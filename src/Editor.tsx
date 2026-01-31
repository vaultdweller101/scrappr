import React, { useRef, useState, useEffect } from 'react'
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
  findSuggestions: (word: string, sentence: string, savedNotes: SavedNote[], setSuggestions: React.Dispatch<React.SetStateAction<SavedNote[]>>) => void,
  setActiveSuggestionRange: React.Dispatch<React.SetStateAction<{ node: Node, start: number, end: number } | null>>,
  savedNotes: SavedNote[],
  setCurrentFontSize: React.Dispatch<React.SetStateAction<string>>
) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) { // Simplified check
    setSuggestions([]);
    setCursorPosition(null);
    setActiveSuggestionRange(null);
    return;
  }
  
  // Update font size from selection
  // This runs even if selection is not collapsed (e.g., highlighting)
  const size = document.queryCommandValue('fontSize');
  setCurrentFontSize(size || '3'); // '3' is default <p> (12pt)

  if (!selection.isCollapsed) {
    // Don't show word suggestions if highlighting text
    setSuggestions([]);
    setCursorPosition(null);
    setActiveSuggestionRange(null);
    return;
  }
  
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  const offset = range.startOffset;

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
  const currentSentence = (node.textContent || '').trim();

  // Check the *sentence* length, not just the word's length
  if (currentSentence.length > 2) {
    findSuggestions(currentWord, currentSentence, savedNotes, setSuggestions);
    
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

// Helper function to tokenize and normalize text
function tokenizeAndNormalize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/); // Split by spaces
  const stopWords = new Set([
    'i', 'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'by', 'for', 'from', 'in', 'of',
    'on', 'to', 'with', 'and', 'but', 'or', 'so', 'if', 'about', 'at', 'it',
    'my', 'me', 'you', 'your'
  ]);
  return new Set(words.filter(word => word.length > 1 && !stopWords.has(word)));
}

