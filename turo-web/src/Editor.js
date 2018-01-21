import React, { Component, PureComponent } from 'react';
import { CompositeDecorator, Modifier, Editor, CharacterMetadata, ContentState, ContentBlock, genKey, EditorState, DefaultDraftBlockRenderMap } from 'draft-js';
import Immutable from 'immutable';
import get from 'lodash/get';
import { UPDATE_STATEMENT } from './constants';
import Results from './Results';
import exampleDoc from './basic';
import debounce from 'lodash/debounce';
import * as actions from './actions';
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux';

class Statement extends Component {
  render() {
    const id = this.props.children.key;
    return (
      <div className='statement'>
        <div className='statement__content'>
          {/* here, this.props.children contains a <section> container, as that was the matching element */}
          {this.props.children}
        </div>
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
  autosaveDocument = debounce((doc) => {
    const contentState = doc.editorState.getCurrentContent();

    // check if cached contentState is the same, don't fire autosave if it is
    if (
      this.cachedTitle !== doc.title ||
      Immutable.is(contentState, this.cachedContent) === false
    ) {
      this.cachedTitle = doc.title;
      this.cachedContent = contentState;
      return this.props.autosaveDocument(doc);
    }
  }, 500);

  keyBindingFn = event => {
    console.log('keyBindingFn')
  }

  onChange = (editorState) => {
    const { id, title } = this.props;

    this.props.updateEditorState(editorState);

    this.autosaveDocument({
      id,
      title,
      editorState
    });
  };

  handlePastedText = (text, html, editorState) => {
    console.log('handlePastedText')
  }

  handleKeyCommand = command => {
    console.log('handleKeyCommand')
    return 'not-handled';
  }

  onChangeTitle = ({ target: { value: title } }) => {
    this.props.updateDocument({ title });

    const { id, editorState } = this.props;

    this.autosaveDocument({
      id,
      title,
      editorState
    });
  }

  componentWillMount() {
    if (!this.props.match.params.id) {
      this.props.createDocument({
        title: this.props.title,
        document: ''
      });
    } else {
      this.props.fetchDocument(this.props.match.params.id);
    }
  }

  render() {
    if (!this.props.id) {
      return <div className='loading'>Loading ...</div>
    } else if (this.props.id && !this.props.match.params.id) {
      return <Redirect to={{ pathname: `/${this.props.id}` }} />
    } else {
      return (
        <div className="document">
          <div className="top-bar">
            <input
              type="text"
              placeholder="Document Title"
              value={this.props.title}
              onChange={this.onChangeTitle}
            />
            <figure className="logo">
              <img src="logo.png" />
            </figure>

          </div>

          <div className='editor'>
            <div className='statements'>
              <Editor
                placeholder="... e.g: 1 + 2"
                handleKeyCommand={this.handleKeyCommand}
                editorState={this.props.editorState}
                blockRenderMap={blockRenderMap}
                onChange={this.onChange}
              />
            </div>
            <Results statements={this.props.turoDoc.statements} />
          </div>
        </div>
      );
    }
  }
}

const mapStateToProps = ({ id, title, turoDoc, editorState }) => ({
  id, title, turoDoc, editorState
});

export default connect(mapStateToProps, actions)(App);
