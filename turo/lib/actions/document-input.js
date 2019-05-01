import EditorActions from './EditorActions';

EditorActions.extend(
  {
    replaceLine: function (string, callback) {
      this.doc.evaluateStatement(this.id, string, callback);
    },

    replaceDocument: function (string, callback) {
      this.doc.evaluateDocument(string, callback);
    },

    newEditToken: function (offset) {
      this._editToken = {
        offset: offset || 0,
      };
    },

    moveCursorBy: function (offset) {
      this.moveCursorTo(offset + this.editToken.offset);
    },

    moveCursorTo: function (newPos) {
      var editToken,
          info = this.statement.info;
      if (info.offsetFirst <= newPos &&
          newPos <= info.offsetLast) {
        editToken = this.editToken;
        editToken.offset = newPos;
      } else {
        editToken = {
          offset: newPos,
        };
      }

      this.doAvailable('update-editor');
      return editToken;
    },
  }
);