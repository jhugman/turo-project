import turoNumber from '../turo-number';
import AbstractOperation from './AbstractOperation';

export default class BinaryOperation extends AbstractOperation {
  get numOperands () {
    return 2;
  }

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
    throw new Error(`No simpleValueCalculator specified for ${this.toString()}`);
  }

  toString () {
    return `(${this.lValueType})${this.literal}(${this.rValueType})`;
  }
}