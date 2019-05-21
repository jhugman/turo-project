import _ from 'underscore';
import turoNumber from '../turo-number';
import mixins from './mixins';
import { Precedence } from './precedence';

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
        Precedence.comparision,
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
        Precedence.comparision,
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
        Precedence.equality,
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
        Precedence.comparision,
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
        Precedence.comparision,
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
        Precedence.inequality,
        mixins.binaryMatchingUnits, mixins.binaryReturnNoUnits
      )
    );
  }
};