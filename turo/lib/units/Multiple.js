import _ from 'underscore';

// TODO should this include source and destination Unit objects?
export default class Multiple {

  constructor (top, bottom) {
    if (top === undefined) {
      top = 1;
    }
    this.top = top;
    this.bottom = bottom || 1;
  }

  set (t, b) {
    this.top = t || 1;
    this.bottom = b || 1;
  }

  times (that) {
    return new Multiple(this.top * that.top, this.bottom * that.bottom);
  }

  _times (that) {
    this.top *= that.top;
    this.bottom *= that.bottom;
    return this;
  }

  divide (that) {
    return new Multiple(this.top * that.bottom, this.bottom * that.top);
  }

  _divide (that) {
    this.top *= that.bottom;
    this.bottom *= that.top;
    return this;
  }

  value (x) {
    x = x || 1;
    return x * this.top / this.bottom;
  }

  toString () {
    return "[" + this.top + ", " + this.bottom + "]";
  }

  static container (name) {
    var container = {};
    if (_.isString(name)) {
      container[name] = new Multiple();
    }
    return container;
  }

  static one () {
    return new Multiple(1, 1);
  }

  static quantity (value) {
    var one = new Multiple();
    one.top = value;
    return one;
  }
}