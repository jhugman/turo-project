import { EditorState, ContentState, genKey } from 'draft-js';
import { handleActions } from 'redux-actions';
import { EditableDocument } from 'turo';
import {
  CREATE_DOCUMENT,
  UPDATE_DOCUMENT,
  FETCH_DOCUMENT,
  UPDATE_EDITOR_STATE,
  BATCH_UPDATE_EDITOR_STATE,
  ITERATIVE_UPDATE_EDITOR_STATE
} from './constants';
import decorator from './decorator';

export const docStore = {};

const initialState = {
  title: '',
  turoDoc: null,
  editorState: null,
  tokenMap: null,
};

const initDoc = (state, { 
  payload: { id, title, text, turoDoc }
}) => {
  docStore.turoDoc = turoDoc;
  window.doc = turoDoc;

  let editorState = EditorState.createWithContent(
    ContentState.createFromText(text)
  );

  editorState = EditorState.set(
    editorState,
    { decorator }
  );

  const tokenMap = updateTokenMap(editorState.getCurrentContent().getBlocksAsArray(), turoDoc.statements, {});
  
  return {
    ...state,
    title,
    turoDoc,
    id,
    editorState,
    tokenMap,
  };
};

const updateTokenMap = (blocks, statements, tokenMap = {}) => {
  console.log('Reducer updating tokenMap')
  statements.forEach(s => {
    const lines = s.text.split(/\n/g);

    let currentLine = lines.shift();
    let currentLineNum = s.info.lineFirst;
    const block = blocks[currentLineNum - 1];
    tokenMap[block.getKey()] = [];

    let offsetFirst = s.info.offsetFirst;
    s.tokens.forEach(t => {
      if (t.line === undefined || t.line < 0) {
        return;
      }

      const block = blocks[t.line - 1];
      
      while (t.line !== currentLineNum) {
        currentLineNum++;
        const block = blocks[currentLineNum - 1];
        if (!block) {
          return;
        }
        tokenMap[block.getKey()] = [];
        offsetFirst += currentLine ? currentLine.length : 0;
        currentLine = lines.shift();
      }

      const startOffset = t.startOffset > -1 ? t.startOffset - offsetFirst: t.startOffset;

      const token = {
        ...t,
        startOffset
      };
      tokenMap[block.getKey()].push(token);
    })

  });
  docStore.tokenMap = tokenMap;
  return tokenMap;
};


const updateEditorState = (state, {
  payload: { editorState, statements, blocks }
}) => {
  const { turoDoc, tokenMap } = state;
  updateTokenMap(blocks, statements, tokenMap);
  return {
    ...state,
    editorState,
    turoDoc,
    tokenMap: docStore.tokenMap,
  };
};

export default handleActions({
  [`${FETCH_DOCUMENT}_FULFILLED`]: initDoc,
  [`${CREATE_DOCUMENT}_FULFILLED`]: initDoc,
  [UPDATE_DOCUMENT]: (state, { payload }) => ({
    ...state,
    ...payload
  }),
  [BATCH_UPDATE_EDITOR_STATE + '_FULFILLED']: updateEditorState,
  [ITERATIVE_UPDATE_EDITOR_STATE + '_FULFILLED']: updateEditorState,
}, initialState);
