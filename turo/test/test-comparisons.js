import tap from 'tap';
import _ from 'underscore';
import turo from '../lib/turo';

const { test, plan } = tap;
const { Turo } = turo; 

function testParse(t, turo, string, expected) {
  var result = turo.evaluate(string);

  if (result.expressionErrors()) {
    console.error(result.expressionErrors());
  }

  if (expected === 'false') {
    var st = result.valueToString();
  } 
  {
    t.equal(result.valueToString(), expected, string + ' = ' + expected);
  }

}

test('No comparisons', function (t) {
  var turo = new Turo();

  testParse(t, turo, '1 + 2', '3');

  t.end();
});

test('Simple comparisons', function (t) {
  var turo = new Turo();
  testParse(t, turo, '3 < 3', 'false');
  testParse(t, turo, '2 < 4', 'true');
  testParse(t, turo, '2 <= 3', 'true');
  testParse(t, turo, '3 <= 2', 'false');
  testParse(t, turo, '3 == 3', 'true');
  testParse(t, turo, '2 == 4', 'false');
  testParse(t, turo, '3 != 3', 'false');
  testParse(t, turo, '2 != 4', 'true');
  testParse(t, turo, '3 >= 3', 'true');
  testParse(t, turo, '3 >= 4', 'false');
  testParse(t, turo, '3 > 2', 'true');
  testParse(t, turo, '3 > 4', 'false');
  t.end();
});

test('Simple with expression comparisons', function (t) {
  var turo = new Turo();

  testParse(t, turo, '1 + 2 < 3', 'false');
  testParse(t, turo, '1 + 2 < 4', 'true');
  testParse(t, turo, '1 + 2 <= 3', 'true');
  testParse(t, turo, '1 + 2 <= 2', 'false');
  testParse(t, turo, '1 + 2 == 3', 'true');
  testParse(t, turo, '1 + 2 == 4', 'false');
  testParse(t, turo, '1 + 2 != 3', 'false');
  testParse(t, turo, '1 + 2 != 4', 'true');
  testParse(t, turo, '1 + 2 >= 3', 'true');
  testParse(t, turo, '1 + 2 >= 4', 'false');
  testParse(t, turo, '1 + 2 > 2', 'true');
  testParse(t, turo, '1 + 2 > 4', 'false');

  t.end();
});

test('Trivial boolean algebra', function (t) {
  var turo = new Turo();
  testParse(t, turo, 'const true = (1 == 1)', 'true');
  testParse(t, turo, 'const false = (1 != 1)', 'false');

  testParse(t, turo, 'true && true', 'true');
  testParse(t, turo, 'true && false', 'false');
  testParse(t, turo, 'false && true', 'false');
  testParse(t, turo, 'false && false', 'false');

  testParse(t, turo, 'true || true', 'true');
  testParse(t, turo, 'true || false', 'true');
  testParse(t, turo, 'false || true', 'true');
  testParse(t, turo, 'false || false', 'false');
  
  testParse(t, turo, '!false', 'true');
  t.end();
});

test('With units', function (t) {
  var turo = new Turo();
  turo.include('app');
  testParse(t, turo, '1 m < 0.1 km', 'true');
  testParse(t, turo, '1 m/s < 0.1 km/h', 'false');
  testParse(t, turo, '1 m <= 0.1 km', 'true');
  testParse(t, turo, '1 m/s <= 0.1 km/h', 'false');
  testParse(t, turo, '100 m == 0.1 km', 'true');
  testParse(t, turo, '1 m == 0.1 km', 'false');
  testParse(t, turo, '1 m != 0.1 km', 'true');
  testParse(t, turo, '1 m != 100 cm', 'false');
  
  testParse(t, turo, '1 km >= 1 m', 'true');
  testParse(t, turo, '1 mm >= 1 m', 'false');

  testParse(t, turo, '1 km > 1 m', 'true');
  testParse(t, turo, '1 mm > 1 m', 'false');

  t.end();
});