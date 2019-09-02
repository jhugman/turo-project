import React, { useState, useEffect } from 'react';
import './App.css';
import Editor, { RenderStyle, RenderBlock } from '@zettel/react'
import EditorBlock from '@zettel/react/dist/EditorBlock'
import { Block, EditorState, BlockTree, textToListIndex } from '@zettel/core'
import id from '@zettel/core/dist/EditorState/id'
// @ts-ignore
import turo from 'turo';
import Lang from './Lang'
import { TuroDoc, Token } from './types'
import defaultTuroDoc from './defaultTuroDoc'
import testdoc from './testdoc'
const { EditableDocument, CompositeStorage, loaders } = turo

EditableDocument.storage = new CompositeStorage([loaders.bundleLoader]);

const initialEditorState: any = EditorState.fromText(``)

const Statement: RenderBlock = (props) => {
  return <div>{props.children}</div>
}

const toPlainText = (tree: BlockTree) => tree.blocks.map(block => block.value.map(val => val.char).join('')).join('\n')

const turoDoc: TuroDoc = EditableDocument.create('new-doc')

const useHashStorage = (
  update: (editorState: EditorState) => void,
  doc: TuroDoc,
  isLoaded: boolean
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

    if (window.location.hash.substr(1).trim().length === 0) {
      // set default doc and reload
      window.location.hash = encodeURIComponent(defaultTuroDoc)
    } else {
      onHashChange()
    }

    return () => window.removeEventListener('hashchange', onHashChange)
  }, [isLoaded])

  return (text: string) => {
    setIsUpdatingHash(true)
    window.history.pushState('Boing', 'Title', `#${encodeURIComponent(text)}`)
  }
}

const useDocumentTitle = (editorState: EditorState) => {
  const plainText = toPlainText(editorState.tree)

  const firstLine = plainText.split('\n')[0]
  return useEffect(() => {
    document.title = firstLine || 'Turo'
  }, [firstLine])
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

  useDocumentTitle(editorState)

  const updateHash = useHashStorage(setEditorState, turoDoc, isLoaded)

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

  const emptyBlocks: Block[] = []

  mappedState.tree.blocks = mappedState.tree.blocks.reduce((acc, block) => {
    const lineNumber = editorState.tree.blocks.findIndex((_block: any) => _block.blockKey === block.blockKey)
    const statement = turoDoc.statements[lineNumber]
    const prevBlock: Block = acc[acc.length - 1]

    // we're grouping statements here
    if (statement != null && statement.currentValue != null) {
      if (prevBlock != null && prevBlock.blocks.length > 0) {
        prevBlock.blocks.push({
          ...block,
          entity: {
            statement
          }
        })
        return acc
      } else {
        return [
          ...acc,
          {
            blockKey: id(),
            value: [],
            blocks: [{
              ...block,
              entity: {
                statement
              }
            }],
            entity: {
              type: 'statement'
            }
          }
        ]
      }
    }

    return [
      ...acc,
      {
        ...block,
        entity: {
          statement
        }
      }
    ]
  }, emptyBlocks)

  const renderStyle: RenderStyle = (props) => {
    return <span key={props.style} className={props.style}>{props.children}</span>
  }

  const renderBlock: RenderBlock = (props) => {
    const { entity } = props.block
    const statement = entity != null ? entity.statement : null
    const isUnparsedText = statement && statement.currentValue == null

    if (entity != null && entity.type === 'statement') {
      return <div className='statement__container'>
      {props.block.blocks.map(block => <EditorBlock renderStyle={renderStyle} renderBlock={renderBlock} block={block} editorState={mappedState} />)}
      </div>
    }

    if (isUnparsedText) {
      return <p key={props.block.blockKey} className='statement__content statement__text'>
        {props.children}
      </p>
    }

    return <div className='statement'>
        <div key={props.block.blockKey} className='statement__expression'>
          {props.children}
        </div>

        {statement != null && <div key={`${props.block.blockKey}-result`} contentEditable={false} className='statement__result'>
          {statement.errors != null ? (
            <span className="error"><Lang>{statement.errors[0].message}</Lang></span>
          ) :<span>{statement && statement.valueToString()}</span>}
        </div>}
    </div>
  }

  return (
    isLoaded ? <Editor
      htmlAttrs={{ className: "App" }}
      renderStyle={renderStyle}
      renderBlock={renderBlock}
      editorState={mappedState}
      renderChildren={(props) => {
        return props.children
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
