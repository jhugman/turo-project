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

  resolveLocation (id, callback) {
    id = path.basename(id)
    const location = (files[id] || fixtures[id]) ? id : null
    callback(location, this);
  }

  loadString (location, callback) {
    if (!location) {
      callback('NO_DOCUMENT', null);
      return;
    }
    const string = files[location] || fixtures[location];
    if (!string) {
      callback('NULL_DOCUMENT', null);
      return
    }
    callback(null, string);
  }
}

export default TestFixtureFileStorage;