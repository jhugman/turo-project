import { test } from 'tap';
import NodeMetadataVisitor, { metadataComparator } from '../../lib/algebra/NodeMetadata';

import Parser from '../../lib/parser/PrattParser';
import RewriteContext from '../../lib/algebra/RewriteContext';
import { addParens, removeParens } from '../../lib/parser/parens-helper';
import output from '../../lib/output';


const parser = new Parser();

function metadataFor(...args) {
  const context = new RewriteContext({ parser });
  const subject = new NodeMetadataVisitor();

  return args
    .map(src => parser.parse(src))
    .map(node => removeParens.apply(node, context) || node)
    .map(node => node.accept(subject, context))
    .map(({ complexity, termKey, identifiers }) => { return { complexity, termKey, identifiers }; });
}

function okEqual(t, src1, src2) {
  const [a1, a2] = metadataFor(src1, src2);
  t.deepEqual(a1, a2, `${src1} is equal to ${src2}`);
  t.equal(0, metadataComparator(a1, a2), `${src1} is ranked equal to ${src2}`)
}

function okBefore(t, src1, src2, compareIdentifiers = true) {
  const [a1, a2] = metadataFor(src1, src2);
  if (compareIdentifiers) {
    t.deepEqual(a1.identifiers, a2.identifiers, `${src1} has same identifiers as ${src2}`);
  }
  t.equal(metadataComparator(a1, a2), 1, `${src1} is ranked before ${src2}`)
}


test('Equal metadata', t => {
  okEqual(t, '2 * a', 'a * 2');
  okEqual(t, '2 + a', 'a + 2');
  okEqual(t, '2 * a', '1 * a');

  okEqual(t, 'sin x * cos y', 'cos y * sin x');
  okEqual(t, 'sin x * cos y - sin y * cos x', 'cos y * sin x - cos x * sin y');
  okEqual(t, 'sin x * cos y + sin y * cos x', 'cos x * sin y + cos y * sin x');

  t.end();
});

test('Simplistic ordering', t => {

  okBefore(t, 'x ^ 2', 'x');
  okBefore(t, 'x ^ 2', 'x ^ 1');
  okBefore(t, 'x ^ 3', 'x ^ 2');
  okBefore(t, '2 * a', 'a');

  okBefore(t, '2 * x', '1', false);
  okBefore(t, 'x * y', 'x', false);
  okBefore(t, 'x', 'y', false);

  okBefore(t, 'cos x', 'sin y');

  okBefore(t, '1 / (1 + a)', '1 / (2 + a)');

  okBefore(t, '1 / (1 + 2 * a)', '1 / (1 + a)');

  t.end();
});