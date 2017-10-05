'use strict';

var _ = require('underscore'),
    turoNumber = require('../turo-number'),
    NO_UNITS = null;

///////////////////////////////////////////////////////////////////////////////
// Exported functions.
///////////////////////////////////////////////////////////////////////////////

function isDimensionless (operandValue) {
  return !operandValue.unit || operandValue.unit.isDimensionless();
}

function makeMixin (simpleValueCalculator) {
  var list = _.toArray(arguments);
  if (_.isFunction(simpleValueCalculator)) {
    list.unshift();
    list.push({
      simpleValueCalculator: simpleValueCalculator
    });
  }
  return list;
}


///////////////////////////////////////////////////////////////////////////////

function checkDivideByZero (leftNode, leftValue, rightNode, rightValue, ctx) {
  if (rightValue.number === 0) {
    ctx.reportError('DIVIDE_BY_ZERO', rightNode);
    return false;
  }
  return true;
}

function checkPercentNoUnits (operandNode, operandValue, ctx) {
  if (operandValue.valueType === 'percent' && !isDimensionless(operandValue)) {
    ctx.reportError('DIMENSION_MISMATCH', operandNode);
    return false;
  }
  return true;
}

///////////////////////////////////////////////////////////////////////////////

var mixins = {
  binaryMatchingUnits: {
    preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
      if (isDimensionless(leftValue)) {
          if (isDimensionless(rightValue)) {
              return true;
          }
          // left is dimensionless, but right isn't.
          return ctx.reportError('DIMENSION_MISMATCH', leftNode, rightNode);
      } else {
          if (isDimensionless(rightValue)) {
              // left is not dimensionless, but right is.
              return ctx.reportError('DIMENSION_MISMATCH', leftNode, rightNode);
          }
      }

      if (!leftValue.unit.matchesDimensions(rightValue.unit)) {
          return ctx.reportError('DIMENSION_MISMATCH', leftNode, rightNode);
      }

      return true;
    },

    prepareRight: function (leftValue, rightValue) {
      if (isDimensionless(leftValue)) {
        return rightValue;
      }
      return rightValue.convert(leftValue.unit);
    },

    unitCalculator: function (leftValue, rightValue) {
      return leftValue.unit || null;
    },
  },

  binaryReturnNoUnits: {
    unitCalculator: function (leftValue, rightValue) {
      return null;
    }
  },

  binaryAnyUnits: {
    turoValueCalculator: function (leftValue, rightValue) {
      var calculatedUnit = this.unitCalculator(leftValue, rightValue);
      var simpleValue = this.simpleValueCalculator(leftValue.value, rightValue.value);
      if (calculatedUnit) {
        var unitConversion = calculatedUnit.simplify();  
        return turoNumber.newInstance(
            simpleValue * unitConversion.value, 
            unitConversion.unit, 
            this.returnValueType
        );
      }
      
      return turoNumber.newInstance(
            simpleValue, 
            null, 
            this.returnValueType
        );
    },
    preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
      return true;
    },
  },

  unaryIdentity: {
    preflightCheck: function (leftNode, leftValue, ctx) {
      // check for units being incompatable.
      // report unit errors.
      return true;
    },

    turoValueCalculator: function (operand) {
      var simpleValue = this.simpleValueCalculator(operand.value);
      return turoNumber.newInstance(simpleValue, operand.unit, this.returnValueType);
    },

    simpleValueCalculator: function (x) {
      return x;
    }
  },

  binaryDivideUtils: {
    nodeCalculator: function (leftNode, rightNode, ctx) {
        var leftValue = ctx.evaluate(leftNode, ctx),
            rightValue = ctx.evaluate(rightNode, ctx);
        if (!this.performPreflightCheck(leftNode, leftValue, rightNode, rightValue, ctx)) {
          return;
        }
        if (isDimensionless(leftValue) && !isDimensionless(rightValue)) {
          if (!rightNode.unitLiteral) {
            rightValue = turoNumber.newInstance(
              rightValue.number, 
              rightValue.unit.pow(-1),
              rightValue.valueType
            );
          }
        }
        return this.turoValueCalculator(leftValue, rightValue, ctx);
    },
    preflightCheck: checkDivideByZero,
    unitCalculator: function (leftValue, rightValue) {
      if (isDimensionless(leftValue)) {
        return rightValue.unit;
      }
      if (isDimensionless(rightValue)) {
        return leftValue.unit;
      }
      return leftValue.unit.per(rightValue.unit);
    } 
  },

  unitsUtils: {
    canDimensionsIntegerDivide: function (value, num) {
      var canDo = true;
      var dimensions = value.unit.getDimension().dimensions;
      _.chain(dimensions).values().each(function (d) {
        canDo = canDo && ((d % num) === 0);
      });
      return canDo;
    },
  },

  unaryAngleToDimensionless: {
    preflightCheck: function (operandNode, operandValue, ctx) {
      // check for units being incompatable.
      // report unit errors.
      if (isDimensionless(operandValue) ||
          operandValue.unit.getDimension().shortName === 'Angle') {
        return true;
      }

      return ctx.reportError('DIMENSION_MISMATCH', operandNode);
    },

    turoValueCalculator: function (operandValue, ctx) {
      var simpleValue = this.simpleValueCalculator(this.toRadians(operandValue, ctx).value);
      return turoNumber.newInstance(simpleValue, NO_UNITS, this.returnValueType);
    },
  },

  trigUtils: {
    getDefaultAngleUnit: function (ctx) {
      var prefs = ctx.prefs,
          units = ctx.units,
          unit = units.unitSchemes.getUnitNames(prefs.unitScheme, 'Angle')[0];
      return units.getUnit(unit);
    },

    isRadians: function (unit) {
      return unit.name === 'radians';
    },

    fromRadians: function (operandValue, ctx) {
      if (isDimensionless(operandValue)) {
        operandValue = turoNumber.newInstance(
          operandValue.number, 
          this.getRadians(ctx), 
          operandValue.valueType
        );
      }
      
      var preferredUnit = this.getDefaultAngleUnit(ctx);
      if (!this.isRadians(preferredUnit)) {
        operandValue = operandValue.convert(preferredUnit);
      }

      return operandValue;
    },

    toRadians: function (operandValue, ctx) {
      if (isDimensionless(operandValue)) {
        operandValue = turoNumber.newInstance(
          operandValue.number, 
          this.getDefaultAngleUnit(ctx), 
          operandValue.valueType
        );
      }

      if (!this.isRadians(operandValue.unit)) {
        operandValue = operandValue.convert(this.getRadians(ctx));
      }

      return operandValue;
    },

    getRadians: function (ctx) {
      return ctx.units.getUnit('radians');
    },
  },

  unaryDimensionlessToAngle: {
    preflightCheck: function (operandNode, operandValue, ctx) {
      // check for units being incompatable.
      // report unit errors.
      if (isDimensionless(operandValue)) {
        return true;
      }

      return ctx.reportError('DIMENSION_MISMATCH', operandNode);
    },

    turoValueCalculator: function (operandValue, ctx) {
      var calculatedUnit = this.unitCalculator(operandValue, ctx),
          simpleValue = this.simpleValueCalculator(this.toRadians(operandValue, ctx).value),
          resultValue = turoNumber.newInstance(simpleValue, this.getRadians(ctx), this.returnValueType);
      
      return this.fromRadians(resultValue, ctx);
    },

    unitCalculator: function (operandValue, ctx) {
      if (isDimensionless(operandValue)) {
        return this.getDefaultAngleUnit(ctx);
      }
      return operandValue.unit;
    },
  },

  binaryNoUnits: {
    turoValueCalculator: function (leftValue, rightValue) {
      var simpleValue = this.simpleValueCalculator(leftValue.value, rightValue.value);
      return turoNumber.newInstance(simpleValue, NO_UNITS, this.returnValueType);
    },

    preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
      var ok = true;
      if (!isDimensionless(leftValue)) {
        ok = false;
        ctx.reportError('DIMENSION_MISMATCH', leftNode);
      }

      if (!isDimensionless(rightValue)) {
        ok = false;
        ctx.reportError('DIMENSION_MISMATCH', rightNode); 
      }

      return ok;
    },
  },

  binaryPercentNoUnits: {
    preflightCheck: function (leftNode, leftValue, rightNode, rightValue, ctx) {
      return checkPercentNoUnits(leftNode, leftValue, ctx) && 
              checkPercentNoUnits(rightNode, rightValue, ctx);
    },
    unitCalculator: function (leftValue, rightValue) {
      if (leftValue.valueType !== 'percent') {
        return leftValue.unit;
      } else {
        return rightValue.unit;
      }
    },
  },

  binaryPercentDivide: {
    preflightCheck: function () {
      return mixins.binaryPercentNoUnits.preflightCheck.apply(null, arguments) ||
        checkDivideByZero.apply(null, arguments);
    },
    unitCalculator: function (leftValue, rightValue) {
      if (leftValue.valueType !== 'percent') {
        return leftValue.unit;
      }
      if (!isDimensionless(rightValue)) {
        return rightValue.unit;
      }
    },
  },

  unaryNoUnits: {
    turoValueCalculator: function (leftValue) {
      var simpleValue = this.simpleValueCalculator(leftValue.value);
      return turoNumber.newInstance(simpleValue, NO_UNITS, this.returnValueType);
    },

    preflightCheck: function (leftNode, leftValue, ctx) {
      var ok = true;
      if (!isDimensionless(leftValue)) {
        ok = false;
        ctx.reportError('DIMENSION_MISMATCH', leftNode);
      }
      return ok;
    },
  },

};

mixins.makeMixin = makeMixin;
mixins.isDimensionless = isDimensionless;

module.exports = mixins;