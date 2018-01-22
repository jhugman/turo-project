import EditorActions from '../editor-actions';
import './suggestions';
import autocomplete from '../autocomplete';


const tokenGenerator = {
  'variable': (scope) => {
    return scope.getAvailableVariables();
  },
  'unit': (scope) => {
    return scope.getAvailableUnits();
  },
};

Object.defineProperties(EditorActions.prototype, {

});

EditorActions.extend({
  getSuggestions() {
    const predictor = this.createTokenPredictor(tokenGenerator);
    const statement = this.statement;
    const string = statement.text;
    
    return predictor.autocomplete(string, this.statementOffset);
  },

  createTokenPredictor (tokenMap) {
    return new autocomplete.TokenPredictor(this.doc.parser, tokenMap);
  },
});

EditorActions.addEditTokenProperties({
  'statementOffset': function () {
    const startLine = this.statement.info.lineFirst;
    const editLine = this.editToken.line;

    const relativeEditLine = editLine - startLine;

    const lines = this.statement.text.split("\n");

    // calculate the offset of the beginning of the line, 
    // assuming that the statement line is accurate.
    let startLineOffset = 0;
    for (let i = 0; i < relativeEditLine; i++) {
      startLineOffset += lines[i].length;
    }

    return startLineOffset + 
        this.editToken.column + 
        // the number of CRs.
        relativeEditLine;
  }
});