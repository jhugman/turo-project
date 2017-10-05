var _ = require("underscore");

var parser = require("./parser"),
    evaluator = require("./evaluator"),
    Units = require("./units-table").UnitsTable,
    Variables = require("./variables-symbol-table").Context,
    operatorsTable = require("./operators-symbol-table"),
    output = require("./to-source"),
    AST = require("./ast"),
    turoNumber = require('./turo-number'),
    lang = require('./language-model');

var EditableDocument = require('./editable-document'),
    Storage = require('./local-file-storage');

EditableDocument.storage = new Storage();

require("./precision-hacks");
var MAX_SF = 14;

var DEFAULT_PREFS = {
  unitScheme: undefined,
  useUnitRefactor: true,
  simpleUnits: true,
  precisionType: undefined, // sf or dp
  precisionDigits: 4,
  formatComma: undefined,
  formatDot: "."
};

function Result (parent, ast, result) {
  this.turo = parent.turo || parent; // we may pass in a turo there is no parent result
  this.ast = ast;
  if (ast) {
    this.id = ast.id;
  }

  this.result = result;
  if (result !== undefined) {
    this._createValueNode(result, ast.unit, 'number');
  }
}

_.extend(Result.prototype, {

  toSource: function () {
    // TODO remove the space. It requires work in to-source, and lots of tests.
    return output.toString(this.ast, " ");
  },
  toString: function (prefs) {
    this._calculateValue(prefs);
    // TODO remove the space. It requires work in to-source, and lots of tests.
    return output.toString(this, " ");
  },
  expression: function () {
    if (this.ast.identifier && this.ast.ast) {
      return this.ast.ast;
    }
    return this.ast;
  },
  expressionToString: function (literals, prefs) {
    if (!this.ast) {
      return this.parsedLine;
    }
    return output.toString(this.expression(), literals, prefs);
  },
  expressionErrors: function () {
    this._calculateValue();
    return this.parseError || this.ast.errors;
  },
  identifier: function () {
    if (!this._identifier && this.ast) {
      return this.ast.identifier;
    } else {
      return this._identifier;
    }
  },
  identifierToString: function () {
    var id = this.identifier();
    return id ? id : "";
  },
  identifierErrors: function () {
    return this._identifierErrors;
  },
  value: function () {
    this._calculateValue();
    return this._valueNode;
  },
  valueToString: function () {
    this._calculateValue();
    return output.toString(this._valueNode, " ");
  },

  _calculateValue: function (prefs) {
    var self = this, 
        valueNode = this._valueNode,
        result, unit, valueType;

    if (valueNode && !prefs) {
      return valueNode;
    }

    var defaultPrefs = self.turo.prefs();
    function fromPrefs (key) {
      var value;
      if (prefs) {
        value = prefs[key];
        if (value !== undefined) {
          return value;  
        }
      }
      return defaultPrefs[key];
    }

    function prepare (turoValue) {
      if (prefs) {
        prefs = _.defaults(prefs, self.turo.prefs());
      } else {
        prefs = self.turo.prefs();
      }

      var node, result, unit;
      unit = turoValue.unit;
      
      if (unit && prefs.useUnitRefactor) {
        node = turoValue.unit.refactoredNode(
          turoValue.number, 
          fromPrefs('unitScheme'), 
          fromPrefs('simpleUnits')
        );
        turoValue = turoNumber.newInstance(node.value, node.unit, turoValue.valueType);
      }

      // TODO _treatOutputNumber should be more about discovering characteristics about the number which 
      // will help display. It should not be concerned with creating a single literal string.
      // e.g. integer, mantissa, exponent. it should also be notated with accuracy (from prefs).
      turoValue.setPrecision(fromPrefs('precisionDigits'), fromPrefs('precisionType'));

      return turoValue;
    }

    var turoValue;
    if (!valueNode && !this.parseError) {
      turoValue = this.turo.evaluateNode(this.ast);

      if (turoValue) {
        this._valueNode = this._createValueNode(turoValue);
        // Write Once to this.result.
        this.result = turoValue;
      }
    }

    // if valueNode is new, or we wish to re-render with new prefs.
    if (this._valueNode && this._valueNode.turoNumber && (!valueNode || prefs)) {
      this._valueNode.turoNumber = prepare(this._valueNode.turoNumber);
    }
  },

  _createValueNode: function (numString, unit, valueType) {
    return AST.valueNode(numString, unit, valueType);
  },

  accept: function (visitor) {
    return AST.acceptVisitor(this, visitor, visitor.visitResultObject, arguments);
  },

});
//////////////////////////////////////////////////////////////////////////

function Turo (prefs) {
  // NOP
  this.prefs(prefs || {});
  this.reset();
}

