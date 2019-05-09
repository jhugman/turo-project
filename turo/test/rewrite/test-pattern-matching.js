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

const okMatch = (t, pattern, codeString, expectedCaptures, expectedPass = true) => {
  const astNode = astParser.parse(codeString);

  const captures = pattern.match(astNode, nodeEquals);

  if (!expectedPass) {
    t.notOk(captures, `Pattern ${pattern.toString()} did not match ${codeString}`);
    return;
  }

  t.ok(captures, `Pattern ${pattern.toString()} did match ${codeString}`);
};

const notOkMatch = (t, pattern, codeString) => {
  okMatch(t, pattern, codeString, undefined, false);
};

test("Leaf pattern matching", t => {
  const p1 = value(1);
  okMatch(t, p1, '1');
  notOkMatch(t, p1, '2');
  notOkMatch(t, p1, 'a');
  okMatch(t, p1, '1');
  notOkMatch(t, p1, '2');
  notOkMatch(t, p1, 'a');

  const p2 = variable('X');
  okMatch(t, p2, 'a');
  okMatch(t, p2, 'b');
  notOkMatch(t, p2, '2');

  const p3 = anyValue('n');
  okMatch(t, p3, '1');
  okMatch(t, p3, '2');
  notOkMatch(t, p3, 'x');

  const p4 = any('splat');
  okMatch(t, p4, '1');
  okMatch(t, p4, 'a');
  okMatch(t, p4, '1 + a');

  t.end();
});



test("Non-terminal matching", t => {
  const p1 = variable('X').binary('+', value(0));
  okMatch(t, p1, 'a + 0');
  okMatch(t, p1, 'b + 0');
  notOkMatch(t, p1, 'a + 1');
  notOkMatch(t, p1, 'a - 0');

  const p2 = variable('X').binary('+', variable('X'));
  okMatch(t, p2, 'a + a');
  okMatch(t, p2, 'b + b');
  notOkMatch(t, p2, 'a + b');

  const p3 = variable('X').unary('log');
  okMatch(t, p3, 'log a');
  okMatch(t, p3, 'log b');
  okMatch(t, p3, 'log(c)');
  notOkMatch(t, p3, 'log 1');

  const p4 = 
    variable('X').binary('^', value(2))
  .binary('+', 
    variable('Y').binary('^', value(2)));

  okMatch(t, p4, 'a^2 + b^2');
  okMatch(t, p4, 'b^2 + a^2');
  notOkMatch(t, p4, 'a^2 + 4^2');

  const p5 = p4.parens().unary('sqrt')
  okMatch(t, p5, 'sqrt(x^2 + y^2)');
  okMatch(t, p5, 'sqrt(a^2 + b^2)');
  notOkMatch(t, p5, 'a^2 + b^2');

  const p6 = variable('C').equals(p5);
  // okMatch(t, p4, 'c^2 == a^2 + b^2');
  okMatch(t, p6, 'd == sqrt(b^2 + a^2)');

  t.end();
});