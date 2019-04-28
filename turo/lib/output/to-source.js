import _ from 'underscore';
import StringDisplay from './StringDisplay';
import ToTokensVisitor from './ToTokensVisitor';
import defaultPrefs from './outputPrefs';

var stringDisplay = new StringDisplay();

//////////////////////////////////////////////////////////////////////////////////


function joinTokenArray(tokens, display, context) {
  var prefs = context.prefs || defaultPrefs,
      formatting = prefs.output_padding || defaultPrefs.output_padding,
      defaultPadding = prefs.output_defaultPadding !== undefined ? prefs.output_defaultPadding : defaultPrefs.output_defaultPadding,
      literals = context.literals || {};

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

  tokens.forEach(t => {
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

var toTokensVisitor = new ToTokensVisitor();
const toTokenArray = function (node, context, optionalTokens) {
  var tokens = optionalTokens || [];
  context = context || {};
  if (!node) {
    return tokens;
  }
  if (node.accept) {
    node.accept(toTokensVisitor, tokens, context);
  } else if (node.valueType) {
    toTokensVisitor.tokenizeTuroNumber(node, tokens, context, {});
  }
  return tokens;
};

//////////////////////////////////////////////////////////////////////////////////

const createToString = function (display) {
  return function toString (node, prefs = defaultPrefs) {
    return toStringWithDisplay(node, display, prefs);
  };
};

const toStringWithDisplay = function (node, display = stringDisplay, prefs = defaultPrefs) {
  if (!node) {
    return '';
  }

  var context = {
    prefs
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

//////////////////////////////////////////////////////////////////////////////////

const toString = createToString(stringDisplay);
function displayImpliedParentheses () {}

export {
  toString,
  toStringWithDisplay,
  createToString,
  displayImpliedParentheses,
};