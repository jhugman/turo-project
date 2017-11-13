import _ from 'lodash';
import turoNumber from '../turo-number';
import mixins from './mixins';

const { makeMixin, isDimensionless } = mixins;
    
var bool = 'boolean';

/////////////////////////////////////////////////////////////////////////////////////////////
// Unit aware comparisons. 
/////////////////////////////////////////////////////////////////////////////////////////////
export default {
  registerOperators(ops) {
    /////////////////////////////////////////////////////////////////////////////////////////////
    // Boolean operators.
    /////////////////////////////////////////////////////////////////////////////////////////////
    ops.addInfixOperator(
      // 1 < x AND y > 2 m
      'AND',
      bool, bool, bool,
      makeMixin(
        function (l, r) {
          return l && r;
        },
        mixins.binaryNoUnits
      )
    );

    ops.addInfixOperator(
      // 1 < x OR y > 2 m
      'OR',
      bool, bool, bool,
      makeMixin(
        function (l, r) {
          return l || r;
        },
        mixins.binaryNoUnits
      )
    );

    ops.addPrefixOperator(
      // !(1 > x)
      '!',
      bool, bool,
      makeMixin(
        function (o) {
          return !o;
        },
        mixins.unaryNoUnits
      )
    );

    ops.addPrefixOperator(
      // NOT (1 > x)
      'NOT',
      bool, bool,
      makeMixin(
        function (o) {
          return !o;
        },
        mixins.unaryNoUnits
      )
    );
  }
}