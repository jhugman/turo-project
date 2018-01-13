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
  return doc.evaluateStatement(`_${id++}`, string)[0];
}

export default { evaluate, reset }