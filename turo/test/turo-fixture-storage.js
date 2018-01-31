import * as builtIn from 'turo-documents';
import { CompositeStorage, BundleDocumentLoader } from '../lib/abstract-storage';

import importing from './fixtures/importing.turo';
import fromDisk from './fixtures/loaded-from-disk.turo';

const fixtures = {
  'importing': importing,
  'loaded-from-disk': fromDisk,
};

export default new CompositeStorage([
  new BundleDocumentLoader(builtIn),
  new BundleDocumentLoader(fixtures),
]);
