import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import { SavedNote } from './Notes'


interface EditorProps {
  savedNotes: SavedNote[];
  docName: string;
}

export default function Editor({ savedNotes, docName }: EditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [suggestions, setSuggestions] = useState<SavedNote[]>([])

  const formatButtonStyle: React.CSSProperties = {
    border: 'none',
    background: 'none',
    padding: '0 4px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text)'
  };

  const exportPDF = async () => {
    if (!editorRef.current) return;
    const el = editorRef.current;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${docName || 'document'}.pdf`);
  };

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
    saveAs(blob, `${docName || 'document'}.docx`)
  }

  const setBold = () => document.execCommand('bold')
  const setItalic = () => document.execCommand('italic')
  const setUnderline = () => document.execCommand('underline')

  // Find suggestions based on current document content
  const findSuggestions = (text: string) => {
    if (!text.trim()) {
      setSuggestions([])
      return
    }
    
    const matches = savedNotes
      .filter((note: SavedNote) => {
        const noteText = note.content.toLowerCase();
        const searchText = text.toLowerCase();
        return noteText.includes(searchText) || 
          searchText.split(' ').some(word => word.length > 2 && noteText.includes(word));
      })
      .slice(0, 3);
    setSuggestions(matches);
  }

  // Formatting button style and component
  // Formatting button style and component
  // Stub for document change handler
  const handleDocumentChange = () => {
    // Implement document change logic if needed
  };

  function FormatButton({ onClick, children, extraStyle }: {
    onClick: () => void,
    children: React.ReactNode,
    extraStyle?: React.CSSProperties
  }) {
    return (
      <button onClick={onClick} style={{ ...formatButtonStyle, ...extraStyle }}>
        {children}
      </button>
    );
  }

  return (
    <div>
      <div className="controls">
        <FormatButton onClick={setBold} extraStyle={{ fontWeight: 'bold' }}>B</FormatButton>
        <FormatButton onClick={setItalic} extraStyle={{ fontStyle: 'italic' }}>I</FormatButton>
        <FormatButton onClick={setUnderline} extraStyle={{ textDecoration: 'underline' }}>U</FormatButton>
        <button onClick={exportPDF} title="Print / Export PDF" style={{ padding: 0, background: 'none', border: 'none' }}>
          <img src="/assets/printer-icon-998.png" alt="Print" style={{ width: 28, height: 28 }} />
        </button>
        <button onClick={exportWord} title="Export Word" style={{ padding: 0, background: 'none', border: 'none' }}>
          <img src="/assets/word-icon-png-4014.png" alt="Export Word" style={{ width: 28, height: 28 }} />
        </button>
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
