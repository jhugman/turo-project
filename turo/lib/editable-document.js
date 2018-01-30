import DocumentModel from './document/document-model';
import unitsTable from './units-table';
import parser from './parser';
import DocumentHelper from './document/document-helper';
import operatorsSymbolTable from './operators-symbol-table';
import lang from './language-model';
import variablesSymbolTable from './variables-symbol-table';
import { each, extend, isArray } from 'underscore';
import EditorActions from './editor-actions';

const { Parser } = parser;
const { UnitsTable: Units } = unitsTable;
const { defaultOperators } = operatorsSymbolTable;
const { Variables: LegacyVariables } = variablesSymbolTable;

var statics;

///////////////////////////////////////////////////////////////////////////////
function EditableDocument (id) {
  if (!this) {
    return new EditableDocument(id);
  }
  var importScope = lang.newScope(undefined, statics.units),
      scope = importScope.newScope(id);
  this._state = {
    id: id,
    model: new DocumentModel(id),
    importScope: importScope,
    scope: scope,
  };

  var parser = new Parser(scope);
  // Scope rules control the access to units, 
  // so novel units can drop in and out of scope. 
  // However, redefining existing units has undefined 
  // results.
  // This is probably the worst of both worlds,
  // so we may not want to scope units with block scope
  parser.units = scope.units;
  parser.operators = defaultOperators;

  this.parser = parser;

  this.documentHelper = new DocumentHelper(EditableDocument.storage);
}

extend(EditableDocument.prototype, {

  /**
   * Asynchronously imports one or more documents into this document's parent scope.
   * 
   * @param id - a string or list of strings the underlying storage will map to a document
   * @param callback - func (err, doc)
   * @return boolean - true iff the import completed synchronously
   */
  import (id, callback) {
    var toImport = id;
    if (!isArray(id)) {
      toImport = [id];
    }

    if (!callback) {
      callback = statics.noCallback;
    }

    var scope = this._state.importScope;
    return this.documentHelper.import(toImport, scope, statics.createEditableDocument_withCallback, callback);
  },

  _freshScope () {
    return this.scope.fresh();
  },

  /**
   * Evaluates the document.
   *
   * If the document is immediately executable, then do so
   * and call callbackNow().
   *
   * If the document is not ready to be accurately evaluated
   * Ensure it is by loading any resources asynchronously 
   * and then call callbackMaybeLater().
   *
   * While the document is waiting, call callbackNow() with interim 
   * results.
   *
   * @return isReady, if the no asynchronous activity is needed.
   */
  evaluateDocument_withCallback (string, callback, optionalDocumentEvaluator) {
    var scope = this._freshScope();
    this.scope = scope;
    return this._firstParseEval(string, optionalDocumentEvaluator, (err) => {
      if (err) {
        callback(err);
        return false;
      }
      return this._evalDocumentSync(string, callback);
    });
  },

  evaluateDocument (string) {
    const promise = new Promise((resolve, reject) => {
      this.evaluateDocument_withCallback(string, (err, doc) => {
        if (!err) {
          resolve(doc);
        } else {
          reject(err);
        }
      });
    });
    return promise;
  },

  reeevaluateDocument (callback) {
    return this._evalDocumentSync(this.text, callback);
  },

  _firstParseEval (string, optionalDocumentEvaluator, syncEval) {
    var firstParseNode = this.parser.parse(string + '\n', 'DocumentFirstParse');

    var context = {
      string,
      documentEvaluator: optionalDocumentEvaluator || statics.createEditableDocument_withCallback,
      scope: this.scope,
      document: this,
    };

    // If this was all done synchronously, then isReady should 
    // contain this, i.e. the document.
    var isReady;

    this.documentHelper.evaluate(
      firstParseNode,
      (err, doc) => {
        isReady = syncEval(err, doc);
      },
      context
    );
    return isReady;
  },

  _evalDocumentSync (string, callback) {
    var scope = this.scope,
        model = this._state.model;

    // Here's where turo the calculator starts.
    var nodes = this.parser.parse(string + '\n', 'EditorText').lines;

    model.batchUpdate(nodes, scope);

    var statements = model.statementsInWrittenOrder;
    each(statements, s => {
      var node = s.node,
          first = node.statementOffsetFirst,
          last = node.statementOffsetLast;
      s.info.text = string.substring(first, last);
    });

    this._state.text = string;

    if (callback) {
      callback(null, this);
    }

    return this;
  },

  evaluateStatement (id, string, callback) {
    if (!callback) {
      callback = statics.noCallback;
    }
    return this._firstParseEval(string, undefined, (err) => {
      if (err) {
        callback(err);
        return false;
      }
      return this._evalStatementSync(id, string, callback);
    });
  },

  getStatement(id) {
    return this._state.model.getStatement(id);
  },

  _evalStatementSync(id, string, callback) {
    var scope = this.scope,
        // XXX scope should come from the statement/node itself, not document.
        // TODO the parser should be dealing with this.
        model = this._state.model;

    this.parser.scope = scope;
    var nodes = this.parser.parse(string + '\n', 'EditorText').lines;

    var statements = model.interactiveUpdate(id, nodes[0], scope);

    // Now, to keep the document text updated, we add the text to the statement.

    // We cannot rely on 'statements' containing the statement with id=id.
    var s = model.getStatement(id);
    s.info.text = string;

    // We now have a different document, so delete the original text.
    delete this._state.text;

    if (callback) {
      callback(null, statements);
    }

    return statements;
  },

  // events: {
  //   requestLines: ['startLine', 'endLine'],
  //   requestDocument: [],
  //   updateTextLines: ['lines', 'characterOffset', 'lineOffset'],
  //   updateResultLines: ['resultLines']
  // },

  createEditTokenForCursor (offset, line, column) {
    return {
      offset: offset,
      line: line,
      column: column,
    };
  },

  // TODO: wtf is an editToken?
  findStatementForEditToken (editToken) {
    var model = this._state.model;

    if (editToken.id) {
      return model.getStatement(editToken.id);
    }

    // After the first edit, all our line numbers 
    // are screwed.
    if (model.state !== DocumentModel.State.OK) {
      // Re-evaluating is an expensive but easy way of fixing that.
      this.reeevaluateDocument();
    }

    var id = 
      model.findStatementIdByLineCol(editToken.line, editToken.column) ||
      model.findStatementIdByOffset(editToken.offset) ||
      null;

    if (id) {
      return model.getStatement(id);
    }
  },

  setEditPoint (token) {
    // const {column, offset, line} = token;
    this.editToken = token;
    return this;
  },

  getActions () {
    return this._editActions;
  },
});

