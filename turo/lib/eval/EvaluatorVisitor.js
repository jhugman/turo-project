import { defaultOperators } from '../operators';
import turoNumber from '../turo-number';
import { ASTVisitor } from '../visitors';

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
export default class EvaluatorVisitor extends ASTVisitor {
  visitImportStatement (node, context) {
    // NOP, we do this in the parser.
  }

  visitStatementList (node, context) {
    node.ast.forEach(function(st) {
      node.accept(this, context);
    });
  }

  visitBinaryOperator (node, context) {
    var operation = node.operation,
        result = operation.evaluate(node.left, node.right, context);
    return unitConversion(node, result);
  }

  visitUnaryOperation (node, context) {
    var operation = node.operation,
        result = operation.evaluate(node.value, context);
    return unitConversion(node, result);
  }

  visitParens (node, context) {
    var child = node.ast,
        result = child.accept(this, context);
    return unitConversion(node, result);
  }  

  visitNumberNode (node, context) {
    node.value = node._value; // XXX WTF
    return turoNumber.newInstance(node.value, node.unitLiteral, node.valueType);
  }

  visitIdentifier (node, context) {
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
  }

  visitVariableDefinition (node, context) {
    var value = node.ast.accept(this, context);
    node.currentValue = value;
    return value;
  }

  visitUnitDefinitionStatement (node, context) {
    return node;
  }

  visitUnit (node, context) {
    return node;
  }

  visitUnitPower (node, context) {
    return node;
  }

  visitUnitPer (node, context) {
    return node;
  }

  visitUnitLiteral (node, context) {
    return node;
  }

  visitUnitMultOp (node, context) {
    return node;
  }

  visitTuroValue (node, context) {
    return node.turoNumber.number;
  }
}