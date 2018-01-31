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

  loadString(slug) {
    const id = slug;
    const string = files[id];
    if (string) {
      return Promise.resolve(string);  
    } else {
      return Promise.reject('NO_DOCUMENT', slug);
    }
  },
});

export default LocalFileStorage;
