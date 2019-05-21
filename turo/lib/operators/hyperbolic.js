import _ from 'underscore';
import turoNumber from '../turo-number';
import mixins from './mixins';
import { Precedence } from './precedence';

const { makeMixin, isDimensionless } = mixins;
    
var number = 'number';
/////////////////////////////////////////////////////////////////////////////////////////////
// Hyperbolic functions.
// http://keisan.casio.com/exec/system/1223040677
/////////////////////////////////////////////////////////////////////////////////////////////

export default {
  registerOperators(ops) {

    ops.addPrefixOperator(
      'sinh',
      number, number,
      makeMixin(
        function (x) {
          if (Math.sinh) {
            return Math.sinh(x);
          } else {
            return (Math.exp(x) - Math.exp(-x)) / 2;
          }
        },
        Precedence.functionCall,
        mixins.unaryNoUnits
      )
    );

    ops.addPrefixOperator(
      'asinh', number, number,
      makeMixin(
        function (x) {
          if (Math.asinh) {
            return Math.asinh(x);
          } else {
            // ln(x + sqrt(x^2 + 1)) + 1
            return Math.ln(x + Math.sqrt(x*x + 1));
          }
        },
        Precedence.functionCall,
        mixins.unaryNoUnits
      )
    );

    ops.addPrefixOperator(
      'cosh', number, number,
      makeMixin(
        function (x) {
          if (Math.cosh) {
            return Math.cosh(x);
          } else {
            return (Math.exp(x) + Math.exp(-x)) / 2;
          }
        },
        Precedence.functionCall,
        mixins.unaryNoUnits
      )
    );

    ops.addPrefixOperator(
      'acosh', number, number,
      makeMixin(
        function (x) {
          if (Math.acosh) {
            return Math.acosh(x);
          } else {
            // ln(x + sqrt(x^2 - 1))
            return Math.ln(x + Math.sqrt(x*x - 1));
          }
        },
        Precedence.functionCall,
        mixins.unaryNoUnits, 
        {
          preflightCheck: function (operandNode, operandValue, ctx) {
            if (operandValue.value < 1) {
              ctx.reportError('COMPLICATED', operandNode);
              return false;
            }
            return mixins.unaryNoUnits.preflightCheck(operandNode, operandValue, ctx);
          }
        }
      )
    );

    ops.addPrefixOperator(
      'tanh', number, number,
      makeMixin(
        function (x) {
          if (Math.tanh) {
            return Math.tanh(x);
          } else {
            return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
          }
        },
        Precedence.functionCall,
        mixins.unaryNoUnits
      )
    );

    ops.addPrefixOperator(
      'atanh', number, number,
      makeMixin(
        function (x) {
          if (Math.atanh) {
            return Math.atanh(x);
          } else {
            // 1 / 2 * ln((1 + x) / (1 - x))
            return Math.ln((1 + x) / (1 - x)) / 2;
          }
        },
        Precedence.functionCall,
        mixins.unaryNoUnits, 
        {
          preflightCheck: function (operandNode, operandValue, ctx) {
            if (Math.abs(operandValue.number) >= 1) {
              ctx.reportError('COMPLICATED', operandNode);
              return false;
            }
            return mixins.unaryNoUnits.preflightCheck(operandNode, operandValue, ctx);
          }
        }
      )
    );
  }
};