import React, { Component } from 'react';
import logo from './logo.svg';
import { EditorState } from 'draft-js';
import './App.css';

import turoApp from '../../model/lib/turo';
import Editor from 'draft-js-plugins-editor';

// const t = new turo.Turo();
// t.resetScope();
// 
// const st = ['x = 1', 'x + 2'];
// const doc = t.parse(st.join('\n') + '\n', 'EditorText');
// 
// console.log(doc)

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
          onChange={this.onChange}
        />
      </div>
    );
  }
}

export default App;