///////////////////////////////////////////////////////////////////////////////
Object.defineProperties(EditableDocument.prototype, {
  scope: {
    get () {
      return this._state.scope;
    },
    set (newValue) {
      this._state.scope = newValue;
      this.parser.scope = newValue;
    },
  },

  importScope: {
    get () {
      return this._state.importScope;
    },
    set (parentScope) {
      this.scope.parent = parentScope;
      this._state.importScope = parentScope;
    },
  },

  id: {
    get () {
      return this._state.id;
    }
  },

  editToken: {
    get () {
      return this._state.editToken;
    },
    set (token) {
      if (token != undefined) {
        this._editActions = new EditorActions(this, token)
      } else {
        this._editActions = null;
      }
      this._state.editToken = token;
    }
  },
  
  model: {
    get () {
      return this._state.model;
    },
  },

  statements: {
    get () {
      return this.model.statementsInWrittenOrder;
    },
  },

  units: {
    get () {
      return statics.units;
    },
  },

  overwriteExistingDefinitions: {
    set (newValue) {
      this._state.model.overwriteExistingDefinitions = !!newValue;
    },
  },

  lineByLineMode: {
    set (newValue) {
      this.overwriteExistingDefinitions = newValue;
    }
  },

  text: {
    get () {
      var text = this._state.text;
      if (text) {
        return text;
      }

      text = this.model.statementsInWrittenOrder.map((s) => {
        return s.info.text || '';
      }).join('\n');

      return text;
    },
  },
});

///////////////////////////////////////////////////////////////////////////////
statics = {
  createEditableDocument_withCallback (id, string, cb) {
    var theDocument = new EditableDocument(id),
        isReady;

    if (string) {
      isReady = theDocument.evaluateDocument_withCallback(string, cb);
    }
    return theDocument;
  },

  createEditableDocument(id) {
    return new EditableDocument(id);
  },

  loadEditableDocument (documentId, imports, cb) {
    var theDocument = new EditableDocument(documentId);

    function evaluator(id, string, cb) {
      var doc;
      if (documentId === id) {
        doc = theDocument;
      } else {
        doc = new EditableDocument(id);
        doc.importScope = theDocument.importScope.clone();
      }
      doc.evaluateDocument_withCallback(string, cb, evaluator);
    }

    // We do two things and a but here.
    // 1. Load the imports.
    // 2. Load the file we've been asked to get.
    // But: the file we're loading may be importing files that have been written 
    // with the same implicit imports (i.e. user generated files),
    // so they have to have the same imports.
    theDocument.import(
      imports, 
      function thenLoadAndEvaluateDocument () {
        EditableDocument.storage.loadDocument(documentId, evaluator, cb);
      }
    );
    return theDocument;
  },

  // units requires everything 
  // to be in the same scope. For complexity reasons.
  units: new Units(),

  noCallback () {},
};

/**
 * EditableDocument
 * Class methods
 *   class createDocument(id: String)
 *   class loadDocument(url: URL)
 * 
 * Methods
 *   import(string|[string], callback)
 *   evaluateStringDocument(string, callback) -> Bool
 *   evaluateStringStatement(string, callback, callbackInterim) -> Bool
 * 
 * Properties:
 *   id
 *   scope
 *   string
 *   status
 *   model
 */

/*
 * You should probably set this.
 */
EditableDocument.storage = null;
EditableDocument.create = statics.createEditableDocument;
EditableDocument.load = statics.loadEditableDocument;

export default EditableDocument;
