import _ from 'underscore';
import theParser from './grammar';
import { Scope } from '../symbols';

import { defaultOperators } from '../operators';
import parserPrefs from './parserPrefs';

// prefs should be accessible from outside of the parser, e.g. someplace like turo.js

function TuroParser (scope = Scope.newScope('rootScope', undefined, defaultOperators), { prefs = parserPrefs } = {}) {
  this.parseContext = {
    scope,
  };
  this.prefs = prefs;
}

theParser._parse = theParser.parse;
TuroParser.prototype = theParser;

_.extend(TuroParser.prototype, {
  parse: function (node, startRule = "PaddedStatement") {
    const options = startRule ? { startRule } : {};
    return this._parse(node, options);
  },
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

export default TuroParser;
