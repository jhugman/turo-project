import tap from 'tap';
import _ from 'underscore';
import path from 'path';
import createStorage from './turo-fixture-storage';
import { EditableDocument } from '../lib/document';

const { test, plan } = tap;

const prefs = { shortUnitNames: true };

test('simple load', async function (t) {
  EditableDocument.storage = createStorage();
  const doc = await EditableDocument.load('simple-file-on-disk', []);
  t.ok(doc, 'document exists');
  t.equal(path.basename(doc.id), 'simple-file-on-disk', 'filename correct');
  t.equal(doc.statements[1].valueToString(undefined, prefs), '42', 'evaluating properly');
  t.end();
});

test('importing load', async function (t) {
  EditableDocument.storage = createStorage('metric');
  const doc = await EditableDocument.load('importing', ['metric']);
  t.ok(doc, 'document exists');
  t.equal(path.basename(doc.id), 'importing', 'filename correct');
  t.equal(doc.statements[2].valueToString(undefined, prefs), '2.1 m', 'evaluating properly');
  t.end();
});

test('simple load with implicit imports of all units', async function (t) {
  EditableDocument.storage = createStorage('metric');
  const doc = await EditableDocument.load('loaded-from-disk', ['app']);
  t.ok(doc, 'document exists');
  t.equal(path.basename(doc.id), 'loaded-from-disk', 'filename correct');
  t.equal(doc.statements[1].valueToString(undefined, prefs), '4.2 m', 'evaluating properly');
  t.end();
});