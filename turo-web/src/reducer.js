import { EditorState, ContentState, genKey } from 'draft-js';
import { handleActions } from 'redux-actions';
import { EditableDocument } from 'turo';
import {
  CREATE_DOCUMENT,
  UPDATE_DOCUMENT,
  FETCH_DOCUMENT,
  UPDATE_EDITOR_STATE,
} from './constants';
import decorator from './decorator';

export const docStore = {};

const initialState = {
  title: '',
  turoDoc: null,
  editorState: null,
};

const createTuroDoc = editorState => {
  const turoDoc = EditableDocument.create(genKey());
  const content = editorState.getCurrentContent();
  turoDoc.import('app');
  content.getBlockMap().forEach(block => turoDoc.evaluateStatement(block.key, block.text));
  docStore.turoDoc = turoDoc;
  window.doc = turoDoc;
  return turoDoc;
}

const initDoc = (state, {
  payload: { id, title, document: text }
}) => {
  let editorState = EditorState.createWithContent(
    ContentState.createFromText(text)
  );

  const turoDoc = createTuroDoc(editorState);

  editorState = EditorState.set(
    editorState,
    { decorator }
  );

  return {
    ...state,
    title,
    turoDoc,
    id,
    editorState,
  };
};

export default handleActions({
  [`${FETCH_DOCUMENT}_FULFILLED`]: initDoc,
  [`${CREATE_DOCUMENT}_FULFILLED`]: initDoc,
  [UPDATE_DOCUMENT]: (state, { payload }) => ({
    ...state,
    ...payload
  }),
  [UPDATE_EDITOR_STATE]: (state, { payload: editorState }) => ({
    ...state,
    editorState,
    turoDoc: createTuroDoc(editorState),
  }),
}, initialState);
