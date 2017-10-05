"use strict";
var tap = require("tap"),
  test = tap.test,
  plan = tap.plan,
  _ = require("underscore");

var ast = require("../lib/ast"),
    evaluator = require("../lib/evaluator");

function i(num) {
  return new ast.NumberNode(num);
}

test("simple", function (t) {
  t.equal(evaluator.evaluate(i(2)).value, 2);
  t.equal(evaluator.evaluate(i(1)).value, 1);
  t.end();
});

test("simple-expressions", function (t) {

  var operator = new ast.BinaryNode(i(1), i(2), "+");
  t.equal(evaluator.evaluate(operator).value, 3);

  operator = new ast.BinaryNode(i(1), i(2), "-");
  t.equal(evaluator.evaluate(operator).value, -1);

  operator = new ast.BinaryNode(i(1), i(2), "/");
  t.equal(evaluator.evaluate(operator).value, 0.5);

  operator = new ast.BinaryNode(i(2), i(2), "*");
  t.equal(evaluator.evaluate(operator).value, 4);

  t.end();
});

