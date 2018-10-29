import * as builtIn from 'turo-documents';
import { CompositeStorage, BundleDocumentLoader } from '../lib/abstract-storage';

import importing from './fixtures/importing.turo';
import fromDisk from './fixtures/loaded-from-disk.turo';
import simpleSample from './fixtures/simple-file-on-disk.turo'

const fixtures = {
  'importing': importing,
  'loaded-from-disk': fromDisk,
  'simple-file-on-disk': simpleSample,
};

export default function createStorage (...implicitImports) {
  return new CompositeStorage([
    new BundleDocumentLoader(builtIn),
    new BundleDocumentLoader(fixtures, implicitImports),
  ]);
};

