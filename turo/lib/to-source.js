import _ from 'lodash';
import { toTokenArray, tokensFromKey } from './to-tokens';

var defaultFormatting = {
  'm/': '', // unit followed by unit per.
  '/m': '', // unit per followed by unit.
  'm^': '', // unit followed by unit pow
  '^1': '', // unit pow followed by number
  '1/': '', // a number followed by unit per
  '1m': ' ', // a number followed by a unit
  'mm': ' ', // a unit followed by a unit
  '(1': '',
  '1)': '',
  'sqrt1': ' ',
  'sqrtx': ' ',
  'sqrtsqrt': ' ',
  '!m': ' ',
  'bangm': ' ',
  '!/': ' ',
  'bang/': ' ',
  '1bang': ' ',
  'bangx': ' ',
  'bangbang': ' ',
  'insqrt': ' ',
  'bangin': ' ',
  'xin': ' ',
  'inx': ' ',
  'min': ' ', // unit followed by in
  'inm': ' ', // in followed by unit
  '-1': '', // nonalpha prefixOp followed by a number,
  'kwdm': ' ',
  'mkwd': ' ',
  'm=': ' ',
  '=1': ' ',
  'x=': ' ',
};

var STRING_DISPLAY = {

    bracketStart: function (token, string, context, offset) {
      return string;
    },

    bracketEnd: function (token, string, context, offset) {
      return string;
    },

    /********
     * Colors and styles.
     */

    identifier: function (token, string, context, offset) {
      return string;
    },

    operator: function (token, string, context, offset) {
      return string;
    },

    number: function (token, string, context, offset) {
      return string;
    },

    unitLiteral: function (token, string, context, offset) {
      return string;
    },

    powerStart: function (token, string, context, offset) {
      return string;
    },

    powerEnd: function (token, string, context, offset) {},

    unitStart: function (token, string, context, offset) {},

    unitEnd: function (token, string, context, offset) {},

    errorStart: function (token, string, context, offset) {},

    errorEnd: function (token, string, context, offset) {},

};




//////////////////////////////////////////////////////////////////////////////////


function findCursor (tokens, cursorPosition) {
  var offset = 0,
      tokenOffset;
  for (var i=0, max=tokens.length; i < max; i++) {
    if (cursorPosition >= offset) {
      return i;
    }
    tokenOffset = tokens.length || 0;
  }
  return tokens.length;
}

function joinTokenArray(tokens, display, context) {
  var formatting = context.formatting || defaultFormatting,
      prefs = context.prefs,
      defaultPadding,
      literals = context.literals || {};

  if (prefs) {
    defaultPadding = prefs.padding;
  }
  defaultPadding = defaultPadding || context.padding;
  

  context.offsetCorrection = 0;
  /*
  {
    offset:
    literal:
    displayType:
    shortType:
  }
  */

  var output = [],
      t_prev,
      prevShortType,
      offset = 0,
      cursorPosition = context.cursorPosition,
      cursorNeeded = cursorPosition !== undefined && display && display.cursorString,
      cursorRendered = !cursorNeeded;

  _.each(tokens, function (t) {
    var literal = t.literal || '';
    if (literal) {
      literal = literals[t.literal] || literal;
      var shortType = t.shortType;
      if (t_prev) {
        var padding = formatting[prevShortType + shortType];
        if (padding === undefined) {
          padding = defaultPadding;
        } else if (_.isString(padding)) {
          // NOOP
        } else if (_.isFunction(padding)) {
          padding = padding(t_prev.literal, literal);
        } else {
          padding = ' ';
        }
        if (padding && _.isString(padding)) {
          output.push(padding);
          offset += padding.length;
        }
      }
      t_prev = t;
      prevShortType = shortType;
    }
    var fn = display[t.displayType],
        string;

    if (fn) {
      string = fn(t, literal, context, offset);
    }

    if (!cursorRendered && cursorPosition <= offset) {
      output.push(display.cursorString);
      cursorRendered = true;
    }

    output.push(string || literal);
    // mutate the tokens. Hmm. Not sure about that.
    t.startOffset = offset;
    offset += literal.length;
    
  });
  if (cursorNeeded && !cursorRendered) {
    output.push(display.cursorString);
  }
  delete context.cursorPosition;
  return output.join('');
}

//////////////////////////////////////////////////////////////////////////////////

var createToString = function (display) {
  return function toString (node, literals, prefs) {
    var context = {}, 
        padding;
    if (_.isString(literals)) {
      context.literals = {};
      padding = literals;
    } else {
      context.literals = literals || {};
      padding = "";
    }

    context.prefs = prefs || {};
    context.padding = padding;
    context.alwaysDisplayParens = this.alwaysDisplayParens;
    
    var tokens;
    if (node && node.accept) {
      tokens = toTokenArray(node, context);
    } else if (_.isArray(node)) {
      tokens = node;
    }

    if (tokens) {
      return joinTokenArray(tokens, display, context);
    }
    return '';
  };
};

var hack_STRING_DISPLAY = _.clone(STRING_DISPLAY);

var toStringWithDisplay = function (node, display, prefs, literals) {
  if (!node) {
    return '';
  }

  prefs = prefs || {};
  display = display || STRING_DISPLAY;
  literals = literals || display.literals || {};
  var context = {
    prefs: prefs,
    literals: literals,
  };

  var tokens;
  if (_.isArray(node)) {
    tokens = node;
  } else if (node) {
    tokens = toTokenArray(node, context, []);
  }

  if (tokens) {
    return joinTokenArray(tokens, display, context);
  }
};

export default {
  stringDisplay: STRING_DISPLAY,

  createToString: createToString,

  toString: createToString(hack_STRING_DISPLAY),

  toStringWithDisplay: toStringWithDisplay,

  display: hack_STRING_DISPLAY,

  toTokenArray: toTokenArray,

  // (tokens, display, context)
  joinTokenArray: joinTokenArray,

  toTokensFromKey: tokensFromKey,

  displayImpliedParentheses: function (bool) {
    this.alwaysDisplayParens = !!bool;
  },
};