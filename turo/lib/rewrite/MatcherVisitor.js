import PatternVisitor from './PatternVisitor';

function mergeCaptures(left, right, nodeEquals) {
  const target = new Map(left.entries());
  
  for (let [k, v] of right.entries()) {  
    const existing = target.get(k);
    if (!existing) {
      target.set(k, v);
      continue;
    }

    if (!nodeEquals(existing, v)) {
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
  if (node.nodeType === 'ParensNode') {
    const [inner] = node.children;
    return bypassParens(inner);
  }
  return node;
}

export default class MatcherVisitor extends PatternVisitor {
  visitChildren (node, ...args) {
    return node.children.map(
      child => child.accept(this, ...args)
    );
  }

  visitBinaryNonTerminal (pattern, astNode, nodeEquals, ...args) {
  }

  visitAnyExpression (pattern, astNode, ...args) {
    return newMap(pattern.captureSymbol, astNode);
  }

  visitVariable (pattern, astNode, ...args) {
    const bareNode = bypassParens(astNode);
    const { nodeType, value } = bareNode;

    if (nodeType === 'IdentifierNode') {
      return newMap(pattern.captureSymbol, bareNode);
    }
  }

  visitAnyLiteral (pattern, astNode, ...args) {
    const bareNode = bypassParens(astNode);
    const { nodeType, value } = bareNode;

    if (nodeType === 'NumberNode') {
      return newMap(pattern.captureSymbol, bareNode);
    }
  }

  visitLiteralLiteral (pattern, astNode, ...args) {
    const bareNode = bypassParens(astNode);
    const { nodeType, value } = bareNode;

    if (nodeType === 'NumberNode' && value == pattern.literal) {
      return emptyMap;
    }
  }

  visitBinaryOperation (pattern, astNode, nodeEquals, ...args) {
    const bareNode = bypassParens(astNode);
    const { nodeType, literal } = bareNode;

    if (nodeType !== 'BinaryNode' || literal !== pattern.literal) {
      // we should check here if there are any special cases of the pattern 
      // e.g. $literal * $subtree or $subtree ^ $literal which 
      // would match iff $literal == 1.
      return;
    }

    if (bareNode.children.length !== pattern.children.length) {
      return;
    }

    const [leftPattern, rightPattern] = pattern.children;
    const [leftAstNode, rightAstNode] = bareNode.children;

    const leftCapture = leftPattern.accept(this, leftAstNode, nodeEquals, ...args);
    const rightCapture = rightPattern.accept(this, rightAstNode, nodeEquals, ...args);

    if (!leftCapture || !rightCapture) {
      return;
    }

    return mergeCaptures(leftCapture, rightCapture, nodeEquals);
  }

  visitParenthesis (pattern, astNode, ...args) {
    const bareNode = bypassParens(astNode);
    const [patternChild] = pattern.children;

    return patternChild.accept(this, bareNode, ...args);
  }

  visitUnaryOperation (pattern, astNode, ...args) {
    const bareNode = bypassParens(astNode);
    const { nodeType, literal } = bareNode;

    if (nodeType !== 'UnaryOperationNode' || literal !== pattern.literal) {
      return;
    }

    const [patternChild] = pattern.children;
    const [astNodeChild] = bareNode.children;

    return patternChild.accept(this, astNodeChild, ...args);
  }

  visitEquality (pattern, astNode, nodeEquals, ...args) {
    const bareNode = bypassParens(astNode);
    const { nodeType, literal } = bareNode;

    // TODO assignment is not what we're trying to do here.
    const isEquality = (nodeType === 'BinaryNode' && literal === '==');
    const isAssignment = (nodeType === 'VariableDefinition');
    if (!isEquality && !isAssignment) {
      return;
    }

    if (bareNode.children.length !== pattern.children.length) {
      return;
    }

    const [leftPattern, rightPattern] = pattern.children;
    const [leftAstNode, rightAstNode] = bareNode.children;

    const leftCapture = leftPattern.accept(this, leftAstNode, nodeEquals, ...args);
    const rightCapture = rightPattern.accept(this, rightAstNode, nodeEquals, ...args);

    if (!leftCapture || !rightCapture) {
      return;
    }

    return mergeCaptures(leftCapture, rightCapture, nodeEquals);
  }
}