import _ from 'underscore';
import turoNumber from '../turo-number';
import mixins from './mixins';

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
        mixins.binaryMatchingUnits
      )
    );

    ops.addInfixOperator(
      '-', number, number, number,
      makeMixin(
        function (a, b) {
          return a - b;
        },
        mixins.binaryMatchingUnits
      )
    );

    ops.addInfixOperator(
      '*', number, number, number,
      makeMixin(
        function (a, b) {
          return a * b;
        },
        mixins.binaryAnyUnits,
        mixins.binaryMultiplyUtils,
      )
    );

    ops.addInfixOperator(
      '/', number, number, number, 
      makeMixin(
        function (a, b) {
          return a / b;
        },
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
        mixins.unaryIdentity
      )
    );

    // unary +
    ops.addPrefixOperator(
      '+', number, number, [
        mixins.unaryIdentity,
      ]
    );

    ops.addInfixOperator(
      'in', number, 'unit', number,
      [
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
