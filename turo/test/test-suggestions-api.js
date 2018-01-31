import tap from 'tap';
import _ from 'underscore';
import { storage } from '../lib/storage/app-bundle-storage';
import EditableDocument from '../lib/editable-document';
import '../lib/actions/autocomplete';

EditableDocument.storage = storage;

const { test, plan } = tap;

test('Test statementOffset', (t) => {
  const doc = EditableDocument.create('testing');
  doc.import('fundamental');
  doc.evaluateDocument('radius1 = 1 m\nradius2 = 2 m\nradius3 = 3 m\nradius4 = \n4m\nradius5 = \n\n5m')

  let editActions = doc.setEditPoint({ line: 1, column: 10 }).getActions();
  t.equal(editActions.statementOffset, 10);

  editActions = doc.setEditPoint({ line: 2, column: 10 }).getActions();
  t.equal(editActions.statementOffset, 10);

  editActions = doc.setEditPoint({ line: 3, column: 10 }).getActions();
  t.equal(editActions.statementOffset, 10);

  editActions = doc.setEditPoint({ line: 5, column: 0 }).getActions();
  t.equal(editActions.statementOffset, 11);

  editActions = doc.setEditPoint({ line: 8, column: 0 }).getActions();
  t.equal(editActions.statementOffset, 12);
  t.end();
});

test('Editor autocomplete, single line', (t) => {

  // {
  //   tokens: [{
  //     tokenType
  //     literal
  //     match
  //   }],
  // }

  const doc = EditableDocument.create('testing');
  doc.import('fundamental');
  doc.evaluateDocument('radius = 1 m\n1 / r  \n1 / r \n')

  let editActions = doc.setEditPoint({ line: 1, column: 12 }).getActions();
  t.ok(editActions, 'EditorActions are accessible from getEditPoint()');
  let suggestions = editActions.getSuggestions();
  t.ok(suggestions, 'suggestions is not nil');

  console.log('suggestions:', suggestions);

  let tokens = _.chain(suggestions.tokens).pluck('literal').sortBy((t) => t.length).value();
  t.ok(tokens.indexOf('m') >= 0, 'contains m');
  t.ok(tokens.indexOf('metre') >= 0, 'contains metre');
  t.ok(tokens.indexOf('minute') >= 0, 'contains mm');
  t.notOk(tokens.indexOf('s') >= 0, 'does not contain s')

  let prefixes = _.chain(suggestions.tokens).pluck('match').unique().value();
  t.deepEqual(prefixes, ['m'], 'only m as "match" prefix');

  suggestions = doc.setEditPoint({ line: 2, column: 5 }).getActions().getSuggestions();
  console.log('suggestions2:', suggestions);

  prefixes = _.chain(suggestions.tokens).pluck('match').unique().value();
  t.deepEqual(prefixes, ['r'], 'only r as "match" prefix');
  tokens = _.chain(suggestions.tokens).pluck('literal').sortBy((t) => t.length).value();

  t.ok(tokens.indexOf('radius') >= 0, 'contains radius');
  t.ok(tokens.indexOf('radian') >= 0, 'contains radian');
  t.notOk(tokens.indexOf('metre') >= 0, 'does not contain metre');

  suggestions = doc.setEditPoint({ line: 3, column: 5 }).getActions().getSuggestions();
  console.log('suggestions3:', suggestions);
  prefixes = _.chain(suggestions.tokens).pluck('match').unique().value();
  t.deepEqual(prefixes, ['r'], 'only r as "match" prefix');
  tokens = _.chain(suggestions.tokens).pluck('literal').sortBy((t) => t.length).value();

  t.ok(tokens.indexOf('radius') >= 0, 'contains radius');
  t.ok(tokens.indexOf('radian') >= 0, 'contains radian');
  t.notOk(tokens.indexOf('metre') >= 0, 'does not contain metre');

  t.end();
});

test('Editor autocomplete, multi line', (t) => {
  const doc = EditableDocument.create('testing');
  doc.import('fundamental');
  doc.evaluateDocument('radius = \n1 m\n1 / \nr  \n');

  let editActions = doc.setEditPoint({ line: 2, column: 3 }).getActions();
  t.ok(editActions, 'EditorActions are accessible from getEditPoint()');
  let suggestions = editActions.getSuggestions();
  t.ok(suggestions, 'suggestions is not nil');
  console.log('suggestions:', suggestions);

  let prefixes = _.chain(suggestions.tokens).pluck('match').unique().value();
  t.deepEqual(prefixes, ['m'], 'only m as "match" prefix');

  let tokens = _.chain(suggestions.tokens).pluck('literal').sortBy((t) => t.length).value();
  t.ok(tokens.indexOf('m') >= 0, 'contains m');
  t.ok(tokens.indexOf('metre') >= 0, 'contains metre');
  t.ok(tokens.indexOf('minute') >= 0, 'contains mm');
  t.notOk(tokens.indexOf('s') >= 0, 'does not contain s')

  t.end();
});

test('Editor autocomplete, multi line with iterative evaluation', (t) => {
  const doc = EditableDocument.create('testing');
  doc.import('fundamental');
  doc.evaluateDocument('radius = 1 m\n1 *\n2 * r  \n');

  let editActions = doc.setEditPoint({ line: 3, column: 5 }).getActions();
  let suggestions = editActions.getSuggestions();
  console.log('suggestions:', suggestions);
  let prefixes = _.chain(suggestions.tokens).pluck('match').unique().value();
  t.deepEqual(prefixes, ['r'], 'only r as "match" prefix');

  let id = editActions.statement.id;
  doc.evaluateStatement(id, '1 *\n2 * radius m');

  editActions = doc.setEditPoint({ line: 3, column: 12 }).getActions();
  suggestions = editActions.getSuggestions();
  prefixes = _.chain(suggestions.tokens).pluck('match').unique().value();
  t.deepEqual(prefixes, ['m'], 'only m as "match" prefix');

  t.end();
});