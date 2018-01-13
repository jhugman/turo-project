import tap from 'tap';
import _ from 'underscore';
import turo from './turo-shim';

const { test, plan } = tap;

function eval_t (t, input, expectedOutput) {
  var result = turo.evaluate(input);
  if (result.hasErrors()) {
    t.fail('Problem with ' + input + ': ' + _.pluck(result.errors, 'message'));
  } else {
    result = result.valueToString(undefined, {padding: ' '});
    t.equal(result, expectedOutput, input + ' = ' + result);
  }
}

test("Percent input & output", function (t) {
  eval_t(t, '10%', '10 %');
  eval_t(t, '(10)%', '10 %');
  eval_t(t, '(10%)', '10 %');
  t.end();
});

test("Percent simple arithmetic", function (t) {
  eval_t(t, '10% + 20%', '30 %');
  eval_t(t, '10% - 20%', '-10 %');
  eval_t(t, '10% * 20%', '2 %');
  eval_t(t, '20% / 10%', '2');
  t.end();
});

test("Percent arithmetic with numbers and units", function (t) {

  eval_t(t, '10% * 150', '15');
  eval_t(t, '150 * 10%', '15');

  eval_t(t, '10% * 150 m', '15 metres');
  eval_t(t, '150 m * 10%', '15 metres');

  eval_t(t, '20 m / 10%', '200 metres');
  
  // TODO Percent: check if this 400 % / 2m = 2 m or 2 /m.
  eval_t(t, '400% / 2 m', '2 metres');
  eval_t(t, '400% / (2 m)', '2/m');

  t.end();
});

test("Percent special case arithmetic", function (t) {
  eval_t(t, '10 + 10%', '11');
  eval_t(t, '10 m + 10%', '11 metres');

  eval_t(t, '10 - 10%', '9');
  eval_t(t, '10 m - 10%', '9 metres');

  // TODO Test:
  // Breaks associativity x % + y should fail, because it's weird.

  t.end();
});

test("Percent special case arithmetic", function (t) {

  eval_t(t, 'tip = 10%', '10 %');
  eval_t(t, '10 m + tip', '11 metres');

  t.end();
});