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
  console.dir(operator);
  t.equal(3, operator.evaluate(1, 2));
  t.equal(6, operators.findOperator("*", "number", "number").evaluate(2, 3));
  t.end();
});
