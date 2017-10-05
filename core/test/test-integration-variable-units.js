"use strict";
var tap = require("tap"),
  test = tap.test,
  plan = tap.plan,
  _ = require("underscore");

var turo = require("../lib/turo");



test("Implicit conversion", function (t) {
  turo.reset();
  turo.evaluate("unit m : Length");
  turo.evaluate("unit km : 1000 m");
  turo.evaluate("x = 1 km");
  t.equal(turo.evaluate("x m").toString(), "x m = 1000 m", "x m == \"x m = 1000 m\"");
  turo.evaluate("test x m = \"x m = 1000 m\"");
  t.end();
});

test("Variable reassignment bug", function (t) {
  turo.reset();
  turo.evaluate("unit m : Length");
  turo.evaluate("unit s : Time");
  turo.evaluate("x = 1 m");
  t.equal(turo.evaluate("x").toString(), "x = 1 m", "x == \"x = 1 m\"");
  turo.evaluate("test x = \"x = 1 m\"");
  turo.evaluate("x = 1 s");
  t.equal(turo.evaluate("x").toString(), "x = 1 s", "x == \"x = 1s\"");
  turo.evaluate("test x = \"x = 1 s\"");
  t.end();
});

test("Variable reassignment bug 2", function (t) {
  turo.reset();
  turo.evaluate("unit m : L");
  turo.evaluate("unit mi : 1609m");
  turo.evaluate("unit s : T");
  turo.evaluate("unit min : 60 s");
  turo.evaluate("distance = 5 mi");
  turo.evaluate("time = 20 min");
  turo.evaluate("speed = (distance / time) m/s");
  t.equal(turo.evaluate("speed").toString(), "speed = 6.7041666666667 m/s", "speed == \"speed = 6.704166666666667 m s\"");

  turo.evaluate("speed = (distance / time)");
  t.equal(turo.evaluate("speed").toString(), "speed = 0.25 mi/min", "speed == \"speed = 0.25 mi/min\"");

  t.end();
});

test("Variable with unitLiteral bug 3", function (t) {
  turo.reset();
  turo.include('app');
  turo.evaluate("w = 80 kg");
  turo.evaluate("h = 6 ft");
  turo.evaluate("h");
  t.equal(turo.evaluate("w kg/(h m)^2").valueToString(), "23.919800926022 kg/m^2", "w kg/(h m)^2");


  turo.evaluate("x = 80");
  t.equal(turo.evaluate("x").valueToString(), "80", "x");
  t.equal(turo.evaluate("x m").valueToString(), "80 metres", "x m");
  t.equal(turo.evaluate("(x m)^2").valueToString(), "6400 m^2", "(x m)^2");

  t.end();
});

