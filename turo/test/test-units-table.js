import tap from 'tap';
import _ from 'underscore';
import turo from '../lib/turo';
import units_table from '../lib/units-table.js';
import output from '../lib/to-source';

const { test, plan } = tap;
const { UnitsTable: Units, Dimension } = units_table;

function equal(t, a, b) {
  t.equal(Math.floor(a * 1e12), Math.floor(b * 1e12), a + " === " + b + "?");
}

test("conversion from units", function (t) {
  var units = new Units();

  var milliseconds = units.addUnit("milliseconds", "time"),
      second = units.addUnit("second", 1000, "milliseconds");

  t.deepEqual(milliseconds.getDimension().dimensions, {"time": 1});
  t.deepEqual(second.getDimension().dimensions, {"time": 1});

  t.equal(units.convert(2, "second", "milliseconds"), 2000);

  t.equal(units.convert(3000, "milliseconds", "second"), 3);
  t.equal(units.convert(3500, "milliseconds", "second"), 3.5);

  // add more units, to see if we're converting on the fly
  units.addUnit("minute", 60, "second");
  t.equal(units.convert(0.5, "minute", "milliseconds"), 30000);
  t.equal(units.convert(60000, "milliseconds", "minute"), 1);


  // now really hard.
  // add a disconnected island, before connecting them again.
  // Not sure if this should be possible
  t.throws(function () {
    units.addUnit("day", 24, "hour");
  });


  units.addUnit("hour", 60, "minute");
  units.addUnit("day", 24, "hour");


  t.deepEqual(units.getDimension("hour").dimensions, {"time":1});


  // now add mass
  units.addUnit("kg", "mass");
  units.addUnit("tonne", 1000, "kg");

  // we can add dimensions
  t.deepEqual(units.getDimension("tonne").dimensions, {"mass":1});
  t.equal(units.convert(3, "tonne", "kg"), 3000);

  // add metric and imperial
  units.addUnit("lb", "kg", 2.24); // unit 2.24 lb = 1 kg;
  units.addUnit("ton", 2240, "lb"); // unit 1 ton = 2240 lb;

  t.equal(units.convert(1, "tonne", "ton"), 1);

  // check we didn't disturb time
  t.equal(units.convert(60000, "milliseconds", "minute"), 1);

  // test if we can convert dimensions
  t.throws(function () {
    units.convert(3, "tonne", "milliseconds");
  });

  t.end();
});

test("unit objects from units", function (t) {

  var units = new Units();

  // now add mass
  units.addUnit("kg", "mass");
  units.addUnit("tonne", 1000, "kg");

  // add metric and imperial
  units.addUnit("lb", "kg", 2.24); // unit 2.24 lb = 1 kg;
  units.addUnit("ton", 2240, "lb"); // unit 1 ton = 2240 lb;

  // we can add dimensions
  t.deepEqual(units.getUnit("tonne").getDimension().dimensions, {"mass":1});

  t.equal(units.getUnit("tonne").convert(3, "kg"), 3000);


  t.equal(units.getUnit("tonne").convert(1, "ton"), 1);

  t.end();
});

test("compound unit dimensions", function (t) {
  var CompoundUnit = units_table.CompoundUnit;
  var units = new Units();

  units.addUnit("metre", "Length");
  t.ok(units.getUnit("metre"));

  units.addUnit("mile", 1609, "metre");

  units.addUnit("second", "Time");
  units.addUnit("hour", 3600, "second");

  var metrePerSecond = new CompoundUnit(units, {"metre": 1, "second": -1});
  t.deepEqual(metrePerSecond.getDimension().dimensions, {Length: 1, Time: -1});


  var mph = new CompoundUnit(units, {"mile": 1, "hour": -1});

  t.ok(mph.getDimension().isEqual(metrePerSecond.getDimension()));


  // conversions.

  // identity
  equal(t, metrePerSecond.convert(10, metrePerSecond), 10);
  equal(t, mph.convert(10, mph), 10);

  equal(t, metrePerSecond.convert(10, mph), 10 * 3600 / 1609, "metrePerSecond to mph");


  var mphs = new CompoundUnit(units, {mile:1, hour:-1, second:-1}),
      msps = new CompoundUnit(units, {metre:1, second:-2});

  equal(t, msps.convert(10, mphs), 10 * 3600 / 1609);

  t.end();
});

