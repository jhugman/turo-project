import _ from 'underscore';
import turoNumber from '../turo-number';
import mixins from './mixins';
import { Precedence } from './precedence';

const { makeMixin, isDimensionless } = mixins;

var number = 'number';

/////////////////////////////////////////////////////////////////////////////////////////////
export default {
  registerOperators(ops) {
    ops.addInfixOperator(
      '+', number, number, number,
      makeMixin(
        function (a, b) {
          return a + b;
        },
        Precedence.addition,
        mixins.binaryMatchingUnits
      )
    );

    ops.addInfixOperator(
      '-', number, number, number,
      makeMixin(
        function (a, b) {
          return a - b;
        },
        Precedence.addition,
        mixins.binaryMatchingUnits
      )
    );

    ops.addInfixOperator(
      '*', number, number, number,
      makeMixin(
        function (a, b) {
          return a * b;
        },
        Precedence.multiplication,
        mixins.binaryAnyUnits,
        mixins.binaryMultiplyUtils
      )
    );

    ops.addInfixOperator(
      '/', number, number, number, 
      makeMixin(
        function (a, b) {
          return a / b;
        },
        Precedence.multiplication,
        mixins.binaryAnyUnits,
        mixins.binaryDivideUtils
      )
    );

    // unary -
    ops.addPrefixOperator(
      '-', number, number, 
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
      '+', number, number, [
        Precedence.unaryAddition,
        mixins.unaryIdentity,
      ]
    );

    ops.addInfixOperator(
      'in', number, 'unit', number,
      [
        Precedence.conversion,
        {
          preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
            return (!isDimensionless(leftValue) && leftValue.unit.matchesDimensions(rightValue.unit));
          },

          turoValueCalculator: function (leftValue, rightValue) {
            return leftValue.convert(rightValue.unit);
          }
        },
      ]
    );
  }
}
