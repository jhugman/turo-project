import React, { Component } from 'react';
import Editor from 'turo-react';
import { EditorState, ContentState } from 'draft-js'
import 'turo-react/dist/index.css';
import 'draft-js/dist/Draft.css';
import './App.css';
import debounce from 'lodash/debounce';


class App extends Component {
  constructor(props) {
    super(props)

    const { location: { pathname }} = props
    const fromUrl = decodeURIComponent(pathname.substr(1))

    this.state = {
      editorState: EditorState.createWithContent(ContentState.createFromText(fromUrl))
    }
  }

  updateUrl = debounce(() => {
    const { history } = this.props
    const { editorState } = this.state
    const text = editorState.getCurrentContent().getPlainText()
    history.push(`/${encodeURIComponent(text)}`)
  }, 500)

  onChange = editorState => {
    this.updateUrl()
    this.setState({ editorState })
  }

  render() {
    return (
      <Editor placeholder="Cheer up, type something" onChange={this.onChange} editorState={this.state.editorState} />
    );
  }
}

export default App;
