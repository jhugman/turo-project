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

const headers = new Headers({ 'Content-Type': "application/json" });

const saveDocument = (id, body) => fetch(
  `/api/${id}`,
  { method: 'PUT', body: JSON.stringify(body), headers }
).then(res => res.json());

export const updateEditorState = createAction(
  UPDATE_EDITOR_STATE
);

export const createDocument = createAction(
  CREATE_DOCUMENT,
  body => fetch(
    '/api',
    { method: 'POST', body: JSON.stringify(body), headers }
  ).then(res => res.json())
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
  (id) => fetch(`/api/${id}`, { method: 'GET', headers}).then(res => res.json())
);
