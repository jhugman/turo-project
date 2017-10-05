"use strict";
var _ = require("underscore");

function TokenPredictor (parser, generatorMap) {
  this.generatorMap = generatorMap || {};
  this.parser = parser;
}

_.extend(TokenPredictor.prototype, {

  addListCreator: function (tokenType, fn) {
    this.generatorMap[tokenType] = fn;
  },

  tabComplete: function (string, dirtyString, offset, ordering) {
    var self = this,
        tokenProcessor = {
          expectedMap: {},

          reset: function () {
            this.expectedMap = {};
          },

          collect: function (tokenType, generator, error) {
            var tokens = generator(error.scope);
            if (tokens) {
              this.expectedMap[tokenType] = tokens;
            }
          },

          calculatePrefix: function (dirtyString, offset, error) {
            var substring;
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
          },

          delivery: function (string, dirtyString, error, existing) {
            var substring, prefix;
            var expectedMap = this.expectedMap;

            substring = this.calculatePrefix(dirtyString, offset, error);

            var ordering = ordering || _.keys(expectedMap);
            var tokens = _.chain(ordering)
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
          },
        };
    return self._makePrediction(tokenProcessor, string, dirtyString, offset);
  },

  createKeyboard: function (originalString, offset) {

    if (offset === undefined) {
      offset = originalString.length;
    }

    var parser = this.parser,
        generatorMap = this.generatorMap;
    var tokenProcessor = {
      collect: function (expectedTokenType, tokenValue) {
        this.keyboard[expectedTokenType] = tokenValue;
        switch (expectedTokenType) {
          case "unitPer":
            // special case units, because we match on multiple in a row.
            this.keyboard.unit = generatorMap.unit || true;
            break;
        }
      },

      delivery: function () {
        if (parser.lastDigitOffset === offset) {
          // special case digits, because they're always matched by \d+
          this.keyboard.digits = true;
        }
        return this.keyboard;
      }
    };
    tokenProcessor.keyboard = {};
    parser.lastDigitOffset = undefined;
    return this._makePrediction(tokenProcessor, originalString, originalString, offset);
  },

  createParseError: function (string, offset) {
    var KNOWN_BAD = "§bad_token";
    
    var error = this._getParseError(string + KNOWN_BAD);
    return error;
  },

  _collectCompletions: function (tokenProcessor, expected, error) {
    _.each(expected, function (tokenType) {
      var generator = this.generatorMap[tokenType];
      if (generator) {
        tokenProcessor.collect(tokenType, generator, error);
      }
    }.bind(this));
  },

  _makePrediction: function (tokenProcessor, string, dirtyString, offset) {
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
    var retValue = tokenProcessor.delivery(string, dirtyString, error);

    if (tokenProcessor.reset && parsedString.match(/^\w+$/)) {
      tokenProcessor.reset();
      error = this.createParseError('');
      this._collectCompletions(tokenProcessor, error.expected, error);
      retValue = tokenProcessor.delivery(string, dirtyString, error, retValue);
    }

    return retValue;
  },

  _getParseError: function (string) {
    var scope = this.parser.scope;
    try {
      // TODO make a new scope for the parser
      this.parser.parse(string, "PaddedStatement");
    } catch (e) {
      if (e.expected) {
        e.scope = this.parser.scope;
        return e;
      }
      console.error("Strange error making predictions", e);
    } finally {
      this.parser.scope = scope;
    }
  }
});






function create (turo) {
  return new TokenPredictor(turo.parser, {
    variable: _.bind(turo.variables.getVariableNames, turo.variables),
    unit: _.bind(turo.units.getUnitNames, turo.units),
    number: function () {
      // NOP
    },
    operator: _.bind(turo.operators.getInfixOperatorNames, turo.operators),
    "variable definition": function () {
      // NOP
    },
    startNumber: function () {
      return true;
    }
  });
}

module.exports = {
  TokenPredictor: TokenPredictor,
  create: create

};