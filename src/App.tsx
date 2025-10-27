import React, { useState } from 'react'
import Editor from './Editor'
import Notes, { SavedNote } from './Notes'

export default function App() {
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([])

  return (
    <div className="app">
      <header>
        <h1>Scrappr</h1>
      </header>
      <main className="split-layout">
        <div className="document-section">
          <h2>Document</h2>
          <Editor savedNotes={savedNotes} />
        </div>
        <Notes onNotesChange={setSavedNotes} />
      </main>
    </div>
  )
}
