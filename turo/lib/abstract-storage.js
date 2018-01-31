import _ from 'underscore';
import path from 'path';

/////////////////////////////////////////////////////////////////////////
class AbstractStorage {
  constructor () {
    this._state = {
      isLoading: {},
      documents: {},
    };
    // subclasses should call this constructor
    // with AbstractStorage.call(this) in their own constructors.
  }

  hasDocument (slug) {
    return this.getDocument(slug);
  }

  isLoadingDocument (slug) {
    return this._state.isLoading[slug];
  }

  // func (slug: String, evaluator: (slug, string, cb) -> Void, cb)
  // Should write to cache, for availability elsewhere
  loadDocument (slug, evaluator, callback) {
    var self = this,
        listeners = self._state.isLoading[slug];

    if (listeners) {
      listeners.push(callback);
      return;
    }

    listeners = [callback];
    self._state.isLoading[slug] = listeners;

    this.loadJSON(slug)
      .then(({ id, title, document: string }) => {
        // evaluates doc
        evaluator(
          slug,
          string,
          function (err, doc) {
            // JS is single threaded, so nothing can add to listeners
            delete self._state.isLoading[slug];
            if (err) {
              console.error(`Error loading ${slug}: ${err}`)
              listeners.forEach((cb) => cb(err));
              return;
            }
            doc.location = slug; //{ slug: slug, storage: this };
            self._state.documents[slug] = doc;
            listeners.forEach((cb) => cb(null, doc));
          }
        );
      })
      .catch((err) => {
        delete self._state.isLoading[slug];
        listeners.forEach((cb) => cb(err));
      });
    // load string,
    // create editable document with evaluate string
    // calls back with model.
  }

  getDocument (slug) {
    return this._state.documents[slug];
  }

  loadJSON (location) {
    return Promise.reject('Unimplemented method loadJSON');
  }

  saveDocument (doc) {
    return Promise.reject('Unimplemented method saveDocument');
  }
}

class CompositeStorage extends AbstractStorage {
  constructor (jsonStores) {
    super();
    this.jsonStores = jsonStores;
  }

  loadJSON (slug) {
    const generator = function* (stores) {
      for (let store of stores) {
        yield store;
      }
    }

    const g = generator(this.jsonStores);
    const tryNext = () => {
      const next = g.next();

      if (next.done) {
        return Promise.reject('NO DOCUMENT IN ANY LOADER');
      }
      const store = next.value;

      return store.loadJSON(slug)
        .then(payload => {
          debugger;
          return payload;
        })
        .catch(e => tryNext());
    };

    return tryNext();
  }
}

class DocumentLoader {
  loadJSON (slug) {
    return Promise.reject('Unimplemented method loadJSON');
  }

  saveDocument (doc) {
    return Promise.reject('Unimplemented method saveDocument');
  }
}

class BundleDocumentLoader extends DocumentLoader {
  constructor (files) {
    super();
    this.files = files;
  }

  loadJSON (slug) {
    const id = path.basename(slug);
    const string = this.files[id];
    if (string) {
      return Promise.resolve({ id: slug, title: slug, document: string });  
    } else {
      return Promise.reject('BundleDocumentLoader: NO_DOCUMENT ' + slug);
    }
  }
}

export { AbstractStorage, CompositeStorage, DocumentLoader, BundleDocumentLoader };
