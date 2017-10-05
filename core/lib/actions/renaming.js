'use strict';

var EditorActions = require('../editor-actions');

EditorActions.addAction(
  'refactor', 
  {
    'rename': function () {
      return !this.astCursorNode;
    },
  },
  {
    'rename': function (newName) {

    },

    'renameCommit': function () {

    },
  }
);