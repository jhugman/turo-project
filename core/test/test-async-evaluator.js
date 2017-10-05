'use strict';

var test = require('tap').test,
    _ = require('underscore');

var DocumentHelper = require('../lib/document/document-helper'),
    AbstractStorage = require('../lib/abstract-storage'),
    Parser = require('../lib/parser').Parser,
    lang = require('../lib/language-model');

/////////////////////////////////////////////////////////////////////////

var fileSource, parser, helper;

function mockEvaluator (id, string, cb) {
  console.log('Parsing document ' + id);
  
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
function MockStorage () {
  AbstractStorage.call(this);
  this._state.mock_fs = {};
}

MockStorage.prototype = new AbstractStorage();

_.extend(MockStorage.prototype, {
  put: function (id, lines) {
    this._state.mock_fs[id] = lines.join('\n');
    return this;
  },

  get: function (id) {
    return this._state.mock_fs[id];
  },

  resolveLocation: function (id, baseLocation, callback) {
    callback(id, this);
  },

  loadString: function (location, callback) {
    setTimeout(
      function () {
        var string = this._state.mock_fs[location];
        callback(null, string);
      }.bind(this),
      Math.random() * 100
    );
  }
});

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

// test('Test single import from turo', function (t) {
//   var turo = newTuro();
//   fileSource.put(
//     'importedFile', 
//     [
//       'unit iU : iLength;',
//       'const iC = 1 iU;'
//     ]);

//   turo.import('importedFile', function () {
//     var m = turo.scope.findUnit('iU');
//     t.ok(m, 'iU exists');
//     t.end();
//   });

// });

// test('Recursive imports', function (t) {
//   var turo = newTuro();
//   fileSource
//     .put(
//       'importedFile2', 
//       [
//         'import "parentFile";',
//         'unit i2U : 10 pU;',
//         'const iC = 1 i2U;'
//       ])
//     .put(
//       'parentFile', 
//       [
//         'unit pU : pLength;',
//         'const pC = 1 pU;'
//       ]);

//   turo.import('importedFile2', function () {
//     var unit = turo.scope.findUnit('i2U');
//     t.ok(unit, 'i2U exists');
//     unit = turo.scope.findUnit('pU');
//     t.ok(unit, 'pU exists');
//     t.end();    
//   });
// });

// test('DAG Recursive imports', function (t) {
//   var turo = newTuro();

//   function unitExists (unitName) {
//     t.ok(turo.scope.findUnit(unitName), unitName + ' exists?');
//   }

//   turo.import('A', function () {
//     unitExists('B1Unit');
//     unitExists('B2Unit');
//     unitExists('CUnit');
//     t.end();    
//   });
// });



test('evaluateDocument', function (t) {
  var turo = setup();
  var scopeUnderTest;

  function unitExists (unitName) {
    t.ok(scopeUnderTest.findUnit(unitName), unitName + ' exists?');
  }

  function unitNotExists (unitName) {
    t.ok(!scopeUnderTest.findUnit(unitName), unitName + ' not exists?');
  }

  function mockEvaluate (filename, cb) {
    mockEvaluator('doc', fileSource.get(filename), cb);
  }

  mockEvaluate('current', function (err, doc) {
    scopeUnderTest = doc.scope;
    unitExists('B1Unit');
    unitNotExists('B2Unit');
    unitExists('CUnit');
    mockEvaluate('current-edited', function (err, doc) {
      scopeUnderTest = doc.scope;
      unitNotExists('B1Unit');
      unitExists('B2Unit');
      unitExists('CUnit');
      t.end();
    });
  });
});

var EditableDocument = require('../lib/editable-document');


var scopeUnderTest;

function unitExists (t, unitName) {
  t.ok(scopeUnderTest.findUnit(unitName), unitName + ' exists?');
}

function unitNotExists (t, unitName) {
  t.ok(!scopeUnderTest.findUnit(unitName), unitName + ' not exists?');
}

test('editable-document eval document', function (t) {
  setup();

  EditableDocument.storage = fileSource;
  
  var doc = new EditableDocument('my-doc');

  function testEvaluate (filename, cb) {
    doc.evaluateDocument(fileSource.get(filename), cb);
  }

  testEvaluate('current', function (err, doc) {
    scopeUnderTest = doc.scope;
    unitExists(t, 'B1Unit');
    unitNotExists(t, 'B2Unit');
    unitExists(t, 'CUnit');
    testEvaluate('current-edited', function (err, doc) {
      scopeUnderTest = doc.scope;
      unitNotExists(t, 'B1Unit');
      unitExists(t, 'B2Unit');
      unitExists(t, 'CUnit');
      t.end();
    });
  });
});

test('editable-document importing', function (t) {
  setup();

  EditableDocument.storage = fileSource;

  fileSource.put('newDoc', ['1 CUnit^2']);
  
  var doc = new EditableDocument('my-doc');

  function testEvaluate (filename, cb) {
    doc.evaluateStatement(filename, fileSource.get(filename), cb);
  }

  doc = new EditableDocument('my-2nd-doc');

  doc.import('A', function (err, s) {
    scopeUnderTest = doc.scope;
    unitExists(t, 'B1Unit');
    unitExists(t, 'B2Unit');
    unitExists(t, 'CUnit');

    // TODO prove that we can make a document using 
    // the imported files.

    testEvaluate('newDoc', function (err) {
      scopeUnderTest = doc.scope;
      unitExists(t, 'B1Unit');
      unitExists(t, 'B2Unit');
      unitExists(t, 'CUnit');
      t.end();
    });
  });
}); 
