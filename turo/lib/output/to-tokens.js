import _ from 'underscore';
import ToTokensVisitor from './ToTokensVisitor';
import Token from './Token';

var tokenTypeToShortType = {
  prefixOp: '-',
  infixOf: '+',
  postfixOp: '!',
  unit: 'm',
  unitPer: '/',
  unitPow: '^',
  variable: 'x',
};

var tokenTypeToAlphaShortType = {
  prefixOp: 'sqrt',
  infixOf: 'in',
  postfixOp: 'bang',
};

function tokensFromKey(keyObj) {
  var keys = keyObj.key.split(/\b/),
      type = keyObj.type;
  var tokens = _.map(keys, function (literal) {
    var tx = new Token('inserted', literal, undefined, undefined, tokenTypeToShortType[type], tokenTypeToAlphaShortType[type]);
    type = '';
    return tx;
  });
  return tokens;
}

var visitor = new ToTokensVisitor();

const toTokenArray = function (node, context, optionalTokens) {
  var tokens = optionalTokens || [];
  context = context || {};
  if (!node) {
    return tokens;
  }
  if (node.accept) {
    node.accept(visitor, tokens, context);
  } else if (node.valueType) {
    visitor.tokenizeTuroNumber(node, tokens, context, {});
  }
  return tokens;
};

export { toTokenArray, tokensFromKey };