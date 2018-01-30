# Using EditableDocument

```javascript
import { EditableDocument, Storage } from 'turo'
```
`EditableDocument` is the main API interface to **turo**.

It should look after loading, importing and evaluating a turo document, both in bulk or editing in an interactive environment.

## Creating, Loading and Importing
```javascript
// specify where you get the files from.
EditableDocument.storage = new Storage();

// Create an empty file
const doc = EditableDocument.create('slug-name');

// Import a file (this one defines fundamental dimensions and basic metric units)
doc.import('fundamental');

const documentString = [
    'radius = 2 m', 
    'area = pi * radius^2', 
    'volume = 4/3 pi * radius^3',
    'height = 4 m'
].join('\n');
doc.evaluateDocument(documentString);

for (let s of doc.statements) {
    console.log(s.valueToString());
}
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

const affectedStatements = doc.evaluateString(statementID, 'radius = 3 m');

for (let s of affectedStatements) {
    console.log(s.valueToString());
}
// 3 metres
// 28.27433388 m^2
// 113.0973355 m^3
```

## Asynchrony
Everything that could involve a network request can also take an optional callback.
```javascript
doc.import('app', (doc) => {
    doc.evaluateDocument('import "jhugman/my-units"', (doc) => {
        renderDoc(doc);
    });
});

// interactive
 doc.evaluateString(statementID, 'radius = 3 m', (affectedStatements) => {
     renderDoc(doc);
 });
```
TODO: make this Promise friendly.

## Autocomplete

```javascript
import '../turo/lib/actions/autocomplete';
const actions = doc.setEditPoint({ column, line }).getActions();
const { tokens } = actions.getSuggestions();

for (let t of tokens) {
    const { literal, match, tokenType } = t;
}
```
