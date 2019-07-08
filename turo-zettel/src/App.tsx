import React, { useState, useEffect } from 'react';
import './App.css';
import Editor, { RenderBlock } from '@zettel/react'
import { EditorState, BlockTree, textToListIndex } from '@zettel/core'
// @ts-ignore
import turo from 'turo';
import Lang from './Lang'
import { TuroDoc, TuroStatement, Token } from './types'
import { blockStatement } from '@babel/types';
const { EditableDocument, CompositeStorage, loaders } = turo

EditableDocument.storage = new CompositeStorage([loaders.bundleLoader]);

const initialEditorState: any = EditorState.fromText(`3291m + 2m
3m in cm`)

const Statement: RenderBlock = (props) => {
  return <div>{props.children}</div>
}

const toPlainText = (tree: BlockTree) => tree.blocks.map(block => block.value.map(val => val.char).join('')).join('\n')

const turoDoc: TuroDoc = EditableDocument.create('new-doc')

const useHashStorage = (
  update: (editorState: EditorState) => void,
  doc: TuroDoc
) => {
  const [isUpdatingHash, setIsUpdatingHash] = useState(false)

  useEffect(() => {
    const onHashChange = () => {
      const text = decodeURIComponent(window.location.hash.substr(1))
      const newEditorState = EditorState.fromText(text)

      doc.evaluateDocument(toPlainText(newEditorState.tree))
      update(newEditorState)

      setIsUpdatingHash(false)
    }
    window.addEventListener('hashchange', onHashChange)

    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (text: string) => {
    setIsUpdatingHash(true)
    window.history.pushState('Boing', 'Title', `#${encodeURIComponent(text)}`)
  }
}

const App = () => {
  const [editorState, setEditorState] = useState(initialEditorState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    turoDoc
    .import('app')
    .then((doc) => {
      return doc.evaluateDocument(toPlainText(initialEditorState.tree))
    }).then(() => {
      setIsLoaded(true)
    })
  }, [])

  const updateHash = useHashStorage(setEditorState, turoDoc)

  const { value } = editorState.list
  const { statements } = turoDoc

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
    isLoaded ? <Editor
      htmlAttrs={{ className: "App" }}
      renderStyle={(props) => {
        return <span key={props.style} className={props.style}>{props.children}</span>
      }}
      renderBlock={(props) => {
        const lineNumber = editorState.tree.blocks.findIndex((block: any) => block.blockKey === props.block.blockKey)
        const statement = turoDoc.statements[lineNumber]
        const statementType = statement && statement.expression.constructor.name

        if (statementType === 'UnparsedText') {
          return <p key={props.block.blockKey} className='statement__content col-2 statement__text'>
            {props.children}
          </p>
        }

        return <>
            {statement != null && <div key={`${props.block.blockKey}-result`} contentEditable={false} className='col-1 statement__result'>
              {statement.errors != null ? (
                <span className="error"><Lang>{statement.errors[0].message}</Lang></span>
              ) :<span>{statement && statement.valueToString()}</span>}
            </div>}

            <div key={props.block.blockKey} className='statement__content col-2 statement__expression'>
              {props.children}
            </div>
        </>
      }}
      editorState={mappedState}
      renderChildren={(props) => {
        return <div className='grid'>{props.children}</div>
      }}
      onChange={(newEditorState) => {
        const text = toPlainText(newEditorState.tree)
        updateHash(text)
        turoDoc.evaluateDocument(text)
        setEditorState(newEditorState)
      }}
    /> : null
  );
}

export default App;
