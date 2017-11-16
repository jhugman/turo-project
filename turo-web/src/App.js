import React, { Component, PureComponent } from 'react';
import { CompositeDecorator, Modifier, Editor, CharacterMetadata, ContentState, ContentBlock, genKey, EditorState, DefaultDraftBlockRenderMap } from 'draft-js';
import Immutable from 'immutable';
import get from 'lodash/get';
import { UPDATE_STATEMENT } from './constants';
import Result from './Result';
import exampleDoc from './basic';
import decorator from './decorator';

import './App.css';
import { connect } from 'react-redux';

// import Editor from 'draft-js-plugins-editor';
import { EditableDocument } from 'turo';


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



class Results extends Component {
  render() {
    return (<div className='results'>
      {this.props.doc.statements.map(stat => <Result key={stat.id} id={stat.id} />)}
    </div>);
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.doc = EditableDocument.create(genKey());
    this.doc.import('app');

    this.doc.evaluateDocument(exampleDoc);
    const blockMap = this.doc.statements.map(statement => {
      this.props.onUpdateStatement(statement);

      return new ContentBlock({
        data: Immutable.Map({
          tokens: statement.tokens
        }),
        key: statement.id,
        characterList: Immutable.List().setSize(statement.text.length).map(() => new CharacterMetadata()),
        text: statement.text,
        depth: 0,
      });
    });

    this.state = {
      editorState: EditorState.createWithContent(
        ContentState.createFromBlockArray(blockMap),
        decorator
      ),
    }
  }

  onChange = (editorState) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const blockMap = contentState.getBlockMap();
    const blockKey = selection.getFocusKey();
    const currentBlockText = contentState.getBlockForKey(blockKey).getText();
    const index = blockMap.keySeq().findIndex(key => key === blockKey)
    const statement = get(this.doc.evaluateStatement(blockKey, currentBlockText), 0);

    if (statement) this.props.onUpdateStatement(statement);

    const newEditorState = EditorState.push(
      editorState,
      Modifier.setBlockData(
        contentState,
        selection,
        Immutable.Map({ tokens: statement ? statement.tokens : [] })
      )
    );

    this.setState({ editorState: newEditorState })
  };

  handlePastedText = (text, html, editorState) => {
  }

  handleKeyCommand = command => {
    return 'not-handled';
  }

  render() {
    return (
      <div className='editor'>
        <div className='statements'>
          <Editor
            handleKeyCommand={this.handleKeyCommand}
            editorState={this.state.editorState}
            blockRenderMap={blockRenderMap}
            onChange={this.onChange}
          />
        </div>
        <Results doc={this.doc} />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  onUpdateStatement: payload => dispatch({ type: UPDATE_STATEMENT, payload })
});

export default connect(null, mapDispatchToProps)(App);
