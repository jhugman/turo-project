import _ from 'underscore';
import basicArithmetic from './basic-arithmetic';
import advancedArithmetic from './advanced-arithmetic';
import trigonometry from './trigonometry';
import hyperbolic from './hyperbolic';
import percent from './percent';
import booleanOps from './boolean';
import numberComparisons from './number-comparisons';

const operations = [
  basicArithmetic,
  advancedArithmetic,
  trigonometry,
  hyperbolic,
  percent,
  booleanOps,
  numberComparisons,
];

export default function (opts) {
  operations.forEach(type => type.registerOperators(opts));

  return opts;
};