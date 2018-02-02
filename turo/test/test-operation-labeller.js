import tap from 'tap';
import _ from 'underscore';
import operatorSymbolTable from '../lib/operators-symbol-table';

const { Operators } = operatorSymbolTable;
const { test, plan } = tap;

test("simple", function (t) {
  var operators = new Operators({});

  operators.addInfixOperator("+", "number", "number", "number", null, function (x, y) {
    return x + y;
  });

  operators.addInfixOperator("*", "number", "number", "number", null, function (x, y) {
    return x * y;
  });

  var operator = operators.findOperator("+", "number", "number");

  t.ok(operator);
  t.equal(3, operator.evaluate(1, 2));
  t.equal(6, operators.findOperator("*", "number", "number").evaluate(2, 3));
  t.end();
});
