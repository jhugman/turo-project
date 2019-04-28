import _ from 'underscore';
import theParser from './grammar';
import { Scope } from '../symbols';

import { createDefaultOperators } from '../operators';

const DEFAULT_PREFS = {
  unitScheme: undefined,
  useUnitRefactor: true,
  simpleUnits: true,
  precisionType: undefined, // sf or dp
  precisionDigits: 4,
  formatComma: undefined,
  formatDot: "."
};

// prefs should be accessible from outside of the parser, e.g. someplace like turo.js

function TuroParser (scope, prefs = _.defaults({}, DEFAULT_PREFS)) {
  this.parseContext = {
    scope: scope || Scope.newScope(),
  };

  this.operators = createDefaultOperators(prefs);
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
