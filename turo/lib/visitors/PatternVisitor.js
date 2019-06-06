export default class PatternVisitor {
  visitChildren (node, ...args) {
    return node.children.map(
      child => child.accept(this, ...args)
    );
  }

  visitAnyExpression (node, ...args) {
    return this.visitChildren(node, ...args);
  }

  visitAnyLiteral (node, ...args) {
    return this.visitChildren(node, ...args);
  }

  visitVariable (node, ...args) {
    return this.visitChildren(node, ...args);
  }

  visitLiteralLiteral (node, ...args) {
    return this.visitChildren(node, ...args);
  }

  visitBinaryOperation (node, ...args) {
    return this.visitChildren(node, ...args);
  }

  visitUnaryOperation (node, ...args) {
    return this.visitChildren(node, ...args);
  }

  visitEquality (node, ...args) {
    return this.visitChildren(node, ...args);
  }

  visitInequality (node, ...args) {
    return this.visitChildren(node, ...args);
  }
}