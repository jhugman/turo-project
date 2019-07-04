import React, { useState, useEffect } from 'react';
import './App.css';
import Editor, { RenderBlock } from '@zettel/react'
import { EditorState, BlockTree, getBlockNumber, textToListIndex } from '@zettel/core'
// @ts-ignore
import turo from 'turo';
import Lang from './Lang'
const { EditableDocument, CompositeStorage, loaders } = turo

type TuroStatement = {
  currentValue: any,
  errors: any[],
  valueToString: () => string,
  expression: any,
  tokens: Token[],
  node: any,
}

type TuroDoc = {
  statements: TuroStatement[],
  import: (key: string) => Promise<TuroDoc>,
  evaluateDocument: (text: string) => Promise<TuroDoc>,
}

type Token = {
  displayType: string,
  line: number,
  literal: string,
  shortType: string,
  startOffset: number
}

EditableDocument.storage = new CompositeStorage([loaders.bundleLoader]);

const initialEditorState = EditorState.fromText(`3291m + 2m
3m in cm`)

const Statement: RenderBlock = (props) => {
  return <div>{props.children}</div>
}

const toPlainText = (tree: BlockTree) => tree.blocks.map(block => block.value.map(val => val.char).join('')).join('\n')

const turoDoc: TuroDoc = EditableDocument.create('new-doc')

const App = () => {
  const [editorState, setEditorState] = useState(initialEditorState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    turoDoc
    .import('app')
    .then((doc) => {
      return doc.evaluateDocument(toPlainText(initialEditorState.tree))
    })
    .then((turoDoc: any) => {
      setIsLoaded(true)
    })
  }, [])

  const { value } = editorState.list
  const { statements } = turoDoc
  console.log({ turoDoc })

  let newValue = value.slice()

  statements.forEach((st: any) => {
    st.tokens.forEach((token: Token) => {
      let offset = token.startOffset + 1 - token.line
      token.literal.split('').forEach(() => {
        const listIndex = textToListIndex(newValue, offset)
        let char = { ...newValue[listIndex] }
        if (char.type == null) {
          char.styles = char.styles = [`token--${token.displayType}`]
        }
        newValue[listIndex] = char
        
        offset++
      })
    })
  })

  const mappedState = new EditorState({
    ...editorState,
    list: {
      ...editorState.list,
      value: newValue
    }
  })

  return (
    <Editor
      htmlAttrs={{ className: "App" }}
      renderStyle={(props) => {
        return <span key={props.style} className={props.style}>{props.children}</span>
      }}
      renderBlock={(props) => {
        const lineNumber = editorState.tree.blocks.findIndex(block => block.blockKey === props.block.blockKey)
        const statement = turoDoc.statements[lineNumber]

        return <div key={props.block.blockKey}>
          <div className='statement'>
            <div className='statement__content'>
              {props.children}
            </div>
            {statement != null && <div contentEditable={false} className='statement__result'>
              {statement.errors != null ? (
                <span className="error"><Lang>{statement.errors[0].message}</Lang></span>
              ) :<span>{statement && statement.valueToString()}</span>}
            </div>}
          </div>
        </div>
      }}
      editorState={mappedState}
      onChange={(newEditorState) => {
        turoDoc.evaluateDocument(toPlainText(newEditorState.tree))
        setEditorState(newEditorState)
      }}
    />
  );
}

export default App;
