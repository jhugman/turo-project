import { test } from 'tap';
import PrattParser from '../../lib/parser/PrattParser';
import output from '../../lib/output';
import evaluator from '../../lib/eval';

/////////////////////////////////////
function okParse (t, subject, src, expectedPass = true) {
  try {
    const ast = subject.parse(src);
    if (expectedPass) {
      t.ok(ast, `${src} has a non null AST`);
      t.equal(output.toString(ast, { output_defaultPadding: '' }), src, `${src} roundtrips ok`);  
    } else {
      t.notOk(expectedPass, 'src is not bad: ${src}');
    }
    
  } catch(e) {
    if (expectedPass) {
      console.error("error", e);
      t.ok(!expectedPass, `Good src is unexpectedly bad: ${src}`);  
    } else {
      t.ok(!expectedPass, `Bad src is bad: ${src}`);  
    }
  }
}

function notOkParse (t, subject, src) {
  okParse(t, subject, src, false);
}

////////

test('Simple elements', t => {
  const subject = new PrattParser();

  okParse(t, subject, '0');
  okParse(t, subject, '(1)');
  okParse(t, subject, '((2))');

  notOkParse(t, subject, '(3))');
  notOkParse(t, subject, '(4');

  t.end();
});

test('Adding operators from defaultOperators', t => {
  const subject = new PrattParser();

  okParse(t, subject, '0+1');
  okParse(t, subject, '2*3+4');

  t.end();
});
/////////////////////////////////////////////////


function evaluate (t, subject, src, expected) {
  try {
    const node = subject.parse(src);
    const result = evaluator.evaluate(node);
    const observed = output.toString(result);
    t.equal(observed, expected, `${src} evaluates to ${expected}`);
  } catch (e) {
    console.error(`${src} errored expectedly`, e);
    t.notOk(e, `${src} errored expectedly`);
  }
}

test('Numbers', t => {
  const subject = new PrattParser();

  evaluate(t, subject, "23", "23");
  evaluate(t, subject, "23.23", "23.23");
  evaluate(t, subject, "23e2", "2300");
  evaluate(t, subject, "23e+2", "2300");
  evaluate(t, subject, "2300e-2", "23");
  evaluate(t, subject, "2300e-2", "23");
  evaluate(t, subject, "23.01e2", "2301");

  t.end();
});

test('Operator precedence', t => {
  const subject = new PrattParser();

  evaluate(t, subject, "1-2", "-1");
  evaluate(t, subject, "1-2+3", "2");
  evaluate(t, subject, "1+2-3", "0");
  evaluate(t, subject, "1*2-3", "-1");

  evaluate(t, subject, "1-2*3", "-5");
  evaluate(t, subject, "2*(3-1)", "4");
  evaluate(t, subject, "3^2", "9");
  evaluate(t, subject, "3^2^2", "81"); // (3^(2^2)) != (3^2)^2
  evaluate(t, subject, "1+3^2", "10");
  evaluate(t, subject, "3^2+1", "10");
  evaluate(t, subject, "-2^3", "-8");
  evaluate(t, subject, "+-2^3", "-8");
  evaluate(t, subject, "--2^3", "8");
  evaluate(t, subject, "-2^-3", "-0.125");
  evaluate(t, subject, "2^--3", "8");
  evaluate(t, subject, "sqrt 4", "2");

  evaluate(t, subject, '1 + -2 * 3^4', '-161')

  t.end();
});

test('identifiers', t => {
  const subject = new PrattParser();
  debugger;
  okParse(t, subject, 'x==5');
  t.end();
});

test('Lexer', t => {
  const subject = new PrattParser()._lex;

  const peek = (src, expected, expectedType) => {
    subject.source = src;
    const token = subject.next();

    t.equal(token.match, expected, `${src} is ${expected}, as a ${token.type}`);
    if (expectedType) {
      t.equal(token.type, expectedType, `${src} is expected type ${expectedType}`);
    }
  }
  
  peek('1', '1');
  peek('12', '12');
  peek('12.5', '12.5');
  peek('0.25e3', '0.25e3', 'NUMBER');
  peek('sqrt', 'sqrt', `sqrt`);
  peek('250e-1', '250e-1', 'NUMBER');
  t.end();
});