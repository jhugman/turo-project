'use strict';

var EditorActions = require('../editor-actions'),
    autocomplete = require('../autocomplete');

Object.defineProperties(EditorActions.prototype, {

});

EditorActions.extend({
  createTokenPredictor: function (tokenMap) {
    return new autocomplete.TokenPredictor(this.doc.parser, tokenMap);
  },
});