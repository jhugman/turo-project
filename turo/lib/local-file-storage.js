import {extend} from 'underscore';
import * as files from 'turo-documents';
import { AbstractStorage } from './abstract-storage';

class LocalFileStorage extends AbstractStorage {
  constructor() {
    super();
  }
 
  loadJSON(slug) {
    const id = slug;
    const text = files[id];
    if (text) {
      return Promise.resolve({ id, title: slug, document: text });  
    } else {
      return Promise.reject('LocalFileStorage NO_DOCUMENT ' + slug);
    }
  }
}

export default LocalFileStorage;
