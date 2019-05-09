import PatternVisitor from './PatternVisitor';

function mergeCaptures(left, right, nodeEquals) {

}

export default class MatcherVisitor extends PatternVisitor {
  visitChildren (node, ...args) {
    return node.children.map(
      child => child.accept(this, ...args)
    );
  }

  visitAnyExpression (pattern, astNode, ...args) {
    return { [pattern.captureName]: astNode };
  }

  visitVariable (pattern, astNode, ...args) {
    const { nodeType, value } = astNode;

    if (nodeType === 'IdentifierNode') {
      return { [pattern.captureName]: astNode };
    }
  }

  visitAnyLiteral (pattern, astNode, ...args) {
    const { nodeType, value } = astNode;
    if (nodeType === 'NumberNode') {
      return { [pattern.captureName]: astNode };
    }
  }

  visitLiteralLiteral (pattern, astNode, ...args) {
    const { nodeType, value } = astNode;

    if (nodeType === 'NumberNode' && value == pattern.literal) {
      return {};
    }
  }

  visitBinaryOperation (node, ...args) {
    const [left, right] = this.visitChildren(node, ...args);
    return `${left} ${node.literal} ${right}`;
  }

  visitParenthesis (node, ...args) {
    const [operand] = this.visitChildren(node, ...args);

    return `(${operand})`;
  }

  visitUnaryOperation (node, ...args) {
    const [operand] = this.visitChildren(node, ...args);

    return `${node.literal} ${operand}`;
  }

  visitEquality (node, ...args) {
    const [left, right] = this.visitChildren(node, ...args);
    return `${left} = ${right}`;
  }

  visitInequality (node, ...args) {
    const [left, right] = this.visitChildren(node, ...args);
    return `${left} ${node.literal} ${right}`;
  }
}