test("composability", function (t) {
  var units = new Units();

  var metre = units.addUnit("metre", "Length"),
      km = units.addUnit("km", 1000, "metre"),
      mile = units.addUnit("mile", 1609, "metre"),

      second = units.addUnit("second", "Time"),
      // we can make a new simple unit out of an old one.
      hour = units.addUnit("hour", 3600, second),

      kg = units.addUnit("kg", "Mass");

  t.ok(metre);
  t.ok(km);
  t.ok(second);
  t.ok(hour);

  // we can compose new units from simpler ones.
  var kph = km.per(hour);
  t.ok(kph);

  var metrePerSecond = metre.per(second);
  t.ok(metrePerSecond);

  // check they're the same dimensions.
  t.ok(metrePerSecond.getDimension().isEqual(kph.getDimension()));

  // and we can do conversion with them.

  // 1 metre per second in km per hour;
  equal(t, metrePerSecond.convert(5, kph), 5 * 3600 / 1000);

  // 1 kg metre;
  var kg_m = kg.by(metre);
  t.ok(kg_m.getDimension().isEqual(new Dimension({Mass:1, Length:1})));

  // 1 kg metre per second;
  var kg_m__s = kg.by(metrePerSecond);
  t.ok(kg_m__s.getDimension().isEqual(new Dimension({Mass:1, Length:1, Time: -1})));

  // 1 metre per second per second
  var acceleration = metre.per(second.by(second));
  t.ok(acceleration.getDimension().isEqual(new Dimension({Length: 1, Time: -2})));



  // now compose from already compound ones.

  // 1 kg m/s/s;
  // TODO 1 kg m/s**2
  // TODO 1 kg m s**-2
  // TODO (1 m) ** 2;
  // TODO sqrt(1 m**2);
  var newton = metrePerSecond.per(second).by(kg);
  t.ok(newton.getDimension().isEqual(new Dimension({Length: 1, Time: -2, Mass:1})));

  var newton2 = kg.by(metre.per(second.by(second)));

  // needed because getDimension() is lazy.
  newton2.getDimension();
  t.deepEqual(newton, newton2);

  // testing naming a compound unit...
  // unit newton : kg m/s/s
  newton2 = units.addUnit("newton", newton);
  t.ok(newton2);
  t.ok(newton === newton2);

  // ... a multiple of a named compound unit
  // unit kilonewton : 1000 newton;
  var kilonewton = units.addUnit("kilonewton", 1000, newton);
  t.ok(kilonewton);

  // 1 kilonewton in newton;
  // 1 newton in kilonewton;
  t.ok(newton.getDimension().isEqual(kilonewton.getDimension()));
  t.equal(kilonewton.convert(2, newton), 2000);
  t.equal(newton.convert(2000, kilonewton), 2);

  // ... an expansion of named compund unit ...
  // 1 kilonewton in kg km per second per second;
  // 1 kg km / hour / s in kilonewton;
  var alt_newton = kph.per(second).by(kg);

  t.ok(newton.getDimension().isEqual(alt_newton.getDimension()));

  // 1 kilonewton in kg kph per second;
  t.equal(kilonewton.convert(1, alt_newton), 3600);

  // 1 kg kph / s in kilonewton; // go through newton
  t.equal(alt_newton.convert(3600, kilonewton), 1);

  // 1 kg kph / s in newton; // use kph
  t.equal(alt_newton.convert(3600, newton), 1000);

  // ... expansion of named compound units within other units ...
  // unit kph: 1 km / hour
  units.addUnit("kph", 1, kph);
  var mph = units.addUnit("mph", 1, mile.per(hour));

  equal(t, kph.convert(100, mph), 100 / 1.609);
  equal(t, kph.convert(100, "mph"), 100 / 1.609);

  t.end();
});

