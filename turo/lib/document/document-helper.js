import _ from 'lodash';
import async from 'async';

//////////////////////////////////////////////////////////////////////////
var visitor = {
  visitImportStatement: function (node, context) {
    var documentId = node.ast;
    context.toImport[documentId] = true;
  },

  visitVariableDeclaration: function (node, context) {

  },

  visitUnitDefinition: function (node, context) {

  },
};

//////////////////////////////////////////////////////////////////////////
function DocumentHelper (storage) {
  this._storage = storage;
}

_.extend(DocumentHelper.prototype, {

  evaluate: function (rootNode, callback, context) {
    context.toImport = {};
    rootNode.accept(visitor, context);

    var toImport = _.keys(context.toImport),
        evaluator = context.documentEvaluator,
        doc = context.document;

    return this._doLoading(toImport, doc, doc.scope, evaluator, callback);
  },

  import: function (toImport, scope, evaluator, callback) {
    return this._doLoading(toImport, scope, scope, evaluator, callback);
  },

  _doLoading: function (toImport, doc, scope, evaluator, callback) {
    var storage = this._storage;

    var toLoad = _.filter(toImport,
      function (id) {
        return !storage.hasDocument(id);
      }
    );

    if (_.isEmpty(toLoad)) {
      // We can evaluate immediately.
      this._finishLoading(toImport, scope);
      callback(null, doc);
      return true;
    }

    async.map(
      toLoad, 
      function (documentId, cb) {
        storage.loadDocument(documentId, evaluator, cb);
      },
      function (err, results) {
        this._finishLoading(toImport, scope);
        callback(null, doc);
      }.bind(this)
    );

    return false;
  },

  _finishLoading: function (toImport, currentScope) {
    var storage = this._storage;
    _.each(toImport, function (id) {
      var doc = storage.getDocument(id);
      // Note: this is where the document is imported 
      // into the current scope. It is the only place 
      // where we should call this method.
      currentScope.addInclude(id, doc.scope);
    });
  },

});

export default DocumentHelper;