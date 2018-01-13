import Storage from '../lib/local-file-storage';
import EditableDocument from '../lib/editable-document';

EditableDocument.storage = new Storage();


let doc, id;

function reset() {
  id = 0;
  doc = EditableDocument.create();
  doc.import('app');
}

reset();

function evaluate(string) {
  return doc.evaluateStatement(`_${id++}`, string)[0];
}

export default { evaluate, reset }