import { test } from 'tap';

import Lexer from 'perplex'
import { Parser } from 'pratt'

import { Precedence } from '../../lib/operators/precedence';

const createExampleParser = () => {
  const lex = new Lexer()
    .token('NUMBER', /^\d+/)
    .token('IDENTIFIER', /[^\d\W]\w*\Z/)
    .token('+', /\+/)
    .token('-', /-/)
    .token('*', /\*/)
    .token('/', /\//)
    .token('^', /\^/)
    .token('(', /\(/)
    .token(')', /\)/)
    .token('$SKIP_WS', /\s+/, true)

  const parser = new Parser(lex)
    .builder()
    .nud('NUMBER', 100, ({ token }) => +(token.match))
    .nud('-', 10, ({ t, bp }) => -parser.parse({ terminals: [ bp ] }))
    .nud('+', 10, ({ t, bp }) => +parser.parse({ terminals: [ bp ] }))
    .nud('(', 10, ({ t, bp }) => {
      const expr = parser.parse({ terminals: [ bp ] })
      lex.expect(')')
      return expr
    })
    .bp(')', 0)

    .led('^', 50, ({ left, t, bp }) => Math.pow(left, parser.parse({ terminals: [ bp - 1 ]})))
    .led('*', 40, ({ left, t, bp }) => left * parser.parse({ terminals: [ bp ] }))
    .led('/', 40, ({ left, t, bp }) => left / parser.parse({ terminals: [ bp ] }))
    .led('+', 30, ({ left, t, bp }) => left + parser.parse({ terminals: [ bp ] }))
    .led('-', 30, ({ left, t, bp }) => left - parser.parse({ terminals: [ bp ] }))
    .build()

  parser.name = 'oracle';
  parser.__lex = lex;
  return parser;
}

const createPrecedenceParser = () => {
  const lex = new Lexer()
    .token('WHITESPACE', /^\s+/, true)
    .token('(', /^\(/)
    .token(')', /^\)/)
    .token('+', /^\+/)
    .token('-', /^\-/)
    .token('*', /^\*/)
    .token('/', /^\//)
    .token('in', /^in/)
    .token('^', /^\^/)
    .token('sqrt', /^sqrt/)
    .token('nth_root', /^nth_root/)
    .token('log', /^log/)
    .token('ln', /^ln/)
    .token('!', /^!/)
    .token('sin', /^sin/)
    .token('asin', /^asin/)
    .token('cos', /^cos/)
    .token('acos', /^acos/)
    .token('tan', /^tan/)
    .token('atan', /^atan/)
    .token('sinh', /^sinh/)
    .token('asinh', /^asinh/)
    .token('cosh', /^cosh/)
    .token('acosh', /^acosh/)
    .token('tanh', /^tanh/)
    .token('atanh', /^atanh/)
    .token('%', /^%/)
    .token('AND', /^AND/)
    .token('OR', /^OR/)
    .token('NOT', /^NOT/)
    .token('<', /^</)
    .token('<=', /^<=/)
    .token('==', /^==/)
    .token('>=', /^>=/)
    .token('>', /^>/)
    .token('!=', /^!=/)
    .token('NUMBER', /^\d+(\.\d+)?([eE]\d+)?/);

  const parser = new Parser(lex)
    .builder()
    .nud('NUMBER', 100, ({ token }) => +(token.match))
    .nud('-', Precedence.unaryAddition.precedence, ({ t, bp }) => -parser.parse({ terminals: [ bp ] }))
    .nud('+', Precedence.unaryAddition.precedence, ({ t, bp }) => +parser.parse({ terminals: [ bp ] }))
    .nud('(', Precedence.parenthesis.precedence, ({ t, bp }) => {
      const expr = parser.parse({ terminals: [ bp ] })
      lex.expect(')')
      return expr
    })
    .bp(')', 0)

    .led('^', Precedence.exponentiation.precedence, ({ left, t, bp }) => Math.pow(left, parser.parse({ terminals: [ bp - 1 ]})))
    .led('*', Precedence.multiplication.precedence, ({ left, t, bp }) => left * parser.parse({ terminals: [ bp ] }))
    .led('/', Precedence.multiplication.precedence, ({ left, t, bp }) => left / parser.parse({ terminals: [ bp ] }))
    .led('+', Precedence.addition.precedence, ({ left, t, bp }) => left + parser.parse({ terminals: [ bp ] }))
    .led('-', Precedence.addition.precedence, ({ left, t, bp }) => left - parser.parse({ terminals: [ bp ] }))
    .build()

  parser.name = 'generated';
  parser.__lex = lex;
  return parser;
}


const evaluate = (t, parser, src, result) => {
  parser.__lex.source = src;
  try {
    t.equal(parser.parse() + '', result, `${parser.name}: ${src} = ${result}`);
  } catch (e) {
    console.error(`Failed to parse ${src}`, e);
    t.notOk(e, `Failed to parse ${src}`)
  }
};

test('example works', t => {
  const subject = createExampleParser();
  evaluate(t, subject, '1 + -2 * 3^4', "-161");
  t.end();
});


function testOperatorPrecedence (t, subject) {  
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

  evaluate(t, subject, '1 -2 + 3', "2");
  evaluate(t, subject, '1 - 2 * 3', "-5");

  evaluate(t, subject, '1 + -2 * 3^4', "-161");
  // evaluate(t, subject, "sqrt 4", "2");
}

function testFpOperatorPrecedence (t, subject) {
  evaluate(t, subject, "-0.5^-3", "-8");
}

test('Operator precedence', t => {
  testOperatorPrecedence(t, createExampleParser());
  testOperatorPrecedence(t, createPrecedenceParser());
  t.end();
});

test('Operator precedence II', t => {
  testFpOperatorPrecedence(t, createPrecedenceParser());
  t.end();
});

test('Numbers', t => {
  const subject = createPrecedenceParser();
  evaluate(t, subject, "23", "23");
  evaluate(t, subject, "23e3", "23000");
  evaluate(t, subject, "0.5", "0.5");

  t.end();
});