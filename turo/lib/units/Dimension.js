import _ from 'underscore';

export default class Dimension {
  constructor(initial) {
      if (typeof initial === "string") {
        this.dimensions = {};
        this.dimensions[initial] = 1;
        this.shortName = initial;
        this._isSimple = true;
      } else {
        this.dimensions = initial || {};
        this._isSimple = false;
      }
  }

  isEqual (that) {
    if (!that.dimensions) {
      return;
    }

    return this._minimalContains(that) && that._minimalContains(this);
  }

  _minimalContains (that) {
    var i = 0,
        keys = _.keys(that.dimensions),
        max = keys.length,
        key, l, r;

    for (; i<max; i++) {
      key = keys[i];
      l = this.dimensions[key];
      r = that.dimensions[key];
      /* jshint bitwise: false */
      if ((l && !r) || (!l && r)) {
        /* jshint bitwise: true */
        return false;
      }
      if (l !== r) {
        return false;
      }
    }
    return true;
  }

  isSimple () {
    return this._isSimple;
    //return _.foldl(_.values(this.dimensions), function (l,r) { return l + r; }, 0) === 1;
  }

  contains (that) {
    var i = 0,
        keys = _.keys(that.dimensions),
        max = keys.length,
        key, thatCardinality, thisCardinality;

    for (; i<max; i++) {
      key = keys[i];
      thatCardinality = that.dimensions[key];
      thisCardinality = this.dimensions[key] || 0;
      if (thisCardinality > 0 && thatCardinality > 0) {
        if (thatCardinality > thisCardinality) {
          return false;
        }
      } else if (thisCardinality < 0 && thatCardinality < 0) {
        if (thatCardinality < thisCardinality) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }

  cardinality () {
    return this.isSimple() ? 1 : _.chain(this.dimensions).values().reduce(function (p, q) {
      return p + (q > 0 ? q : -q);
    }, 0).value();
  }
}