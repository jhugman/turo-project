import { test } from 'tap';
import output from '../../lib/output';
import Parser from '../../lib/parser/PrattParser';
import RewriteContext from '../../lib/rewrite/RewriteContext';
import SimplifyVisitor from '../../lib/rewrite/SimplifyVisitor';


const expressionParser = new Parser();
const simplifyVisitor = new SimplifyVisitor();

function okSimple(t, src, expected) {
  const astNode = expressionParser.parse(src);
  const context = new RewriteContext();

  const destNode = astNode.accept(simplifyVisitor, context) || astNode;
  const observed = output.toString(destNode);
  t.equal(observed, expected, `${src} simplifies to ${expected}`);
}

test('Simplify Visitor', t => {
  okSimple(t, '--2', '2');
  okSimple(t, '----2', '2');
  okSimple(t, '1 + ----2', '3');

  okSimple(t, '2 * 1 * x ^ (2 - 1)', '2 * x');
  okSimple(t, '--2 ++x^0', '3');
  okSimple(t, '++x^(1 - 1)', '1');

  // not expected to work well.
  okSimple(t, 'x - 3 + 4', 'x - 3 + 4'); // X - a + b --> X - (b - a)
  okSimple(t, 'x + (4 - 3)', 'x + 1');

  okSimple(t, '5 * x - 3 * x', '5 * x - 3 * x'); // n1 * X - n2 * X --> (n1 - n2) * X
  okSimple(t, '(5 - 3) * x', '2 * x');
  t.end();
});