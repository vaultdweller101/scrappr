// allow importing png/jpg/svg if needed
declare module '*.png'
declare module '*.jpg'
declare module '*.svg'
declare module 'html-docx-js/dist/html-docx' {
  const htmlDocx: (content: string, options?: object) => Blob
  export default htmlDocx
}

declare module 'html-docx-js' {
  const htmlDocx: (content: string, options?: object) => Blob
  export default htmlDocx
}

// allow importing png/jpg/svg if needed
declare module '*.png'
declare module '*.jpg'
declare module '*.svg'
