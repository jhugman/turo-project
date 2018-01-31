import _ from 'underscore';

/////////////////////////////////////////////////////////////////////////
function AbstractStorage () {
  this._state = {
    isLoading: {},
    documents: {},
  };
  // subclasses should call this constructor
  // with AbstractStorage.call(this) in their own constructors.
}

_.extend(AbstractStorage.prototype, {
  hasDocument: function (slug) {
    return this.getDocument(slug);
  },

  isLoadingDocument(slug) {
    return this._state.isLoading[slug];
  },

  // func (slug: String, evaluator: (slug, string, cb) -> Void, cb)
  // Should write to cache, for availability elsewhere
  loadDocument(slug, evaluator, callback) {
    var self = this,
        listeners = self._state.isLoading[slug];

    if (listeners) {
      listeners.push(callback);
      return;
    }

    listeners = [callback];
    self._state.isLoading[slug] = listeners;

    this.loadString(slug)
      .then((string) => {
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
        listeners.forEach((cb) => cb(err));
      });
    // load string,
    // create editable document with evaluate string
    // calls back with model.
  },

  loadString: function (location, callback) {
    return Promise.reject('Unimplemented method loadString');
  },

  getDocument: function (slug) {
    return this._state.documents[slug];
  },
});

export default AbstractStorage;
