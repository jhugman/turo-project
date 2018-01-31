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
  hasDocument: function (id) {
    return this.getDocument(id);
  },

  isLoadingDocument(id) {
    return this._state.isLoading[id];
  },

  // func (id: String, evaluator: (id, string, cb) -> Void, cb)
  // Should write to cache, for availability elsewhere
  loadDocument(id, evaluator, callback) {
    var self = this,
        listeners = self._state.isLoading[id];

    if (listeners) {
      listeners.push(callback);
      return;
    }

    listeners = [callback];
    self._state.isLoading[id] = listeners;

    this.resolveLocation(id, function (location, layer) {
      // loads doc
      layer.loadString(location, function (err, string) {
        if (err) {
          callback(err, null)
          return
        }
        // evaluates doc
        evaluator(
          id,
          string,
          function (err, doc) {
            if (err) {
              delete self._state.isLoading[id];
              console.error(`Error loading ${id}: ${err}`)
              callback(err);
              return;
            }
            doc.location = location;
            self._state.documents[id] = doc;
            _.each(listeners, function (cb) {
              cb(null, doc);
            });
            delete self._state.isLoading[id];
          }
        );
      });
    });  
    // load string,
    // create editable document with evaluate string
    // calls back with model.
  },

  loadString: function (location, callback) {
    throw new Error('Unimplemented method loadString');
  },

  resolveLocation: function (id, callback) {
    throw new Error('Unimplemented method resolveLocation');
  },

  getDocument: function (id) {
    return this._state.documents[id];
  },
});

export default AbstractStorage;
