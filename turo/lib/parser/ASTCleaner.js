import { ASTTransformer } from '../visitors';

const isUnit = (node, scope) => {
  return scope.findUnit(node.literal);
};

const isVariable = (node, scope) => {
  return scope.findVariable(node.literal);
};

const isIdentifier = (node) => node.nodeType === 'IdentifierNode';

export default class ASTCleaner extends ASTTransformer {

  _identifierTrimmer1 = new UnknownIdentifierTrimmer1()

  apply (node, ...args) {
    return node.accept(this._identifierTrimmer1, node.scope, ...args);
  }
}

class UnknownIdentifierTrimmer1 extends ASTTransformer {

  reportError (node, errorCode) {

  }

  visitBinaryOperator (node, scope, ...args) {
    scope = node.scope || scope;
    const nodeOpt = node.transformChildren(child => child.accept(this, scope, ...args));
    node = nodeOpt || node;

    switch (node.literal) {
      case ' ': {
        const leftIdentifier = isIdentifier(node.left);
        if (leftIdentifier && !isVariable(node.left, scope)) {
          this.reportError(node.left, 'UNKNOWN_VARIABLE');
          return node.right;
        }
        if (!isUnit(node.right, scope)) {
          if (isVariable(node.right, scope)) {
            this.reportError(node.right, 'UNKNOWN_UNIT')
          }

          return node.left;
        }
        break;
      }

      default: {
        if (isIdentifier(node.right) && !isVariable(node.right, scope)) {
          return node.left;
        }
      }
    }

    return nodeOpt;
  }
}