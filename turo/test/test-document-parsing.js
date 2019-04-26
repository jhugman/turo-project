import tap from 'tap';
import _ from 'underscore';
import { Parser } from '../lib/parser';
import ast from '../lib/ast';
import evaluator from '../lib/eval';
import { Units } from '../lib/units';
import output from '../lib/to-source';

const { test, plan } = tap;

const parser = new Parser();
parser.scope._unitsTable = new Units();
const defaultOperators = parser.operators;

var operatorNames = {
  sin: true,
  log: true, 
  sqrt: true
};

const dummyOperators = {
  hasPrefixOperator: function (string) {
    return !!operatorNames[string];
  },

  hasInfixOperator: function (string) {
    return !!operatorNames[string];
  },

  hasPostfixOperator: function (string) {
    return !!operatorNames[string];
  },
};

function parse (lines) {
  var doc = parser.parse(lines.join('\n') + '\n', 'EditorText');

  return doc;
}

function numValidStatements (doc) {
  var count = 0;
  _.each(doc.lines, function (line) {
    if (!line.isUnparsed) {
      count ++;
    }
  });
  return count;
}

function numStatements (doc) {
  return doc.lines.length;
}

test('Multi line, multi single line expressions', function (t) {
  parser.operators = dummyOperators;
  var doc = parse([
      'Some free text',
      '1 + 2 * 3'
    ]);

  t.equal(numStatements(doc), 2);
  t.equal(numValidStatements(doc), 1);

  doc = parse([
    '1 + 2 * 3',
    'Some free text',
  ]);

  t.equal(numStatements(doc), 2);
  t.equal(numValidStatements(doc), 1);

  doc = parse([
    'Some free text',
    '1 + 2 * 3',
    'more free text',
    '3 * 2'
  ]);

  t.equal(numStatements(doc), 4);
  t.equal(numValidStatements(doc), 2);

  parser.operators = defaultOperators;
  t.end();
});

test('Multi line statement', function (t) {
  parser.operators = dummyOperators;
  var doc = parse([
    '1 +',
    '2 + ',
    '3'
  ]);

  t.equal(numStatements(doc), 1);
  t.equal(numValidStatements(doc), 1);

  doc = parse([
    '1',
    '+ 2',
    '+ 3'
  ]);

  t.equal(numStatements(doc), 1);
  t.equal(numValidStatements(doc), 1);

  doc = parse([
    '1',
    '+2',
    '+3'
  ]);

  t.equal(numStatements(doc), 1);
  t.equal(numValidStatements(doc), 1);

  parser.operators = defaultOperators;
  t.end();
});

test('Lines with variables', function (t) {
  parser.operators = dummyOperators;
  var doc = parse([
    'x = 1',
    '2',
    'x',
    '3',
  ]);

  t.equal(numStatements(doc), 4);
  t.equal(numValidStatements(doc), 4);

  parser.operators = defaultOperators;
  t.end();
});

test('Lines with statements', function (t) {
  parser.operators = dummyOperators;
  var doc = parse([
    'unit m : Length',
    'const x = 2',
    'x',
    '3',
  ]);

  t.equal(numStatements(doc), 4);
  t.equal(numValidStatements(doc), 4);

  parser.operators = defaultOperators;
  t.end();
});

test('Lines with semi-colons', function (t) {
  parser.operators = dummyOperators;
  var doc = parse([
    'unit m : Length;',
    'const x = 2;',
    'x;',
    'y = x + 3;',
  ]);

  t.equal(numStatements(doc), 4);
  t.equal(numValidStatements(doc), 4);
  
  parser.operators = defaultOperators;
  t.end();
});

test('Docs with empty lines', function (t) {
  parser.operators = dummyOperators;
  var doc = parse([
    'some text',
    '',
    '',
    'x = 1',
    'y = 1',
    '4'
  ]);

  t.equal(numStatements(doc), 6);
  t.equal(numValidStatements(doc), 3);

  parser.operators = defaultOperators;
  t.end();
});

test('Lines with imports and free text', function (t) {
  parser.operators = dummyOperators;
  var doc = parse([
    'import "foo";',
    'unit m : Length;',
    'const x = 2;',
    'free text',
    'x;',
    'y = x + 3;',
  ]);

  t.equal(numStatements(doc), 6);
  t.equal(numValidStatements(doc), 5);

  parser.operators = defaultOperators;
  t.end();
});

test('Statements with exotic operators', function (t) {
  parser.operators = defaultOperators;

  var doc = parse([
    'sqrt(9)',
  ]);

  t.equal(numStatements(doc), 1, 'sqrt(9) statements');
  t.equal(numValidStatements(doc), 1, 'sqrt(9) valid statements');
  
  debugger;
  doc = parse([
    'sin(45)',
  ]);

  t.equal(numStatements(doc), 1, 'sin(45) statements');
  t.equal(numValidStatements(doc), 1, 'sin(45) valid statements');

  doc = parse([
    '3 nth_root 8',
  ]);

  t.equal(numStatements(doc), 1, '3 nth_root 8 statements');
  t.equal(numValidStatements(doc), 1, '3 nth_root 8 valid statements');

  t.end();
});

