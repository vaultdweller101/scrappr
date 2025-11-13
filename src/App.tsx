import React, { useState } from 'react'
import Editor from './Editor'
import Notes, { SavedNote } from './Notes'

export default function App() {
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([])
  const [activeTab, setActiveTab] = useState<'doc' | 'notes'>('doc')
  const [docName, setDocName] = useState('Untitled document')
  const [editingName, setEditingName] = useState(false)

  const handleNameClick = () => setEditingName(true)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setDocName(e.target.value)
  const handleNameBlur = () => setEditingName(false)
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setEditingName(false)
    }
  }

  return (
    <div className="app">
      <div className="topbar-horizontal">
        <img
          src="/assets/scrappr.png"
          alt="Scrappr logo"
          className="logo"
          width={64}
          height={64}
        />
        <div className="topbar-right">
          <div className="docname-bar">
            {editingName ? (
              <input
                className="docname-input"
                value={docName}
                autoFocus
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
              />
            ) : (
              <span
                className="docname-display"
                title="Click to rename"
                tabIndex={0}
                onClick={handleNameClick}
                onKeyDown={e => (e.key === 'Enter' ? setEditingName(true) : undefined)}
                role="button"
                style={{ cursor: 'pointer' }}
              >
                {docName}
              </span>
            )}
          </div>
          <div className="tab-bar">
            <button
              className={activeTab === 'doc' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('doc')}
            >
              Doc
            </button>
            <button
              className={activeTab === 'notes' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
          </div>
        </div>
      </div>
      <main className="tab-content">
        {/* Always render the Doc section, but hide it with CSS */}
        <div
          className="document-section"
          style={{ display: activeTab === 'doc' ? 'block' : 'none' }}
        >
          <Editor savedNotes={savedNotes} docName={docName} />
        </div>

        {/* Always render the Notes section, but hide it with CSS */}
        <div
          className="notes-section"
          style={{ display: activeTab === 'notes' ? 'block' : 'none' }}
        >
          <Notes onNotesChange={setSavedNotes} />
        </div>
      </main>
    </div>
  )
}
