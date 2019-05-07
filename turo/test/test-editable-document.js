import { test, plan } from 'tap';
import { xtest } from './xtap';
import _ from 'underscore';
import { storage } from '../lib/storage/app-bundle-storage';
import { EditableDocument } from '../lib/document';

var prefs = {
  output_defaultPadding: ' ',
};

EditableDocument.storage = storage;

const display = undefined;

var nextId = 1;
async function simpleEval (doc, string) {
  const results = await doc.evaluateStatement('_' + (nextId++), string);
  return results[0].valueToString(display, prefs);
}

async function cascadeEval (doc, string) {
  var results = await doc.evaluateStatement('_' + (nextId++), string);
  return _.map(results, function (r) {
    return r.expressionToString(display, prefs) + ' = ' + r.valueToString(display, prefs);
  });
}

test('Evaluating an empty and consequently a non-empty string', t => {
  var doc = EditableDocument.create('doc');
  const id = 'heyo'
  doc.evaluateStatement(id, '');
  doc.evaluateStatement(id, '123');
  // doc.evaluateStatement(id, '21321');
  t.end();
});

test('Simple evaluation, with no cascade', async t => {  
  var doc = EditableDocument.create('t1');
  await doc.import('app');
  t.equal(await simpleEval(doc, '1 + 2'), '3');
  t.equal(await simpleEval(doc, '5 - 7'), '-2');
  t.equal(await simpleEval(doc, '2 m + 1 cm'), '2.01 metres');

  t.end();
});


test('Cascaded evaluation, in a reply setting', async t => {  
  const doc = EditableDocument.create('t2');

  doc.overwriteExistingDefinitions = true;

  t.equal(await simpleEval(doc, 'x = 1'), '1');
  t.equal(await simpleEval(doc, 'y = x + 1'), '2');

  t.deepEqual(await cascadeEval(doc, 'x = 2'), ['x = 2 = 2', 'y = x + 1 = 3']);
  t.deepEqual(await cascadeEval(doc, 'y = 3'), ['y = 3 = 3']);

  t.deepEqual(await cascadeEval(doc, 'x = 4'), ['x = 4 = 4']);
  t.end();
});

xtest('Strings in the correct place', async (t) => {
  var lines = ['x = 1', 'y = 2 trailing text', '    y + x', 'z = \n\nx + 1', '', 'unparseable '];
  var orig = lines.join('\n');
  var doc = EditableDocument.create('doc');

  await doc.evaluateDocument(orig);
  t.equal(doc.text, orig, 'Original text equal');

  // delete the cache.
  delete doc._state.text;
  t.equal(doc.text, orig, 'Regenerate the original document text');

  lines[0] = 'x = 2';
  await doc.evaluateStatement('doc_0', 'x = 2');
  t.equal(doc.text, lines.join('\n'), 'Updated text document with a changed statement');

  lines.push('z = y + x');
  await doc.evaluateStatement('doc_6', 'z = y + x');
  t.equal(doc.text, lines.join('\n'), 'Updated text document with a new statement');

  t.end();
});

test('Strings in the correct place', async (t) => {
  var lines = ['x = 1', 'y = 2 trailing text', '    y + x', 'z = x + 1', '', 'unparseable '];
  var orig = lines.join('\n');
  var doc = EditableDocument.create('doc');

  await doc.evaluateDocument(orig);
  t.equal(doc.text, orig, 'Original text equal');

  // delete the cache.
  delete doc._state.text;
  t.equal(doc.text, orig, 'Regenerate the original document text');

  lines[0] = 'x = 2';
  await doc.evaluateStatement('doc_0', 'x = 2');
  t.equal(doc.text, lines.join('\n'), 'Updated text document with a changed statement');

  lines.push('z = y + x');
  await doc.evaluateStatement('doc_6', 'z = y + x');
  t.equal(doc.text, lines.join('\n'), 'Updated text document with a new statement');

  t.end();
});

async function testDoc (t, lines, expected) {
  var doc = EditableDocument.create('doc');
  await doc.import('fundamental');
  await doc.evaluateDocument(lines.join('\n'));

  var i = 0;
  _.each(doc.statements, function (s) {
    t.equal(s.valueToString(display, prefs), expected[i], lines[i] + ' = ' + expected[i] + ' = ' + s.valueToString(display, prefs));
    i++;
  });
}

test('Evaluating out of order', async t => {
  await testDoc(t, ['x = 1', 'y = x + 1'], ['1', '2']);
  await testDoc(t, ['y = x + 1', 'x = 1'], ['2', '1']);
  t.end();
});

test('Evaluating exotic operators', async t => {
  await testDoc(t, ['x = sqrt 4'], ['2']);
  await testDoc(t, ['y = 3 nth_root 8'], ['2']);
  await testDoc(t, ['z = cos(0 degrees)'], ['1']);
  await testDoc(t, ['z = cos(60 degrees)'], ['0.5']);
  t.end();
});

test('Finding statements', async t => {
  var lines = ['x = 1', 'y = 2', 'target', '', 'z = \n\nx + 1', 'unparseable '];
  var orig = lines.join('\n');
  var doc = EditableDocument.create('doc');

  await doc.evaluateDocument(orig);

  var s, editToken;

  editToken = {
    id: 'doc_0',
  };
  s = doc.findStatementForEditToken(editToken);

  t.ok(s);
  t.equal(editToken.id, s.id);

  editToken = {
    line: 2
  };

  s = doc.findStatementForEditToken(editToken);
  t.ok(s, 'statement found by line number');
  t.equal(s.text, 'y = 2', 'correct statement found by line number');

  await doc.evaluateStatement(s.id, 'y = 5');
  s = doc.findStatementForEditToken(editToken);  
  t.equal(s.text, 'y = 5', 'correct statement found by line number, after edit');

  editToken = {
    offset: 13,
  };

  s = doc.findStatementForEditToken(editToken);  
  t.equal(s.text, 'target', 'correct statement found by offset');

  t.end();
});
