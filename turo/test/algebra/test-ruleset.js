import { test } from 'tap';
import output from '../../lib/output';
import RuleSet, { create } from '../../lib/algebra/RuleSet';
import simplifyRules from '../../lib/algebra/rules/simplify';
import SimplifyVisitor from '../../lib/algebra/SimplifyVisitor';

import Parser from '../../lib/parser/PrattParser';

const parser = new Parser();
const simplifyVisitor = new SimplifyVisitor();

test('', t => {
  const list = simplifyRules;

  t.ok(RuleSet, 'Ruleset is a thing');
  t.ok(create, 'Ruleset is a thing');

  t.ok(list, 'simplifyRules is a thing');

  const ruleset = create(list);
  t.ok(ruleset, 'ruleset is a thing');

  t.end();
});


function okRuleset(t, ruleset, src, expected) {
  const ast = parser.parse(src);

  const modified = ruleset.apply(ast);
  const observed = output.toString(modified);

  t.equal(observed, expected, `${src} simplifies to ${expected}`);

}

test('Test simplify with boring rules', t => {
  const ruleset = create([
    simplifyVisitor,
    { l: 'v*c', r: 'c*v'},
    { l: 'c+v', r: 'v+c'},
    { l: '1 * n', r: 'n'},
    { l: 'c1 * n^c2 * c3 * n^c4', r: '(c1 * c3) * n^(c2 + c4)'},
    { l: 'c1 * n + c2 * n', r: '(c1 + c2) * n'},
  ]);

  okRuleset(t, ruleset, 'x * x', 'x^2');
  okRuleset(t, ruleset, 'x * x * x', 'x^3');
  okRuleset(t, ruleset, 'x * x * x * x + x^4 * 4', '5 * x^4');

  t.end();
});

test('Test simplify with boring rules', t => {
  const ruleset = create([
    simplifyVisitor,
    { l: 'v*c',                   r: 'c*v'},
    { l: 'c+v',                   r: 'v+c'},
    { l: 'c-v',                   r: 'v-c'},
    { l: 'v-c',                   r: 'v+(-c)'},
    { l: '1 * n',                 r: 'n'},
    { l: 'c1 * n^c2 * c3 * n^c4', r: '(c1 * c3) * n^(c2 + c4)'},
    { l: 'c1 * n + c2 * n',       r: '(c1 + c2) * n'},
    { l: 'n + c1 + c2',           r: 'n + (c1 + c2)'},
    { l: 'v1 + c1 + v2 + c2',     r: 'v1 + v2 + (c1 + c2)'},
  ]);

  okRuleset(t, ruleset, 'x + 1 + 2 + 3', 'x + 6');
  okRuleset(t, ruleset, '1 + x + 2 + 3', 'x + 6');
  okRuleset(t, ruleset, '1 + 2 + x + 3', 'x + 6');

  okRuleset(t, ruleset, 'x + x + x + x',         '4 * x');
  okRuleset(t, ruleset, 'x + 2 * x + 3 * x + 4 * x',         '10 * x');
  okRuleset(t, ruleset, 'x^2 + x^2 + x^2 + x^2', '4 * x^2');
  okRuleset(t, ruleset, 'sqrt(x) + sqrt(x) + sqrt(x) + sqrt(x)',  '4 * sqrt(x)');

  t.end();
});