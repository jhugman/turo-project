import _ from 'lodash';
import turoNumber from '../turo-number';
import mixins from './mixins';

const { makeMixin, isDimensionless } = mixins;

var number = 'number',
    bool = 'boolean';

/////////////////////////////////////////////////////////////////////////////////////////////
// Unit aware comparisons. 
/////////////////////////////////////////////////////////////////////////////////////////////
export default {
  registerOperators(ops) {

    ops.addInfixOperator(
      // 1 m < 1 yd
      '<',
      number, number, bool,
      makeMixin(
        function (l, r) {
          console.log('bool', l, r);
          return l < r;
        },
        mixins.binaryMatchingUnits, mixins.binaryReturnNoUnits
      )
    );

    ops.addInfixOperator(
      // 1 m <= 1 yd
      '<=',
      number, number, bool,
      makeMixin(
        function (l, r) {
          return l <= r;
        },
        mixins.binaryMatchingUnits, mixins.binaryReturnNoUnits
      )
    );

    ops.addInfixOperator(
      // 1 m == 1 yd
      '==',
      number, number, bool,
      makeMixin(
        function (l, r) {
          return l === r;
        },
        mixins.binaryMatchingUnits, mixins.binaryReturnNoUnits
      )
    );

    ops.addInfixOperator(
      // 1 m >= 1 yd
      '>=',
      number, number, bool,
      makeMixin(
        function (l, r) {
          return l >= r;
        },
        mixins.binaryMatchingUnits, mixins.binaryReturnNoUnits
      )
    );

    ops.addInfixOperator(
      // 1 m > 1 yd
      '>',
      number, number, bool,
      makeMixin(
        function (l, r) {
          return l > r;
        },
        mixins.binaryMatchingUnits, mixins.binaryReturnNoUnits
      )
    );

    ops.addInfixOperator(
      // 1 m != 1 yd
      '!=',
      number, number, bool,
      makeMixin(
        function (l, r) {
          return l !== r;
        },
        mixins.binaryMatchingUnits, mixins.binaryReturnNoUnits
      )
    );
  }
};