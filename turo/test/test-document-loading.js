import tap from 'tap';
import _ from 'underscore';
import path from 'path';
import storage from './turo-fixture-storage';
import EditableDocument from '../lib/editable-document';

const { test, plan } = tap;

const prefs = { shortUnitNames: true };

function file (relative) {
  return path.resolve(__dirname, 'fixtures', relative);
}

console.log(storage);
debugger;


test('simple load', async function (t) {
  EditableDocument.storage = storage;
  const doc = await EditableDocument.load('loaded-from-disk', 'metric');
  t.ok(doc, 'document exists');
  t.equal(path.basename(doc.id), 'loaded-from-disk', 'filename correct');
  t.equal(doc.statements[1].valueToString(undefined, prefs), '4.2 m', 'evaluating properly');
  t.end();
});

test('importing load', async function (t) {
  EditableDocument.storage = storage;
  const doc = await EditableDocument.load('importing', 'metric');
  t.ok(doc, 'document exists');
  t.equal(path.basename(doc.id), 'importing', 'filename correct');
  t.equal(doc.statements[2].valueToString(undefined, prefs), '2.1 m', 'evaluating properly');
  t.end();
});

test('simple load with implicit imports of all units', async function (t) {
  EditableDocument.storage = storage;
  const doc = await EditableDocument.load('loaded-from-disk', 'app');
  t.ok(doc, 'document exists');
  t.equal(path.basename(doc.id), 'loaded-from-disk', 'filename correct');
  t.equal(doc.statements[1].valueToString(undefined, prefs), '4.2 m', 'evaluating properly');
  t.end();
});