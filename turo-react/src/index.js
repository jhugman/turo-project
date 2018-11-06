import React, { Component } from 'react';
import { render } from 'react-dom';
import 'draft-js/dist/Draft.css';
import Editor from './Editor';
import { ContentState, EditorState, EditorBlock } from 'draft-js';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText('2m + 2m'))
    }
  }

  onChange = editorState => {
    this.setState({ editorState })
  }

  render() {
    return <Editor
      onChange={this.onChange}
      placeholder="Cheer up, type something"
      editorState={this.state.editorState}
    />
  }
}

render(
  <App />,
  document.getElementById('root')
);
