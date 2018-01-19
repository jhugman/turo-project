import {extend} from 'underscore';
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
    callback(location, this);
    return location;
  },

  loadString(location, callback) {
    if (!location) {
      callback('NO_DOCUMENT');
    }
    callback(null, files[location]);
  },
});

export default LocalFileStorage;
