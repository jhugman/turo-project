import { ASTVisitor } from '../visitors';
import { isBinary, isUnary, getPrecedence } from '../rewrite/utils';
/////////////////////////////////////////////////////////////////////////////////////////
class ParensRemover extends ASTVisitor {

  apply (node, ...args) {
    return node.accept(this, ...args);
  }

  visitBinaryOperator (node, ...args) {
    return node.transformChildren(c => c.accept(this, ...args));
  }

  visitUnaryOperation (node, ...args) {
    return node.transformChildren(c => c.accept(this, ...args));
  }

  visitParens (node, ...args) {
    return node.inner.accept(this, ...args) || node.inner;
  }  

  visitNumberNode (node, ...args) {
    return;
  }

  visitIdentifier (node, ...args) {
    return;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
class ParensAdder extends ASTVisitor {
  apply (node, ...args) {
    const [{ parser } = {}, ..._] = args;
    if (!parser) {
      throw new Error('Cannot proceed without precedence information');
    }
    return node.accept(this, parser, ...args);
  }

  _visit(node, ...args) {
    const [parser, ..._] = args;

    const myPrecedence = getPrecedence(node, parser);

    return node.transformChildren(c => {
      const t = c.accept(this, ...args);
      const torc = t || c;
      const theirPrecedence = getPrecedence(torc, parser);
      if (theirPrecedence < myPrecedence) {
        return torc.parens();
      } else if (torc.numOperands === 1 && node.numOperands === 1 && node.isPrefix !== torc.isPrefix) {
        return torc.parens();
      }
      return t;
    });
  }

  visitBinaryOperator (node, ...args) {
    return this._visit(node, ...args);
  }

  visitUnaryOperation (node, ...args) {
    return this._visit(node, ...args);
  }

  visitParens (node, ...args) {
    return node.inner.accept(this, ...args) || node.inner;
  }  

  visitNumberNode (node, ...args) {
    return;
  }

  visitIdentifier (node, ...args) {
    return;
  }
}

const removeParens = new ParensRemover();
const addParens = new ParensAdder();
const normalizeParens = new ParensAdder();

export {
  removeParens,
  addParens,
  normalizeParens,
}