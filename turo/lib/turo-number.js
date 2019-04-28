import _ from 'underscore';
import output from './output';
import precision from './precision-hacks';

var noUnits = null;

//////////////////////////////////////////////////////

var MAX_SF = 14;

function createNumberLiteral (num, precisionDigits, precisionType) {
  var dp = precisionDigits,
      sf = Math.min(dp, MAX_SF),
      literal;
  switch (precisionType) {
    case "dp":
      literal = num.toFixed(dp);
      break;
    case "sf":
      literal = precision.toPrecision10(num, sf);
      break;
    default:
      literal = precision.toPrecision10(num, MAX_SF);
  }
  return literal;
}

//////////////////////////////////////////////////////
// TuroNumber constructor.
//////////////////////////////////////////////////////
function TuroNumber (number, unit, valueType, original) {
  if (!this) {
    return new TuroNumber(number, unit, valueType, original);
  }
  this._init(number, unit, valueType, original);
}

// scope tricks
var newInstance, recycle;

//////////////////////////////////////////////////////
// TuroNumber methods.
//////////////////////////////////////////////////////
_.extend(TuroNumber.prototype, {

  _init (number, unit, valueType, parent) {
    this.number = number;
    this.valueType = valueType;
    this.unit = unit || noUnits;

    // we may want to derive from the original.
    this._original = parent;
    delete this.literal;
    return this;
  },

  prepareLiteral (prefs) {
    this.setPrecision(prefs.precisionDigits, prefs.precisionType);
  },

  setPrecision (precisionDigits, precisionType) {
    if (_.isNumber(this.number)) {
      this.literal = createNumberLiteral(this.number, precisionDigits, precisionType);
    }
  },

  convert (newUnit) {
    if (this._original) {
      // we use the original, to not lose 
      // accuracy.
      return this._original.convert(newUnit);
    }
    return newInstance(
      this.unit.convert(this.number, newUnit),
      newUnit,
      this.valueType,
      this
    );
  },

  toString (display, prefs) {
    this.prepareLiteral(prefs);
    return output.toString(this, display, prefs);
  },

});

Object.defineProperties(TuroNumber.prototype, {
  number: {
    get () {
      return this._value;
    },
    set (v) {
      this._value = v;
    },
  },

  value: {
    get () {
      return this._value;
    },
    set (v) {
      this._value = v;
    },
  },
});
//////////////////////////////////////////////////////
// Static methods.
//////////////////////////////////////////////////////

var pool = [];
newInstance = function (number, unit, valueType, original) {
  var obj;
  if (pool.length) {
     obj = pool.pop();
     obj._init(number, unit, valueType, original);
  } else {
    obj = new TuroNumber(number, unit, valueType, original);
  }
  return obj;
};

recycle = function (turoNumber) {
  if (turoNumber) {
    pool.push(turoNumber);
  }
};
//////////////////////////////////////////////////////

export default {
  TuroNumber: TuroNumber,
  newInstance: newInstance,
  recycle: recycle,
};
