import _ from 'lodash';

var PATTERN = /[()]/g;

function PreProcessor () {
  // NOP
}

PreProcessor.prototype.preprocess = function (inputString) {

  var stack = [];

  var isOpener = function (match) {
    return match === "(";
  };

  var closer = function (closer) {
    return ")";
  };

  var replacer = function (match) {

    if (isOpener(match)) {
      stack.push(closer(match));
    } else if (stack.length > 0) {
      if (match === _.last(stack)) {
        stack.pop();
      } else {
        // what?
      }
    } else {
      return "";
    }
    return match;
  };
  return inputString.replace(PATTERN, replacer) + stack.join("");
};

export default {
  PreProcessor: PreProcessor,
  createEmpty: function () {
    return new this.PreProcessor();
  }
};