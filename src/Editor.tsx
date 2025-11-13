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

// Utility: check for suggestion at cursor
function checkSuggestionAtCursor(
  editorRef: React.RefObject<HTMLDivElement>,
  setSuggestions: React.Dispatch<React.SetStateAction<SavedNote[]>>,
  setCursorPosition: React.Dispatch<React.SetStateAction<{x: number, y: number} | null>>,
  findSuggestions: (word: string) => void,
  setActiveSuggestionRange: React.Dispatch<React.SetStateAction<{ node: Node, start: number, end: number } | null>>
) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    setSuggestions([]);
    setCursorPosition(null);
    setActiveSuggestionRange(null);
    return;
  }

  const range = selection.getRangeAt(0);
  let node = range.startContainer;
  let offset = range.startOffset;
  if (node.nodeType !== Node.TEXT_NODE) {
    setSuggestions([]);
    setCursorPosition(null);
    setActiveSuggestionRange(null);
    return;
  }
  const textContent = node.textContent || '';
  let start = offset;
  let end = offset;
  while (start > 0 && textContent[start - 1].match(/\S/)) {
    start--;
  }
  while (end < textContent.length && textContent[end].match(/\S/)) {
    end++;
  }
  const currentWord = textContent.substring(start, end).trim();
  if (currentWord.length > 2) {
    findSuggestions(currentWord);
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) return;
    setCursorPosition({
      x: rect.left - editorRect.left,
      y: rect.bottom - editorRect.top + 8,
    });
    setActiveSuggestionRange({ node, start, end });
  } else {
    setSuggestions([]);
    setCursorPosition(null);
    setActiveSuggestionRange(null);
  }
}

export default function Editor({ savedNotes, docName }: EditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [suggestions, setSuggestions] = useState<SavedNote[]>([])
  // Add state for cursor position
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [activeSuggestionRange, setActiveSuggestionRange] = useState<{ node: Node, start: number, end: number } | null>(null);

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

  const findSuggestions = (word: string) => {
    if (!word) {
      setSuggestions([]);
      return;
    }
    const searchText = word.toLowerCase();
    const matches = savedNotes
      .filter((note: SavedNote) => {
        const noteText = note.content.toLowerCase();
        // Check if the note's content includes the search word
        return noteText.includes(searchText);
      })
      .slice(0, 100);
    setSuggestions(matches);
  };

  const handleSuggestionClick = (noteContent: string) => {
    if (!activeSuggestionRange || !editorRef.current) return;

    const { node, start, end } = activeSuggestionRange;

    // Create a range to select the word
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);

    // Get the selection and remove any existing ranges
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range); // Select the word

    // Replace it (we add a space for better typing flow)
    document.execCommand('insertText', false, noteContent + ' ');

    // Hide suggestions and clear the stored range
    setSuggestions([]);
    setCursorPosition(null);
    setActiveSuggestionRange(null);

    // Re-focus the editor
    editorRef.current.focus();
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
    // Added position: 'relative' to contain the absolute modal
    <div style={{ position: 'relative' }}>
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

      {suggestions.length > 0 && cursorPosition && (
        <div 
          className="suggestions-modal"
          style={{
            position: 'absolute',
            top: cursorPosition.y,
            left: cursorPosition.x,
            zIndex: 10
          }}
        >
        <h3>Related Notes</h3>
          {/* Add the new wrapper div here */}
          <div className="suggestions-list">
            {suggestions.map(note => (
              <div 
                key={note.id}
                className="suggestion"
                title="Similar note found"
                onClick={() => handleSuggestionClick(note.content)}>
                {note.content.slice(0, 100)}
                {note.content.length > 100 ? '...' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="editor"
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        // We use a timeout to let the DOM update before we check it
        onInput={() => setTimeout(() => checkSuggestionAtCursor(editorRef, setSuggestions, setCursorPosition, findSuggestions, setActiveSuggestionRange), 0)}
        onKeyUp={() => setTimeout(() => checkSuggestionAtCursor(editorRef, setSuggestions, setCursorPosition, findSuggestions, setActiveSuggestionRange), 0)}
        onClick={() => setTimeout(() => checkSuggestionAtCursor(editorRef, setSuggestions, setCursorPosition, findSuggestions, setActiveSuggestionRange), 0)}
        aria-label="Document editor"
      >
        <h2>Your Document Title</h2>
        <p>Start writing here...</p>
      </div>
    </div>
  )
}