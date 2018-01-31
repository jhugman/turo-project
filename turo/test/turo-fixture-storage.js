import {extend} from 'underscore';
import * as files from 'turo-documents';
import AbstractStorage from '../lib/abstract-storage';
import path from 'path';

import importing from './fixtures/importing.turo';
import fromDisk from './fixtures/loaded-from-disk.turo';

const fixtures = {
  'importing': importing,
  'loaded-from-disk': fromDisk,
};

class TestFixtureFileStorage extends AbstractStorage {
  constructor () {
    super();
  }

  saveDocument (doc, opts) {
    //
  }

  loadString (slug) {
    const id = path.basename(slug);
    const string = files[id] || fixtures[id];
    if (string) {
      return Promise.resolve(string);  
    } else {
      return Promise.reject('NO_DOCUMENT', slug);
    }
  }
}

export default TestFixtureFileStorage;