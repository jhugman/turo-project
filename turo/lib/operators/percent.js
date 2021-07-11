import _ from 'underscore';
import turoNumber from '../turo-number';
import mixins from './mixins';
import { Precedence } from './precedence';

const { makeMixin, isDimensionless } = mixins;
    
var number = 'number',
    percent = 'percent';

/////////////////////////////////////////////////////////////////////////////////////////////
// Percent special cases using a postfix operator to generate percents from numbers.
/////////////////////////////////////////////////////////////////////////////////////////////

function percentNumberMultiply (lValue, rValue) {
  return lValue * rValue / 100;
}

export default {
  registerOperators(ops) {
    // Making a percent type with a postfix operator.
    /////////////////////////////

    ops.addPostfixOperator(
      '%', number, percent,
      [
        Precedence.multiplication,
        mixins.unaryNoUnits, 
        mixins.unaryIdentity,
        {
          nodeCalculator: function (operandNode, ctx) {
            var operandValue = ctx.evaluate(operandNode, ctx);

            if (!operandValue) {
                // An error occurred in the sub tree.
                // We don't need to report it again here.
                return;
            }

            if (!this.preflightCheck(operandNode, operandValue, ctx)) {
                return;
            }

            if (operandNode.nodeType === 'ParensNode' && operandNode.inner.literal === '/') {
              // i.e. (10 / 1000) % = 1%
              return turoNumber.newInstance(operandValue * 100, null, this.returnValueType);
            }

            return this.turoValueCalculator(operandValue);
          }
        }
      ]
    );

    // Percent percent arithmetic.
    /////////////////////////////

    ops.addInfixOperator(
      // 1% + 2%
      '+', percent, percent, percent,
      makeMixin(
        function (a, b) {
          return a + b;
        },
        Precedence.addition,
        mixins.binaryNoUnits
      )
    );

    ops.addInfixOperator(
      // 1% - 2%
      '-', percent, percent, percent,
      makeMixin(
        function (a, b) {
          return a - b;
        },
        Precedence.addition,
        mixins.binaryNoUnits
      )
    );

    ops.addInfixOperator(
      // 10% * 20% = 2%
      '*', percent, percent, percent,
      makeMixin(
        percentNumberMultiply,
        Precedence.multiplication,
        mixins.binaryNoUnits
      )
    );

    ops.addInfixOperator(
      // 200% / 100%
      '/',
      percent,
      percent,
      number,
      makeMixin(
        function (a, b) {
          return a / b;
        },
        Precedence.multiplication,
        mixins.binaryNoUnits,
        mixins.binaryPercentNoUnits,
        mixins.binaryDivideUtils,
        mixins.binaryPercentNoUnitsDivide
      )
    );

    // Mixing numbers and percent.
    /////////////////////////////

    ops.addInfixOperator(
      // SPECIAL CASE
      // 10 $ + 10%
      '+',
      number,
      percent,
      number,
      makeMixin(
        function (a, b) {
          return a * (100 + b) / 100;
        },
        Precedence.addition, // because it's like 10$ * 1.10
        mixins.binaryPercentNoUnits
      )
    );

    ops.addInfixOperator(
      // SPECIAL CASE
      // 10 $ - 10%
      '-',
      number,
      percent,
      number,
      makeMixin(
        function (a, b) {
          return a * (100 - b) / 100;
        },
        Precedence.addition,
        mixins.binaryPercentNoUnits
      )
    );

    ops.addInfixOperator(
      // 50% * 10 m
      '*',
      percent,
      number,
      number,
      makeMixin(
        percentNumberMultiply,
        mixins.binaryPercentNoUnits,
        Precedence.multiplication
      )
    );

    ops.addInfixOperator(
      // 10m * 50%
      '*',
      number,
      percent,
      number,
      makeMixin(
        percentNumberMultiply,
        mixins.binaryPercentNoUnits,
        Precedence.multiplication
      )
    );

    ops.addInfixOperator(
      // 50% / 10 m
      '/',
      percent,
      number,
      number,
      makeMixin(
        function percentNumberDivide (lValue, rValue) {
          // L % / R = (L / 100) / R
          return lValue / rValue / 100;
        },
        Precedence.multiplication,
        mixins.binaryDivideUtils,
        mixins.binaryPercentDivide
      )
    );

    ops.addInfixOperator(
      // 10m / 50%
      '/',
      number,
      percent,
      number,
      makeMixin(
        function numberPercentDivide (lValue, rValue) {
          // L / R% = L / (R / 100)
          return lValue * 100 / rValue;
        },
        Precedence.multiplication,
        mixins.binaryDivideUtils,
        mixins.binaryPercentDivide
      )
    );
    /////////////////////////////////////////////////////////////////////////////////////////////

    // unary -
    ops.addPrefixOperator(
      '-', percent, percent, 
      makeMixin(
        function (x) {
          return -x;
        },
        Precedence.unaryAddition,
        mixins.unaryIdentity
      )
    );

    // unary +
    ops.addPrefixOperator(
      '+', percent, percent, [
        Precedence.unaryAddition,
        mixins.unaryIdentity,
      ]
    );
  }
};