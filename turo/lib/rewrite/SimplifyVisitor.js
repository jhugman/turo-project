import { ASTVisitor } from '../visitors';
import { isNatural, isConstant, isOne, isZero, zero, one } from './utils';

// Adapted from simplifyCore in math.js
// https://github.com/josdejong/mathjs/blob/af37445940ac7c49e199d546eec18b76e1e53a12/src/function/algebra/simplify/simplifyCore.js

function calc (literal, left, right, context) {
  return context.evalNode(left.binary(literal, right));
}

export default class SimplifyVisitor extends ASTVisitor {

  // Rules can be applied.
  apply (node, ...args) {
    return node.accept(this, ...args);
  }

  visitBinaryOperator (node, ...args) {
    const [context, ..._] = args;

    const [b0, b1] = node.children.map(
      child => child.accept(this, ...args) 
    );
    const [a0, a1] = [b0 || node.left, b1 || node.right];
    const noChange = () => (b0 || b1) ? a0.binary(node.literal, a1) : undefined;

    if (node.literal === '+') {
      if (isConstant(a0)) {
        if (isZero(a0)) {
          return a1;
        } else if (isConstant(a1)) {
          return calc('+', a0, a1, context);
        }
      }
      if (isConstant(a1) && isZero(a1)) {
        return a0;
      }
      if (a1.numOperands === 1 && a1.literal === "-") {
        return a0.binary('-', a1.inner);
      }
      //? return new OperatorNode(node.op, node.fn, a1 ? [a0, a1] : [a0]);
      return a0.binary(node.literal, a1);
    } else if (node.literal === '-') {
      if (isConstant(a0)) {
        if (isConstant(a1)) {
          return calc(node.literal, a0, a1, context);
        } else if (isZero(a0)) {
          return a1.unary('-');
        }
      }

      if (isConstant(a1) && isZero(a1)) {
        return a0;
      }

      if (a1.numOperands === 1 && a1.literal === '-') {
        return a0.binary('+', a1.inner).accept(this, ...args);
      }

      return noChange();
    } else if (node.literal === '*') {
      if (isConstant(a0)) {
        if (isZero(a0)) {
          return zero(context);
        } else if (isOne(a0)) {
          return a1;
        } else if (isConstant(a1)) {
          return calc('*', a0, a1, context);
        }
      }

      if (isConstant(a1)) {
        if (isZero(a1)) {
          return zero(context);
        } else if (isOne(a1)) {
          return a0;
        } else if (a0.numOperands === 2 && a0.literal === node.literal) {
          const [a00, a01] = a0.children;
          if (isConstant(a00)) {
            const a00a1 = calc('*', a00, a1, context);
            return a00a1.binary('*', a01); // constants on the left
          }
        }
        return a1.binary(node.literal, a0) // constants on the left
      }
      return noChange();
    } else if (node.literal === '/') {
      if (isConstant(a0)) {
        if (isZero(a0)) {
          return zero(context);
        } else if (isConstant(a1)) {
          if (isOne(a1) || isNatural(a1, '2') || isNatural(a1, '4')) {
            return calc('/', a0, a1, context);
          }
        }
      }
      return noChange();
    } else if (node.literal === '^') {
      if (isConstant(a1)) {
        if (isZero(a1)) {
          return one(context)
        } else if (isOne(a1)) {
          return a0;
        } else if (isConstant(a0)) {
          return calc('^', a0, a1, context);
        } else if (a0.numOperands === 2 && a0.literal === '^') {
          const [a00, a01] = a0.children;
          if (isConstant(a01)) {
            return a00.binary(node.literal, calc('*', a01, a1, context));
          }
        }
      }
      return noChange();
    }
  }

  visitUnaryOperation (node, ...args) {
    const b0 = node.inner.accept(this, ...args);
    const a0 = b0 || node.inner;
    const noChange = () => b0 ? b0.unary(node.literal) : undefined;

    if (node.literal === "+") {
      // unary plus
      return a0;
    }

    if (node.literal === "-") {
      // unary minus
      if (a0.numOperands === 1 && a0.literal === '-') {
        return a0.inner;
      } else if (a0.numOperands === 2 && a0.literal === '-') {
        const [a00, a01] = a0.children;
        return a01.binary('-', a00);
      }
      return noChange();
    }

    return undefined;
  }

  visitParens (node, ...args) {
    const b = node.inner.accept(this, ...args);
    const c = b || node.inner;
    const noChange = () => b ? b.parens() : undefined;
    if (c.numOperands === undefined) {
      return c;
    }
    return noChange();
  }  

  visitNumberNode (node, rule, context, ...args) {
    return undefined;
  }

  visitIdentifier (node, rule, context, ...args) {
    return undefined;
  }
}