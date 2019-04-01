import _ from 'underscore';
import output from '../to-source';
import { toTokenArray } from '../to-tokens';
import evaluator from '../eval/evaluator';

export default class TuroStatement {
  constructor (id, node, info, updateId) {
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

  get tokens() {
    return this.toTokens();
  }

  get id() {
    return this._id;
  }

  get errors() {
    return this.node.errors;
  }

  get expression() {
    var node = this._node;
    if (node.definition) {
      return node.definition;
    }
    return node;
  }

  get identifier() {
    return this._node.identifier;
  }

  get info() {
    return this._info;
  }

  get node() {
    return this._node;
  }

  get currentValue() {
    if (this._currentValue) {
      return this._currentValue;
    }
    this._currentValue = this.reevaluate();
    return this._currentValue;
  }

  get text() {
    return this._info.text;
  }

  isParseable () {
    return !!(this.node.accept) && !this.node.isUnparsed;
  }

  hasErrors() {
    if (!this.isParseable()) {
      return true;
    }
    let value = this.currentValue;
    return this.errors && this.errors.length;
  }

  toTokens() {
    return toTokenArray(this.node, {prefs: {}});
  }

  valueToString (display, prefs) {
    return output.toStringWithDisplay(this.currentValue, display, prefs);
  }

  expressionToString (display, prefs) {
    return output.toStringWithDisplay(this.expression, display, prefs);
  }

  verboseToString (display, prefs) {
    if (!prefs) {
      prefs = { padding: ' '};
    }
    var t = [
      output.toStringWithDisplay(this.node, display, prefs),
      '=',
      this.valueToString(display, prefs)
    ];

    return t.join(' ');
  }

  errorToString (display) {

  }

  reevaluate () {
    if (!this.isParseable()) {
      return;
    }

    var currentValue = evaluator.evaluate(this.node);
    this._currentValue = currentValue;

    return currentValue;
  }

  toString(display, prefs) {
    return this.verboseToString(display, prefs);
  }
}