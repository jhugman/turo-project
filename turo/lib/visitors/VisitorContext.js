import ast from '../ast';
import { TuroError } from '../errors';

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
      const error = new TuroError(errorCode, node);
      node.error = error;
      this.errors.push(error);
    });
  }
}