import { test } from 'tap';
import { any, anyValue, value, variable } from '../../lib/rewrite/patterns';

test('Fluent API', (t) => {

  const e_1p1 = value(1).binary('+', value(1));
  const e_1px = value(1).binary('+', anyValue('n'));
  const e___1 = value(1).unary('-').unary('-');

  t.equal(e_1p1.toString(), '1 + 1');
  t.equal(e_1px.toString(), '1 + $n');
  t.equal(e___1.toString(), '- - 1');

  const e_a_a = any(1).equals(any(2))
  t.equal(e_a_a.toString(), '_1 = _2');

  const e_xt1px = variable('x').binary('*', value(1).binary('+', variable('x')).parens());
  t.equal(e_xt1px.toString(), 'var_x * (1 + var_x)');

  t.end();
});