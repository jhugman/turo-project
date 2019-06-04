import _ from 'underscore';
import turoNumber from '../turo-number';
import mixins from './mixins';
import { Precedence } from './precedence';

const { makeMixin, isDimensionless } = mixins;
    
var number = 'number';

/////////////////////////////////////////////////////////////////////////////////////////////
// Basic trig.
/////////////////////////////////////////////////////////////////////////////////////////////
export default {
  registerOperators(ops) {
    ops.addPrefixOperator(
      'sin', number, number,
      makeMixin(
        function (x) {
          return Math.sin(x);
        },
        Precedence.trigonometric,
        mixins.trigUtils,
        mixins.unaryAngleToDimensionless
      )
    );

    ops.addPrefixOperator(
      'asin', number, number,
      makeMixin(
        function (x) {
          // TODO check if -1 <= lNode <= 1
          return Math.asin(x);
        },
        Precedence.trigonometric,
        mixins.trigUtils,
        mixins.unaryDimensionlessToAngle
      )
    );

    ops.addPrefixOperator(
      'cos', number, number,
      makeMixin(
        function (x) {
          return Math.cos(x);
        },
        Precedence.trigonometric,
        mixins.trigUtils,
        mixins.unaryAngleToDimensionless
      )
    );

    ops.addPrefixOperator(
      'acos', number, number,
      makeMixin(
        function (x) {
          return Math.acos(x);
        },
        Precedence.trigonometric,
        mixins.trigUtils,
        mixins.unaryDimensionlessToAngle
      )
    );

    ops.addPrefixOperator(
      'tan', number, number,
      makeMixin(
        function (x) {
          return Math.tan(x);
        },
        Precedence.trigonometric,
        mixins.trigUtils,
        mixins.unaryAngleToDimensionless
      )
    );

    ops.addPrefixOperator(
      'atan', number, number,
      makeMixin(
        function (x) {
          return Math.atan(x);
        },
        Precedence.trigonometric,
        mixins.trigUtils,
        mixins.unaryDimensionlessToAngle
      )
    );
  }
};