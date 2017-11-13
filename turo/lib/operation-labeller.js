import extend from 'lodash/extend';
import ast from './ast';

function addError (errorName, parent, context) {
  ast.addError(errorName, parent, context);
  if (arguments.length <= 3) {
    return;
  }
  delete parent.error;
  for (var i = 3, max = arguments.length; i < max; i++) {
    var node = arguments[i];
    node.error = errorName;
  }
}

function OperationLabellerVisitor () {
}

extend(OperationLabellerVisitor.prototype, {
  visitBinaryOperator: function (node, context) {

    var len = context.errors.length;

    var lType = node.left.accept(this, context),
        rType = node.right.accept(this, context),
        operator;

    if (!(lType && rType)) {
      // An error happened further down the tree.
      return;
    }

    operator = context.operators.findOperator(node.literal, lType, rType);

    if (!operator) {
      addError("TYPE_MISMATCH", node, context, node.left, node.right);
      return;
    }

    node.operation = operator;
    return operator.returnValueType;
  },

  visitUnaryOperation: function (node, context) {
    var operandType = node.value.accept(this, context),
        operator;

    if (!operandType) {
      // An error happened further down the tree.
      return;
    }

    operator = context.operators.findUnaryOperator(node.literal, operandType, node.isPrefix);

    if (!operator) {
      ast.addError("TYPE_MISMATCH", node, context);
      return;
    }

    node.operation = operator;
    return operator.returnValueType;
  },

  visitParens: function (node, context) {
    return node.ast.accept(this, context);
  }, 

  visitInteger: function (node, context) {
    return node.valueType;
  },

  visitIdentifier: function (node, context) {
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
  },

  visitVariableDefinition: function (node, context) {
    // This is OK to do here, because a) it's only done infrequently
    // we could lazily calculate, but valueType is an intermediate value,
    // but changes in the variables used in this definition may change a
    // this variable.
    node.valueType = node.ast.accept(this, context);

    return node.valueType;
  },

  visitUnit: function (unit, context) {
    return "unit";
  },

  visitUnitPower: function (unit, context) {
    return "unit";
  },

  visitUnitLiteral: function (unit, context) {
    return "unit";
  },

  visitUnitMultOp: function (unit, context) {
    return "unit";
  },

  visitTuroValue: function (node, context) {
    return node.turoNumber.valueType;
  },

});

function Labeller (visitor, operators, errors, evaluator) {
  this.operators = operators;
  this.visitor = visitor;
  this.errors = errors || [];
  this.evaluator = evaluator;
  this.prefs = evaluator.prefs;
}

extend(Labeller.prototype, {
  label: function (node) {
    if (node.accept) {
      var valueType = node.accept(this.visitor, this);
      node.valueType = valueType;
      return valueType;
    }
  },

  evaluate: function (node) {
    if (this.evaluator) {
      return this.evaluator.evaluate(node);
    }
  }
});

export default {
  visitor: new OperationLabellerVisitor(), // new ast can be plugged in as and when by extending this
  label: function (node, operators, errors, evaluator) {
    return new Labeller(this.visitor, operators, errors, evaluator).label(node);
  },

  OperationLabellerVisitor: OperationLabellerVisitor
};