import ast from '../ast';

function addError (errorName, parent, context, ...nodes) {
  ast.addError(errorName, parent, context);
  if (arguments.length <= 3) {
    return;
  }
  delete parent.error;
  nodes.forEach(node => {
    node.error = errorName;
  });
}

class OperationLabellerVisitor {
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
      addError("TYPE_MISMATCH", node, context, node.left, node.right);
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
      ast.addError("TYPE_MISMATCH", node, context);
      return;
    }

    node.operation = operation;
    return operation.returnValueType;
  }

  visitParens (node, context) {
    return node.ast.accept(this, context);
  } 

  visitInteger (node, context) {
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
      ast.addError("NO_SUCH_VARIABLE", node, context);
      return;
    }

    // TODO detect cycles
    if (definitionNode._isBusy) {
      ast.addError("UNCALCULATED_VARIABLE", node, context);
      ast.addError("CYCLIC_DEFINITION", definitionNode, context);
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

  visitTuroValue (node, context) {
    return node.turoNumber.valueType;
  }
}

export default {
  visitor: new OperationLabellerVisitor(), // new ast can be plugged in as and when by extending this
  label (node, operators, errors = []) {
    const context = { operators, errors };
    if (node.accept) {
      var valueType = node.accept(this.visitor, context);
      node.valueType = valueType;
      return valueType;
    }
  },
  OperationLabellerVisitor
};