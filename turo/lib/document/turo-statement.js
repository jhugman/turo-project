import _ from 'lodash';
import output from '../to-source';
import evaluator from '../evaluator';

function TuroStatement (id, node, info, updateId) {
  this._id = id;
  this._node = node;
  /*
  info = {
    id: id,
    documentId: this.documentId,
    lineFirst: node.lineFirst,
    lineLast: node.lineLast,
    offsetFirst: node.statementOffsetFirst,
    offsetLast: node.statementOffsetLast,
  };
   */
  this._info = info;
  this._currentValue = null;
  this._errors = null;
  this._updateId = updateId;
}

Object.defineProperties(TuroStatement.prototype, {
  id: {
    get: function () {
      return this._id;
    }
  },

  errors: {
    get: function () {
      return this._errors;
    }
  },

  expression: {
    get: function () {
      var node = this._node;
      if (node.definition) {
        return node.definition;
      }
      return node;
    }
  },

  identifier: {
    get: function () {
      return this._node.identifier;
    }
  },

  info: {
    get: function () {
      return this._info;
    }
  },

  node: {
    get: function () {
      return this._node;
    }
  },

  currentValue: {
    get: function () {
      if (this._currentValue) {
        return this._currentValue;
      }
      this._currentValue = this.reevaluate();
      return this._currentValue;
    }
  },

  text: {
    get: function () {
      return this._info.text;
    },
  },
});

_.extend(TuroStatement.prototype, {
  isParseable: function () {
    return !!(this.node.accept);
  },

  hasErrors: function () {
    return this._errors && this._errors.length;
  },

  valueToString: function (display, prefs) {
    return output.toStringWithDisplay(this.currentValue, display, prefs);
  },

  expressionToString: function (display, prefs) {
    return output.toStringWithDisplay(this.expression, display, prefs);
  },

  verboseToString: function (display, prefs) {
    var t = [
      output.toStringWithDisplay(this.node, display, prefs),
      '=',
      this.valueToString(display, prefs)
    ];

    return t.join(' ');
  },

  errorToString: function (display) {

  },

  reevaluate: function () {
    if (!this.isParseable()) {
      return;
    }

    var currentValue = evaluator.evaluate(this.node);
    this._currentValue = currentValue;

    return currentValue;
  },
});

export default TuroStatement;