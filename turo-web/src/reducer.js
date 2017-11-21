import { EditorState, ContentState, genKey } from 'draft-js';
import { handleActions } from 'redux-actions';
import { EditableDocument } from 'turo';
import {
  CREATE_DOCUMENT,
  AUTOSAVE_DOCUMENT,
  FETCH_DOCUMENT,
  UPDATE_EDITOR_STATE,
} from './constants';
import decorator from './decorator';

const initialState = {
  title: 'Untitled',
  turoDoc: null,
  editorState: null,
};

const createTuroDoc = (text) => {
  const turoDoc = EditableDocument.create(genKey());
  turoDoc.import('app');
  turoDoc.evaluateDocument(text);
  return turoDoc;
}

const initDoc = (state, {
  payload: { id, title, document: text }
}) => ({
  ...state,
  title,
  id,
  turoDoc: createTuroDoc(text),
  editorState: EditorState.createWithContent(
    ContentState.createFromText(text),
    // decorator
  )
});

export default handleActions({
  [`${FETCH_DOCUMENT}_FULFILLED`]: initDoc,
  [`${CREATE_DOCUMENT}_FULFILLED`]: initDoc,
  [UPDATE_EDITOR_STATE]: (state, { payload: editorState }) => ({
    ...state,
    editorState,
  }),
}, initialState);
