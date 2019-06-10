import { ASTVisitor } from '../visitors';
import _ from 'underscore';
import async from 'async';

//////////////////////////////////////////////////////////////////////////

class ImportFinder extends ASTVisitor {
  visitImportStatement (node, context) {
    const documentId = node.filename;
    context.toImport.set(documentId, true);
  }
}

const visitor = new ImportFinder();

//////////////////////////////////////////////////////////////////////////
export default class DocumentImportHelper {
  constructor (storage) {
    this._storage = storage;
  }

  evaluate(rootNode, callback, context) {
    context.toImport = new Map();
    rootNode.accept(visitor, context);

    var toImport = Array.from(context.toImport.keys()),
        documentCreator = context.documentEvaluator,
        doc = context.document;

    return this._doLoading(toImport, doc, doc.scope, documentCreator, callback);
  }

  import(toImport, scope, documentCreator, callback) {
    return this._doLoading(toImport, scope, scope, documentCreator, callback);
  }

  _doLoading(toImport, doc, scope, documentCreator, callback) {
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
      (documentId, cb) => storage.loadDocument(documentId, documentCreator, cb),
      (err, results) => {
        if (err) {
          callback(err, doc);
          return;
        }
        this._finishLoading(toImport, scope);
        callback(null, doc);
      }
    );

    return false;
  }

  _finishLoading(toImport, currentScope) {
    var storage = this._storage;
    toImport.forEach(id => {
      var doc = storage.getDocument(id);
      // Note: this is where the document is imported 
      // into the current scope. It is the only place 
      // where we should call this method.
      currentScope.addImport(id, doc.scope);
    });
  }
}