import tap from 'tap';
import _ from 'underscore';
import turo from '../lib/turo';

const { test, plan } = tap;

test("Simple expressions", function (t) {
  turo.reset();
  t.equal(turo.evaluate("1+2").toString(), "1 + 2 = 3", "1+2 == \"3\"");
  t.equal(turo.evaluate("1*3").toString(), "1 * 3 = 3", "1*3 == \"3\"");
  t.end();
});

test("Result convenience methods", function (t) {
  turo.reset();

  var m = turo.evaluate("unit m : Length");
  var r = turo.evaluate("2 * 2 m");

  t.equal(r.identifier(), undefined);
  t.equal(r.identifierToString(), "");
  t.equal(r.expressionToString(), "2*2 m");
  t.equal(r.valueToString(), "4 m");

  r = turo.evaluate("area = 2 m * 2m");
  t.equal(r.identifier(), "area");
  t.equal(r.identifierToString(), "area");
  t.equal(r.expressionToString(), "2 m*2 m");
  t.equal(r.valueToString(), "4 m^2");

  t.end();
});