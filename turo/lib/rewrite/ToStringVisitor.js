import PatternVisitor from './PatternVisitor';

export default class ToStringVisitor extends PatternVisitor {
  visitChildren (node, ...args) {
    return node.children.map(
      child => child.accept(this, ...args)
    );
  }

  visitAnyExpression (node, ...args) {
    return node.captureId;
  }

  visitAnyLiteral (node, ...args) {
    return node.captureId;
  }

  visitVariable (node, ...args) {
    return node.captureId;
  }

  visitLiteralLiteral (node, ...args) {
    return '' + node.literal;
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