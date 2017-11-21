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
  autosaveDocument = debounce((doc) => this.props.autosaveDocument(doc), 500);

  onChange = (editorState) => {
    // const contentState = editorState.getCurrentContent();
    // const selection = editorState.getSelection();
    // const blockMap = contentState.getBlockMap();
    // const blockKey = selection.getFocusKey();
    // const currentBlockText = contentState.getBlockForKey(blockKey).getText();
    // const index = blockMap.keySeq().findIndex(key => key === blockKey)
    // const statement = get(this.doc.evaluateStatement(blockKey, currentBlockText), 0);

    // if (statement) this.props.updateStatement(statement);

    // const newEditorState = EditorState.push(
    //   editorState,
    //   Modifier.setBlockData(
    //     contentState,
    //     selection,
    //     Immutable.Map({ tokens: statement ? statement.tokens : [] })
    //   )
    // );

    // this.setState({ editorState: newEditorState })

    const { id, title } = this.props;

    console.log('hey there auto save', this.props);

    this.autosaveDocument({
      id,
      title,
      editorState
    });

    this.props.updateEditorState(editorState);
  };

  handlePastedText = (text, html, editorState) => {
  }

  handleKeyCommand = command => {
    return 'not-handled';
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
    console.log('yo', this.props);
    if (!this.props.id) {
      console.log('render loading');
      return <div className='loading'>Loading ...</div>
    } else if (this.props.id && !this.props.match.params.id) {
      console.log('render redirect');
      return <Redirect to={{ pathname: `/${this.props.id}` }} />
    } else {
      return (
        <div className='editor'>
          <div className='statements'>
            <Editor
              handleKeyCommand={this.handleKeyCommand}
              editorState={this.props.editorState}
              blockRenderMap={blockRenderMap}
              onChange={this.onChange}
            />
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
