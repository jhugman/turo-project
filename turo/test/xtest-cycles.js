import tap from 'tap';
import _ from 'underscore';
import turo from './turo-shim';

const { test, plan } = tap;

function exec(str) {
  return turo.evaluate(str).resultValueNode;
}

test("Cycle with prime. Should execute", async function (t) {
  await turo.reset();
  exec("r = 1");
  exec("r = 2");

  exec("r = r'");
  exec("r = r' + 1");

  t.end();
});

test("Cycle without prime. Should error", async function (t) {
  await turo.reset();
  exec("r = 1");
  exec("r = 2");

  exec("r = r");
  exec("r = r + 1");

  t.end();
});