import * as files from 'turo-documents';
import { CompositeStorage, BundleDocumentLoader } from '../storage/abstract-storage';

export const bundleLoader = new BundleDocumentLoader(files);
export const storage = new CompositeStorage([ bundleLoader ]);