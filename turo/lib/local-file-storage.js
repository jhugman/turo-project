import extend from 'lodash/extend';
import * as files from 'turo-documents';
import AbstractStorage from './abstract-storage';

function LocalFileStorage (basePath) {
  this.baseLocation = basePath;
  AbstractStorage.call(this);
}

LocalFileStorage.prototype = new AbstractStorage();

extend(LocalFileStorage.prototype, {
  saveDocument(doc, opts) {
    //
  },

  resolveLocation(id, baseLocation, callback) {
    var location = files[id] ? id : null
    console.log('resolve location', location);
    callback(location, this);
    return location;
  },

  loadString(location, callback) {
    console.log('loadstring', location, files[location]);
    if (!location) {
      callback('NO_DOCUMENT');
    }
    callback(files[location]);
  },
});

export default LocalFileStorage;
