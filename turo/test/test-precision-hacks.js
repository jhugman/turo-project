import { test, plan } from 'tap';
import turo from './turo-shim';

test("Initial", async function (t) {
  await turo.reset();
  // turo.evaluate("import \"metric\"");
  t.equal(turo.evaluate("0.1 + 0.2").valueToString(), "0.3", "0.1 + 0.2"); // 15
  t.equal(turo.evaluate("1.2 * 6").valueToString(), "7.2", "1.2 * 6");
  t.equal(turo.evaluate("1.2 * 6 - 7").valueToString(), "0.2", "1.2 * 6 - 7"); // 15
  t.equal(turo.evaluate("sqrt 2 ^ 2").valueToString(), "2", "2"); // 14
  t.end();
});

