import tap from 'tap';
import _ from 'underscore';
import operatorSymbolTable from '../lib/operators-symbol-table';
import mixins from '../lib/operators/mixins';

const { makeMixin, simpleTestingOperator } = mixins;
const { Operators } = operatorSymbolTable;
const { test, plan } = tap;

test("simple", function (t) {
  var operators = new Operators({});

  operators.addInfixOperator(
    "+", 
    "number", "number", "number", 
    makeMixin(
      function (x, y) {
        return x + y;
      },
      simpleTestingOperator
    )
  );

  operators.addInfixOperator(
    "*", 
    "number", "number", "number", 
    makeMixin(
      function (x, y) {
        return x * y;
      },
      simpleTestingOperator
    )
  );

  var operator = operators.findOperator("+", "number", "number");

  t.ok(operator);
  t.equal(3, operator.evaluate(1, 2));
  t.equal(6, operators.findOperator("*", "number", "number").evaluate(2, 3));
  t.end();
});
