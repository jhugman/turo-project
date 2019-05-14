import ast from '../ast';
import output from '../output';

const defaultNodeEquals = (lhs, rhs) => output.toString(lhs) === output.toString(rhs);

export default class RewriteContext {
  constructor ({ nodeEquals = defaultNodeEquals } = {}) {
    this.nodeEquals = nodeEquals;
  }

  createIdentity (value = '1') {
    return new ast.NumberNode(value);
  }

  createIdentifier (id) {
    return new ast.IdentifierNode(id);
  }
}