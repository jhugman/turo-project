import { test } from 'tap';
import Rule from '../../lib/rewrite/RewriteRule';
import RuleApply from '../../lib/rewrite/RuleApply';
import output from '../../lib/output';
import Parser from '../../lib/parser/PrattParser';
import RewriteContext from '../../lib/rewrite/RewriteContext';

const parser = new Parser();
const ruleParser = new Parser();

test('simple rule apply', t => {
  const rule = new Rule(
    'A * X + B * X', 
    '(A + B) * X', 
    ruleParser
  );

  const src = '5 * (x + 1) + 6 * (x + 1)';
  const expected = '(5 + 6) * (x + 1)';

  const astNode = parser.parse(src);
  const context = new RewriteContext();

  const destNode = rule.apply(astNode, context);

  const observed = output.toString(destNode);

  t.equal(observed, expected, `${rule.toString()} applied to ${src}`);
  t.end();
});

test('Apply recursively', t => {
  const rule = new Rule(
    '(X-A)*(X+A)', 
    '(X^2-A^2)', 
    ruleParser
  );
  const ruleApply = new RuleApply();

  const src = '(x-2)*(x+2)/((y-a)*(y+a))';
  const expected = '(x^2 - 2^2) / ((y^2 - a^2))';

  const astNode = parser.parse(src);

  const context = new RewriteContext();
  const destNode = astNode.accept(ruleApply, rule, context);

  const observed = output.toString(destNode);
  t.equal(observed, expected, `${rule.toString()} applied to ${src}`);
  t.end();
});