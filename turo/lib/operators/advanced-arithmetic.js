'use strict';
var _ = require('underscore'),
    turoNumber = require('../turo-number'),
    mixins = require('./mixins'),

    makeMixin = mixins.makeMixin,
    isDimensionless = mixins.isDimensionless;
    
var number = 'number';
/////////////////////////////////////////////////////////////////////////////////////////////
// Logs, factorials, powers.
/////////////////////////////////////////////////////////////////////////////////////////////
module.exports.registerOperators = function registerOperators (ops) {

  ops.addInfixOperator(
    '^', number, number, number,
    makeMixin(
      function (left, right) {
        return Math.pow(left, right);
      },
      mixins.unitsUtils,
      {
        preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
          if (!isDimensionless(rightValue)) {
            // 2^4m
            ctx.reportError('DIMENSION_MISMATCH', rightNode);
            return false;
          }
          if (leftValue.value < 0 && rightValue.value % 1) {
            // -1^.5
            ctx.reportError('NEGATIVE_NUMBER_EXPONENTIATION', leftNode);
            return false;
          }

          if (!isDimensionless(leftValue)) {
            var rightNumber = rightValue.number;
            if (rightNumber > 1 && rightNumber % 1) {
              // (2m)^1.5
              ctx.reportError('FRACTIONAL_UNIT_POWER', leftNode);
              return false;
            }
            if (rightNumber < 1 && !this.canDimensionsIntegerDivide(leftValue, 1 / rightNumber)) {
              // (4m)^(1/3)
              ctx.reportError('FRACTIONAL_UNIT_POWER', leftNode);
              return false;
            }
          }

          return true;
        },

        // TODO refactor this into a 'prepareLeftOperand', 
        // 'prepareRightOperan' and 'prepareBothOperand', 'prepareNoOperands' mixins.
        turoValueCalculator: function (leftValue, rightValue) {
          var calculatedUnit = this.unitCalculator(leftValue, rightValue);
          var compatLeftValue = this.prepareLeft(leftValue, rightValue);
          var simpleValue = this.simpleValueCalculator(compatLeftValue.value, rightValue.value);
          return turoNumber.newInstance(simpleValue, calculatedUnit, this.returnValueType);
        },

        unitCalculator: function (leftValue, rightValue) {
          var unit = leftValue.unit,
              power = rightValue.number;
          if (!unit) {
            return;
          }
          if (power < 1) {
            unit = unit.simplify().unit;
            // Simplify if needed. We should convert the operand to this unit to start with.
            // XXX save a call to simplify.
            leftValue._simplifiedUnit = unit;
          }
          return unit.pow(power);
        },

        prepareLeft: function (leftValue, rightValue) {
          if (leftValue._simplifiedUnit) {
            return leftValue.convert(leftValue._simplifiedUnit);
          }
          return leftValue;
        },

      }
    )
  );
  /////////////////////////////////////////////////////////////////////////////////////////////

  ops.addPrefixOperator(
    'sqrt', number, number,
    makeMixin(
      function (x) {
        return Math.sqrt(x);
      },
      mixins.unitsUtils,
      {
        preflightCheck: function (operandNode, operandValue, ctx) {
          if (!isDimensionless && !this.canDimensionsIntegerDivide(operandValue, 2)) {
            ctx.reportError('DIMENSION_MISMATCH', operandNode);
            return false;
          }

          if (operandValue.number < 0) {
            ctx.reportError('NEGATIVE_NUMBER_SQRT', operandNode);
            return false;
          }

          return true;
        },

        unitCalculator: function (innerValue) {
          if (isDimensionless(innerValue)) {
            return null;
          }

          // XXX save a simplify call.
          var convertToUnitFirst = innerValue.unit.simplify().unit;
          innerValue._simplifiedUnit = convertToUnitFirst;

          return convertToUnitFirst.pow(1 / 2);
        },

        prepareOperand: function (left) {
          var unit = left._simplifiedUnit;
          if (unit) {
            left = left.convert(unit);
          }
          return left;
        }
      }
    )
  );

  /////////////////////////////////////////////////////////////////////////////////////////////

  ops.addInfixOperator(
    'nth_root', number, number, number,
    makeMixin(
      function (left, right) {
        return Math.pow(right, 1 / left);
      },
      mixins.unitsUtils,
      {

        preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
          if (!isDimensionless(leftValue)) {
            ctx.reportError('DIMENSION_MISMATCH', rightNode);
            return false;
          }
          if (!isDimensionless(rightValue) && !this.canDimensionsIntegerDivide(rightValue, leftValue.number)) {
            ctx.reportError('DIMENSION_MISMATCH', leftNode);
            return false;
          }
          if (rightValue.value < 0) {
            ctx.reportError('NEGATIVE_NUMBER_EXPONENTIATION', leftNode);
            return false;
          }

          return true;
        },

        unitCalculator: function (leftValue, rightValue) {
          if (rightValue.unit) {
            var simplifiedUnit = rightValue.unit.simplify().unit;
            // Simplify if needed. We should convert the operand to this unit to start with.
            // XXX save a call to simplify.
            rightValue._simplifiedUnit = simplifiedUnit;
            return simplifiedUnit.pow(1 / leftValue.number);
          }
        },

        prepareRight: function (leftValue, rightValue) {
          if (rightValue.unit) {
            return rightValue.convert(rightValue._simplifiedUnit);
          }
          return rightValue;
        }
      }
    )
  );

  /////////////////////////////////////////////////////////////////////////////////////////////
  // Logs.
  /////////////////////////////////////////////////////////////////////////////////////////////

  ops.addPrefixOperator(
    'log', number, number,
    makeMixin(
      function (x) {
        return Math.log(x) / Math.LN10;
      },
      mixins.unaryNoUnits
    )
  );

  ops.addPrefixOperator(
    'ln', number, number,
    makeMixin(
      function (x) {
        return Math.log(x);
      },
      mixins.unaryNoUnits
    )
  );

  /////////////////////////////////////////////////////////////////////////////////////////////
  // Factorial
  // http://stackoverflow.com/a/15454866/4737
  function gamma (n) {  // accurate to about 15 decimal places
    //some magic constants 
    var g = 7, // g represents the precision desired, p is the values of p[i] to plug into Lanczos' formula
        p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if(n < 0.5) {
      return Math.PI / Math.sin(n * Math.PI) / gamma(1 - n);
    }
    else {
      n--;
      var x = p[0];
      for(var i = 1; i < g + 2; i++) {
        x += p[i] / (n + i);
      }
      var t = n + g + 0.5;
      return Math.sqrt(2 * Math.PI) * Math.pow(t, (n + 0.5)) * Math.exp(-t) * x;
    }
  }

  function factorial_decimal (n) {
    return gamma(n + 1);
  }

  function factorial_integer (n) {
    var product = 1;
    for (var i = n; i > 0; i--) {
      product *= i;
    }
    return product;
  }

  ops.addPostfixOperator(
    '!', number, number,
    makeMixin(
      function (x) {
        if (x % 1 === 0) {
          return factorial_integer(x);
        } else {
          return factorial_decimal(x);
        }
      },
      mixins.unaryNoUnits, 
      {
        preflightCheck: function (operandNode, operandValue, ctx) {
          if (operandValue.number < 0) {
            ctx.reportError('COMPLICATED', operandNode);
            return false;
          }
          return mixins.unaryNoUnits.preflightCheck(operandNode, operandValue, ctx);
        }
      }
    )
  );

};