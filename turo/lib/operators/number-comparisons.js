'use strict';
var _ = require('underscore'),
    turoNumber = require('../turo-number'),
    mixins = require('./mixins'),

    makeMixin = mixins.makeMixin,
    isDimensionless = mixins.isDimensionless;
    
var number = 'number',
    bool = 'boolean';

/////////////////////////////////////////////////////////////////////////////////////////////
// Unit aware comparisons. 
/////////////////////////////////////////////////////////////////////////////////////////////
module.exports.registerOperators = function registerOperators (ops) {

  ops.addInfixOperator(
    // 1 m < 1 yd
    '<',
    number, number, bool,
    makeMixin(
      function (l, r) {
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

};