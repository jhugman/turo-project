'use strict';

var test = require('tap').test,
    _ = require('underscore');

var lang = require('../lib/language-model'),
    Scope = lang.Scope,
    LM = lang.LanguageModel;

var aUnit = ['unit-metre'],
    aVariable = ['_id_'],
    a2ndVariable = ['_id2_'],
    a2ndUnit = ['unit-km'],
    a3rdUnit = ['unit-yd'];

test('Initial load', function (t) {

  var scope = new Scope();

  scope.addUnit(aUnit, 'm');
  t.equal(scope.findUnit('m'), aUnit);

  scope.addVariable('x', aVariable);
  t.equal(scope.findVariable('x'), aVariable);

  t.end();
});

test('Parent child', function (t) {
  var parent = new Scope();

  parent.addUnit(aUnit, 'm');
  t.equal(parent.findUnit('m'), aUnit);

  parent.addVariable('x', aVariable);
  t.equal(parent.findVariable('x'), aVariable);

  var child = parent.newScope();
  var pUnit = child.findUnit('m');
  var pVar = child.findVariable('x');

  t.equal(pUnit, aUnit);
  t.equal(child.findVariable('x'), aVariable);

  child.addVariable('x', a2ndVariable);
  t.equal(parent.findVariable('x'), aVariable);
  t.equal(child.findVariable('x'), a2ndVariable);

  child.addUnit(a2ndUnit, 'm');
  t.equal(parent.findUnit('m'), aUnit);
  t.equal(child.findUnit('m'), a2ndUnit);

  t.end();
});

test('Add includes', function (t) {
  var parent = new Scope();

  parent.addUnit(aUnit, 'm');
  t.equal(parent.findUnit('m'), aUnit);

  parent.addVariable('x', aVariable);
  t.equal(parent.findVariable('x'), aVariable);

  var doc = new Scope();
  doc.addInclude('app', parent);

  var pUnit = doc.findUnit('m');
  var pVar = doc.findVariable('x');

  t.equal(pUnit, aUnit);
  t.equal(doc.findVariable('x'), aVariable);

  doc.addVariable('x', a2ndVariable);
  t.equal(parent.findVariable('x'), aVariable);
  t.equal(doc.findVariable('x'), a2ndVariable);

  doc.addUnit(a2ndUnit, 'm');
  t.equal(parent.findUnit('m'), aUnit);
  t.equal(doc.findUnit('m'), a2ndUnit);

  var grandparent = new Scope();
  grandparent.addUnit(a3rdUnit, 'yd');

  parent.addInclude('imperial', grandparent);

  t.equal(parent.findUnit('yd'), a3rdUnit);
  t.equal(doc.findUnit('yd'), a3rdUnit);

  t.end();
});

test('Available unit tokens', function (t) {

  var parent = new Scope();
  var child = parent.newScope();
  
  parent.addUnit(aUnit, 'm');
  parent.addUnit(a2ndUnit, 'km');

  t.deepEqual(parent.getAvailableUnits(), ['m', 'km']);
  t.deepEqual(child.getAvailableUnits(), ['m', 'km']);

  child.addUnit(aUnit, 'mm');
  t.deepEqual(child.getAvailableUnits(), ['mm', 'm', 'km']);

  t.end();
});


test('Available variable tokens', function (t) {

  var parent = new Scope();
  var child = parent.newScope();
  
  parent.addVariable('x', aUnit);
  parent.addVariable('y', a2ndUnit);

  t.deepEqual(parent.getAvailableVariables(), ['x', 'y']);
  t.deepEqual(child.getAvailableVariables(), ['x', 'y']);

  child.addVariable('z', aUnit);
  t.deepEqual(child.getAvailableVariables(), ['z', 'x', 'y']);

  t.end();
});


test('Integration with turo object', function (t) {
  var Turo = new require('../lib/turo').Turo,
    turo = new Turo();

  function testParseable (string) {
    var prevScopeId = turo.parser.parseContext.scope.id;
    t.ok(!turo.evaluate(string).parseError, 'is parseable? ' + string);
    t.equal(prevScopeId, turo.parser.parseContext.scope.id, 'scope ids should be equal');
  }

  function testUnitAvailability (string) {
    t.ok(turo.parser.parseContext.scope.findUnit(string), 'unit present? ' + string);
  }

  var prevScopeId = turo.parser.parseContext.scope.id;
  //turo.include('app');
  t.equal(prevScopeId, turo.parser.parseContext.scope.id, 'scope ids should be equal');

  // testUnitAvailability('m');

  testParseable('1 + 1'); // smoke test
  // testParseable('1 m');
  // testParseable('2 * c');

  t.end();
});

test('Consistent ids', function (t) {

  var parent = new Scope(undefined, 'doc');
  var childScopes = [];
  var childScope = parent;
  for (var i=0; i < 5; i++) {
    var prevId = childScope.id;
    childScope = parent.newScope();
    t.notEqual(parent.id, childScope.id, parent.id + ' != ' + childScope.id);
    t.notEqual(prevId, childScope.id, prevId + ' != ' + childScope.id);
    childScopes.push(childScope);
  }

  parent = parent.fresh();
  _.each(childScopes, function (scope) {
    var newScope = parent.newScope();
    t.equal(scope.id, newScope.id, scope.id + ' == ' + newScope.id);
  });

  t.end();
});