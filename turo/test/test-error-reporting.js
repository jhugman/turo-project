import tap from 'tap';
import _ from 'underscore';
import turo from './turo-shim';

const { test, plan } = tap;

test("Parse Error", (t) => {
  turo.resetImportNothing();

  const expectUnparsable = (string) => {
    const result = turo.evaluate(string);
    t.ok(result.hasErrors(), `'${string}' has errors`);
    t.notOk(result.isParseable(), `'${string}' is not parseable`);
  };

  // empty string
  expectUnparsable('')
  // syntax error
  expectUnparsable('/1');
  // no such variable (really a parse error)
  expectUnparsable('x + 1');
  
  t.end();
});

test("Divide by zero", (t) => {
  turo.resetImportNothing();

  var result, errors;
  result = turo.evaluate("1 / 0");
  errors = result.errors;

  t.ok(errors);
  t.equal(errors.length, 1);

  result = turo.evaluate("(1 / 0) + (1 / (1 - 1))");
  errors = result.errors;

  t.ok(errors);
  t.equal(errors.length, 2);

  t.end();
});

test("Dimension mismatch", (t) => {
  turo.resetImportNothing();

  var result, errors;
  
  result = turo.evaluate("unit m : Length");
  t.ok(!result.errors);

  result = turo.evaluate("unit s : Time");
  t.ok(!result.errors);

  result = turo.evaluate("1 m * 1 s");
  t.ok(!result.errors);

  result = turo.evaluate("1 m + 1 s");
  errors = result.errors;
  t.ok(errors);
  t.equal(errors.length, 2);

  result = turo.evaluate("(1 m + 1 s) * (1m + 1s)");
  errors = result.errors;
  t.ok(errors);
  t.equal(errors.length, 4);

  t.end();
});

