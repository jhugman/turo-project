import tap from 'tap';
import _ from 'underscore';
import turo from './turo-shim';

const { test, plan } = tap;

test("Initial", function (t) {
  turo.reset();
  turo.evaluate("person = 1");
  t.equal(turo.evaluate("person").toString(), "person = 1", "person == \"person = 1\"");
  turo.evaluate("constant = 1");
  t.equal(turo.evaluate("constant").toString(), "constant = 1", "constant == \"constant = 1\"");
  t.end();
});

// TODO Where does unbalancing of parens come in?
// test('Rountripping with unbalanced parentheses', function (t) {
//   var result = turo.evaluate("(1+1");

//   function rt(string) {
//     t.equal(turo.evaluate(string).expressionToString(), string, string);
//   }

//   rt('1.0');
//   rt('(1.0');
//   rt('(1+2');
//   rt('sin(1');
//   rt('sin(1+(2');
//   t.end();
// });
