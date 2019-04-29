import _ from 'underscore';

const calculatePrefix = (dirtyString, offset, error) => {
  var substring;
  if (offset === undefined || error.offset === undefined) {
    substring = "";
  } else if (error.offset === offset) {
    // we have a valid statement up to the cursor.
    // but the last word may still have completions.
    var re = /\b(\w+)$/m,
        m = re.exec(dirtyString.substring(0, offset));
    substring = m ? m[1] : "";
  } else if (error.offset > offset) {
    substring = "";
  } else {
    substring = dirtyString.substring(error.offset, offset);
  }
  return substring;
};


class AutocompleteTokenProcessor {
  constructor(offset, prefix, ordering) {
    this.expectedMap = {};
    this.offset = offset;
    this.prefix = prefix;
    this.ordering = ordering;
  }

  collect (tokenType, generator, error) {
    const tokens = generator(error.scope);
    if (tokens) {
      this.expectedMap[tokenType] = tokens;
    }
  }

  delivery (string, error) {
    if (this.offset != error.offset) {
      return [];
    }
    const expectedMap = this.expectedMap;
    const ordering = this.ordering || Object.keys(expectedMap);
    const substring = this.prefix || '';
    const tokens = _.chain(ordering)
      .map(function (tokenType) {
        return _.map(expectedMap[tokenType], (literal) => {
          return { literal, tokenType, match: substring };
        });
      })
      .flatten()
      .value();

    
    if (substring) {
      return _.filter(tokens, function (t) {
        return t.literal.indexOf(substring) === 0;
      });
    }

    return tokens;
  } 
}

class TabCompleteTokenProcessor {
  constructor(dirtyString, offset, ordering) {
    this.dirtyString = dirtyString;
    this.expectedMap = {};
    this.ordering = ordering;
  }

  collect (tokenType, generator, error) {
    const tokens = generator(error.scope);
    if (tokens) {
      this.expectedMap[tokenType] = tokens;
    }
  }

  // XXX this should go away, but the prefix calculation 
  // is wrong, but the tests are right.
  calculatePrefix (dirtyString, offset, error) {
    let substring;
    if (offset === undefined || error.offset === undefined) {
      // we have a valid statement up to the cursor.
      // but the last word may still have completions.
      var re = /\b(\w+)$/m,
          m = re.exec(dirtyString.substring(0, offset));
      substring = m ? m[1] : "";
    } else if (error.offset === offset) {
      substring = "";
    } else if (error.offset > offset) {
      substring = "";
    } else {
      substring = dirtyString.substring(error.offset, offset);
    }
    return substring;
  }

  delivery (string, error, existing) {
    const offset = this.offset;
    const expectedMap = this.expectedMap;
    const dirtyString = this.dirtyString;
    const substring = this.calculatePrefix(dirtyString, offset, error);

    const ordering = this.ordering || _.keys(expectedMap);
    let tokens = _.chain(ordering)
      .map(function (key) {
        return expectedMap[key] || [];
      })
      .flatten()
      .value();

    if (substring) {
      tokens = _.filter(tokens, function (t) {
        return t.indexOf(substring) === 0;
      });
    }

    let prefix;
    if (!substring && dirtyString[dirtyString.length - 1] !== " " && tokens.length === 1) {
      // this is beginning to look like a corner case.
      prefix = " ";
    }
    if (prefix) {
     tokens = _.map(tokens, function (t) {
       return prefix + t;
     });
    }
    if (existing) {
      tokens = _.union(tokens, existing[0]);
    }
    return [tokens, substring];
  }
}


export default class TokenPredictor {
  constructor (parser, generatorMap) {
    this.generatorMap = generatorMap || {};
    this.parser = parser;
  }

  addListCreator (tokenType, fn) {
    this.generatorMap[tokenType] = fn;
  }

  autocomplete (string, offset, ordering) {
    const self = this,
          tokenProcessorWithoutPrefix = new AutocompleteTokenProcessor(offset, '', ordering);
    const tokens = self._makePrediction(tokenProcessorWithoutPrefix, string, offset);
    const substring = calculatePrefix(string, offset, tokenProcessorWithoutPrefix.error);
    if (substring !== '') {
      const tokenProcessorWithPrefix = new AutocompleteTokenProcessor(offset - substring.length, substring, ordering);
      const newTokens = self._makePrediction(tokenProcessorWithPrefix, string, offset - substring.length);
      return {tokens: [...tokens, ...newTokens]};
    }
    return {tokens};
  }

  tabComplete (string, dirtyString, offset, ordering) {
    var self = this,
        tokenProcessor = new TabCompleteTokenProcessor(dirtyString, offset, ordering);

    return self._makePrediction(tokenProcessor, string, offset);
  }

  createKeyboard (originalString, offset) {

    if (offset === undefined) {
      offset = originalString.length;
    }

    var parser = this.parser,
        generatorMap = this.generatorMap;
    var tokenProcessor = {
      collect (expectedTokenType, tokenValue) {
        this.keyboard[expectedTokenType] = tokenValue;
        switch (expectedTokenType) {
          case "unitPer":
            // special case units, because we match on multiple in a row.
            this.keyboard.unit = generatorMap.unit || true;
            break;
        }
      },

      delivery () {
        if (parser.lastDigitOffset === offset) {
          // special case digits, because they're always matched by \d+
          this.keyboard.digits = true;
        }
        return this.keyboard;
      }
    };
    tokenProcessor.keyboard = {};
    parser.lastDigitOffset = undefined;
    return this._makePrediction(tokenProcessor, originalString, offset);
  }

  createParseError (string, offset) {
    var KNOWN_BAD = "§bad_token";
    
    var error = this._getParseError(string + KNOWN_BAD);
    return error;
  }

  _collectCompletions (tokenProcessor, expected, error) {
    const generateMap = this.generatorMap;
    _.chain(expected)
      .map(function (tokenType) {
        if (_.isString(tokenType)) { 
          return tokenType; 
        }

        return tokenType.description;
      })
      .each(function (tokenType) {
        var generator = generateMap[tokenType];
        if (generator) {
          tokenProcessor.collect(tokenType, generator, error);
        }
      })
      .value();
  }

  _makePrediction (tokenProcessor, string, offset) {
    var self = this,
        parsedString = string,
        error;
    offset = offset || string.length;
    if (_.isNumber(offset)) {
      parsedString = string.substring(0, offset);
      error = this.createParseError(parsedString);
    } else {
      error = offset;
    }
        
    if (!error) {
      // unbelievable
      console.log("WEIRD - no predictions definitely bad string");
      return tokenProcessor.delivery();
    }

    var expected = error.expected;

    tokenProcessor.error = error;
    this._collectCompletions(tokenProcessor, expected, error);
    var retValue = tokenProcessor.delivery(string, error);

    if (tokenProcessor.reset && parsedString.match(/^\w+$/)) {
      tokenProcessor.reset();
      error = this.createParseError('');
      this._collectCompletions(tokenProcessor, error.expected, error);
      retValue = tokenProcessor.delivery(string, error, retValue);
    }

    return retValue;
  }

  _getParseError (string) {
    var scope = this.parser.scope;
    try {
      // TODO make a new scope for the parser
      this.parser.parse(string, "PaddedStatement");
    } catch (e) {
      if (e.expected) {
        e.scope = this.parser.scope;
        e.offset = (e.location) ? e.location.start.offset : 0;
        return e;
      }
      console.error("Strange error making predictions", e);
    } finally {
      this.parser.scope = scope;
    }
  }
}