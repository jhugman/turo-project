import ast from "../ast";

export default class VisitorContext {
  constructor (visitor, opts) {
    this.visitor = visitor;
    Object.assign(this, opts);
  }

  evaluate (node) {
    if (node.accept) {
      return node.accept(this.visitor, this);
    }
  }

  reportError (errorCode, ...highlightedNodes) {
    highlightedNodes.forEach(node => {
      const error = new ast.Error(errorCode, node);
      this.errors.push(error);
    });
  }
}