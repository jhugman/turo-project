import Storage from '../lib/local-file-storage';
import EditableDocument from '../lib/editable-document';

EditableDocument.storage = new Storage();

const doc = EditableDocument.create()
doc.import('app')
let id = 0;

function evaluate(string) {
  return doc.evaluateStatement(`_${id++}`, string)[0];
}

export default { evaluate }