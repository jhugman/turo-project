import tap from 'tap';
import _ from 'underscore';
import { storage } from '../lib/storage/app-bundle-storage';
import { EditableDocument } from '../lib/document';

const { test, plan } = tap;

var prefs = {
  padding: ' ',
};

EditableDocument.storage = storage;

var nextId = 1;
function simpleEval (doc, string) {
  var results = doc.evaluateStatement('_' + (nextId++), string);
  return results[0].valueToString();
}

function cascadeEval (doc, string) {
  var results = doc.evaluateStatement('_' + (nextId++), string);
  return _.map(results, function (r) {
    return r.expressionToString(null, prefs) + ' = ' + r.valueToString();
  });
}

test('Evaluating an empty and consequently a non-empty string', function (t) {
  var doc = EditableDocument.create('doc');
  const id = 'heyo'
  doc.evaluateStatement(id, '');
  doc.evaluateStatement(id, '123');
  // doc.evaluateStatement(id, '21321');
  t.end();
});

// 
// 
// test('Synchronous evaluation', function (t) {  
//   var doc = EditableDocument.create('t1');
//   doc.import('app');
// 
//   t.equal(simpleEval(doc, '1 + 2'), '3');
//   t.equal(simpleEval(doc, '5 - 7'), '-2');
//   t.equal(simpleEval(doc, '2 m + 1 cm'), '2.01 metres');
// 
//   t.end();
// });
// 
// 
// test('Cascaded evaluation, in a reply setting', function (t) {  
//   var doc = EditableDocument.create('t2');
// 
//   doc.overwriteExistingDefinitions = true;
// 
//   t.equal(simpleEval(doc, 'x = 1'), '1');
//   t.equal(simpleEval(doc, 'y = x + 1'), '2');
// 
//   t.deepEqual(cascadeEval(doc, 'x = 2'), ['x = 2 = 2', 'y = x + 1 = 3']);
//   t.deepEqual(cascadeEval(doc, 'y = 3'), ['y = 3 = 3']);
// 
//   t.deepEqual(cascadeEval(doc, 'x = 4'), ['x = 4 = 4']);
//   t.end();
// });
// 
// test('Strings in the correct place', function (t) {
//   var lines = ['x = 1', 'y = 2 trailing text', '    y + x', 'z = \n\nx + 1', '', 'unparseable '];
//   var orig = lines.join('\n');
//   var doc = EditableDocument.create('doc', orig);
// 
//   t.equal(doc.text, orig, 'Original text equal');
// 
//   // delete the cache.
//   delete doc._state.text;
//   t.equal(doc.text, orig, 'Regenerate the original document text');
// 
//   lines[0] = 'x = 2';
//   doc.evaluateStatement('doc_0', 'x = 2');
//   t.equal(doc.text, lines.join('\n'), 'Updated text document with a changed statement');
// 
//   lines.push('z = y + x');
//   doc.evaluateStatement('doc_6', 'z = y + x');
//   t.equal(doc.text, lines.join('\n'), 'Updated text document with a new statement');
// 
//   t.end();
// });
// 
// function testDoc (t, lines, expected) {
//   var doc = EditableDocument.create('doc');
//   doc.import('fundamental');
//   var i = 0;
//   doc.evaluateDocument(lines.join('\n'));
//   _.each(doc.statements, function (s) {
//     t.equal(s.valueToString(undefined, prefs), expected[i], lines[i] + ' = ' + expected[i] + ' = ' + s.valueToString());
//     i++;
//   });
// }
// 
// test('Evaluating out of order', function (t) {
//   testDoc(t, ['x = 1', 'y = x + 1'], ['1', '2']);
//   testDoc(t, ['y = x + 1', 'x = 1'], ['2', '1']);
//   t.end();
// });
// 
// test('Evaluating exotic operators', function (t) {
//   testDoc(t, ['x = sqrt 4'], ['2']);
//   testDoc(t, ['y = 3 nth_root 8'], ['2']);
//   testDoc(t, ['z = cos(0 degrees)'], ['1']);
//   testDoc(t, ['z = cos(60 degrees)'], ['0.5']);
//   t.end();
// });
// 
// test('Finding statements', function (t) {
//   var lines = ['x = 1', 'y = 2', 'target', '', 'z = \n\nx + 1', 'unparseable '];
//   var orig = lines.join('\n');
//   var doc = EditableDocument.create('doc', orig);
// 
//   var s, editToken;
// 
//   editToken = {
//     id: 'doc_0',
//   };
//   s = doc.findStatementForEditToken(editToken);
// 
//   t.ok(s);
//   t.equal(editToken.id, s.id);
// 
//   editToken = {
//     line: 2
//   };
// 
//   s = doc.findStatementForEditToken(editToken);
//   t.ok(s, 'statement found by line number');
//   t.equal(s.text, 'y = 2', 'correct statement found by line number');
// 
//   doc.evaluateStatement(s.id, 'y = 5');
//   s = doc.findStatementForEditToken(editToken);  
//   t.equal(s.text, 'y = 5', 'correct statement found by line number, after edit');
// 
//   editToken = {
//     offset: 13,
//   };
// 
//   s = doc.findStatementForEditToken(editToken);  
//   t.equal(s.text, 'target', 'correct statement found by offset');
// 
//   t.end();
// });
