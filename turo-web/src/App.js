import React, { Component } from 'react';
import logo from './logo.svg';
import { EditorState, DefaultDraftBlockRenderMap } from 'draft-js';
import Immutable from 'immutable';
import './App.css';

import turoApp from 'turo-model';
import Editor from 'draft-js-plugins-editor';
// import Turo from 'turo';

// const model = turoApp.calculator.model;
// console.log(Turo)

const text = `1 + 321`;
const model = turoApp.calculator.model;
// console.log(model.putStatement(text));

// const t = new turo.Turo();
// t.resetScope();
// 
// const st = ['x = 1', 'x + 2'];
// const doc = t.parse(st.join('\n') + '\n', 'EditorText');
// 
// console.log(doc)

class Statement extends Component {
  render() {
    console.log('hey tis a custom block')
    console.log(this.props.children.props.block.getText());

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

class App extends Component {
  state = {
    editorState: EditorState.createEmpty()
  };

  onChange = (editorState) => {
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
