import _ from 'underscore';
import theParser from './grammar';
import lang from './language-model';

function TuroParser (scope) {
  this.parseContext = {
    scope: scope || lang.newScope(),
  };
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

var instance = new TuroParser();
instance.Parser = TuroParser;

export default instance;
