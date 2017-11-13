import tap from 'tap';
import _ from 'lodash';
import turo from '../lib/turo';

const { test, plan } = tap;

test("Output has units", function (t) {
  turo.reset();
  turo.evaluate("unit m : L");
  turo.evaluate("unit km : 1000m");
  t.equal(turo.evaluate("2000m in km").toString(), "2000 m in km = 2 km", "2000m in km == \"2 km\"");

  t.equal(turo.evaluate("2km in m").toString(), "2 km in m = 2000 m", "2km in m == \"2000 m\"");


  t.end();
});

test("Output has compound units", function (t) {
  turo.reset();
  turo.evaluate("unit m : L");
  turo.evaluate("unit km : 1000m");
  turo.evaluate("unit s : T");
  turo.evaluate("unit h : 3600s");

  turo.evaluate("unit kph : 1km/h");

  t.equal(turo.evaluate("2 m/s in kph").toString(), "2 m/s in kph = 7.2 kph", "2 m/s in kph = 7.2 kph");
  t.equal(turo.evaluate("7.2kph in m/s").toString(), "7.2 kph in m/s = 2 m/s", "7.2 kph in m/s = 2 m/s");

  // TODO
  //t.equal(turo.evaluate("2 m/s^2 in kph/s").toString(), "7.2 m /s^2 in kph /s", "2 m /s^2 in kph /s");

  t.end();
});