test("api first", function (t) {
  var units = new Units();

  var metre = units.addUnit("metre", "Length"),
      km = units.addUnit("km", 1000, "metre"),

      second = units.addUnit("second", "Time"),
      // we can make a new simple unit out of an old one.
      hour = units.addUnit("hour", 3600, second),

      kg = units.addUnit("kg", "Mass"),
      kph = units.addUnit("kph", km.per(hour));

  var newton = kg.by(metre.per(second.by(second)));
  t.ok(newton);

  var newton2 = units.addUnit("newton", newton);
  t.ok(newton2);
  t.ok(newton === newton2);
  t.ok(newton === units.getUnit("newton"));

  var newton3 = kg.by((metre.per(second)).per(second));
  t.ok(newton.isEqual(newton3));

  var kilonewton = units.addUnit("kilonewton", 1000, "newton");
  t.equal(kilonewton.convert(3.2, "newton"), 3200);
  t.equal(kilonewton.convert(3.2, newton), 3200);

  var altNewton = kg.by(kph).per(second);
  t.ok(altNewton.getDimension().isEqual(newton.getDimension()));
  t.equal(kilonewton.convert(1, altNewton), 3600);
  t.equal(altNewton.convert(3.6, newton), 1);

  t.end();
});

test("advanced complex conversion", function (t) {
  var units = new Units(),
      output = require("../lib/to-source");


  var metre = units.addUnit("metre", "Length"),
      second = units.addUnit("second", "Time"),
      cm = units.addUnit("cm", metre, 100),

      speed = metre.per(second),
      acceleration = metre.per(second).per(second),
      area = metre.pow(2),
      volume = metre.pow(3),
      litre = units.addUnit("litre", 1000, cm.pow(3));

    // 1000 liters = 1 m^3
    equal(t, litre
                .convert(1000,
              metre.pow(3)), 1);

    // 1000 liter / s = 1 m^3 / s
    equal(t, litre.per(second)
                .convert(1000,
              metre.pow(3).per(second)), 1);

   // TODO
 //  t.equal(output.toString(cm.by(metre)), "cm^2");


  t.end();
});

test("source visitor", function (t) {
  var units = new Units();

  var metre = units.addUnit("metre", "Length"),
      second = units.addUnit("second", "Time"),
      speed = metre.per(second),
      acceleration = metre.per(second).per(second),
      area = metre.pow(2),
      volume = metre.pow(3),
      litre = units.addUnit("litre", 0.001, metre.pow(3));


  let string = output.toString(speed, " ");

  t.equal(output.toString(speed, " "), "metre/second");
  t.equal(output.toString(acceleration, " "), "metre/second^2");

  t.equal(output.toString(area, " "), "metre^2");
  t.equal(output.toString(volume, " "), "metre^3");
  t.equal(output.toString(area.per(litre), " "), "metre^2/litre");

  t.end();
});

