
var _ = require("underscore");

var PATTERN = /([^\w\s]?)\b([a-z_]\w*)\b([^\w\s]?)/gi;

var makeObject = (function () {
  function alwaysTrue () {
    return true;
  }

  return function makeObject (list, fn) {
    var result = {};
    if (!_.isFunction(fn)) {
      fn = alwaysTrue;
    }

    _.each(list, function (key) {
      result[key] = fn(key);
    });

    return result;
  };
})();

function PreProcessor (words) {
  if (_.isArray(words)) {
    this.reservedWords = makeObject(words);
  } else if (_.isObject(words)) {
    this.reservedWords = words;
  } else {
    this.reservedWords = {};
  }
}

var spaces = (function () {
  var cache = [];
  return function (i) {
    var j, s = cache[i];
    if (typeof s === "string") {
      return s;
    }
    s = "";
    for (j=0; j<i; j++) {
      s = s + " ";
    }
    cache[i] = s;
    return s;
  };
})();

var buildFunction = function (reservedWords) {
  return function (match, p1, word, p2) {
    if (reservedWords[word]) {
      return match;
    } else {
      return spaces(match.length);
    }
  };
};

PreProcessor.prototype.preprocess = function (inputString) {
  var replacer = buildFunction(this.reservedWords);
  return inputString.replace(PATTERN, replacer);
};

function createPreProcessor(variables, operators, units) {

  var p = new PreProcessor();

  p.rebuild = function () {
    this.reservedWords = makeObject(_.flatten([
        // TODO get this from the parser.
        ["unit", "per", "test", "const", "include"],
        operators.getInfixOperatorNames(),
        variables.getVariableNames(),
        units.getUnitNames()
      ]));
    return this;
  };

  return p.rebuild();

}

module.exports = {
  PreProcessor: PreProcessor,
  createEmpty: function (reservedWords) {
    return new this.PreProcessor(reservedWords);
  },
  createWithContext: createPreProcessor
};