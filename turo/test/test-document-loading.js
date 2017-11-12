var _ = require('underscore'),
    test = require('tap').test,
    path = require('path');

var prefs = {
  shortUnitNames: true,
};

var Storage = require('../lib/local-file-storage');
var EditableDocument = require('../lib/editable-document');

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

