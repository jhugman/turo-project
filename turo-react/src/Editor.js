import React, { Component } from 'react';
import './App.css';
import { EditorState, EditorBlock } from 'draft-js';
import { EditorContainer, Editor, Plugin } from '@djsp/core';
import { EditableDocument, CompositeStorage, loaders } from 'turo';
import Lang from './Lang';

const ErrorToken = ({ children }) => <span className="token--error">{children}</span>

const tokenComps = {
  identifier: ({ children }) => <span className="token--identifier">{children}</span>,
  operator: ({ children }) => <span className="token--operator">{children}</span>,
  number: ({ children }) => <span className="token--number">{children}</span>,
}

const createErrorStrategy = (turoDoc) => ({
  strategy: (block, cb, contentState) => {
    const lineNumber = contentState
      .getBlockMap()
      .keySeq()
      .findIndex(key => key === block.getKey());

    let blockOffset = contentState.getBlocksAsArray()
      .slice(0, lineNumber)
      .map(block => block.getText())
      .join('\n').length

    if (lineNumber > 0) {
      blockOffset+= 1
    }

    const statement = turoDoc.statements[lineNumber]

    statement && statement.tokens
    .reduce((errorStartOffset, token, index) => {
      if (token.displayType === 'errorStart') {
        return token.startOffset;
      } else if (token.displayType === 'errorEnd' && errorStartOffset > -1) {
        cb(errorStartOffset, token.startOffset)
        return -1
      }

      return errorStartOffset;
    }, blockOffset)
  },
  component: ErrorToken
})


const createTokenStrategy = (displayType, turoDoc) => ({
  strategy: (block, cb, contentState) => {
    const lineNumber = contentState
      .getBlockMap()
      .keySeq()
      .findIndex(key => key === block.getKey());

    let blockOffset = contentState.getBlocksAsArray()
      .slice(0, lineNumber)
      .map(block => block.getText())
      .join('\n').length

    if (lineNumber > 0) {
      blockOffset+= 1
    }

    const statement = turoDoc.statements[lineNumber]

    statement && statement.tokens
    .filter(token => token.displayType === displayType)
    .forEach(token => {
      const startOffset = token.startOffset - blockOffset
      cb(startOffset, startOffset + token.literal.length)
    })
  },
  component: tokenComps[displayType]
})

EditableDocument.storage = new CompositeStorage([loaders.bundleLoader]);

class Statement extends Component {
  render() {
    const { statement } = this.props.blockProps
    return (
      <div className='statement'>
        <div className='statement__content'>
          <EditorBlock {...this.props} />
        </div>
        {statement != null && <div contentEditable={false} className='statement__result'>
          {statement.errors != null ? (
            <span className="error"><Lang>{statement.errors[0].message}</Lang></span>
          ) :<span>{statement && statement.valueToString()}</span>}
        </div>}
      </div>
    );
  }
}

export default class _Editor extends Component {
  state = {
    docLoaded: false
  }

  constructor(props) {
    super(props)
    this.turoDoc = EditableDocument.create('new-doc')

    const { editorState } = props
    const blocks = editorState.getCurrentContent().getBlocksAsArray();
    const text = blocks.map((block) => block.getText()).join('\n');

    this.turoDoc.import('app')
    .then(() => this.turoDoc.evaluateDocument(text))
    .then((turoDoc) => {
      this.setState({ docLoaded: true })
    })
  }

  onChange = editorState => {
    const blocks = editorState.getCurrentContent().getBlocksAsArray();
    const text = blocks.map((block) => block.getText()).join('\n');

    this.turoDoc.evaluateDocument(text)
    this.props.onChange(editorState)
  }

  blockRendererFn = block => {
    const { editorState } = this.props

    const lineNumber = editorState
      .getCurrentContent()
      .getBlockMap()
      .keySeq()
      .findIndex(key => key === block.getKey());


    return {
      component: Statement,
      editable: true,
      props: {
        statement: this.turoDoc.statements[lineNumber]
      }
    }
  }

  render() {
    if (this.state.docLoaded) {
      return <EditorContainer
        {...this.props}
        onChange={this.onChange}
      >
        <Plugin
          decorators={
            []
            /*
            Object.keys(tokenComps)
            .map((type) => createTokenStrategy(type, this.turoDoc))
            .concat([createErrorStrategy(this.turoDoc)]).reverse()
            */
          }
          blockRendererFn={this.blockRendererFn}
        />
        <Editor />
      </EditorContainer>
    } else {
      return null
    }
  }
}
