import { createAction } from 'redux-actions';
import {
  UPDATE_STATEMENT,
  AUTOSAVE_DOCUMENT,
  FETCH_DOCUMENT,
  UPDATE_EDITOR_STATE,
  UPDATE_DOCUMENT,
  UPDATE_DOCUMENT_TITLE,
  CREATE_DOCUMENT,
} from './constants';

import { EditableDocument } from 'turo';

const headers = new Headers({ 'Content-Type': "application/json" });

const saveDocument = (id, body) => fetch(
  `/api/${id}`,
  { method: 'PUT', body: JSON.stringify(body), headers }
).then(res => res.json());


const initialize = (fetchPromise) => {
  return fetchPromise
    .then(res => res.json())
    .then(({ id, title, document: text }) => {
      const turoDoc = EditableDocument.create('' + id);
      return turoDoc.import('app')
        .then(
          turoDoc => {
            return turoDoc.evaluateDocument(text)
          }
        ).then(
          turoDoc => ({ id, title, text, turoDoc })
        );
    });
};

export const updateEditorState = createAction(
  UPDATE_EDITOR_STATE
);

export const createDocument = createAction(
  CREATE_DOCUMENT,
  body => initialize(fetch(
    '/api',
    { method: 'POST', body: JSON.stringify(body), headers }
  ))
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
  (id) => initialize(fetch(`/api/${id}`, { method: 'GET', headers}))
);

