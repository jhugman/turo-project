import tap from 'tap';
import _ from 'underscore';
import turo from '../lib/turo';

const { test, plan } = tap;

test("Initial", function (t) {
  turo.reset();
  // turo.evaluate("include \"metric\"");
  t.equal(turo.evaluate("0.1 + 0.2").valueToString(), "0.3", "0.1 + 0.2"); // 15
  t.equal(turo.evaluate("1.2 * 6").valueToString(), "7.2", "1.2 * 6");
  t.equal(turo.evaluate("1.2 * 6 - 7").valueToString(), "0.2", "1.2 * 6 - 7"); // 15
  t.equal(turo.evaluate("sqrt 2 ^ 2").valueToString(), "2", "2"); // 14
  t.end();
});

