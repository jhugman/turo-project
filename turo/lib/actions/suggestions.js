import EditorActions from '../editor-actions';
import autocomplete from '../autocomplete';

Object.defineProperties(EditorActions.prototype, {
});

EditorActions.extend({
  createTokenPredictor: function (tokenMap) {
    return new autocomplete.TokenPredictor(this.doc.parser, tokenMap);
  },
});