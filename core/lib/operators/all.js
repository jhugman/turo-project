'use strict';
var _ = require('underscore');

module.exports = function (ops) {
  require('./basic-arithmetic').registerOperators(ops);
  require('./advanced-arithmetic').registerOperators(ops);
  require('./trigonometry').registerOperators(ops);
  require('./hyperbolic').registerOperators(ops);
  require('./percent').registerOperators(ops);
  require('./boolean').registerOperators(ops);
  require('./number-comparisons').registerOperators(ops);

  return ops;
};