test("unit simplification", function (t) {

  var units = new Units();

  var metre = units.addUnit("metre", "Length"),
      second = units.addUnit("second", "Time"),
      cm = units.addUnit("cm", metre, 100),

      speed = metre.per(second),
      acceleration = metre.per(second).per(second),
      area = metre.pow(2),
      volume = metre.pow(3),
      litre = units.addUnit("litre", 1000, cm.pow(3));

  var node = cm.per(metre).simplify();
  t.equal(node.value, 0.01);
  t.ok(node.unit.isDimensionless());


  var unit = metre.per(cm.pow(2));
  t.equal(output.toString(unit), "metre/cm^2");

  node = unit.simplify();
  t.equal(output.toString(node.unit, " "), "/cm");
  t.equal(node.value, 100);


  unit = cm.pow(2).per(metre);
  t.equal(output.toString(unit, " "), "cm^2/metre");

  node = unit.simplify();
  t.equal(output.toString(node.unit, " "), "cm");
  t.equal(node.value, 0.01);



  unit = litre.per(cm.by(cm));
  // this is current behavior. We need to simplify it.
  t.equal(output.toString(unit, " "), "litre/cm^2");

  // 2 litre == 2 * 10 cm * 10 cm * 10 cm
  // 2 * 10 cm * 10 cm * 10 cm / 1 cm^2
  // 2000 cm^3 / cm^2
  // 2000 cm
  // 20 m

  // TODO Make this behaviour the default.
  node = unit.simplify();
  t.equal(node.value, 1000);
  t.equal(output.toString(node.unit, " "), "cm");

  var orig;
  orig = cm.by(metre);
  node = orig.simplify();
  t.equal(output.toString(node.unit), "cm^2");
  t.equal(node.value, 100);
  t.equal(orig.convert(1, node.unit), node.value);

  orig = cm.by(metre).by(cm);
  node = orig.simplify();
  t.equal(output.toString(node.unit), "cm^3");
  t.equal(node.value, 100);
  t.equal(orig.convert(1, node.unit), node.value);

  orig = metre.by(metre).by(cm);
  node = orig.simplify();
  t.equal(output.toString(node.unit), "metre^3");
  t.equal(node.value, 0.01);
  t.equal(orig.convert(1, node.unit), node.value);


  var year = units.addUnit("year", 60 * 60 * 24 * 356, second),
      hour = units.addUnit("h", 3600, second),
      month = units.addUnit("month", year, 12),
      kg = units.addUnit("kg", "Mass"),

      km = units.addUnit("km", 1000, metre),
      kph = units.addUnit("kph", 1, km.per(hour));


  // Units of the same dimension are canceled out and normalized
  // e.g. kg / month * year => kg
  orig = kg.per(month).by(year);
  node = orig.simplify();
  t.equal(output.toString(node.unit), "kg");
  t.equal(node.value, 12);
  t.equal(orig.convert(1, node.unit), node.value);

  // month per year => dimensionless.
  orig = month.per(year);
  node = orig.simplify();
  t.equal(output.toString(node.unit), "");
  t.ok(node.unit.isDimensionless());
  t.equal(node.value, 1/12);
  t.equal(orig.convert(1, node.unit), node.value);

  // Where units are mixed, the one used most is used.
  // m * m * km => m^3
  orig = metre.by(metre).by(km);
  node = orig.simplify();
  t.equal(output.toString(node.unit), "metre^3");
  t.equal(node.value, 1000);
  t.equal(orig.convert(1, node.unit), node.value);

  // Compound units are replace with their base units
  // kph / s => km/h s => km/s^2
  orig = kph.per(second);
  node = orig.simplify();
  t.equal(output.toString(node.unit), "km/second^2");
  t.equal(node.value, 1/3600);
  t.equal(orig.convert(1, node.unit), node.value);

  t.end();
});


test("Dimension utility methods", function (t) {
  var xy2 = new Dimension({x : 2, y : 2}),
      xy1 = new Dimension({x : 1, y : 1}),
      xz1 = new Dimension({x : 1, z : 1}),

      x_1 = new Dimension({x : -1}),
      x_2 = new Dimension({x : -2}),

      x;

  t.ok(xy1.contains(xy1));
  t.ok(xy2.contains(xy2));

  t.ok(xy2.contains(xy1));
  t.ok(!xy1.contains(xy2));

  t.ok(!xy1.contains(xz1));
  t.ok(!xz1.contains(xy1));

  t.ok(x_2.contains(x_1));
  t.ok(!x_1.contains(x_2));

  t.end();
});

function choices (t, unit, expected, unitScheme) {
  var r = unit._reductions(unitScheme);
  var observed = _.map(r, function (u) {
    return output.toString(u);
  });


  function object (keys, fn) {
    // underscore should have this.
    var func = _.isFunction(fn) ? fn :
                function () {return fn};
    var obj = {};
    _.each(keys, function (key) {
      obj[key] = func(key);
    });

    return obj;
  }

  t.deepEqual(object(observed, 1), object(expected, 1), output.toString(unit) + " = " + JSON.stringify(observed));
}

