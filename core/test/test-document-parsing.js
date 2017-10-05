'use strict';

var _ = require('underscore'),
    test = require('tap').test;

var parser = require("../lib/parser"),
    ast = require("../lib/ast"),
    evaluator = require("../lib/evaluator"),
    Units = new require("../lib/units-table").UnitsTable,
    Variables = new require("../lib/variables-symbol-table").Context,
    output = require("../lib/to-source");
  
parser.units = new Units();
parser.variables = new Variables();

var operatorNames = {
  sin: true,
  log: true, 
  sqrt: true
};

parser.operators = {
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
    if (line.accept) {
      count ++;
    }
  });
  return count;
}

function numStatements (doc) {
  return doc.lines.length;
}

test('Multi line, multi single line expressions', function (t) {

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


  t.end();
});

test('Multi line statement', function (t) {
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

  t.end();
});

test('Lines with variables', function (t) {
  var doc = parse([
    'x = 1',
    '2',
    'x',
    '3',
  ]);

  t.equal(numStatements(doc), 4);
  t.equal(numValidStatements(doc), 4);

  t.end();
});

test('Lines with statements', function (t) {
  var doc = parse([
    'unit m : Length',
    'const x = 2',
    'x',
    '3',
  ]);

  t.equal(numStatements(doc), 4);
  t.equal(numValidStatements(doc), 4);

  t.end();
});

test('Lines with semi-colons', function (t) {
  var doc = parse([
    'unit m : Length;',
    'const x = 2;',
    'x;',
    'y = x + 3;',
  ]);

  t.equal(numStatements(doc), 4);
  t.equal(numValidStatements(doc), 4);

  t.end();
});

test('Docs with empty lines', function (t) {
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

  t.end();
});

test('Lines with imports and free text', function (t) {
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

  t.end();
});

test('Statements with exotic operators', function (t) {
  var _dummyOperators = parser.operators;
  debugger;
  parser.operators = require('../lib/operators-symbol-table').defaultOperators;

  var doc = parse([
    'sqrt(9)',
  ]);

  t.equal(numStatements(doc), 1);
  t.equal(numValidStatements(doc), 1);
  
  doc = parse([
    'sin(45)',
  ]);

  t.equal(numStatements(doc), 1);
  t.equal(numValidStatements(doc), 1);

  doc = parse([
    '3 nth_root 8',
  ]);

  t.equal(numStatements(doc), 1);
  t.equal(numValidStatements(doc), 1);

  parser.operators = _dummyOperators;
  t.end();
});

