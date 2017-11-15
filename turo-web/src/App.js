import React, { Component, PureComponent } from 'react';
import { CompositeDecorator, CharacterMetadata, ContentState, ContentBlock, genKey, EditorState, DefaultDraftBlockRenderMap } from 'draft-js';
import Immutable from 'immutable';
import { UPDATE_STATEMENT } from './constants';
import Result from './Result';
import exampleDoc from './basic';

import './App.css';
import { connect } from 'react-redux';

import Editor from 'draft-js-plugins-editor';
import { EditableDocument } from 'turo';

function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr, start;
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
  }
}

class NumberComp extends PureComponent {
  render() {
    return (<span>{this.props.children}</span>)
  }
}

const handleStrategy = (contentBlock, callback) => {
  console.log(contentBlock);
}

const compositeDecorator = new CompositeDecorator([
  {
    strategy: handleStrategy,
    component: NumberComp,
  }
]);

const st1 = `boing = 5m`;
const st2 = `boing + 10m`;

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
      console.log('statement', statement.toTokens());

      this.props.onUpdateStatement(statement);

      return new ContentBlock({
        data: {
          tokens: statement.tokens
        },
        key: statement.id,
        characterList: Immutable.List().setSize(statement.text.length).map(() => new CharacterMetadata()),
        text: statement.text,
        type: 'unstyled',
        depth: 0,
      });
    });

    this.state = {
      editorState: EditorState.createWithContent(
        ContentState.createFromBlockArray(blockMap),
        compositeDecorator
      ),
    }
  }

  onChange = (editorState) => {
    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();
    const blockKey = editorState.getSelection().getFocusKey();
    const currentBlockText = contentState.getBlockForKey(blockKey).getText();
    const index = blockMap.keySeq().findIndex(key => key === blockKey)

    this.props.onUpdateStatement(this.doc.evaluateStatement(blockKey, currentBlockText)[0]);

    this.setState({ editorState })
  };

  handlePastedText = (text, html, editorState) => {
  }

  render() {
    return (
      <div className='editor'>
        <div className='statements'>
          <Editor
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
