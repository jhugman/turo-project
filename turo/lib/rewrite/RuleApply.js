import { ASTVisitor } from '../visitors';

export default class RuleApplyVisitor extends ASTVisitor {
  visitBinaryOperator (node, ...args) {
    const [rule, context, ..._] = args;
    return rule.applyAtNode(node, context) ||
  
      node.transformChildren(
        child => child.accept(this, ...args)
      );
  }

  visitUnaryOperation (node, ...args) {
    const [rule, context, ..._] = args;
    return rule.applyAtNode(node, context) ||
  
      node.transformChildren(
        child => child.accept(this, ...args)
      );
  }

  visitParens (node, ...args) {
    return node.transformChildren(
      child => child.accept(this, ...args)
    );
  }  

  visitNumberNode (node, rule, context, ...args) {
    return;
  }

  visitIdentifier (node, rule, context, ...args) {
    return;
  }
}