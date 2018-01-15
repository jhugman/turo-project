import tap from 'tap';
import _ from 'underscore';
import turo from './turo-shim';

const { test, plan } = tap;
const prefs = {};


function eval_t (t, input, expectedOutput) {
  var result = turo.evaluate(input);
  if (result.parseError) {
    throw new Error(result.parseError + '');
  }
  t.equal(result.valueToString(), expectedOutput, input + ' = ' + expectedOutput);
}

test("Derive correct units", function (t) {
  eval_t(t, 'sin(0 radians)', '0');
  eval_t(t, 'sin((pi/2) radians)', '1');

  eval_t(t, 'sin(0 deg)', '0');
  eval_t(t, 'sin(90 deg)', '1');

  // no unit  hints, uses deg
  prefs.unitScheme = undefined;
  eval_t(t, 'sin(0)', '0');
  eval_t(t, 'sin(90)', '1');

  // explicit unit scheme, uses deg
  prefs.unitScheme = "Metric";
  eval_t(t, 'sin(0)', '0');
  eval_t(t, 'sin(90)', '1');

  // explicit unit scheme, uses radians
  // TODO thread prefs into the editable-document -> turo-statement -> evaluator.
  // prefs.unitScheme = "SI";
  // eval_t(t, 'sin(0)', '0');
  // eval_t(t, 'sin(pi/2)', '1');



  t.end();
});


