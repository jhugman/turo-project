import tap from 'tap';
import _ from 'lodash';
import $turo from '../lib/turo';
import graphBuilder from '../lib/document/document-graph-builder';
import path from 'path';
import Storage from '../lib/local-file-storage';
import EditableDocument from '../lib/editable-document';

const { test, plan } = tap;

const prefs = { shortUnitNames: true };

function file (relative) {
  return path.resolve(__dirname, 'fixtures', relative);
}

test('simple load', function (t) {
  EditableDocument.storage = new Storage(path.resolve(__dirname, 'fixtures'));
  EditableDocument.load('./loaded-from-disk', 'app', function (err, doc) {
    t.ok(doc, 'document exists');
    t.equal(path.basename(doc.id), 'loaded-from-disk', 'filename correct');
    t.equal(doc.statements[1].valueToString(undefined, prefs), '4.2 m', 'evaluating properly');
    t.end();
  });
});

test('importing load', function (t) {
  EditableDocument.storage = new Storage(path.resolve(__dirname, 'fixtures'));
  EditableDocument.load('./importing', 'app', function (err, doc) {
    t.ok(doc, 'document exists');
    t.equal(path.basename(doc.id), 'importing', 'filename correct');
    t.equal(doc.statements[2].valueToString(undefined, prefs), '2.1 m', 'evaluating properly');
    t.end();
  });
});

