import turoNumber from '../turo-number';
import AbstractOperation from './AbstractOperation';

export default class UnaryOperation extends AbstractOperation {
  get numOperands () {
    return 1;
  }

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

  toString () {
    return (this.isPrefix) ? `${this.literal}(${this.rValueType})` : `(${this.lValueType})${this.literal}`;
  }
}
