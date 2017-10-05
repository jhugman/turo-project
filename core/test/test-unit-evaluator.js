"use strict";
var tap = require("tap"),
  test = tap.test,
  plan = tap.plan,
  _ = require("underscore");

var parser = require("../lib/parser"),
    ast = require("../lib/ast"),
    evaluator = require("../lib/evaluator"),
    Units = new require("../lib/units-table").UnitsTable,
    Variables = new require("../lib/variables-symbol-table").Context;

test("Expressions with units", function (t) {

  var variables = parser.variables = new Variables(),
      units = parser.units = new Units(),
      result;

  function parse(str) {
    var node = parser.parse(str, "Statement");
    if (node.accept) {
      return evaluator.evaluate(node);
    }
  }

  var m = parse("unit m : Length").ast,
      s = parse("unit s : Time").ast,
      km = parse("unit km : 1000 m").ast;

  result = parse("1 m * 1 s");
  t.equal(1, result.number);
  t.ok(m.by(s).isEqual(result.unit));

  t.ok(m.pow(2).isEqual(parse("1 m^2").unit));
  t.ok(km.pow(2).isEqual(parse("1 km^2").unit));

  t.ok(m.pow(2).isEqual(parse("1 km^2 in m^2").unit));


  t.end();
});