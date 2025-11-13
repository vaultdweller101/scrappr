# Scrappr

![Scrappr Logo](assets/scrappr.png)

Scrappr is a smart, distraction-free document editor built with React and TypeScript. It combines a rich-text document editor with an intelligent note-taking system, suggesting relevant notes from your collection in real-time as you write.

This project was built to be a simple, persistent, and intelligent writing environment that saves your work locally and helps you connect your ideas.

***

## Features

* **Smart Note Suggestions:** As you type a sentence, a "Related Notes" pop-up appears with relevant notes from your collection, scored by relevance.
* **Click-to-Insert:** Instantly insert the full content of a suggested note directly into your document.
* **Persistent Document:** All document content (including formatting) is automatically saved to `localStorage` as you type—never lose your work on a refresh.
* **Persistent Notes:** A separate "Notes" tab to create, edit, and delete notes. All notes are saved to `localStorage`.
* **Rich Text Toolbar:**
    * Bold, Italic, Underline
    * Left, Center, Right, and Justify alignment
    * Increase/Decrease font size
    * Manually type in a specific font size (e.g., 12, 18, 24)
* **Export Options:** Export your document as a **PDF** or a **Microsoft Word (`.docx`)** file.

***

## Tech Stack

* **Framework:** React
* **Language:** TypeScript
* **Build Tool:** Vite
* **Document Export:**
    * `html2canvas` & `jspdf` for PDF export
    * `docx` & `file-saver` for Word export
* **Styling:** Plain CSS with CSS Variables

***

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v18 or later recommended)
* npm (or pnpm/yarn)

### Installation

1.  Clone the repo:
    ```sh
    git clone https://github.com/vaultdweller101/scrappr
    ```
2.  Navigate to the project directory:
    ```sh
    cd scrappr
    ```
3.  Install NPM packages:
    ```sh
    npm install
    ```
4.  Run the development server:
    ```sh
    npm run dev
    ```
5.  Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

***

## Acknowledgements

* Icons provided by [Flaticon](https://www.flaticon.com/)