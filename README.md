# scrappr
An app used for managing ideas and inspirations for writers

## scrappr-web (local dev)

This workspace now includes a small React + Vite app (`scrappr-web`) that provides a simple rich-text editor and export buttons for PDF and Word.

Quick start:

1. Install dependencies:

	npm install

2. Start the dev server:

	npm run dev

3. Open http://localhost:5173 in your browser.

Notes:
- Export to PDF uses html2canvas + jsPDF.
- Export to Word uses html-docx-js and file-saver.

# Demo here:

[![Demo](assets/scrappr.png)](https://www.youtube.com/watch?v=t5cJEN5DwcY)

# For development

1. Run eslint to detect issue with TypeScript code

	npx eslint src/