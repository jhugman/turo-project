import React, { useState, useEffect } from 'react';
import { Block, EditorState, createViewState, textToListIndex, toText } from '@zettel/core'
import { TuroDoc, Token } from '../types'
import defaultTuroDoc from '../defaultTuroDoc'

export default function useHashStorage (
  update: (editorState: EditorState) => void,
  doc: TuroDoc,
  isLoaded: boolean
) {
  const [isUpdatingHash, setIsUpdatingHash] = useState(false)

  useEffect(() => {
    const onHashChange = () => {
      const text = decodeURIComponent(window.location.hash.substr(1))
      const newEditorState = EditorState.fromText(text)

      doc.evaluateDocument(toText(newEditorState))
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
