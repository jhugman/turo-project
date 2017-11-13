import _ from 'lodash';

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
    
    this.resolveLocation(id, undefined, function (location, layer) {
      console.log(id + ' => ' + location);
      layer.loadString(location, function (err, string) {
        evaluator(
          id, 
          string, 
          function (err, doc) {
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
