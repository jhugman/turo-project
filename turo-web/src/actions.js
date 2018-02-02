import { createAction } from 'redux-actions';
import {
  UPDATE_STATEMENT,
  AUTOSAVE_DOCUMENT,
  FETCH_DOCUMENT,
  BATCH_UPDATE_EDITOR_STATE,
  ITERATIVE_UPDATE_EDITOR_STATE,
  UPDATE_DOCUMENT,
  UPDATE_DOCUMENT_TITLE,
  CREATE_DOCUMENT,
} from './constants';
import { findLineNumber, textForStatement } from './blocks-utils';

import { EditableDocument } from 'turo';
import { storage } from './api-document-loader';

EditableDocument.storage = storage;

const headers = new Headers({ 'Content-Type': "application/json" });

const saveDocument = (id, body) => fetch(
  `/api/${id}`,
  { method: 'PUT', body: JSON.stringify(body), headers }
).then(res => res.json());


const initialize = (fetchPromise) => {
  return fetchPromise.then(
      turoDoc => {
        const { id, title, text } = turoDoc;
        return { id, title, text, turoDoc };
      }
    );
};

export const batchUpdateEditorState = createAction(
  BATCH_UPDATE_EDITOR_STATE,
  (turoDoc, editorState) => {
    const blocks = editorState.getCurrentContent().getBlocksAsArray();
    const text = blocks.map((block) => block.getText()).join('\n');

    return turoDoc.evaluateDocument(text)
      .then(
        (turoDoc) => ({ editorState, statements: turoDoc.statements, blocks })
      );
  }
);

export const iterativeUpdateEditorState = createAction(
  ITERATIVE_UPDATE_EDITOR_STATE,
  (turoDoc, editorState) => {
    const selection = editorState.getSelection();
    const column = selection.getStartOffset();
    const blockKey = selection.getStartKey();

    // find the line that this block corresponds to.
    const blocks = editorState.getCurrentContent().getBlocksAsArray();
    const line = findLineNumber(blocks, blockKey);
    if (line === undefined) {
      return;
    }

    // then find the statement, that corresponds to this line and column
    const statement = turoDoc.findStatementForEditToken({ line, column });
    if (!statement) {
      return;
    }

    const newText = textForStatement(blocks, statement);

    const id = statement.id;
    return turoDoc.evaluateStatement(id, newText)
      .then(
        (statements) => ({ editorState, statements, blocks })
      );
  }
);

export const createDocument = createAction(
  CREATE_DOCUMENT,
  body => initialize(EditableDocument.load())
);

export const updateDocument = createAction(UPDATE_DOCUMENT);

export const autosaveDocument = createAction(
  AUTOSAVE_DOCUMENT,
  ({ id, title, editorState })  => saveDocument(id, {
    title,
    document: editorState.getCurrentContent().getPlainText()
  })
);

export const fetchDocument = createAction(
  FETCH_DOCUMENT,
  id => initialize(EditableDocument.load(id))
);

