import ast from '../ast';
import output from '../output';
import evaluator from '../eval';
import { createNumber } from './utils';
import GetMetadataVisitor, { metadataComparator } from './NodeMetadata';

const defaultNodeEquals = (lhs, rhs) => output.toString(lhs) === output.toString(rhs);
const defaultMetadataComparator = metadataComparator;

export default class RewriteContext {
  constructor (
      {
        parser = undefined, 
        metadataVisitor = new GetMetadataVisitor(),
        metadataComparator = defaultMetadataComparator,
      } = {}
    ) {
    this.parser = parser;
    if (!parser) {
      this._nodeEquals = defaultNodeEquals;
    }
    this.metadataVisitor = metadataVisitor;
    this.metadataComparator = metadataComparator;
  }

  createIdentity (value = '1') {
    return new ast.NumberNode(value);
  }

  createIdentifier (id) {
    return new ast.IdentifierNode(id);
  }

  evalNode (node) {
    return createNumber(evaluator.evaluate(node));
  }

  getMetadata (node, ...args) {
    return node.accept(this.metadataVisitor, this, ...args);
  }

  generateKey (node, ...args) {
    return this.getMetadata(node, ...args).termKey;
  }

  nodeEquals (a, b, ...args) {
    return this._nodeEquals ? 
      this._nodeEquals(a, b) : 
      this.getMetadata(a, ...args).id === this.getMetadata(b, ...args).id;
  }
}