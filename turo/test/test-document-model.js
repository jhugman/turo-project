import tap from 'tap';
import _ from 'underscore';
import $turo from '../lib/turo';
import DocumentModel from '../lib/document/document-model';

const { test, plan } = tap;

var model, turo;
function createModel() {
  turo = new $turo.Turo(); model = new DocumentModel('testDoc');
}

function parse (lines) {
  turo.resetScope();
  // parse twice because we haven't written document-helper yet.
  turo.parse(lines.join('\n') + '\n', 'EditorText');
  var doc = turo.parse(lines.join('\n') + '\n', 'EditorText');

  return _.filter(doc.lines, function (node) {
    return node.accept;
  });
}

function observedValues (results) {
  return _.map(results, function (r) {
    if (r._currentValue) {
      return r._currentValue.number + '';
    }
    return '';
  });
}

function testLines (t, lines, expectedList, noShuffle) {
  var nodes = parse(lines),
      shuffled = noShuffle ? nodes : _.shuffle(nodes), // shuffle them so we can test batch update more thoroughly
      results = model.batchUpdate(shuffled);

  var ids = _.pluck(nodes, '_id');
  model._state.idsInWrittenOrder = ids;

  results = model.statementsInWrittenOrder;
  t.deepEqual(observedValues(results), expectedList, lines.join('; '));
}

function testInteractive (t, lineNum, newText, expectedList, numDeltas) {
  // We need to do this here because we haven't yet told 
  // the parser to start the parse at an arbitrary offset/line.
  // Definitely whitebox testing.
  var s = model.statementsInWrittenOrder[lineNum - 1],
      id = s.id;

  var deltas = model.interactiveUpdate(id, turo.parse(newText));
  var results = model.statementsInWrittenOrder;
  t.deepEqual(observedValues(results), expectedList, newText);

  if (numDeltas !== undefined) {
    t.equal(deltas.length, numDeltas, 'cascade size: ' + numDeltas + ' = ' + deltas.length);
  }
}

test('Batch mode', function (t) {
  createModel();

  testLines(t, ['x = 1', 'x + 1'], ['1', '2']);
  testLines(t, ['x = 1', 'y - x', 'y = 3'], ['1', '2', '3']);

  testLines(t, ['x = 1', 'y - x + z', 'y = 3', 'z = y - 3 * x'], ['1', '2', '3', '0']);

  t.end();
});

test('Find statement by line', function (t) {
  var lines = ['x = 1', 'y - x + z', 'y = 3', 'z = y - 3 * x'];
  var expectedList = ['1', '2', '3', '0'];
  testLines(t, lines, expectedList);

  var statements = model.statementsInWrittenOrder;

  for (var i = 0; i < statements.length; i++) {
    var id = model.findStatementIdByLineCol(i + 1),
        expected = statements[i].id;
    t.equal(id, expected, expected + ' = ' + id);
  }

  t.end();
});

test('Interactive, simple editing', function (t) {
  var lines = ['x = 1', 'y + 2', 'y = x + z', 'z = x + 3'];
  var expectedList = ['1', '7', '5', '4'];
  testLines(t, lines, expectedList);
  testInteractive(t, 1, 'x = 2', ['2', '9', '7', '5'], 4); // x = 2|, y + 2, y = x + z, z = x + 3
  testInteractive(t, 2, '1 + 2', ['2', '3', '7', '5'], 1); // x = 2, 1 + 2|, y = x + z, z = x + 3
  testInteractive(t, 1, 'x = 1', ['1', '3', '5', '4'], 3); // x = 1|, 1 + 2, y = x + z, z = x + 3
  t.end();
});

test('Interactive, deleting of variables', function (t) {
  var lines = ['x = 1', 'y + 2', 'y = x + z', 'z = x + 3'];
  var expectedList = ['1', '7', '5', '4'];
  testLines(t, lines, expectedList);

  testInteractive(t, 1, '2', ['2', '', '', ''], 4);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  // 
  testInteractive(t, 1, 'x = 1', ['1', '7', '5', '4'], 4);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  t.end();
});

test('Interactive, duplicating variables', function (t) {
  var lines = ['a = 1', 'a = 2', 'y = a'];
  var expectedList = ['1', '2', '2'];
  testLines(t, lines, expectedList, true);

  // Change the first one, it should have no effect on 
  // the others.
  testInteractive(t, 1, 'a = 3', ['3', '2', '2'], 1);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  // Change the second one, it should cascade to 
  // the others.
  testInteractive(t, 2, 'a = 4', ['3', '4', '4'], 2);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  // Change it back, to fit in with the rest of the tests.
  testInteractive(t, 2, 'a = 2', ['3', '2', '2'], 2);
  t.equal(model.state, DocumentModel.State.UNKNOWN);


  // Delete the second one, so that the first one 
  // is now the one that cascades.
  testInteractive(t, 2, '4', ['3', '4', '3'], 2);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  // Change the only one left, it should update the 
  // others.
  testInteractive(t, 1, 'a = 5', ['5', '4', '5'], 2);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  // This cascades correctly.
  testInteractive(t, 2, 'a = 6', ['5', '6', '6'], 2);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  testInteractive(t, 1, 'x = 7', ['7', '6', '6'], 1);
  t.equal(model.state, DocumentModel.State.INVALID);
  t.end();
});

test('Interactive, duplicating variables interactively', function (t) {
  var lines = ['a = 1', '2', 'y = a'];
  var expectedList = ['1', '2', '1'];
  testLines(t, lines, expectedList, true);


  // Add another definition of a after the first one.
  testInteractive(t, 2, 'a = 3', ['1', '3', '3'], 2);
  t.equal(model.state, DocumentModel.State.UNKNOWN);


  lines = ['1', 'a = 2', 'y = a'];
  expectedList = ['1', '2', '2'];
  testLines(t, lines, expectedList, true);

  // Add another definition of a before the first one.
  testInteractive(t, 1, 'a = 3', ['3', '2', '2'], 1);
  t.equal(model.state, DocumentModel.State.UNKNOWN);

  t.end();
});