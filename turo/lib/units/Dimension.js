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
      }

      this.initProperties()
  }

  initProperties() {
    Object.keys(this.dimensions).forEach(k => {
      if (!this.dimensions[k]) {
        delete this.dimensions[k];
      }
    });
    const cardinality = this.cardinality();
    this._isSimple = cardinality == 1;
    this._isDimensionless = cardinality == 0;
  }

  isEqual (that) {
    if (!that.dimensions) {
      return;
    }

    return this._minimalContains(that) && that._minimalContains(this);
  }

  isDimensionless () {
    return this._isDimensionless;
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

  by (that) {
    const sum = {};
    Object.assign(sum, this.dimensions, that.dimensions);
    Object.keys(sum).forEach(key => {
      sum[key] = (this.dimensions[key] || 0) + (that.dimensions[key] || 0);
    });
    return new Dimension(sum);
  }

  per (that) {
    const sum = {};
    Object.assign(sum, this.dimensions, that.dimensions);
    Object.keys(sum).forEach(key => {
      sum[key] = (this.dimensions[key] || 0) - (that.dimensions[key] || 0);
    });
    return new Dimension(sum);
  }

  pow (pow) {
    const sum = {};
    Object.keys(this.dimensions).forEach(key => {
      sum[key] = (this.dimensions[key] || 0) * pow;
    });
    return new Dimension(sum);
  }  
}

Dimension.NONE = new Dimension();