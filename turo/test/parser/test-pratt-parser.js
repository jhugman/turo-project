import { test } from 'tap';
import PrattParser from '../../lib/parser/PrattParser';
import output from '../../lib/output';
import evaluator from '../../lib/eval';

/////////////////////////////////////
function okParse (t, subject, src, expectedOutput = src, expectedPass = true) {
  let ast;
  try {
    ast = subject.parse(src);
  } catch(e) {
    if (expectedPass) {
      console.error(`Error parsing ${src}`, e);
      t.ok(!expectedPass, `Good src is unexpectedly bad: ${src}`);  
    } else {
      t.ok(!expectedPass, `Bad src is bad: ${src}`);  
    }
    return;
  }

  if (expectedPass) {
    t.ok(ast, `${src} has a non null AST`);
    t.equal(output.toString(ast, { output_defaultPadding: '' }), expectedOutput, `${src} roundtrips ok`);  
  } else {
    t.notOk(expectedPass, 'src is not bad: ${src}');
  }
}

function notOkParse (t, subject, src) {
  okParse(t, subject, src, undefined, false);
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
  okParse(t, subject, 'x = 1');
  okParse(t, subject, '_1 = 1');
  okParse(t, subject, '$1 = 1');

  okParse(t, subject, 'x1 = 1');
  okParse(t, subject, 'x_1 = 1');
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

test('let statement', t => {
  const subject = new PrattParser();
  okParse(t, subject, 'let x = 5', 'x = 5');

  t.end();
});

test('unit suffixes', t => {
  const subject = new PrattParser();

  okParse(t, subject, 'x m', 'x m');
  okParse(t, subject, 'x m + y cm', 'x m+y cm');

  okParse(t, subject, '1 m/s', '1 m/s');
  okParse(t, subject, '1 m/s^2', '1 m/s^2');

  t.end();
});


test('unit statements', t => {
  const subject = new PrattParser();

  okParse(t, subject, 'unit 1 m : Length');
  okParse(t, subject, 'unit 1 s : Time');

  okParse(t, subject, 'unit 100 cm : 1 m');
  okParse(t, subject, 'unit 1 h : 3600 s');

  okParse(t, subject, 'unit 1 kph : 1000 km/h');

  okParse(t, subject, 'unit 1 ha : 1000000 m^2');

  okParse(t, subject, 'unit 1 mph : 1609 m/3600 s');

  okParse(t, subject, 'unit 12 inch : 1 ft');
  t.end();
});


test('unit statements with twiddly bits', t => {
  const subject = new PrattParser();

  okParse(t, subject, 'unit 1 m metre metres : Length');
  okParse(t, subject, 'unit 1 s second seconds : Time');

  okParse(t, subject, 'unit 100 cm centimetre centimetres : 1 m');
  okParse(t, subject, 'unit 1 h hour hours : 3600 s');

  okParse(t, subject, 'unit 1 kph : Speed, 1000 km/h');

  okParse(t, subject, 'unit 1 ha : Area, 1000000 m^2');

  okParse(t, subject, 'unit 1 mph : 1609 m/3600 s');

  okParse(t, subject, 'unit mph (imperial) : Speed, 1609 m/h')
  t.end();
});

test('assignment statements', t => {
  const subject = new PrattParser();

  okParse(t, subject, 'x = 1');
  okParse(t, subject, 'y = 1+x');

  okParse(t, subject, 'longVariableName = x+y');
  t.end();
});

test('import statements', t => {
  const subject = new PrattParser();

  const lex = subject._lex;
  const expected = 'filename';
  lex.source = `"${expected}"`;

  const token = lex.next();
  t.ok(token, 'String is non-null');

  // now put string in an import statement
  okParse(t, subject, 'import "fundamental"');
  okParse(t, subject, 'import "metric"');
  t.end();
});

test('end of lines can be anything', t => {
  const subject = new PrattParser();

  okParse(t, subject, 'import "x" // comment', 'import "x"');
  okParse(t, subject, 'x = 1;', 'x = 1');
  okParse(t, subject, 'y = 1 // comment', 'y = 1');

  // most of these should be soaked up by the unit parsing
  okParse(t, subject, 'y = 2 I don\'t think this should error', 'y = 2 I don t think this should error');

  okParse(t, subject, 'y = 3 This "should" not be acceptable', 'y = 3 This should');

  // This should be cleared up by the ASTCleaner.
  okParse(t, subject, 'y = 4 ^_^', 'y = 4^_');

  t.end();
});