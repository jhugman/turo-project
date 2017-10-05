"use strict";
var tap = require("tap"),
  test = tap.test,
  plan = tap.plan,
  _ = require("underscore");

var balancer = require("../lib/preprocessor-paren-balancer");

test("Identity", function (t) {
  var b = balancer.createEmpty();
  t.equal(b.preprocess("1 + 2 * 3"), "1 + 2 * 3");
  t.equal(b.preprocess("(1 + 2) * 3"),  "(1 + 2) * 3");
  t.end();
});

test("Not enough closers", function (t) {
  var b = balancer.createEmpty();
  t.equal(b.preprocess("1 * (2 + 3"), "1 * (2 + 3)");
  t.equal(b.preprocess("((1 + 2) * 3)"),  "((1 + 2) * 3)");
  t.equal(b.preprocess("((1 + 2 * 3"),  "((1 + 2 * 3))");
  t.end();
});

test("Too many closers", function (t) {
  var b = balancer.createEmpty();
  t.equal(b.preprocess("1) + (2 * 3))"), "1 + (2 * 3)");
  t.equal(b.preprocess(")1) + (2) * 3)))"),  "1 + (2) * 3");
  t.end();
});

test("Mixed", function (t) {
  var b = balancer.createEmpty();
  t.equal(b.preprocess("1 + 2 * 3"), "1 + 2 * 3");
  t.equal(b.preprocess("(1 + 2) * 3"),  "(1 + 2) * 3");
  t.end();
});