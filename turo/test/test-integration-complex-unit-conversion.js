import tap from 'tap';
import _ from 'underscore';

import turo from './turo-shim'

const { test, plan } = tap;

var prefs = {
  padding: ' ',
};

test("Initial", async function (t) {
  await turo.reset();
  // assume synchronous, but it isn't really.

  t.equal(turo.evaluate("1 km^2 in m^2").valueToString(), "1000000 m^2", "1 km^2 in m^2 == \"1000000 m^2\"");
  t.end();
});

test("Square root", async function (t) {
  await turo.reset();
  t.equal(turo.evaluate("sqrt(1 ha)").valueToString(), "100 m", "sqrt(1 ha)");
  t.equal(turo.evaluate("sqrt(1 km * 1.024 m)").valueToString(), "0.032 km", "sqrt(1 km * 1.024 m)");
  t.equal(turo.evaluate("sqrt(1 m * 1.024 km)").valueToString(), "32 m", "sqrt(1 m * 1.024 km)");

  // I'm not sure which this: 
  // My DSL has an "include science" command. 
  // But it's spelt: include "science".
  turo.evaluate('area = 102400 m^2');
  turo.evaluate('infection_aceleration = area / 10 s / 10 s');

  t.equal(turo.evaluate("sqrt(infection_aceleration)").valueToString(), "32 m/s", "sqrt(infection_aceleration)");

  t.end();
});

test("Nth root", async function (t) {
  await turo.reset();
  t.equal(turo.evaluate("3 nth_root 27").valueToString(), "3", "3 nth_root 27");
  t.equal(turo.evaluate("3 nth_root(27 litres)").valueToString(), "30 cm", "3 nth_root(27 litre)");
  t.equal(turo.evaluate("3 nth_root 27 litres").valueToString(), "3 litres", "3 nth_root 27 litres");
  t.equal(turo.evaluate("2 nth_root(25 kph^2)").valueToString(), "5 km/h", "2 nth_root(25 kph^2)");
  t.end();
});


test("Nth power", async function (t) {
  await turo.reset();
  t.equal(turo.evaluate("2^3").valueToString(), "8", "2^3");
  t.equal(turo.evaluate("(2m)^3").valueToString(), "8 m^3", "(2m)^3");
  t.equal(turo.evaluate("(27m^3)^(1/3)").valueToString(), "3 m", "(27m^3)^(1/3)");
  t.equal(turo.evaluate("(27l)^(1/3)").valueToString(), "30 cm", "(27l)^(1/3)");

//   // Invalid statements.
  t.ok(turo.evaluate("(3 m)^(2 m)").hasErrors(), "(3 m)^(2 m) is invalid");
  t.ok(turo.evaluate("(3 m^3)^(1.5)").hasErrors(), "(3 m^3)^(1.5) is invalid");
  t.ok(turo.evaluate("(3 m^3)^(.5)").hasErrors(), "(3 m^3)^(.5) is invalid");

  t.end();
});



test('Unit Divide', async function (t) {
  await turo.reset();
  t.equal(turo.evaluate("4/2").valueToString(), "2", "4/2");
  t.equal(turo.evaluate("4/2s").valueToString(), "2 seconds", "4/2s");
  t.equal(turo.evaluate("4m/2").valueToString(), "2 metres", "4m/2");
  t.equal(turo.evaluate("4m/2s").valueToString(), "2 m/s", "4m/2s");
  t.equal(turo.evaluate("4/2").valueToString(), "2", "4/2");
  t.equal(turo.evaluate("4/2/s").valueToString(), "2/s", "4/2s");
  t.equal(turo.evaluate("4/m/2").valueToString(), "2/m", "4m/2");
  t.equal(turo.evaluate("4/m/2/s").valueToString(), "2 s/m", "4m/2s");
  t.end();
});

test('Unit prefix ops', async function (t) {
  await turo.reset();
  // TODO: this should be 100 metres
  t.equal(turo.evaluate("sqrt(1 ha)").valueToString(), "100 m", "sqrt(1 ha)");
  // TODO: sqrt(1 m) should fail.
  t.equal(turo.evaluate("sqrt(1) ha").valueToString(), "1 hectare", "sqrt(1) ha");
  t.equal(turo.evaluate("sqrt 1 ha").valueToString(), "1 hectare", "sqrt 1 ha");

  // Trig functions slightly differently, handling angles…
  t.equal(turo.evaluate('cos(180 deg)').valueToString(), "-1", 'cos(180 deg)');
  t.equal(turo.evaluate('cos(pi radians)').valueToString(), "-1", 'cos(pi radians)');
  t.equal(turo.evaluate('cos 180 radians').valueToString(), "-1 radian", 'cos pi radians');
  // by default, it uses whatever Angle unit belongs to the current unit scheme.
  t.equal(turo.evaluate('cos(180)').valueToString(), "-1", 'cos(180)');

  // but fallback to multiplication if not an angle.
  t.equal(turo.evaluate('cos 0 m').valueToString(), "1 metre", 'cos 0 m');

  // cos(0 m) makes no sense: should error.
  // t.ok(turo.evaluate('cos(0 m)').errors.length > 0, 'cos(0 m)');

  t.equal(turo.evaluate('cos(180 deg) m').valueToString(), "-1 metre", 'cos(180 deg) m');
  t.equal(turo.evaluate('cos(pi radians) m').valueToString(), "-1 metre", 'cos(pi radians) m');
  t.equal(turo.evaluate('cos(pi radians) m').valueToString(), "-1 metre", 'cos(pi radians) m');
  t.equal(turo.evaluate('acos(0)').valueToString(), "90 degrees", 'acos(0)');
  t.equal(turo.evaluate('acos(0) m').valueToString(), "90 deg m", 'acos(0) m');

  t.end();
});

test('Simple unit conversion based on unitScheme', async function (t) {
  await turo.reset();
  const prefs = {
    useUnitRefactor: true,
    simpleUnits: true,
  };
  t.equal(turo.evaluate("36 inch").valueToString(undefined, prefs), "36 inches", "36 inches");

  prefs.unitScheme = 'Imperial';
  t.equal(turo.evaluate("36 inch").valueToString(undefined, prefs), "36 inches", "36 inches");

  // TODO how do we vary the display unit scheme globally?
  // prefs.unitScheme = 'Metric';
  // t.equal(turo.evaluate("36 inch").valueToString(undefined, prefs), "91.44 cm", "36 inch in Metric");

  t.end();
});

