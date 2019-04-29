import tap from 'tap';
import _ from 'underscore';
import EditorActions from '../lib/actions/EditorActions';

const { test, plan } = tap;

function MockDocument () {}

var mockStatement = {};

MockDocument.prototype.findStatementForEditToken = function (editToken) {
  mockStatement.id = editToken.id || mockStatement.id;
  return mockStatement;
};

function createId (num) {
  return ':' + num;
}

function createEditToken (lineNum) {
  // we're just testing whether the machinary that make the building blocks of EditActions is working
  // so let's keep this simple.
  return {
    id: createId(lineNum),
    cursorLine: lineNum,
  };
}

test('Lazily finding statement', function (t) {

  var doc = new MockDocument(),
      editToken = createEditToken(1),
      editPoint = new EditorActions(doc, editToken);

  t.notOk(editPoint._editState.statement);
  t.equal(editPoint.statement, mockStatement);
  t.ok(editPoint._editState.statement);

  t.end();
});

test('Copying statement numbers in to editToken', function (t) {
  var doc = new MockDocument(),
      editToken = {},
      editPoint = new EditorActions(doc, editToken);

  mockStatement = {
    id: 23,
  };

  t.notOk(editToken.id);

  // By getting id from editPoint,
  t.equal(editPoint.id, mockStatement.id);

  // It has populated the id into editToken.
  t.equal(editToken.id, mockStatement.id);
  
  // The edit token can be passed around:
  // to other instances of the same document
  // or to find new instances of the same statement.
  t.end();
});

test('addEditStateProperties', function (t) {
  EditorActions.addEditStateProperties({
    testingAddEditStateProperty: function () {
      return this.statement.testingAddEditStateProperty;
    }
  });

  var doc = new MockDocument(),
      editToken = createEditToken(2),
      editPoint = new EditorActions(doc, editToken);

  mockStatement = {
    lineFirst: 1,
    lineLast: 3,
    testingAddEditStateProperty: 23,
  };

  t.equal(editPoint.testingAddEditStateProperty, 23);

  mockStatement.testingAddEditStateProperty = 17;
  t.equal(editPoint.testingAddEditStateProperty, 23);

  t.end();
});

test('addAction: function (type, tests, extension)', function (t) {

  EditorActions.addAction('testing', {
    fakeId: function () {
      return !!this.statement.id;
    },
    alwaysZero: function () {
      return true;
    },
    neverAvailable: function () {
      return false;
    }
  }, {
    fakeId: function () {
      return this.statement.id;
    },
    alwaysZero: function () {
      return 0;
    },
    neverAvailable: function () {
      // I'm here! Just never available!
    }
  });


  var doc = new MockDocument(),
      editToken = createEditToken(2),
      editPoint = new EditorActions(doc, editToken);

  t.ok(editPoint.can('fakeId'));
  t.ok(editPoint.can('alwaysZero'));
  t.notOk(editPoint.can('neverAvailable'));

  t.equal(editPoint.alwaysZero(), 0);
  t.equal(editPoint.fakeId(), mockStatement.id);
  t.equal(typeof editPoint.neverAvailable, 'function');

  t.deepEqual(editPoint.available('testing'), ['fakeId', 'alwaysZero']);

  t.end();
});

test('Using available actions as event emitters', function (t) {

  var stateChanges = {};

  EditorActions.addAction('changeEvent', {
    a: function () {
      return true;
    },
    b: function () {
      return true;
    },
    c: function () {
      return false;
    }
  }, {
    a: function (arg) {
      stateChanges.a = arg + 1;
    },
    b: function (arg) {
      stateChanges.b = arg + 2;
    },
    c: function (arg) {
      stateChanges.c = arg + 6;
    },
  });

  var doc = new MockDocument(),
      editPoint = new EditorActions(doc);

  editPoint.doAvailable('changeEvent', 3);

  t.ok(stateChanges.a, 4);
  t.ok(stateChanges.b, 5);
  t.notOk(stateChanges.c);

  t.end();
});