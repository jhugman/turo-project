'use strict';
var _ = require('underscore'),
    turoNumber = require('../turo-number'),
    mixins = require('./mixins'),

    makeMixin = mixins.makeMixin,
    isDimensionless = mixins.isDimensionless;
    
var number = 'number';

/////////////////////////////////////////////////////////////////////////////////////////////
// Basic trig.
/////////////////////////////////////////////////////////////////////////////////////////////
module.exports.registerOperators = function registerOperators (ops) {
  ops.addPrefixOperator(
    'sin', number, number,
    makeMixin(
      function (x) {
        return Math.sin(x);
      },
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
      mixins.trigUtils,
      mixins.unaryDimensionlessToAngle
    )
  );
};