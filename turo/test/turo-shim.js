import { storage } from '../lib/storage/app-bundle-storage';
import EditableDocument from '../lib/editable-document';

let doc, id;

function resetImportNothing() {
  EditableDocument.storage = storage;
  doc = EditableDocument.create();
  id = 0;
}

async function reset() {
  resetImportNothing();
  return doc.import('app');
}



function evaluate(string) {
  // We can do this here because we know that this is a synchronous call. 
  // Typically, clients would use the Promise based doc.evaluateStatement(id, string);
  return doc.evaluateStatement_withCallback(`_${id++}`, string)[0];
}

function parse (string, parseRule) {
  return doc.parser.parse(string, parseRule);
}

export default { evaluate, reset, resetImportNothing, parse }