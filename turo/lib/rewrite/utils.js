import ast from '../ast';
import output from '../output';

function isConstant (node) {
  return node.nodeType === 'NumberNode';
}

function isMinusConstant (node) {
  if (!node) {
    debugger;
  }
  const { numOperands, literal } = node;
  if (numOperands === 1 && (literal === '+' || literal === '-')) {
    return isMinusConstant(node.inner);
  }

  return isConstant(node);
}

function isZero (node) {
  return isConstant(node) && node.literal === '0';
}

function isNatural (node, string) {
  return isConstant(node) && node.literal === string && (!node.unit || node.unit.isDimensionless());
}

function isOne (node) {
  return isNatural(node, '1');
}

function zero () {
  return createNumber('0');
}

function one () {
  return createNumber('1');
}

function createNumber (literal = '1') {
  if (typeof literal === 'string' || typeof literal === 'number') {
    return new ast.NumberNode(literal);
  } else {
    const { number: value, unit, valueType } = literal;
    return Object.assign(
      new ast.NumberNode(value),
      { unit, valueType }
    );
  }
  
}

function generateKey (node) {
  // SLOW TODO replace.
  return output.toString(node);
}

function isBinaryAdd(node) {
  return isBinary(node, '+', '-');
}

function isUnary(node, ...ops) {
  if (!node) {
    debugger;
  }
  const { numOperands, literal } = node;

  if (numOperands !== 1) {
    return false;
  }

  if (!ops || !ops.length) {
    return true;
  }

  return (ops.indexOf(literal) >= 0);
}

function isBinary(node, ...ops) {
  if (!node) {
    debugger;
  }
  const { numOperands, literal } = node;

  if (numOperands !== 2) {
    return false;
  }

  if (!ops || !ops.length) {
    return true;
  }

  return (ops.indexOf(literal) >= 0);
}

function mergeCaptures(left, right, context) {
  const target = new Map(left.entries());
  
  for (let [k, v] of right.entries()) {  
    const existing = target.get(k);
    if (!existing) {
      target.set(k, v);
      continue;
    }

    if (!context.nodeEquals) {
      debugger;
    }
    if (!context.nodeEquals(existing, v)) {
      return;
    }

    target.set(k, v);
  }

  return target;
}

const emptyMap = new Map();

function newMap(key, value) {
  return new Map().set(key, value);
}

function bypassParens (node) {
  if (!node) {
    debugger;
  }
  if (node.nodeType === 'ParensNode') {
    const [inner] = node.children;
    return bypassParens(inner);
  }
  return node;
}

function getPrecedence(node, parser) {
  if (isBinary(node)) {
    return parser.getInfixOperatorPrecedence(node.literal);
  } else if (isUnary(node)) {
    return node.isPrefix ? 
      parser.getPrefixOperatorPrecedence(node.literal) :
      parser.getPostfixOperatorPrecedence(node.literal)
  } else if (node.nodeType === 'NumberNode' || node.nodeType === 'IdentifierNode') {
    return 100;
  }

  return 0;
} 

export {
  isUnary,
  isBinary,
  isBinaryAdd,
  getPrecedence,
  mergeCaptures,
  bypassParens,
  newMap,
  emptyMap,
  generateKey,
  createNumber,
  isConstant, 
  isMinusConstant,
  isOne, 
  isZero, 
  one, 
  zero,
}