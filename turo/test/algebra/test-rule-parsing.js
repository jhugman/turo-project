import { test } from 'tap';
import { createFindPattern, createReplacePattern } from '../../lib/algebra/rule-parser';
import RewriteContext from '../../lib/algebra/RewriteContext';
import ReplaceVisitor from '../../lib/algebra/ReplaceVisitor';
import Parser from '../../lib/parser/PrattParser';
import output from '../../lib/output';

const parser = new Parser();
const replaceVisitor = new ReplaceVisitor()

test('Simplistic', t => {
  const search = createFindPattern(parser, 'a * X + a');
  const replace = createReplacePattern(parser, 'a * (X + 1)');

  const src = '2 * p + 2';
  const expected = '2 * (p + 1)';

  const astNode = parser.parse(src);
  const context = new RewriteContext({ parser });

  const captures = search.match(astNode, context);
  const replacement = replaceVisitor.createReplacement(replace, captures, context);

  t.equal(output.toString(replacement), expected);

  t.end();
});

const okReplace = (t, searchPattern, replacePattern, src, expected) => {
  const search = createFindPattern(parser, searchPattern);
  const replace = createReplacePattern(parser, replacePattern);

  const astNode = parser.parse(src);
  const context = new RewriteContext();

  const captures = search.match(astNode, context);
  t.ok(captures, `${searchPattern} matches ${src}`);

  const replacement = replaceVisitor.createReplacement(replace, captures, context);

  t.equal(output.toString(replacement), expected, `'${searchPattern}' -> '${replacePattern} on '${src}'`);
}

test('String them together', t => {
  okReplace(t, 'a*X + a', 'a*(X + 1)', '5*x^2 + 5', '5 * (x^2 + 1)');
  okReplace(t, '(X - Y)*(X + Y)', 'X^2 - Y^2', '(x - 3)*(x + 3)', 'x^2 - 3^2');

  okReplace(t, '(X - Y)*(X + Y)', '$1^2 - $2^2', '(x - 3)*(x + 3)', 'x^2 - 3^2');
  t.end();
});