// findSuggestions function with scoring logic
function findSuggestions(
  word: string,
  sentence: string,
  savedNotes: SavedNote[],
  setSuggestions: React.Dispatch<React.SetStateAction<SavedNote[]>>
) {
  const searchTokens = tokenizeAndNormalize(sentence);
  const wordToken = word.toLowerCase();
  if (searchTokens.size === 0) {
    setSuggestions([]);
    return;
  }
  const scoredNotes = savedNotes.map(note => {
    const noteContentLower = note.content.toLowerCase();
    const noteTokens = tokenizeAndNormalize(noteContentLower);
    let score = 0;
    for (const token of searchTokens) {
      if (noteTokens.has(token)) {
        score += 1;
      }
    }
    if (noteTokens.has(wordToken)) {
      score += 3;
    }
    if (noteContentLower.includes(sentence)) {
      score += 10;
    } else if (noteContentLower.includes(word)) {
      score += 5;
    }
    return { note, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);
  const topNotes = scoredNotes.slice(0, 5).map(item => item.note);
  setSuggestions(topNotes);
}

// (handleSuggestionClick function remains unchanged from your file)
function handleSuggestionClick(
  noteContent: string,
  activeSuggestionRange: { node: Node, start: number, end: number } | null,
  editorRef: React.RefObject<HTMLDivElement>,
  setSuggestions: React.Dispatch<React.SetStateAction<SavedNote[]>>,
  setCursorPosition: React.Dispatch<React.SetStateAction<{x: number, y: number} | null>>,
  setActiveSuggestionRange: React.Dispatch<React.SetStateAction<{ node: Node, start: number, end: number } | null>>
) {
  if (!activeSuggestionRange || !editorRef.current) return;
  const { node, start, end } = activeSuggestionRange;
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.execCommand('insertText', false, noteContent + ' ');
  setSuggestions([]);
  setCursorPosition(null);
  setActiveSuggestionRange(null);
  editorRef.current.focus();
}


export default function Editor({ savedNotes, docName }: EditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [suggestions, setSuggestions] = useState<SavedNote[]>([])
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [activeSuggestionRange, setActiveSuggestionRange] = useState<{ node: Node, start: number, end: number } | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [currentFontSize, setCurrentFontSize] = useState('3'); // 1-7 scale
  const [fontSizeInput, setFontSizeInput] = useState('12'); // Display value (pt)

  // Load content from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('scrappr-doc-content');
    if (editorRef.current) {
      if (savedContent) { // Only set if there *is* saved content
        editorRef.current.innerHTML = savedContent;
      } else {
        // Otherwise, ensure it's blank
        editorRef.current.innerHTML = ''; 
      }
    }
  }, []); // Empty array means this runs only once on mount

  // Sync display input when true state changes
  useEffect(() => {
    setFontSizeInput(FONT_MAP[currentFontSize] || '12');
  }, [currentFontSize]);

  const formatButtonStyle: React.CSSProperties = {
    border: 'none',
    background: 'none',
    padding: '0 4px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text)',
    cursor: 'pointer' // Ensure it's clickable
  };

  const exportPDF = () => {
  // Temporarily set the document title so the PDF filename defaults to your docName
  const originalTitle = document.title;
  document.title = docName || 'document';
  
  window.print();
  
  // Restore original title
  document.title = originalTitle;
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

  const handleFontSizeInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // 1. Save the current selection from the window
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      // Only save if the selection is inside the editor
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.startContainer)) {
        setSavedRange(range);
      }
    }
    // 2. Select the text in the input
    e.target.select();
  };

  const setBold = () => document.execCommand('bold')
  const setItalic = () => document.execCommand('italic')
  const setUnderline = () => document.execCommand('underline')

  const setJustifyLeft = () => document.execCommand('justifyLeft')
  const setJustifyCenter = () => document.execCommand('justifyCenter')
  const setJustifyRight = () => document.execCommand('justifyRight')
  const setJustifyFull = () => document.execCommand('justifyFull')
  
  // Maps the 1-7 scale to common point sizes for display
  const FONT_MAP: { [key: string]: string } = {
    '1': '8',
    '2': '10',
    '3': '12',
    '4': '14',
    '5': '18',
    '6': '24',
    '7': '36',
  };

  const PT_TO_SCALE_MAP: { [key: string]: string } = {
    '8': '1',
    '10': '2',
    '12': '3',
    '14': '4',
    '18': '5',
    '24': '6',
    '36': '7',
  };

  const increaseFontSize = () => {
    // Get the new size, clamped between 1 and 7
    const newSize = Math.min(7, Number(currentFontSize) + 1);
    document.execCommand('fontSize', false, newSize.toString());
    setCurrentFontSize(newSize.toString());
  }
  const decreaseFontSize = () => {
    // Get the new size, clamped between 1 and 7
    const newSize = Math.max(1, Number(currentFontSize) - 1);
    document.execCommand('fontSize', false, newSize.toString());
    setCurrentFontSize(newSize.toString());
  }

  // When the input value changes (user is typing)
  const handleFontSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSizeInput(e.target.value);
  };

  // When the user blurs the input
  const handleFontSizeInputBlur = () => {
    // Revert to the "true" state's display value
    setFontSizeInput(FONT_MAP[currentFontSize] || '12');
  };

  // When the user hits Enter in the input
  const handleFontSizeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Stop form submission/newline
      
      const ptSize = fontSizeInput.replace('pt', '').trim();
      let scaleSize = '3'; // Default

      // (Your existing logic to find scaleSize... no changes here)
      if (PT_TO_SCALE_MAP[ptSize]) {
        scaleSize = PT_TO_SCALE_MAP[ptSize];
      } else {
        // Not a direct match, find closest
        const numericSize = parseInt(ptSize, 10);
        if (!isNaN(numericSize)) {
          if (numericSize <= 8) scaleSize = '1';
          else if (numericSize <= 10) scaleSize = '2';
          else if (numericSize <= 12) scaleSize = '3';
          else if (numericSize <= 14) scaleSize = '4';
          else if (numericSize <= 18) scaleSize = '5';
          else if (numericSize <= 24) scaleSize = '6';
          else scaleSize = '7'; // Max size
        }
      }

      // 1. Restore the saved selection if it exists
      if (savedRange) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedRange);
        setSavedRange(null); // Clear the saved range
      }

      // 2. Apply the change (now it has a selection to act on)
      document.execCommand('fontSize', false, scaleSize);
      
      // 3. Update the "true" state
      setCurrentFontSize(scaleSize);
      
      // 4. Update the display state to the *actual* mapped value
      setFontSizeInput(FONT_MAP[scaleSize]);
      
      // 5. Re-focus the editor
      editorRef.current?.focus();
    }
  };

  // Saves content and triggers suggestion check
  const handleEditorInput = () => {
    // 1. Save content
    if (editorRef.current) {
      localStorage.setItem('scrappr-doc-content', editorRef.current.innerHTML);
    }
    // 2. Run suggestion logic
    setTimeout(() => checkSuggestionAtCursor(
      editorRef, 
      setSuggestions, 
      setCursorPosition, 
      findSuggestions, 
      setActiveSuggestionRange, 
      savedNotes,
      setCurrentFontSize // <-- ADD THIS
    ), 0);
  };

  function FormatButton({ onClick, children, extraStyle, title}: { 
    onClick: () => void,
    children: React.ReactNode,
    extraStyle?: React.CSSProperties,
    title?: string,
  }) {
    return (
      <button 
        onClick={onClick} 
        title={title} 
        style={{ ...formatButtonStyle, ...extraStyle }}
      >
        {children}
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="controls">
        <FormatButton onClick={setBold} title="Bold (Ctrl+B)" extraStyle={{ fontWeight: 'bold' }}>B</FormatButton>
        <FormatButton onClick={setItalic} title="Italic (Ctrl+I)" extraStyle={{ fontStyle: 'italic' }}>I</FormatButton>
        <FormatButton onClick={setUnderline} title="Underline (Ctrl+U)" extraStyle={{ textDecoration: 'underline' }}>U</FormatButton>
        
        <FormatButton onClick={setJustifyLeft} title="Align Left">
          <img src="/assets/align-left.png" alt="Align Left" style={{ width: 20, height: 20, opacity: 0.8 }} />
        </FormatButton>
        <FormatButton onClick={setJustifyCenter} title="Align Center">
          <img src="/assets/align-center.png" alt="Align Center" style={{ width: 20, height: 20, opacity: 0.8 }} />
        </FormatButton>
        <FormatButton onClick={setJustifyRight} title="Align Right">
          <img src="/assets/align-right.png" alt="Align Right" style={{ width: 20, height: 20, opacity: 0.8 }} />
        </FormatButton>
        <FormatButton onClick={setJustifyFull} title="Align Justify">
          <img src="/assets/align-justify.png" alt="Align Justify" style={{ width: 20, height: 20, opacity: 0.8 }} />
        </FormatButton>

        <FormatButton 
          onClick={decreaseFontSize} 
          title="Decrease Font Size" 
          extraStyle={{ fontSize: '1.2rem', lineHeight: 1, padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '4px 0 0 4px', width: 'auto' }}
        >-</FormatButton>
        
        <input 
          type="text"
          title="Font size (pt)"
          value={fontSizeInput}
          onChange={handleFontSizeInputChange}
          onKeyDown={handleFontSizeInputKeyDown}
          onBlur={handleFontSizeInputBlur}
          onFocus={handleFontSizeInputFocus} // Select all text on click
          style={{ 
            width: '32px', 
            textAlign: 'center', 
            fontSize: '0.9rem', 
            color: 'var(--text)', 
            border: '1px solid var(--border)',
            borderLeft: 'none',
            borderRight: 'none',
            padding: '5px 0',
            lineHeight: 1.4,
            fontVariantNumeric: 'tabular-nums',
            outline: 'none',
            marginLeft: '-1px', // Overlap buttons for seamless look
            marginRight: '-1px',
            zIndex: 1 // Ensure input border is on top
          }}
        />
        
        <FormatButton 
          onClick={increaseFontSize} 
          title="Increase Font Size" 
          extraStyle={{ fontSize: '1.2rem', lineHeight: 1, padding: '2px 8px', border: '1px solid var(--border)', borderRadius: '0 4px 4px 0', width: 'auto' }}
        >+</FormatButton>
        
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
          <div className="suggestions-list">
            {suggestions.map(note => (
              <div 
                key={note.id}
                className="suggestion"
                title="Click to insert note"
                onClick={() => handleSuggestionClick(
                  note.content,
                  activeSuggestionRange,
                  editorRef,
                  setSuggestions,
                  setCursorPosition,
                  setActiveSuggestionRange
                )}
              >
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
        aria-label="Document editor"
        onInput={handleEditorInput}
        onKeyUp={() => setTimeout(() => checkSuggestionAtCursor(editorRef, setSuggestions, setCursorPosition, findSuggestions, setActiveSuggestionRange, savedNotes, setCurrentFontSize), 0)}
        onClick={() => setTimeout(() => checkSuggestionAtCursor(editorRef, setSuggestions, setCursorPosition, findSuggestions, setActiveSuggestionRange, savedNotes, setCurrentFontSize), 0)}
      >
      </div>
    </div>
  )
}