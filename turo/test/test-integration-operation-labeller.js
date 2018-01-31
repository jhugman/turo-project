import tap from 'tap';
import _ from 'underscore';
import turo from './turo-shim';

const { test, plan } = tap;

test("Regression", async function (t) {
  await turo.reset();
  t.equal(turo.evaluate("1+2").toString(), "1 + 2 = 3", "1+2 == 3");

  turo.evaluate("unit m : L");

  var onemetre = turo.evaluate("1m");

  t.equal(onemetre.toString(), "1 m = 1 m", "1m == \"1 m\"");
  t.equal(turo.evaluate("2m*2m").toString(), "2 m * 2 m = 4 m^2", "2m*2m == 4m ** 2");
  turo.evaluate("unit s : T");
  t.equal(turo.evaluate("2m/2s").toString(), "2 m / 2 s = 1 m/s", "2m/2s == \"1 m per s\"");

  t.end();
});

test("Orthoganal units", async function (t) {
  await turo.reset();
  turo.evaluate("unit s : T");
  turo.evaluate("unit m : L");
  t.equal(turo.evaluate("2m/1s").toString(), "2 m / 1 s = 2 m/s", "2m/1s == \"2 m per s\"");

  t.equal(turo.evaluate("4*4m**2").toString(), "4 * 4 m^2 = 16 m^2", "4*4m^2 == \"16 m^2\"");

  t.equal(turo.evaluate("4*4m").toString(), "4 * 4 m = 16 m", "4*4m == \"16 m\"");

  t.end();
});

test("More complex units", async function (t) {
  await turo.reset();
  turo.evaluate("unit m : L");
  turo.evaluate("unit s : T");
  turo.evaluate("unit mps : 1 m per s");
  turo.evaluate("2 * 1 mps");
  turo.evaluate("2 mps * 1 s");
  t.end();
});

test('Unary operators', async function (t) {
  await turo.reset();

  t.equal(turo.evaluate("sqrt 25").expressionToString(), "sqrt 25", "sqrt 25 = 5");

  t.end();
});

