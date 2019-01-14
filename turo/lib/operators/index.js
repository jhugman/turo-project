import ast from '../ast';
import turoNumber from '../turo-number';

class AbstractOperation {
  // publically called by the evaluator.
  evaluate (leftNode, rightNode, ctx) {}

  // calculates calculates the operands, and then uses them to calculate 
  // the result.
  // Returns an AST node.
  nodeCalculator (leftNode, rightNode, ctx) {}

  // checks for any operands that would cause errors (e.g. unit dimensionality, divide by zero),
  // returns true if no errors. Reports errors with ctx if so.
  // Returns Boolean
  preflightCheck (leftNode, leftValue, rightNode, rightValue, ctx) {}

  // Calculates the unit of the result (using unitCalculator), normalizes 
  // the right hand operand to be compatible with the left (using prepareRight)
  // the calculates the simple values (using simpleValueCalculator).
  // Returns a TuroNumber
  turoValueCalculator (leftValue, rightValue) {}
}

//////////////////////////////////////////////////
class BinaryOperation extends AbstractOperation {
  evaluate (leftNode, rightNode, ctx) {
    return this.nodeCalculator(leftNode, rightNode, ctx);
  }

  nodeCalculator (leftNode, rightNode, ctx) {
    var leftValue = ctx.evaluate(leftNode, ctx),
      rightValue = ctx.evaluate(rightNode, ctx);
    if (!this.performPreflightCheck(leftNode, leftValue, rightNode, rightValue, ctx)) {
      return;
    }
    return this.turoValueCalculator(leftValue, rightValue, ctx);
  }

  performPreflightCheck (leftNode, leftValue, rightNode, rightValue, ctx) {
    if (!leftValue || !rightValue) {
      // An error occurred in the sub tree.
      // We don't need to report it again here.
      return;
    }

    if (!this.preflightCheck(leftNode, leftValue, rightNode, rightValue, ctx)) {
      return;
    }
    return true;
  }

  preflightCheck (leftNode, leftValue, rightNode, rightValue, ctx) {
    // check for units being incompatable.
    // report unit errors.
    return true;
  }

  turoValueCalculator (leftValue, rightValue) {
    var calculatedUnit = this.unitCalculator(leftValue, rightValue);
    var compatRightValue = this.prepareRight(leftValue, rightValue);
    var simpleValue = this.simpleValueCalculator(leftValue.value, compatRightValue.value);
    return turoNumber.newInstance(simpleValue, calculatedUnit, this.returnValueType);
  }

  prepareRight (leftValue, rightValue) {
    return rightValue;
  }

  simpleValueCalculator (left, right) {
    throw new Error(`No simpleValueCalculator specified for ${literal} operator over ${lValueType} and ${rValueType}`);
  }
}
//////////////////////////////////////////////////

class UnaryOperation extends AbstractOperation {
  evaluate(x, ctx) {
    return this.nodeCalculator(x, ctx);
  }

  performPreflightCheck (operandNode, operandValue, ctx) {
    if (!operandValue) {
      // An error occurred in the sub tree.
      // We don't need to report it again here.
      return;
    }
    if (!this.preflightCheck(operandNode, operandValue, ctx)) {
      return;
    }
    return true;
  }

  nodeCalculator (operandNode, ctx) {
    var operandValue = ctx.evaluate(operandNode, ctx);
    if (!this.performPreflightCheck(operandNode, operandValue, ctx)) {
      return;
    }
    return this.turoValueCalculator(operandValue, ctx);
  }

  preflightCheck (leftNode, leftValue, ctx) {
    // check for units being incompatable.
    // report unit errors.
    return true;
  }

  turoValueCalculator (leftValue) {
    var calculatedUnit = this.unitCalculator(leftValue),
      operand = this.prepareOperand(leftValue);
    var simpleValue = this.simpleValueCalculator(operand.value);
    return turoNumber.newInstance(simpleValue, calculatedUnit, this.returnValueType);
  }

  prepareOperand (leftValue) {
    return leftValue;
  }

  unitCalculator (leftValue) {
    return leftValue.unit;
  }

  simpleValueCalculator (left) {
    throw new Error(`No simpleValueCalculator specified for ${literal} operator over ${lValueType} or ${rValueType}`);
  }
}

export { UnaryOperation, BinaryOperation };
