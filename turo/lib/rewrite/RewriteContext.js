import ast from '../ast';

export default class RewriteContext {
  constructor ({ nodeEquals } = {}) {
    this.nodeEquals = nodeEquals;
  }

  createIdentity (value = '1') {
    return new ast.NumberNode(value);
  }
}