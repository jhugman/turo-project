import { test } from 'tap';
import { any, anyValue, value, variable } from '../../lib/rewrite/patterns';
import RewriteContext from '../../lib/rewrite/RewriteContext';
import ReplaceVisitor from '../../lib/rewrite/ReplaceVisitor';
import { Parser, Scope } from '../../lib/parser';
import output from '../../lib/output';

import { Operators, defaultOperators } from '../../lib/operators';

const astType = 'astType';
const patternOperators = new Operators();
patternOperators.addPrefixOperator('eval', astType, astType, [{}]);

const baseScope = Scope.newScope('default', undefined, defaultOperators);
const patternScope = baseScope.newScope('patterns', undefined, patternOperators);

'abcdefghijklmnopqrstuvwxyz'
  .split('')
  .forEach(c => baseScope.addVariable(c, {}));

'123456789'
  .split('')
  .forEach(c => patternScope.addVariable('$' + c, {}));

const astParser = new Parser(baseScope);
const patternParser = new Parser(patternScope);

function capturesMap (object, context) {
  const map = new Map();
  for (let [k, v] of Object.entries(object)) {
    map.set(k, astParser.parse(v));
  }
  return map;
}

function okReplace (t, replacementString, expected, obj) {
  const pattern = patternParser.parse(replacementString);
  const captures = capturesMap(obj);

  const subject = new ReplaceVisitor();
  const context = new RewriteContext();

  const replacement = subject.createReplacement(pattern, captures, context);
  const observed = output.toString(replacement);

  t.equal(observed, expected, `${replacementString} maps to ${expected}`);

  return observed;
}


test('Test simple replacement', t => {
  okReplace(t, 'a', '2', { a: '2' }); // on its own.
  okReplace(t, '1 + a', '1 + 2', { a: '2' }); // binary
  okReplace(t, '1 + c', '1 + c', { a: '2' }); // missing capture

  okReplace(t, '1 + (a)', '1 + (2)', { a: '2' }); // parens
  okReplace(t, '1 + sin(a)', '1 + sin (2)', { a: '2' }); // unary

  t.end();
});

test('Multiple replacements', t => {
  okReplace(t, 
    'a + (b + c)', 
    '1 + (2 + 3)', 
    { a: '1', b: '2', c: '3' }
  );
  okReplace(t, 
    'a^b + a^b',
    '(1 + 2) ^ (3) + (1 + 2) ^ (3)',
    { a: '(1 + 2)', b: '(3)' }
  );
  t.end();
});

test('Shortcut replacement strings', t => {
  okReplace(t, 
    '$1 + ($2 + $3)', 
    '1 + (2 + 3)', 
    { a: '1', b: '2', c: '3' }
  );
  t.end();
});

test('Eval operator', t => {
  okReplace(t, 
    '1 + eval(a * b)',
    '1 + 6',
    { a: '2', b: '1 + 2' }
  );

  t.end();
});