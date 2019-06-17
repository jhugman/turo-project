import { test } from 'tap';

import Parser from '../../lib/parser/PrattParser';
import output from '../../lib/output';

import { removeParens, addParens } from '../../lib/parser/parens-helper';

const parser = new Parser();
function okRemoval (t, src, expected) {
  const astNode = parser.parse(src);
  const transformed = removeParens.apply(astNode) || astNode;

  const observed = output.toString(transformed);
  t.equal(observed, expected, `${src} without parens is ${expected}`);
}

function okAdd (t, src, expected) {
  const astNode = parser.parse(src);
  const intermediate = astNode;
  const transformed = addParens.apply(intermediate, { parser }) || intermediate;

  const observed = output.toString(transformed);
  t.equal(observed, expected, `${src} with normalized parens is ${expected}`);
}

test('Removal cases', t => {
  okRemoval(t, 'x + 1', 'x + 1');
  okRemoval(t, '(x + 1)', 'x + 1');
  okRemoval(t, '(((x)) + ((1)))', 'x + 1');

  okRemoval(t, 'x * (y + 1)', 'x * y + 1');
  okRemoval(t, '(x * (y + (1)))', 'x * y + 1');
  t.end();
});

test('Simple addition', t => {
  okAdd(t, 'x + 1', 'x + 1');
  okAdd(t, '(x + 1)', 'x + 1');
  okAdd(t, 'x * (y + 1)', 'x * (y + 1)');

  okAdd(t, 'y + (1)', 'y + 1');
  okAdd(t, '(x * (y + (1)))', 'x * (y + 1)');

  t.end();
});

test('Prefix ops', t => {
  okAdd(t, 'sin(x)', 'sin x');
  okAdd(t, 'sin(((x)))', 'sin x');
  okAdd(t, 'sin(2*x)', 'sin(2 * x)');
  t.end();
});

test('Postfix ops', t => {
  okAdd(t, '(sin x)!', '(sin x)!');
  okAdd(t, 'sin x!', '(sin x)!');
  okAdd(t, 'sin(x!)', 'sin(x!)');
  t.end();
});