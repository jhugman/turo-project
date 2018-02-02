export const findLineNumber = (blocks, blockKey) => {
  for (let i=0; i < blocks.length; i++) {
    if (blocks[i].key === blockKey) {
      // line numbers in pegjs are 1 based.
      return i + 1;
    }
  }
};

export const textForStatement = (blocks, statement) => {
  const newLines = [];
  for (let i = statement.info.lineFirst - 1; i < statement.info.lineLast; i++) {
    const block = blocks[i];
    if (!block) {
      break;
    }
    newLines.push(block.getText());
  } 
  return newLines.join('\n');
};