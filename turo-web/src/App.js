import React, { Component } from 'react';
import logo from './logo.svg';
import { EditorState, DefaultDraftBlockRenderMap } from 'draft-js';
import Immutable from 'immutable';
import './App.css';

// import turoApp from 'turo-model';
import Editor from 'draft-js-plugins-editor';
import turo from 'turo';
// import Turo from 'turo';

const t = new turo.Turo();
t.resetScope();
t.include('fundamental');
// const { EditableDocument: doc } = turo;

const text = `100m`;

const res = t.evaluate(text, 'EditorText');
console.log('res', res);
console.log('value', res.value())

class Statement extends Component {
  render() {
    // console.log('hey tis a custom block')
    // console.log(this.props.children.props.block.getText());

    return (
      <div className='MyCustomBlock'>
        {/* here, this.props.children contains a <section> container, as that was the matching element */}
        {this.props.children}
      </div>
    );
  }
}

const blockRenderMap = DefaultDraftBlockRenderMap.merge(
  Immutable.Map({
    'unstyled': {
      element: Statement
    }
  })
);

// const model = turoApp.calculator.model;

class App extends Component {
  state = {
    editorState: EditorState.createEmpty()
  };

  onChange = (editorState) => {
    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();
    const blockKey = editorState.getSelection().getFocusKey();
    const currentBlockText = contentState.getBlockForKey(blockKey).getText();
    const index = blockMap.keySeq().findIndex(key => key === blockKey)
    // const stat = model.putStatement(currentBlockText, null, index);

    // console.log('text', currentBlockText);
    // console.log('result', stat);
    this.setState({ editorState })
  };

  render() {
    return (
      <div className="App">
        <Editor
          editorState={this.state.editorState}
          blockRenderMap={blockRenderMap}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

export default App;
