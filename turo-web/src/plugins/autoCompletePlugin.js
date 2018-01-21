export default (turoDoc) => ({
  onChange: (editorState, { getProps }) => {
    const selection = editorState.getSelection();
    const { onAutoComplete } = getProps();

    if (selection.hasFocus && selection.isCollapsed()) {
      const focusOffset = selection.getFocusOffset();
      const currentBlock = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getFocusKey());

      const textUntilFocus = currentBlock.getText().substr(0, focusOffset);
      console.log('yo', textUntilFocus, turoDoc);

      // line and cursor index
      // data = turoDoc.suggest(textUntilFocus)
      // example tokens
      const data = {
        match: textUntilFocus,
        tokens: [{
          tokenType: 'unit',
          literal: 'meter'
        }, {
          tokenType: 'unit',
          literal: 'milimeter'
        }, {
          tokenType: 'unit',
          literal: 'mm'
        }, {
          tokenType: 'unit',
          literal: 'miles'
        }]
      }

      onAutoComplete(data.tokens);
    }

    return editorState;
  }
})
