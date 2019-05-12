import { test } from 'tap';
import { any, anyValue, value, variable } from '../../lib/rewrite/patterns';
import RewriteContext from '../../lib/rewrite/RewriteContext';
import { Parser, Scope } from '../../lib/parser';
import output from '../../lib/output';

const fakeScope = Scope.newScope('default');
'abcdefghijklmnopqrstuvwxyz'
  .split('')
  .forEach(c => fakeScope.addVariable(c, {}));

const astParser = new Parser(fakeScope);
// very slow but sure way of checking if two astNodes are equivalent.
const nodeEquals = (lhs, rhs) => output.toString(lhs) === output.toString(rhs);

test("Dumb check of parser", t => {
  const ast = (string) => astParser.parse(string);
  t.equal(output.toString(ast('1 + 2')), '1 + 2');
  t.equal(output.toString(ast('1 + x')), '1 + x');

  t.end();
});

const okMatch = (t, pattern, codeString, expectedCaptures, expectedPass = true) => {
  const astNode = astParser.parse(codeString);

  const context = new RewriteContext({ nodeEquals });
  const captures = pattern.match(astNode, context);

  if (!expectedPass) {
    t.notOk(captures, `Pattern ${pattern.toString()} did not match ${codeString}`);
    return;
  }

  t.ok(captures, `Pattern ${pattern.toString()} did match ${codeString}`);

  if (!expectedCaptures) {
    return;
  }

  debugger;

  const observedCaptures = new Map();
  for (let [k, v] of captures.entries()) {
    observedCaptures.set(k, output.toString(v));
  }

  const expectedCapturesMap = new Map(Object.entries(expectedCaptures));

  t.deepEqual(observedCaptures, expectedCapturesMap, `${codeString} has expected captures`);
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
  const X = variable('X');
  const zero = value(0);
  const p1 = X.binary('+', zero);
  okMatch(t, p1, 'a + 0');
  okMatch(t, p1, 'b + 0');
  notOkMatch(t, p1, 'a + 1');
  notOkMatch(t, p1, 'a - 0');

  const p2 = X.binary('+', X);
  okMatch(t, p2, 'a + a');
  okMatch(t, p2, 'b + b');
  notOkMatch(t, p2, 'a + b');

  const p3 = X.unary('log');
  okMatch(t, p3, 'log a');
  okMatch(t, p3, 'log b');
  okMatch(t, p3, 'log(c)');
  notOkMatch(t, p3, 'log 1');

  const p4 = 
    X.binary('^', value(2))
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

test("Parens are transparent", t => {
  const X = variable('X');
  const zero = value(0);

  const p1 = X.binary('+', zero);
  okMatch(t, p1, 'a + (0)');
  okMatch(t, p1, '(b) + 0');
  okMatch(t, p1, '(c + 0)');
  okMatch(t, p1, '((d)) + ((0))');
  okMatch(t, p1, '(e) + (0)');
  okMatch(t, p1, '((f) + (0))');
  okMatch(t, p1, '(((g))+((0)))');

  const p2 = X.parens().parens().binary('+', zero.parens().parens()).parens();
  okMatch(t, p2, 'a + (0)');
  okMatch(t, p2, '(b) + 0');
  okMatch(t, p2, '(c + 0)');
  okMatch(t, p2, '((d)) + ((0))');
  okMatch(t, p2, '(e) + (0)');
  okMatch(t, p2, '((f) + (0))');
  okMatch(t, p2, '(((g))+((0)))');

  t.end();
});

test("Identities rewritten", t => {
  const X = variable('X');

  const a = anyValue('a'); 
  const b = anyValue('b');

  const p1 = a.binary('*', X);
  okMatch(t, p1, '2 * x');
  okMatch(t, p1, 'x');

  const p2 = X.binary('^', b);
  okMatch(t, p2, 'x ^ 2', { var_X: 'x', $b: 2 });
  okMatch(t, p2, 'x', { var_X: 'x', $b: 1 });

  const p3 = X.binary('*', a);
  okMatch(t, p3, 'x * 2', { var_X: 'x', $a: '2' });
  okMatch(t, p3, 'x', { var_X: 'x', $a: '1' });

  const p4 = a.binary('*', X.binary('^', b));
  okMatch(t, p4, '3 * x ^ 2', { var_X: 'x', $a: '3', $b: '2' });
  okMatch(t, p4, 'x');  
  t.end();
});

test("Capture merging", t => {
  const a = anyValue('a');
  const X = any('X');
  const Y = any('Y');
  const Z = any('Z');

  const p1 = X.binary('/', X);
  okMatch(t, p1, '(x + 1) / (x + 1)', { _X: '(x + 1)'});
  notOkMatch(t, p1, '(x + 1) / (x + 2)');

  const p2 = X.binary('^', a).binary('+', Y.binary('^', a));
  okMatch(t, p2, '(2 * x)^2 + y^2', { _X: '(2 * x)', a: '2', _Y: 'y'});

  t.end();
});