import { test } from 'tap';
import GatherTerms from '../../lib/algebra/GatherTerms';

import Parser from '../../lib/parser/PrattParser';
import RewriteContext from '../../lib/algebra/RewriteContext';
import { addParens, removeParens } from '../../lib/parser/parens-helper';
import output from '../../lib/output';


const parser = new Parser();

function okGather(t, subject, src, expected) {
  const astNode = parser.parse(src);
  const context = new RewriteContext({ parser });
  const transformed = 
    [removeParens, subject, addParens].reduce(
      (acc, transform) => transform.apply(acc, context) || acc,
      astNode
    );
  const observed = output.toString(transformed);

  t.equal(observed, expected, `${src} gathered to ${expected}`);
}

test('Gather like terms together', t => {
  const subject = new GatherTerms();
  okGather(t, subject, 'x^2 + 2 * x + 2 + 1 + 2 * x + 3 * x^2', '4 * x^2 + 4 * x + 3');

  okGather(t, subject, 'sin(x) * sin(x) + x * 5 + 3 * sin(x) * sin(x) + x^2 + 3 * x + 5', '4 * sin x * sin x + x^2 + 8 * x + 5');
  okGather(t, subject, '-1 + 1 + x - 2',                    'x + -2');
  okGather(t, subject, 'x^2 - 2*x - 2 + 1 + 2*x - 3*x^2',   '-2 * x^2 + -1');
  okGather(t, subject, 'x^2 - 2*x - 2 + 1 + x - 3*x^2',     '-2 * x^2 + -1 * x + -1');
  okGather(t, subject, 'x*y + 5*x + 3*x*y + x^2 + 3*x + 5', '4 * x * y + x^2 + 8 * x + 5');

  t.end();
});

test('Normalize multiples of operands', t => {
  const subject = new GatherTerms();

  okGather(t, subject, '4 * x + 1', '4 * x + 1');
  okGather(t, subject, 'x * 4 + 1', '4 * x + 1');
  okGather(t, subject, 'x * 2 * 4 + 1', '8 * x + 1');

  t.end();
});

test('Expand parenthesis', t => {
  const subject = new GatherTerms({ expandConstantByParens: true }); // defaults to true.

  okGather(t, subject, 'x * 2 * 4', '8 * x');
  okGather(t, subject, '2 * (x + 3)', '2 * x + 6');

  okGather(t, subject, '2 * (x + 3) * 5', '10 * x + 30');
  okGather(t, subject, '2 * (3 * x + 3) + 6 * (5 - x)', '36');
  t.end();
});

test('Recurse down through non-addition.', t => {
  const subject = new GatherTerms();

  okGather(t, subject, '(2 * x - 1) * (x + 1) / (x + x - 2 + 1)',   '(2 * x - 1) * (x + 1) / (2 * x + -1)');
  okGather(t, subject, '-(2 * x + 2 + 3)',                          '-2 * x + -5');
  okGather(t, subject, '--(2 * x + 2 + 3)',                         '2 * x + 5');
  okGather(t, subject, 'x + -(x - 4 * (x - 1))',                    '4 * x + -4');

  okGather(t, subject, '1 / x + 1 / x + 1 / x^2 + 1 / x^2 * 3',     '4 * 1 / x^2 + 2 * 1 / x');
  okGather(t, subject, '1 / x + 1 / x + 1 / x^2 + 3 / x^2',         '4 * 1 / x^2 + 2 * 1 / x');
  okGather(t, subject, 'sin(2 * x + x)',                            'sin(3 * x)');
  okGather(t, subject, 'sin(2 * x + x) + 3 * sin(x + x + x)',       '4 * sin(3 * x)');

  okGather(t, subject, 'x / (x + 1 - 2) + (2 * x - x) / (-1 + x)',  '2 * x / (x + -1)');

  t.end();
});

test('Normalize ordering', t => {
  const subject = new GatherTerms();
  okGather(t, subject, 'x * y + y * x * 3',  '4 * x * y');
  okGather(t, subject, '1 / (x + y) + 3 / (y + x)',  '4 * 1 / (x + y)');
  okGather(t, subject, '1 / (1 + x) + 3 / (x + x + 1)',  '3 * 1 / (2 * x + 1) + 1 / (x + 1)');
  t.end();
});