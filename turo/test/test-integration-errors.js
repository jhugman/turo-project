import { test } from 'tap';
import _ from 'underscore';

import { storage } from '../lib/storage/app-bundle-storage';
import { EditableDocument } from '..';

const TuroDocument = EditableDocument;
TuroDocument.storage = storage;

test('happy case async await', async (t) => {
  const doc = TuroDocument.create('test2');

  const documentString = [
    'width = 2 m', 
    'height = 1m',
    'area = width * height / 2',
  ].join('\n');

  await doc.import('fundamental');
  await doc.evaluateDocument(documentString);

  const results = doc.statements.map(s => s.valueToString());

  t.deepEqual(['2 metres', '1 metre', '1 m^2'], results, 'No errors reported');
  t.end();
});

test('error reporting', async (t) => {
  const doc = TuroDocument.create('test2');

  const documentString = [
    'height = 2m',
    'width = 2m + 2s',
    '1 / (3 - 2 - 1)',
  ].join('\n');

  await doc.import('fundamental');
  await doc.evaluateDocument(documentString);

  const results = doc.statements.map(s => s.errors || []);

  t.deepEqual([0, 2, 1], results.map(errors => errors.length), 'Number of errors per statement');

  // error codes
  t.deepEqual([
      [],
      ['DIMENSION_MISMATCH', 'DIMENSION_MISMATCH'],
      ['DIVIDE_BY_ZERO']
    ], 
    results.map(errors => errors.map(e => e.errorCode)), 'Error codes per error per statement');

    // character offsets into the document
    t.deepEqual([
      [],
      [[20, 21], [25, 26]],
      [[32, 42]]
    ], 
    results.map(errors => errors.map(e => [e.node.offsetFirst, e.node.offsetLast])), 'Character offsets per error per statement');

    // statement line offsets
    // t.deepEqual([
    //   [1, 1],
    //   [2, 2],
    //   [3, 3]
    // ], 
    // doc.statements.map(s => [s.offsetFirst, s.offsetLast]), 'Line numbers per statement');


  t.end();
});