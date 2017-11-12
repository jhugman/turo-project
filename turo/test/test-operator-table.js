"use strict";
var tap = require("tap"),
  test = tap.test,
  plan = tap.plan,
  _ = require("underscore");


var ast = require("../lib/ast"),
    parser = require("../lib/parser"),
    output = require("../lib/to-source"),
    Operators = require("../lib/operators-symbol-table").Operators;



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


var inode = function (num) {
  return new ast.NumberNode(num);
};

var turoNumber = require('../lib/turo-number');
var ctx = {
  evaluate: function (node) {
    return turoNumber.newInstance(node.value, node.unit, 'number');
  }
};

test("defaultOperators", function (t) {

  var ops = require("../lib/operators-symbol-table").defaultOperators,
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


