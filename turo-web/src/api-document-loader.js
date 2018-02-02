import { bundleLoader } from '../../turo/lib/storage/app-bundle-storage';
import { CompositeStorage, DocumentLoader } from '../../turo/lib/abstract-storage';

const headers = new Headers({ 'Content-Type': "application/json" });

const addImplicitImports = (promise) => {
  return promise.then(json => {
    json.implicitImports = ['app'];
    return json;  
  });
};

class APIDocumentLoader extends DocumentLoader {
  constructor() {
    super();
  }

  loadJSON(slug) {
    if (!slug) {
      return this.fetchIDJSON();
    }
    return fetch(`/api/${slug}`, { method: 'GET', headers })
      .then(res => addImplicitImports(res.json()));
  }

  fetchIDJSON() {
    const body = { title: '', document: '' };
    return fetch('/api',
        { method: 'POST', body: JSON.stringify(body), headers }
    ).then(res => addImplicitImports(res.json()));
  }

  saveDocument(slug, doc) {
    const obj = {
      document: doc.text,
      title: doc.id,
    };
  }
}

export const apiLoader = new APIDocumentLoader();
export const storage = new CompositeStorage([ 
  bundleLoader,
  apiLoader,
]);