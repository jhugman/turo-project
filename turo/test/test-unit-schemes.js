import tap from 'tap';
import _ from 'underscore';
import turo from '../lib/turo';
import units_table from '../lib/units-table.js';
import output from '../lib/to-source';

const { test, plan } = tap;
const { UnitsTable, Dimension } = units_table;

test("Unit schemes", function (t) {
  var units = new Units(),
      m = units.addUnit("m", "Length", undefined, ["metric"]),
      s = units.addUnit("s", "Time");

  // Explicitly defined unit scheme
  t.deepEqual(m.getUnitSchemes(), ["metric"]);

  // Compound unit has schemes derived from simpler units
  var volume = m.pow(3);
  t.deepEqual(volume.getUnitSchemes(), ["metric"]);

  // Implicitly defined from a base unit
  var km = units.addUnit("km", 1000, m);
  t.deepEqual(km.getUnitSchemes(), ["metric"]);

  var h = units.addUnit("h", 3600, s),
    // Explicitly defined scheme overrides scheme from base units
      mi = units.addUnit("mi", 1609, m, ["imperial"]);

  // Units without schemes do not have any effect on derived schemes.
  t.deepEqual(km.per(h).getUnitSchemes(), ["metric"]);
  t.deepEqual(mi.per(h).getUnitSchemes(), ["imperial"]);

  t.end();
});

test("Unit scheme helper", function (t) {
  var units = new Units(),
      unitSchemes = units.unitSchemes,

      m = units.addUnit("m", "Length", undefined, ["metric"]),
      cm = units.addUnit("cm", m, 100),

      s = units.addUnit("s", "Time"),
      h = units.addUnit("h", "Time"),
      inch = units.addUnit("inch", m, 39, ["imperial"]),
      miles = units.addUnit("miles", 1609, m, ["imperial"]);

  t.deepEqual(unitSchemes.getUnitSchemes(), ["metric", "imperial"]);

  t.deepEqual(unitSchemes.getDimensions("metric"), ["Length", "Time"]);

  t.deepEqual(unitSchemes.getUnitNames("metric", "Length"), ["m", "cm"]);
  t.deepEqual(unitSchemes.getUnitNames("imperial", "Length"), ["inch", "miles"]);

  t.deepEqual(unitSchemes.getUnitNames("metric", "Time"), ["s", "h"]);
  t.deepEqual(unitSchemes.getUnitNames("imperial", "Time"), ["s", "h"]);

  // compound units:


  var mph = units.addUnit("mph", 1, miles.per(h), ["imperial"], "Speed"),
      kph = units.addUnit("kph", 1000, m.per(h));

  t.equal(mph.getDimension().shortName, "Speed");
  t.equal(kph.getDimension().shortName, "Speed");

  t.deepEqual(unitSchemes.getDimensions("metric"), ["Length", "Time", "Speed"]);
  t.deepEqual(unitSchemes.getDimensions("imperial"), ["Length", "Time", "Speed"]);

  t.deepEqual(unitSchemes.getUnitNames("imperial", "Speed"), ["mph"]);
  t.deepEqual(unitSchemes.getUnitNames("metric", "Speed"), ["kph"]);

  t.end();
});

test("Unit scheme helper", function (t) {
  var units = new Units(),
      unitSchemes = units.unitSchemes,

      m = units.addUnit("m", "Length", undefined, ["metric"]),
      cm = units.addUnit("cm", m, 100),
      mm = units.addUnit("mm", cm, 10),
      km = units.addUnit("km", 1000, m),

      inch = units.addUnit("inch", m, 39, ["imperial"]),
      foot = units.addUnit("foot", 12, inch),
      miles = units.addUnit("miles", 1609, m, ["imperial"]);

    t.equal(unitSchemes.findClosestUnit(mm, "imperial", "Length").name, "inch");
    t.equal(unitSchemes.findClosestUnit(cm, "imperial", "Length").name, "inch");
    t.equal(unitSchemes.findClosestUnit(m, "imperial", "Length").name, "foot");
    t.equal(unitSchemes.findClosestUnit(inch, "metric", "Length").name, "cm");
    t.equal(unitSchemes.findClosestUnit(miles, "metric", "Length").name, "km");

    t.end();
});

function contains (t, superset, subset) {
  var result = _.isEmpty(_(subset).difference(superset));
  if (!result) {
    t.deepEqual(superset, subset);
  } else {
    t.ok(true, "Contains: " + JSON.stringify(subset));
  }
}

test("Unit schemes in imports: Metric", function (t) {
  var Turo = require("../lib/turo").Turo,
      turo = new Turo();

  turo.include("metric");
  var units = turo.units,
      unitSchemes = units.unitSchemes;

  contains(t, unitSchemes.getUnitSchemes(), ["SI", "Metric"]);
  t.deepEqual(unitSchemes.getUnitNames("SI", "Length"), ["m"]);
  t.deepEqual(unitSchemes.getUnitNames("SI", "Mass"), ["kg"]);
  t.deepEqual(unitSchemes.getUnitNames("Metric", "Length"), ["m", "km", "cm", "mm"]);
  t.end();
});

test("Unit schemes in imports: Imperial", function (t) {
  var Turo = require("../lib/turo").Turo,
      turo = new Turo();

  turo.include("imperial");
  var units = turo.units,
      unitSchemes = units.unitSchemes;

  contains(t, unitSchemes.getUnitSchemes(), ["SI", "Imperial"]);

  t.deepEqual(unitSchemes.getUnitNames("SI", "Length"), ["m"]);
  t.deepEqual(unitSchemes.getUnitNames("Imperial", "Length"), ["yd", "ft", "inch", "mile"]);

  t.end();
});

test("Unit schemes in imports: app", function (t) {
  var Turo = require("../lib/turo").Turo,
      turo = new Turo();

  turo.include("app");
  var units = turo.units,
      unitSchemes = units.unitSchemes;

  contains(t, unitSchemes.getUnitSchemes(), ["SI","Metric","Imperial"]);

  t.deepEqual(unitSchemes.getUnitNames("SI", "Length"), ["m"]);
  t.deepEqual(unitSchemes.getUnitNames("Imperial", "Length"), ["yd", "ft", "inch", "mile"]);

  t.end();
});
