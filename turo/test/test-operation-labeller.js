import { test, plan } from 'tap';
import { Operators, mixins } from '../lib/operators';

test("simple", function (t) {
  var operators = new Operators({});

  operators.addInfixOperator(
    "+", 
    "number", "number", "number", 
    mixins.makeMixin(
      function (x, y) {
        return x + y;
      },
      mixins.simpleTestingOperator
    )
  );

  operators.addInfixOperator(
    "*", 
    "number", "number", "number", 
    mixins.makeMixin(
      function (x, y) {
        return x * y;
      },
      mixins.simpleTestingOperator
    )
  );

  var operator = operators.findOperator("+", "number", "number");

  t.ok(operator);
  t.equal(3, operator.evaluate(1, 2));
  t.equal(6, operators.findOperator("*", "number", "number").evaluate(2, 3));
  t.end();
});
