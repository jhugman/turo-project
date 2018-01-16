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
  title: 'Untitled',
  turoDoc: null,
  editorState: null,
};

const createTuroDoc = editorState => {
  const turoDoc = EditableDocument.create(genKey());
  const content = editorState.getCurrentContent();
  turoDoc.import('app');
  const text = content.getPlainText();
  turoDoc.evaluateDocument(text);
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

const batchUpdateDocument = (state, editorState) => {
  const { turoDoc } = state;
  const content = editorState.getCurrentContent();
  const text = content.getPlainText();
  turoDoc.evaluateDocument(text);
  return {
    ...state,
    editorState,
    turoDoc,
  };
};

const iterativeUpdateDocument = (state, editorState) => {
  // editorState works on blocks (i.e. long lines)
  // turoDoc works on statements (i.e. multi line expressions)
  // so for each key press, we need to find 
  // a) which block it was in (easy)
  // b) which statatement that corresponds to
  // c) which other blocks does that statement correspond to.
  // 
  // Further compounding: blocks are not numbered sequentially.
  const selection = editorState.getSelection();
  const startOffset = selection.getStartOffset();
  const startKey = selection.getStartKey();

  const { turoDoc } = state;

  const blocks = editorState.getCurrentContent().getBlocksAsArray();
  let startLine;
  for (let i=0; i < blocks.length; i++) {
    if (blocks[i].key === startKey) {
      startLine = i;
      break;
    }
  }

  if (startLine === undefined) {
    return;
  }

  let editToken = { line: startLine + 1, offset: startOffset };
  let statement = turoDoc.findStatementForEditToken(editToken);

  if (!statement) {
    return;
  }

  const id = statement.id;
  const newLines = [];
  for (let i = statement.info.lineFirst - 1; i < statement.info.lineLast; i++) {
    const block = blocks[i];
    if (!block) {
      break;
    }
    newLines.push(block.getText());
  } 

  const newText = newLines.join('\n');

  turoDoc.evaluateStatement(id, newText);

  return {
      ...state,
      editorState,
      turoDoc,
    };
};

const updateEditorState = (state, {
  payload: editorState
}) => {
  if (editorState.getLastChangeType() !== 'insert-characters') {
    return batchUpdateDocument(state, editorState);
  }
  return iterativeUpdateDocument(state, editorState);
}

export default handleActions({
  [`${FETCH_DOCUMENT}_FULFILLED`]: initDoc,
  [`${CREATE_DOCUMENT}_FULFILLED`]: initDoc,
  [UPDATE_DOCUMENT]: (state, { payload }) => ({
    ...state,
    ...payload
  }),
  [UPDATE_EDITOR_STATE]: updateEditorState,
}, initialState);
