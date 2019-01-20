import { defaultOperators } from './operators';
import operatorLabeller from './operation-labeller';
import ast from './ast';
import turoNumber from './turo-number';
import {extend} from 'underscore';

function unitConversion(node, resultValue) {
  if (resultValue === undefined) {
    // This is an error condition
    // where the result of an operation 
    // is in error.
    return;
  }
  // unitLiteral = the unit the user typed.
  var sourceUnit = resultValue.unit,
      unitLiteral = node.unitLiteral;

  if (sourceUnit && unitLiteral) {
    if (unitLiteral.matchesDimensions(sourceUnit)) {
      return resultValue.convert(unitLiteral);
    }
    return turoNumber.newInstance(resultValue.number, unitLiteral.by(sourceUnit), resultValue.valueType);
  } else if (unitLiteral && !sourceUnit) {
    return turoNumber.newInstance(resultValue.number, unitLiteral, resultValue.valueType);
  }
  return resultValue;
}

///////////////////////////////////////////////////////////////
function EvaluatorVisitor () {
}

extend(EvaluatorVisitor.prototype, {

  visitIncludeStatement: function (node, context) {
    // NOP, we do this in the parser.
  },

  visitStatementList: function (node, context) {
    var turo = context.turo;
    if (!turo) {
      throw "No turo object";
    }

    node.ast.forEach(function(st) {
      node.accept(this, context, turo);
    });
  },

  visitBinaryOperator: function (node, context) {
    var operation = node.operation,
        result = operation.evaluate(node.left, node.right, context);
    return unitConversion(node, result);
  },

  visitUnaryOperation: function (node, context) {
    var operation = node.operation,
        result = operation.evaluate(node.value, context);
    return unitConversion(node, result);
  },

  visitParens: function (node, context) {
    var child = node.ast,
        result = child.accept(this, context);
    return unitConversion(node, result);
  },  

  visitInteger: function (node, context) {
    node.value = node._value; // XXX WTF
    return turoNumber.newInstance(node.value, node.unitLiteral, node.valueType);
  },

  visitIdentifier: function (node, context) {
    var definition = node.definition,
        value = definition.currentValue;
    
    if (value) {
      return unitConversion(node, value);
    }

    if (definition) {
      value = definition.accept(this, context);
    }

    if (value === undefined) {
      context.reportError("NO_SUCH_VARIABLE", node);
      return;
    }

    delete node.error;
    return unitConversion(node, value);
  },

  visitVariableDefinition: function (node, context) {
    var value = node.ast.accept(this, context);
    node.currentValue = value;
    return value;
  },

  visitUnitDefinitionStatement: function (node, context) {
    return node;
  },

  visitUnit: function (node, context) {
    return node;
  },

  visitUnitPower: function (node, context) {
    return node;
  },

  visitUnitPer: function (node, context) {
    return node;
  },

  visitUnitLiteral: function (node, context) {
    return node;
  },

  visitUnitMultOp: function (node, context) {
    return node;
  },

  visitTuroValue: function (node, context) {
    return node.turoNumber.number;
  },
});


function Evaluator (visitor, opts) {
  this.visitor = visitor;
  extend(this, opts);
}

extend(Evaluator.prototype, {
  evaluate: function (node) {
    if (node.accept) {
      return node.accept(this.visitor, this);
    }
  },

  reportError: function (errorCode, ...highlightedNodes) {
    highlightedNodes.forEach(node => {
      const error = new ast.Error(errorCode, node);
      this.errors.push(error);
    });
  },
});

export default {
  visitor: new EvaluatorVisitor(), // new ast can be plugged in as and when by extending this
  variables: null,
  evaluate: function (node, turo) {
    // we need to do this because we can't detect if the variables
    // have changed units or types.
    var errors = node.errors || [],
        scope = node.scope,
        len = errors.length,
        evaluator = new Evaluator(this.visitor, 
        {
          prefs: turo && turo.prefs ? turo.prefs() : {}, 
          errors: errors,
          units: turo ? turo.units : 
                 scope ? scope.units : null,
          cacheVariableValue: true,
        });
    operatorLabeller
          .label(node,
                 defaultOperators,
                 errors,
                 evaluator);

    if (errors.length !== len) {
      node.errors = errors;
      return;
    }

    // now we have units and operations, we can evaluate.
    var value = evaluator.evaluate(node);

    if (errors.length !== len) {
      node.errors = errors;
    }

    return value;
  },


  EvaluatorVisitor: EvaluatorVisitor
};