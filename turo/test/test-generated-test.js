import tap from 'tap';
import _ from 'underscore';
import turo from './turo-shim';

const { test, plan } = tap;

test("Initial", function (t) {
  turo.reset();
  turo.evaluate("r = 1");
  t.equal(turo.evaluate("r").valueToString(), "1", "r == \"1\"");
  t.equal(turo.evaluate("r").valueToString(), "1", "r == \"1\"");
  t.end();
});

test("simple integers", function (t) {
  turo.reset();
  t.equal(turo.evaluate("1").valueToString(), "1", "1 == \"1\"");
  t.equal(turo.evaluate("1").valueToString(), "1", "1 == \"1\"");
  t.equal(turo.evaluate("1+2").valueToString(), "3", "1+2 == \"3\"");
  t.equal(turo.evaluate("1+2").valueToString(), "3", "1+2 == \"3\"");
  t.end();
});