test("Unit reduction", function (t) {

  var units = new Units();

  var metre = units.addUnit("m", "Length", undefined, ["Metric"]),
      cm = units.addUnit("cm", metre, 100),
      km = units.addUnit("km", 1000, metre),

      second = units.addUnit("second", "Time"),
      hour = units.addUnit("h", 3600, second),

      speed = metre.per(second),
      acceleration = metre.per(second).per(second),
      area = metre.pow(2),
      volume = metre.pow(3),

      litre = units.addUnit("litre", 1000, cm.pow(3)),
      kph = units.addUnit("kph", 1, km.per(hour)),



      x;



  choices(t, metre.pow(3), ["litre"]);

  choices(t, metre.per(second).by(area), ["litre/second"]);

  choices(t, metre.per(second).by(km.pow(2)), ["litre/second"]);

  choices(t, area.by(km.pow(2)).by(speed), ["m kph litre"]);

  var mile = units.addUnit("mile", 1609, metre, ["Imperial"]),
      mph = units.addUnit("mph", 1, mile.per(hour));

  // factor into units found in the original
  choices(t, metre.per(second).by(km.pow(2)), ["litre/second"]);
  choices(t, area.by(km.pow(2)).by(speed), ["m kph litre", "m mph litre"]);

  // factor into imperial units only.
  choices(t, metre.per(second).by(km.pow(2)), ["mile^2 mph"], "Imperial");
  choices(t, area.by(km.pow(2)).by(speed), ["mile^4 mph"], "Imperial");


  t.end();
});



test("Unit refactoring", function (t) {

  var units = new Units();

  var metre = units.addUnit("m", "Length", undefined, ["Metric"]),
      cm = units.addUnit("cm", metre, 100),
      km = units.addUnit("km", 1000, metre),

      second = units.addUnit("second", "Time"),
      hour = units.addUnit("h", 3600, second),

      speed = metre.per(second),
      acceleration = metre.per(second).per(second),
      area = metre.pow(2),
      volume = metre.pow(3),

      litre = units.addUnit("litre", 1000, cm.pow(3)),
      kph = units.addUnit("kph", 1, km.per(hour)),

      mile = units.addUnit("mile", 1609, metre, ["Imperial"]),
      gallon = units.addUnit("gallon", 4.54, litre, ["Imperial"]),
      mph = units.addUnit("mph", 1, mile.per(hour)),


      x;

  function conv(quantity, unit, unitScheme, expectedQuantity, expectedUnit) {
    var node = unit.refactoredNode(quantity, unitScheme);
    t.equal(node.value, expectedQuantity, quantity + " = " + expectedQuantity);
    t.equal(output.toString(node.unit), expectedUnit, output.toString(unit) + " => " + expectedUnit);
  }

  conv(4.54, litre, "Imperial", 1, "gallon");
  conv(4540, cm.pow(3), "Imperial", 1, "gallon");

  conv(160.9, kph, "Imperial", 100.0, "mph");
  conv(160.9, km.per(hour), "Imperial", 100.0, "mph");

  conv(100.0, mile.per(hour), "Metric", 160.9, "kph");
  conv(100.0, mph, "Metric", 160.9, "kph");

  t.end();
});


test("Unit includes: App", function (t) {
  turo.include("app");
  var units = turo.units,
      unitSchemes = units.unitSchemes;

  t.equal(units.convert(1, "gallon", "litre"), 4.54609);
  t.equal(units.convert(1, "litre", "gallon").toPrecision(5), (1/4.54609).toPrecision(5));

  var ha = units.getUnit("ha"),
      m = units.getUnit("m"),
      kg = units.getUnit("kg");

  t.equal(ha.convert(1, m.pow(2)), 10000);

  t.end();
});