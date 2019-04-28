import tap from 'tap';
import _ from 'underscore';
import output from '../lib/output';
import { Parser } from '../lib/parser';

const { test, plan } = tap;
const parser = new Parser();

function roundtrip(t, src) {
  var node = parser.parse(src);
  t.equal(output.toString(node), src);
}

test("simple", function (t) {
  roundtrip(t, "1 + 2");
  t.end();
});

test("identifier", function (t) {
  // add these to the parser scope.
  roundtrip(t, 'x = 1');
  roundtrip(t, 'y = 2');

  // now test
  roundtrip(t, "x");
  roundtrip(t, "x + y");
  t.end();
});

test("brackets", function (t) {
  roundtrip(t, "(1)");
  roundtrip(t, "(1 + 2)");
  roundtrip(t, "1 + (2 + 3)");
  t.end();
});

test("missing method", function (t) {
  // the simplest visitors should work, recursing if the method is missing.
  var identifierCount= 0;
  var identifiers = {};
  var visitor = {
    visitIdentifier: function (node) {
      identifierCount++;
      identifiers[node.name] = (identifiers[node.name]||0) + 1;
    }
  };

  function count(src, expectedCount) {
    var node = parser.parse(src);
    identifierCount = 0;
    identifiers = {};
    node.accept(visitor);
    t.equal(identifierCount, expectedCount);
    if (identifierCount) {
      t.ok(identifiers.x);
    }
  }

  count("1", 0);
  count("x", 1);
  count("x+x", 2);
  count("x+(x+x)", 3);
  t.end();
});