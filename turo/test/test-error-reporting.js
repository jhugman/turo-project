import tap from 'tap';
import _ from 'underscore';
import turo from '../lib/turo';

const { test, plan } = tap;

test("Parse Error", function (t) {
  turo.reset();

  // empty string
  var result = turo.evaluate("");
  t.ok(result.expressionErrors());
  t.ok(result.parseError);

  // syntax error
  result = turo.evaluate("1/");
  t.ok(result.expressionErrors());
  t.ok(result.parseError);

  // no such variable (really a parse error)
  result = turo.evaluate("1/x");
  t.ok(result.expressionErrors());
  t.ok(result.parseError);

  t.end();
});

test("Divide by zero", function (t) {
  turo.reset();

  var result, errors;
  result = turo.evaluate("1 / 0");
  errors = result.expressionErrors();

  t.ok(errors);
  t.equal(errors.length, 1);

  result = turo.evaluate("(1 / 0) + (1 / (1 - 1))");
  errors = result.expressionErrors();

  t.ok(errors);
  t.equal(errors.length, 2);


  t.end();
});

test("Dimension mismatch", function (t) {

  var result, errors;
  turo.reset();
  result = turo.evaluate("unit m : Length");
  t.ok(!result.expressionErrors());

  result = turo.evaluate("unit s : Time");
  t.ok(!result.expressionErrors());

  result = turo.evaluate("1 m * 1 s");
  t.ok(!result.expressionErrors());

  result = turo.evaluate("1 m + 1 s");
  errors = result.expressionErrors();
  t.ok(errors);
  t.equal(errors.length, 1);

  result = turo.evaluate("(1 m + 1 s) * (1m + 1s)");
  errors = result.expressionErrors();
  t.ok(errors);
  t.equal(errors.length, 2);

  t.end();
});

