import React, { Component } from 'react';
import { render } from 'react-dom';
import 'draft-js/dist/Draft.css';
import Editor from './Editor';
import { ContentState, EditorState, EditorBlock } from 'draft-js';
import basic from './basic.turo'


class App extends Component {
  editor = null

  constructor(props) {
    super(props)

    window.onhashchange = (ev) => {
      this.setFromHash()
    }

    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText(decodeURIComponent(window.location.hash.substr(1))))
    }
  }


  componentDidMount() {
    if (window.location.hash.substr(1).trim().length === 0) {
      window.location.hash = encodeURIComponent(basic)
    } else {
      this.setFromHash()
    }
  }

  onChange = editorState => {
    this.setState({ editorState })
  }

  setFromHash = () => {
    console.log(this.editor)
    this.onChange(
      EditorState.push(
        this.state.editorState,
        ContentState.createFromText(decodeURIComponent(window.location.hash.substr(1)))
      )
    )

    setTimeout(() => {
      document.querySelector('[contenteditable=true]').focus()
    }, 10)
  }

  render() {
    return <Editor
      ref={(editor) => { this.editor = editor }}
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
