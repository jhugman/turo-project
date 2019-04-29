import EditorActions from './EditorActions';
import TokenPredictor from './TokenPredictor';

Object.defineProperties(EditorActions.prototype, {
});

EditorActions.extend({
  createTokenPredictor: function (tokenMap) {
    return new TokenPredictor(this.doc.parser, tokenMap);
  },
});