import { test } from 'tap';
import { any, anyValue, value, variable } from '../../lib/rewrite/patterns';
import { Parser, Scope } from '../../lib/parser';
import output from '../../lib/output';

const fakeScope = Scope.newScope('default');
'abcdefghijklmnopqrstuvwxyz'
  .split('')
  .forEach(c => fakeScope.addVariable(c, {}));

const astParser = new Parser(fakeScope);
const ast = (string) => astParser.parse(string);

// very slow but sure way of checking if two astNodes are equivalent.
const nodeEquals = (lhs, rhs) => output.toString(lhs) === output.toString(rhs);

test("Dumb check of parser", t => {
  t.equal(output.toString(ast('1 + 2')), '1 + 2');
  t.equal(output.toString(ast('1 + x')), '1 + x');

  t.end();
});

test("Leaf pattern matching", t => {
  const p1 = value(1);
  t.ok(p1.match(ast('1')));
  t.notOk(p1.match(ast('2')));
  t.notOk(p1.match(ast('a')));

  const p2 = variable('X');
  t.ok(p2.match(ast('a')));
  t.ok(p2.match(ast('b')));
  t.notOk(p2.match(ast('2')));

  const p3 = anyValue('n');
  t.ok(p3.match(ast('1')));
  t.ok(p3.match(ast('2')));
  t.notOk(p3.match(ast('x')));

  t.end();
});