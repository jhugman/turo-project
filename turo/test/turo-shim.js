import { storage } from '../lib/storage/app-bundle-storage';
import EditableDocument from '../lib/editable-document';

let doc, id;

async function reset() {
  EditableDocument.storage = storage;
  doc = EditableDocument.create();
  id = 0;
  return doc.import('app');
}

function evaluate(string) {
  // We can do this here because we know that this is a synchronous call. 
  // Typically, clients would use the Promise based doc.evaluateStatement(id, string);
  return doc.evaluateStatement_withCallback(`_${id++}`, string)[0];
}

export default { evaluate, reset }