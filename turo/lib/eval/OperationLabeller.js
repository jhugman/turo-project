import { ASTVisitor } from '../visitors';

export default class OperationLabellerVisitor extends ASTVisitor {
  visitBinaryOperator (node, context) {
    const len = context.errors.length;

    const lType = node.left.accept(this, context),
          rType = node.right.accept(this, context);

    if (!(lType && rType)) {
      // An error happened further down the tree.
      return;
    }

    const operation = context.operators.findOperator(node.literal, lType, rType);

    if (!operation) {
      context.reportError("TYPE_MISMATCH", node, node.left, node.right);
      return;
    }

    node.operation = operation;
    return operation.returnValueType;
  }

  visitUnaryOperation (node, context) {
    const operandType = node.value.accept(this, context);

    if (!operandType) {
      // An error happened further down the tree.
      return;
    }

    const operation = context.operators.findUnaryOperator(node.literal, operandType, node.isPrefix);

    if (!operation) {
      context.reportError("TYPE_MISMATCH", node);
      return;
    }

    node.operation = operation;
    return operation.returnValueType;
  }

  visitParens (node, context) {
    return node.ast.accept(this, context);
  } 

  visitNumberNode (node, context) {
    return node.valueType;
  }

  visitIdentifier (node, context) {
    if (!context.variables && !node.scope) {
      // not throw, because our earlier tests
      // won't pass. TODO
      return;
    }
    var definitionNode;

    if (node.scope) {
      definitionNode = node.scope.findVariable(node.name);
    }

    if (!definitionNode || !definitionNode.accept) {
      context.reportError("NO_SUCH_VARIABLE", node);
      return;
    }

    // TODO detect cycles
    if (definitionNode._isBusy) {
      context.reportError("UNCALCULATED_VARIABLE", node);
      context.reportError("CYCLIC_DEFINITION", definitionNode);
      return;
    }
    definitionNode._isBusy = true;

    var retValueType = definitionNode.accept(this, context);

    // This is incidental to operation labelling.
    node.definition = definitionNode;
    node.isConstant = definitionNode.isConstant;
    
    delete definitionNode._isBusy;

    return retValueType;
  }

  visitVariableDefinition (node, context) {
    // This is OK to do here, because a) it's only done infrequently
    // we could lazily calculate, but valueType is an intermediate value,
    // but changes in the variables used in this definition may change a
    // this variable.
    node.valueType = node.ast.accept(this, context);

    return node.valueType;
  }

  visitUnit (unit, context) {
    return "unit";
  }

  visitUnitPower (unit, context) {
    return "unit";
  }

  visitUnitLiteral (unit, context) {
    return "unit";
  }

  visitUnitMultOp (unit, context) {
    return "unit";
  }
}