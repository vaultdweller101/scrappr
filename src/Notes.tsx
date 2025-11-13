import React, { useEffect, useState } from 'react'

export interface SavedNote {
  id: string;
  content: string;
  timestamp: number;
}

interface NotesProps {
  onNotesChange: (notes: SavedNote[]) => void;
}

function renderNote(note: SavedNote, deleteNote: (id: string) => void) {
  return (
    <div key={note.id} className="saved-note">
      <div className="note-content">
        {note.content}
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
  )
}

export default function Notes({ onNotesChange }: NotesProps) {
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')

  // Load saved notes from localStorage on mount
  useEffect(() => {
    const notes = localStorage.getItem('scrappr-saved-notes')
    if (notes) {
      const loadedNotes = JSON.parse(notes)
      setSavedNotes(loadedNotes)
      onNotesChange(loadedNotes)
    }
  }, [onNotesChange])

  // Open the modal
  const openNewNoteModal = () => {
    setNewNoteContent('')
    setIsModalOpen(true)
  }

  // Close the modal
  const closeNewNoteModal = () => {
    setIsModalOpen(false)
  }

  // Save new note from modal
  const handleSaveNote = () => {
    if (!newNoteContent || !newNoteContent.trim()) {
      return // Don't save empty notes
    }
    
    const newNote: SavedNote = {
      id: Date.now().toString(),
      content: newNoteContent,
      timestamp: Date.now()
    }
    
    const updatedNotes = [newNote, ...savedNotes]
    setSavedNotes(updatedNotes)
    localStorage.setItem('scrappr-saved-notes', JSON.stringify(updatedNotes))
    onNotesChange(updatedNotes)
    
    closeNewNoteModal()
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
      <div className="notes-toolbar">
        <button onClick={openNewNoteModal} className="save-note">
          Save Note
        </button>
      </div>
      
      <div className="saved-notes">
        <h3>Saved Notes ({savedNotes.length})</h3>
        <div className="saved-notes-grid">
          {savedNotes.map(note => renderNote(note, deleteNote))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeNewNoteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Note</h3>
            <textarea
              className="modal-textarea"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Start writing your note..."
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={closeNewNoteModal} className="modal-button cancel-note">
                Cancel
              </button>
              <button onClick={handleSaveNote} className="modal-button save-note">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}