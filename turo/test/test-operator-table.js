import { test } from 'tap';
import _ from 'underscore';
import ast from '../lib/ast';
import { Operators, defaultOperators, mixins } from '../lib/operators';
import turoNumber from '../lib/turo-number';

test("simple", function (t) {
  var operators = new Operators();

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


var inode = function (num) {
  return new ast.NumberNode(num);
};


var ctx = {
  evaluate: function (node) {
    return turoNumber.newInstance(node.value, node.unit, 'number');
  }
};

test("defaultOperators", function (t) {

  var ops = defaultOperators,
      number = "number";
  var left = 1,
      right = 2,
      expected = 3,
      op = ops.findOperator("+", number, number);

  t.ok(op);
  t.ok(op.evaluate);
  t.ok(ctx.evaluate);

  var result = op.evaluate(inode(left), inode(right), ctx);
  t.equal(expected, result.value);
  t.end();
});


