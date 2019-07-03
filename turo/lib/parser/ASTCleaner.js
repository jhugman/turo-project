import { ASTTransformer } from '../visitors';

const isUnit = (node, scope) => {
  return scope.findUnit(node.literal);
};

const isVariable = (node, scope) => {
  return scope.findVariable(node.literal);
};

const isIdentifier = (node) => node.nodeType === 'IdentifierNode';

export default class ASTCleaner extends ASTTransformer {
  visitBinaryOperator (node, scope, ...args) {
    scope = node.scope || scope;
    const nodeOpt = node.transformChildren(child => child.accept(this, scope, ...args));
    node = nodeOpt || node;

    switch (node.literal) {
      case ' ': {
        if (!isUnit(node.right, scope)) {
          return node.left;
        }
        break;
      }

      default: {
        if (!isVariable(node.right, scope)) {
          return node.left;
        }
      }
    }

    return nodeOpt;
  }
}