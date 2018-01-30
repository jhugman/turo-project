import Storage from '../lib/local-file-storage';
import EditableDocument from '../lib/editable-document';

let doc, id;

function reset() {
  EditableDocument.storage = new Storage();
  doc = EditableDocument.create();
  doc.import('app');
  id = 0;
}

reset();

function evaluate(string) {
  // We can do this here because we know that this is a synchronous call. 
  // Typically, clients would use the Promise based doc.evaluateStatement(id, string);
  return doc.evaluateStatement_withCallback(`_${id++}`, string)[0];
}

export default { evaluate, reset }