Object.defineProperties(Turo.prototype, {
  scope: {
    get: function () {
      return this.parser.parseContext.scope;
    },
    set: function (scope) {
      this.parser.parseContext.scope = scope;
    }
  },

  rootScope: {
    get: function () {
      if (!this._rootScope) {
        this._rootScope = lang.newScope();
      }
      return this._rootScope;
    },
    set: function (scope) {
      this._rootScope = scope;
    }
  },
});

Object.defineProperties(Result.prototype, {
  resultValueNode: {
    get: function () {
      if (!this._valueNode) {
        this._calculateValue();
      }
      return this._valueNode;
    },

    set: function (node) {
      this._valueNode = node;
    }
  }
});
////////////////////////////////////////////////////////////////////////////
_.extend(Turo.prototype, {

  resetScope: function () {
    this.scope = this.rootScope.fresh();
  },

  markRootScope: function () {
    this.rootScope = this.scope.newScope();
    this.resetScope();
  },

  reset: function () {
    this.variables = new Variables();
    this.units = new Units();
    this.operators = operatorsTable.createDefaultOperators(this._prefs);
    this.parser = parser;
    this.scope = lang.newScope();
    this.parser.turo = this;
    delete this._scopesInMemory;
    var wordCleaners = require("./preprocessor-word-cleaner");
    this.wordCleaner = wordCleaners.createWithContext(this.variables, this.operators, this.units);
    this.parenBalancer = require("./preprocessor-paren-balancer").createEmpty();
  },

  prefs: function (prefs) {
    if (!prefs) {
      return this._prefs;
    }
    this._prefs = _.defaults(prefs, DEFAULT_PREFS);
    return this._prefs;
  },

  include: function include (turoFilename) {
    var doc = this.theDocument;
    if (!doc) {
      this.theDocument = doc = EditableDocument.create('doc');
    }

    doc.import(turoFilename);

    this.scope = doc.scope;
    this.units = doc.units;
  },

  _cleanWords: function (string) {
    var self = this,
        re, applied = false,
        expressions = [
                      /^(\s*\w+\s*:?=)(.*)$/mg,
                      /^(\s*const\s+\w+\s*:?=)(.*)$/mg,
                      /^(\s*unit\s*[-\d\.]*\s*\w+\s*:.*)$/mg,
                      /^(\s*test\s+"[^"]*")(.*)$/mg,
                      /^(\s*include\s+"[^"]*")(.*)$/mg
                    ],

        cleaner = function (match, prefix, suffix) {
            applied = true;
            if (typeof suffix === 'string') {
              suffix = self.wordCleaner.preprocess(suffix);
              return prefix + suffix;
            } else {
              return prefix;
            }
          },
          i, max = expressions.length;

    for (i=0; i < max; i++) {
      re = expressions[i];
      string = string.replace(re, cleaner);
      if (applied) {
        break;
      }
    }
    if (!applied) {
      string = self.wordCleaner.preprocess(string);
    }
    return string;
  },

  cleanString: function (string) {
    if (this.lenientParser) {
      string = this._cleanWords(string);
    }

    return this.parenBalancer.preprocess(string);
  },

  parse: function (string, parseRule) {
    return parser.parse(string, parseRule || "PaddedStatement");
  },

  evaluateNode: function (node) {
    return evaluator.evaluate(node, this);
  },

  evaluate: function (string, parseRule, id)  {
    string = string || '';
    var originalInput = string, result;
    
    if (!parseRule) {
      string = this.cleanString(string);
    }
    parser.turo = this;
    parser.inputLength = originalInput.length;
    
    try {
      var ast = this.parse(string, parseRule);

      ast.id = id;
      ast.parsedLine = string;
      ast.lineLiteral = originalInput;

      if (this.lenientParser) {
        this.wordCleaner.rebuild();
      }
      result = this.newResult(ast);
    } catch (e) {
      result = this.newResult();
      result.parseError = e;
    }

    result.id = id;
    result.addedParens = (string.length - originalInput.length);
    result.parsedLine = string;
    return result;
  },

  newResult: function (ast) {
    return new Result(this, ast);
  },

  setWriter: function (writer) {
    this.writer = writer;
  },
});

// Not sure where to put this, tbh.

var EditorActions = require('./editor-actions');
require('./actions/document-input');
require('./actions/suggestions');

module.exports = _.extend(new Turo(), {
  Turo: Turo,
  EditableDocument: EditableDocument,
  EditorActions: EditorActions,
  storage: {
    LocalFiles: Storage,
  },
  turoNumber: turoNumber,
  Error: AST.Error,
  toSource: output,
  ast: AST,
});
