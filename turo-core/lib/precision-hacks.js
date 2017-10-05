(function(){

  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number}      The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }

})();

function precision10 (value) {
  var exponent, largest, smallest;
  value = value.toString().split('e');
  exponent = (value[1] ? +value[1] : 0);

  value = value[0].toString().split('.');

  //value = [ "integer part", "float part"]
  largest = exponent + (+value[0] ? value[0].length : 0);
  smallest = exponent - (value[1] ? value[1].length : 0);
  return [largest, smallest];
}

module.exports = {
  toPrecision10: function (value, desiredPrecision) {
    var precision = precision10(value),
        roundTo;
    if ((precision[0] - precision[1]) < desiredPrecision) {
      // NOP
    } else {
      roundTo = -desiredPrecision + precision[0];
      value = Math.round10(value, roundTo);
      value = parseFloat(value.toString(), 10);
    }

    if (precision[0] > desiredPrecision || -precision[0] > desiredPrecision) {
      return value.toExponential();
    }
    return value + "";
  }
};