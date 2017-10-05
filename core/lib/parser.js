'use strict';
var _ = require('underscore'),
    theParser = require('./parser-generated.js'),
    lang = require('./language-model');

function TuroParser (scope) {
  this.parseContext = {
    scope: scope,
  };
}

TuroParser.prototype = theParser;

_.extend(TuroParser.prototype, {
  reset: function () {
    this.parseContext.scope = this.parseContext.scope.fresh();
  }
});

Object.defineProperties(TuroParser.prototype, {
  scope: {
    set: function (scope) {
      this.parseContext.scope = scope;
    },
    get: function () {
      return this.parseContext.scope;
    }
  }
});

var instance = new TuroParser(lang.newScope());
instance.Parser = TuroParser;

module.exports = instance;
