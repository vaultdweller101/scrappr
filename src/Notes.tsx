import React, { useEffect, useRef, useState } from 'react'

export interface SavedNote {
  id: string;
  content: string;
  timestamp: number;
}

interface NotesProps {
  onNotesChange: (notes: SavedNote[]) => void;
}

export default function Notes({ onNotesChange }: NotesProps) {
  const [currentNote, setCurrentNote] = useState('')
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([])
  const notesRef = useRef<HTMLDivElement>(null)

  // Load saved notes from localStorage on mount
  useEffect(() => {
    const notes = localStorage.getItem('scrappr-saved-notes')
    if (notes) {
      const loadedNotes = JSON.parse(notes)
      setSavedNotes(loadedNotes)
      onNotesChange(loadedNotes)
    }
  }, [onNotesChange])

  // Handle note content changes
  const handleNotesChange = () => {
    if (!notesRef.current) return
    const content = notesRef.current.innerText
    setCurrentNote(content)
  }

  // Save current note and clear editor
  const saveNote = () => {
    if (!currentNote.trim()) return
    
    const newNote: SavedNote = {
      id: Date.now().toString(),
      content: currentNote,
      timestamp: Date.now()
    }
    
    const updatedNotes = [newNote, ...savedNotes]
    setSavedNotes(updatedNotes)
    localStorage.setItem('scrappr-saved-notes', JSON.stringify(updatedNotes))
    onNotesChange(updatedNotes)
    
    // Clear current note
    setCurrentNote('')
    if (notesRef.current) {
      notesRef.current.innerText = ''
    }
  }

  // Delete a saved note
  const deleteNote = (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return
    }

    const updatedNotes = savedNotes.filter(note => note.id !== noteId)
    setSavedNotes(updatedNotes)
    localStorage.setItem('scrappr-saved-notes', JSON.stringify(updatedNotes))
    onNotesChange(updatedNotes)
  }

  return (
    <div className="notes-container">
      <h2>Ideas &amp; Notes</h2>
      <div className="notes-toolbar">
        <button onClick={saveNote} className="save-note">
          Save Note
        </button>
      </div>
      
      <div 
        ref={notesRef}
        className="notes-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={handleNotesChange}
        aria-label="Notes editor"
      />
      
      <div className="saved-notes">
        <h3>Saved Notes ({savedNotes.length})</h3>
        {savedNotes.map(note => (
          <div key={note.id} className="saved-note">
            <div className="note-content">
              {note.content.slice(0, 100)}
              {note.content.length > 100 ? '...' : ''}
            </div>
            <div className="note-actions">
              <div className="note-date">
                {new Date(note.timestamp).toLocaleDateString()}
              </div>
              <button 
                onClick={() => deleteNote(note.id)}
                className="delete-note"
                title="Delete this note"
                aria-label="Delete note"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}