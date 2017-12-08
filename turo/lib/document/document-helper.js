import _ from 'lodash';
import async from 'async';

//////////////////////////////////////////////////////////////////////////
var visitor = {
  visitImportStatement(node, context) {
    var documentId = node.ast;
    context.toImport[documentId] = true;
  },
};

//////////////////////////////////////////////////////////////////////////
function DocumentHelper (storage) {
  this._storage = storage;
}

_.extend(DocumentHelper.prototype, {

  evaluate(rootNode, callback, context) {
    context.toImport = {};
    rootNode.accept(visitor, context);

    var toImport = _.keys(context.toImport),
        evaluator = context.documentEvaluator,
        doc = context.document;

    return this._doLoading(toImport, doc, doc.scope, evaluator, callback);
  },

  import(toImport, scope, evaluator, callback) {
    return this._doLoading(toImport, scope, scope, evaluator, callback);
  },

  _doLoading(toImport, doc, scope, evaluator, callback) {
    var storage = this._storage;

    var toLoad = _.filter(
      toImport,
      (id) => !storage.hasDocument(id)
    );

    if (_.isEmpty(toLoad)) {
      // We can evaluate immediately.
      this._finishLoading(toImport, scope);
      callback(null, doc);
      return true;
    }

    async.map(
      toLoad,
      (documentId, cb) => storage.loadDocument(documentId, evaluator, cb),
      (err, results) => {
        this._finishLoading(toImport, scope);
        callback(null, doc);
      }
    );

    return false;
  },

  _finishLoading(toImport, currentScope) {
    var storage = this._storage;
    toImport.forEach(id => {
      var doc = storage.getDocument(id);
      // Note: this is where the document is imported 
      // into the current scope. It is the only place 
      // where we should call this method.
      currentScope.addInclude(id, doc.scope);
    });
  },

});

export default DocumentHelper;