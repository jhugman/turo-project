import ast from '../ast';
import output from '../output';
import evaluator from '../eval';
import { createNumber } from './utils';
import GetMetadataVisitor, { metadataComparator } from '../../lib/rewrite/NodeMetadata';

const defaultNodeEquals = (lhs, rhs) => output.toString(lhs) === output.toString(rhs);
const defaultGenerateKey = node => output.toString(node);
const defaultMetadataComparator = metadataComparator;

export default class RewriteContext {
  constructor (
      { 
        nodeEquals = defaultNodeEquals, 
        generateKey = defaultGenerateKey, 
        parser = undefined, 
        metadataVisitor = new GetMetadataVisitor(),
        metadataComparator = defaultMetadataComparator,
      } = {}
    ) {
    this.nodeEquals = nodeEquals;
    this.generateKey = generateKey;
    this.parser = parser;
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
}