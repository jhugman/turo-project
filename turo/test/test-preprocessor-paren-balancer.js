import tap from 'tap';
import _ from 'lodash';
import turo from '../lib/turo';
import balancer from '../lib/preprocessor-paren-balancer';

const { test, plan } = tap;

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