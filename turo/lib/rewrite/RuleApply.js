import { ASTVisitor } from '../visitors';

export default class RuleApplyVisitor extends ASTVisitor {
  visitBinaryOperator (node, ...args) {
    const [rule, context, ..._] = args;
    const replacement = rule.apply(node, context);
    if (replacement) {
      return replacement;
    }

    const [leftReplacement, rightReplacement] = node.children.map(
      child => child.accept(this, ...args)
    );

    if (leftReplacement || rightReplacement) {
      const [left, right] = node.children;

      const lhs = leftReplacement || left;
      const rhs = rightReplacement || right;
      return lhs.binary(node.literal, rhs);
    }
  }

  visitUnaryOperation (node, ...args) {
    const [rule, context, ..._] = args;
    const replacement = rule.apply(node, context);
    if (replacement) {
      return replacement;
    }

    const innerReplacement = node.inner.accept(this, ...args);
    if (innerReplacement) {
      return innerReplacement.unary(node.literal);
    }
  }

  visitParens (node, ...args) {
    const inner = node.inner.accept(this, ...args);
    if (inner) {
      return inner.parens();
    }
  }  

  visitNumberNode (node, rule, context, ...args) {
    return;
  }

  visitIdentifier (node, rule, context, ...args) {
    return;
  }
}