# Using EditableDocument

```javascript
import { TuroDocument } from 'turo';
```
`TuroDocument` is the main API interface to **turo**.

It should look after loading, importing and evaluating a turo document, both in bulk or editing in an interactive environment.

## Creating, Loading and Importing
Documents can import other turo documents. This is how units and constants are defined.
```javascript
// Create an empty document
const doc = TuroDocument.create('slug-name');

// Import a file (this one defines fundamental dimensions and basic metric units)
const documentString = [
    'radius = 2 m', 
    'area = pi * radius^2', 
    'volume = 4/3 pi * radius^3',
    'height = 4 m'
].join('\n');

doc.import('fundamental')
    .then((doc) => doc.evaluateDocument(documentString))
    .then((doc) => {
        for (let s of doc.statements) {
            console.log(s.valueToString());
        }    
    });

// 2 metres
// 12.56637061 m^2
// 33.51032164 m^3
// 4 metres
```

## Editing the document
```javascript
// columns are zero based; zero is before the first letter.
const column = 1;
// lines are one base. Sorry.
const line = 2;

const actions = doc.setEditPoint({ column, line }).getActions();
const statementID = actions.id;

doc.evaluateString(statementID, 'radius = 3 m')
    .then(affectedStatements => {
        for (let s of updatedStatements) {
            console.log(s.valueToString());
        }
        // 3 metres
        // 28.27433388 m^2
        // 113.0973355 m^3
    });

```

## Asynchrony
Everything that could involve a network request returns a promise.
```javascript
const doc = TuroDocument.create('opaque-identifier');
doc.import('app')
    .then(doc => doc.evaluateDocument('import "jhugman/my-units"'))
    .then(doc => renderDoc(doc));
    
// interactive
 doc.evaluateStatement(statementID, 'radius = 3 m')
    .then(updatedStatements => renderDoc(doc));
```

## Autocomplete

```javascript
import '../turo/lib/actions/autocomplete';
const actions = doc.setEditPoint({ column, line }).getActions();
const { tokens } = actions.getSuggestions();

for (let t of tokens) {
    const { literal, match, tokenType } = t;
}
```

## Storage

Turo can load and import turo documents from arbitrary places using `DocumentLoader` objects.

A `bundleLoader` gives you access to documents bundled at build time. (`app`, `metric`, `imperial` etc).

You can define your own `DocumentLoader` object to talk to your API.

```javascript
import { TuroDocument, CompositeStorage, loaders } from 'turo';
const { bundleLoader, DocumentLoader } = loaders;

class StupidDocumentLoader extends DocumentLoader {
    loadJSON (slug) {
        // If we know we can't load this, then reject. Perhaps another loader can do it.
        return Promise.resolve({ 
            id: slug, 
            text: 'x = 2m', 
            title: 'Hello world', 
            // These are the files that we import on behalf of the user.
            impliedImports: [
                'app',
            ], 
        });
    }
}

TuroDocument.storage = new CompositeStorage([
    bundleLoader,
    new StupidDocumentLoader(),
]);
```
