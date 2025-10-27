import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import { SavedNote } from './Notes'

interface EditorProps {
  savedNotes: SavedNote[];
}

export default function Editor({ savedNotes }: EditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [filename, setFilename] = useState('document')
  const [suggestions, setSuggestions] = useState<SavedNote[]>([])

  const exportPDF = async () => {
    if (!editorRef.current) return
    const el = editorRef.current
    // Use html2canvas to capture the element
    const canvas = await html2canvas(el, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${filename}.pdf`)
  }

  const exportWord = async () => {
    if (!editorRef.current) return
    // Convert editor text content into simple paragraphs for docx.
    const text = editorRef.current.innerText || ''
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: lines.length
            ? lines.map((l) => new Paragraph({ children: [new TextRun(l)] }))
            : [new Paragraph({ children: [new TextRun('') ] })],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${filename}.docx`)
  }

  const setBold = () => document.execCommand('bold')
  const setItalic = () => document.execCommand('italic')

  // Find suggestions based on current document content
  const findSuggestions = (text: string) => {
    if (!text.trim()) {
      setSuggestions([])
      return
    }
    
    const matches = savedNotes
      .filter(note => {
        const noteText = note.content.toLowerCase()
        const searchText = text.toLowerCase()
        return noteText.includes(searchText) || 
               // Check for word-level matches
               searchText.split(' ').some(word => 
                 word.length > 2 && noteText.includes(word)
               )
      })
      .slice(0, 3) // Limit to top 3 suggestions
    
    setSuggestions(matches)
  }

  // Handle document content changes
  const handleDocumentChange = () => {
    if (!editorRef.current) return
    const content = editorRef.current.innerText
    findSuggestions(content)
  }

  return (
    <div className="editor-container">
      <div className="controls">
        <input value={filename} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilename(e.target.value)} />
        <button onClick={setBold}>Bold</button>
        <button onClick={setItalic}>Italic</button>
        <button onClick={exportPDF}>Export PDF</button>
        <button onClick={exportWord}>Export Word</button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions">
          <h3>Related Notes</h3>
          {suggestions.map(note => (
            <div 
              key={note.id}
              className="suggestion"
              title="Similar note found"
            >
              {note.content.slice(0, 100)}
              {note.content.length > 100 ? '...' : ''}
            </div>
          ))}
        </div>
      )}

      <div
        className="editor"
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleDocumentChange}
        aria-label="Document editor"
      >
        <h2>Your Document Title</h2>
        <p>Start writing here...</p>
      </div>
    </div>
  )
}
