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

const batchUpdateDocument = (state, editorState) => {
  const { turoDoc } = state;
  const blocks = editorState.getCurrentContent().getBlocksAsArray();
  const text = blocks.map((block) => block.getText()).join('\n');

  turoDoc.evaluateDocument(text, (err, turoDoc));

  const tokenMap = updateTokenMap(blocks, turoDoc.statements, {});

  return {
    ...state,
    editorState,
    turoDoc,
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
    
        offsetFirst += currentLine.length;
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

  const { turoDoc, tokenMap } = state;

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

  const editToken = { line: startLine + 1, column: startOffset };
  const statement = turoDoc.findStatementForEditToken(editToken);

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

  const newStatement = turoDoc.getStatement(id);
  
  updateTokenMap(blocks, [newStatement], {...tokenMap});

  return {
    ...state,
    editorState,
    turoDoc,
    tokenMap: docStore.tokenMap,
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
