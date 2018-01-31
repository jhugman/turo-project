import _ from 'underscore';
import { test, plan } from 'tap';

import DocumentHelper from '../lib/document/document-helper';
import { AbstractStorage } from '../lib/abstract-storage';
import _parser from '../lib/parser';
import lang from '../lib/language-model';
import EditableDocument from '../lib/editable-document';

const { Parser } = _parser;
////////////////////////////////////////////////////////////////////////
var scopeUnderTest;

function unitExists (t, unitName) {
  t.ok(scopeUnderTest.findUnit(unitName), unitName + ' exists?');
}

function unitNotExists (t, unitName) {
  t.ok(!scopeUnderTest.findUnit(unitName), unitName + ' not exists?');
}

/////////////////////////////////////////////////////////////////////////
var fileSource, parser, helper;

function mockEvaluator (id, string, cb) {
  // one scope per id.
  var scope = lang.newScope(id);
  
  var doc = {
    id: id,
    string: string,
    scope: scope,
  };
  
  var ctx = {
    document: doc,
    scope: scope,
    documentEvaluator: mockEvaluator,
  };

  // one parser per id.
  var parser = new Parser(scope);
  
  var node = parser.parse(string + '\n', 'DocumentFirstParse');

  helper.evaluate(node, function (err, doc) {
    //doc.node = parser.parse(string, 'EditorText');
    cb(err, doc);
  }, ctx);
  return doc;
}

/////////////////////////////////////////////////////////////////////////
class MockStorage extends AbstractStorage {
  constructor () {
    super();
    this._state.mock_fs = {};
  }

  put (id, lines) {
    this._state.mock_fs[id] = lines.join('\n');
    return this;
  }

  get (id) {
    return this._state.mock_fs[id];
  }

  loadJSON (slug) {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          var string = this._state.mock_fs[slug];
          resolve({ id: slug, title: slug, document: string });
        },
        Math.random() * 100
      );  
    });
  }
};

/////////////////////////////////////////////////////////////////////////
function setup () {
  fileSource = new MockStorage();
  helper = new DocumentHelper(fileSource);

  fileSource
    .put('current', 
      [
        'import "B1"',
        'import "C"',
      ])
    .put('current-edited', 
      [
        'import "B2"',
        'import "C"',
      ])
    .put(
      'A', 
      [
        'import "B1";',
        'import "B2";'
      ])  
    .put(
      'B1', 
      [
        'import "C";',
        'unit B1Unit : 10 CUnit;'
      ])
    .put(
      'B2', 
      [
        'import "C";',
        'unit B2Unit : 10 CUnit;'
      ])
    .put(
      'C', 
      [
        'unit CUnit : CDimension;',
      ]);
    return helper;
}

var newTuro = setup;

/////////////////////////////////////////////////////////////////////////

test('abstract-storage', function (t) {
  var storage = new MockStorage();
  helper = new DocumentHelper(storage);
  storage.put('a', ['aaa']).put('b', ['bbb']);

  t.notOk(storage.hasDocument('a'));

  storage.loadDocument('a', mockEvaluator, function (err, doc) {
    t.ok(doc);
    t.equal(doc.id, 'a');

    t.deepEqual(doc, storage.getDocument(doc.id));

    t.ok(storage.hasDocument('a'));

    t.end();
  });
});

test('Test single import from turo', function (t) {
  setup();
  fileSource.put(
    'importedFile', 
    [
      'unit iU : iLength;',
      'const iC = 1 iU;'
    ]);

  EditableDocument.storage = fileSource;
  const doc = new EditableDocument('my-doc');

  doc.import('importedFile').then(() => {
    var m = doc.scope.findUnit('iU');
    t.ok(m, 'iU exists');
    t.end();
  });
});

test('Recursive imports', function (t) {
  setup();
  fileSource
    .put(
      'importedFile2', 
      [
        'import "parentFile";',
        'unit i2U : 10 pU;',
        'const iC = 1 i2U;'
      ])
    .put(
      'parentFile', 
      [
        'unit pU : pLength;',
        'const pC = 1 pU;'
      ]);

  EditableDocument.storage = fileSource;
  const doc = new EditableDocument('my-doc');

  doc.import('importedFile2').then(() => {
    var unit = doc.scope.findUnit('i2U');
    t.ok(unit, 'i2U exists');
    unit = doc.scope.findUnit('pU');
    t.ok(unit, 'pU exists');
    t.end();    
  });
});

test('DAG Recursive imports', function (t) {
  setup();

  EditableDocument.storage = fileSource;
  const doc = new EditableDocument('my-doc');

  doc.import('A').then(() => {
    scopeUnderTest = doc.scope;
    unitExists(t, 'B1Unit');
    unitExists(t, 'B2Unit');
    unitExists(t, 'CUnit');
    t.end();    
  });
});

test('naiveEvaluateDocument', function (t) {
  var turo = setup();

  function mockEvaluate (filename, cb) {
    mockEvaluator('doc', fileSource.get(filename), cb);
  }

  mockEvaluate('current', function (err, doc) {
    scopeUnderTest = doc.scope;
    unitExists(t, 'B1Unit');
    unitNotExists(t, 'B2Unit');
    unitExists(t, 'CUnit');
    mockEvaluate('current-edited', function (err, doc) {
      scopeUnderTest = doc.scope;
      unitNotExists(t, 'B1Unit');
      unitExists(t, 'B2Unit');
      unitExists(t, 'CUnit');
      t.end();
    });
  });
});

test('editable-document eval document', function (t) {
  setup();

  EditableDocument.storage = fileSource;
  
  var doc = new EditableDocument('my-doc');

  function testEvaluate (filename) {
    return doc.evaluateDocument(fileSource.get(filename));
  }

  testEvaluate('current').then((doc) => {
    scopeUnderTest = doc.scope;
    unitExists(t, 'B1Unit');
    unitNotExists(t, 'B2Unit');
    unitExists(t, 'CUnit');
  }).then(() => {
    return testEvaluate('current-edited')
  }).then((doc) => {
    scopeUnderTest = doc.scope;
    unitNotExists(t, 'B1Unit');
    unitExists(t, 'B2Unit');
    unitExists(t, 'CUnit');
    t.end();
  });
});

test('editable-document importing', function (t) {
  setup();

  EditableDocument.storage = fileSource;
  const doc = new EditableDocument('my-2nd-doc');

  doc.import('A').then((s) => {
    scopeUnderTest = doc.scope;
    unitExists(t, 'B1Unit');
    unitExists(t, 'B2Unit');
    unitExists(t, 'CUnit');
    // TODO prove that we can make a document using 
    // the imported files.
  }).then(() => {
    return doc.evaluateStatement('_id', '1 CUnit^2');
  }).then((s) => {
      scopeUnderTest = doc.scope;
      unitExists(t, 'B1Unit');
      unitExists(t, 'B2Unit');
      unitExists(t, 'CUnit');
      t.end();
  });
}); 
