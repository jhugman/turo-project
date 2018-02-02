import tap from 'tap';
import _ from 'underscore';
import wordCleaner from '../lib/preprocessor-word-cleaner';

const { test, plan } = tap;

test("Identity", function (t) {
  var wc = wordCleaner.createEmpty(["foo", "bar", "baz"]);
  t.equal(wc.preprocess("foo bar baz"), "foo bar baz");
  t.equal(wc.preprocess(" foo  bar baz"),  " foo  bar baz");
  t.equal(wc.preprocess(" foo bar baz "), " foo bar baz ");
  t.end();
});


test("Dumb words", function (t) {

  var wc = wordCleaner.createEmpty(["foo", "bar", "baz"]);


  t.equal(wc.preprocess("X foo bar baz"), "  foo bar baz");
  t.equal(wc.preprocess("foo X bar baz"), "foo   bar baz");
  t.equal(wc.preprocess("foo bar baz X"), "foo bar baz  ");

  t.equal(wc.preprocess("X foo X bar baz XXX"), "  foo   bar baz    ");


  t.end();
});

test("Foreign punctionation", function (t) {
  var wc = wordCleaner.createEmpty(["foo", "bar", "baz"]);
  t.equal(wc.preprocess(".X foo X. bar baz (X)"), "   foo    bar baz    ");
  t.end();
});

test("My punctionation", function (t) {
  var wc = wordCleaner.createEmpty(["foo", "bar", "baz"]);
  t.equal(wc.preprocess("X (foo) X (bar baz) X"), "  (foo)   (bar baz)  ");
  t.end();
});

test("Mixed", function (t) {
  var wc = wordCleaner.createEmpty(["foo", "bar", "baz"]);
  t.equal(wc.preprocess(".X (foo) X. (bar baz) (X)"), "   (foo)    (bar baz)    ");

  t.equal(wc.preprocess("let foo = (5 + 3) * 2"), "    foo = (5 + 3) * 2");

  t.end();
});

test("Unit statement bug", function (t) {
  var wc = wordCleaner.createEmpty(["unit", "m", "cm"]);
  t.equal(wc.preprocess("unit 100 cm : m"), "unit 100 cm : m");

  t.end();
});