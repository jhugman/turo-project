# turo-react
An editor component for turo, built with react

## To test component in isolation

1. `yarn install`
2. `yarn start`

## To build component
For use in apps/other components

1. `yarn build`
2. Now simply import it from other folders in the monorepo as a linked package: `"turo-react": "link:../turo-react"`


## Usage

```js
import Editor from 'turo-react'

<TuroEditor
  onChange={editorState => this.setState({ editorState })}
  editorState={this.state.editorState}
/>
```

`TuroEditor` inherits almost all props from [the draft js editor](https://draftjs.org/docs/api-reference-editor), please refer 
