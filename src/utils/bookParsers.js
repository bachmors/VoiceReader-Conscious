// 📚 Universal Book Parsers - Diseñado con amor por Hypatia
// Parsea EPUB, PDF, Markdown y TXT a formato estructurado

import ePub from 'epub'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import MarkdownIt from 'markdown-it'

// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

/**
 * Parser universal que detecta y procesa cualquier formato
 */
export const parseBook = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase()
  
  console.log(`📖 Parseando ${extension.toUpperCase()}: ${file.name}`)
  
  switch (extension) {
    case 'epub':
      return await parseEpub(file)
    case 'pdf':
      return await parsePdf(file)
    case 'md':
    case 'markdown':
      return await parseMarkdown(file)
    case 'txt':
      return await parseText(file)
    default:
      throw new Error(`Formato ${extension} no soportado. Formatos válidos: EPUB, PDF, MD, TXT`)
  }
}

/**
 * Parser EPUB - Extrae capítulos y metadata
 */
export const parseEpub = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    
    return new Promise((resolve, reject) => {
      const book = new ePub(arrayBuffer)
      
      book.on('end', async () => {
        try {
          const chapters = []
          const spine = book.spine.spineItems
          
          for (let i = 0; i < Math.min(spine.length, 10); i++) { // Limitar a 10 capítulos por performance
            const item = spine[i]
            const chapter = await book.getChapter(item.id)
            
            if (chapter) {
              const cleanContent = cleanHTML(chapter)
              const sentences = splitIntoSentences(cleanContent)
              
              chapters.push({
                id: item.id,
                title: item.title || `Capítulo ${i + 1}`,
                content: cleanContent,
                sentences: sentences,
                wordCount: cleanContent.split(' ').length
              })
            }
          }
          
          resolve({
            title: book.metadata.title || file.name,
            author: book.metadata.creator || 'Autor desconocido',
            language: book.metadata.language || 'es',
            chapters: chapters,
            totalSentences: chapters.reduce((sum, ch) => sum + ch.sentences.length, 0),
            format: 'epub',
            source: file.name
          })
        } catch (error) {
          reject(new Error(`Error procesando EPUB: ${error.message}`))
        }
      })
      
      book.on('error', (error) => {
        reject(new Error(`Error cargando EPUB: ${error.message}`))
      })
      
      book.parse()
    })
  } catch (error) {
    throw new Error(`Error leyendo archivo EPUB: ${error.message}`)
  }
}

/**
 * Parser PDF - Extrae texto de todas las páginas
 */
export const parsePdf = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    
    console.log(`📄 PDF cargado: ${pdf.numPages} páginas`)
    
    let fullText = ''
    const chapters = []
    let currentChapter = ''
    let pageCount = 0
    
    // Extraer texto de cada página
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) { // Limitar a 50 páginas
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      let pageText = ''
      textContent.items.forEach(item => {
        if (item.str) {
          pageText += item.str + ' '
        }
      })
      
      fullText += pageText + '\n\n'
      currentChapter += pageText + ' '
      pageCount++
      
      // Crear capítulo cada 5 páginas o detectar saltos de capítulo
      if (pageCount % 5 === 0 || pageNum === pdf.numPages || detectChapterBreak(pageText)) {
        if (currentChapter.trim()) {
          const cleanContent = cleanText(currentChapter)
          const sentences = splitIntoSentences(cleanContent)
          
          chapters.push({
            id: `chapter-${chapters.length + 1}`,
            title: `Sección ${chapters.length + 1}`,
            content: cleanContent,
            sentences: sentences,
            pages: `${pageNum - pageCount + 1}-${pageNum}`,
            wordCount: cleanContent.split(' ').length
          })
          
          currentChapter = ''
          pageCount = 0
        }
      }
    }
    
    return {
      title: extractTitleFromPdf(fullText) || file.name,
      author: 'Extraído de PDF',
      language: 'es',
      chapters: chapters,
      totalSentences: chapters.reduce((sum, ch) => sum + ch.sentences.length, 0),
      format: 'pdf',
      source: file.name,
      pages: pdf.numPages
    }
  } catch (error) {
    throw new Error(`Error procesando PDF: ${error.message}`)
  }
}

/**
 * Parser Markdown - Convierte MD a estructura de capítulos
 */
export const parseMarkdown = async (file) => {
  try {
    const text = await file.text()
    const md = new MarkdownIt()
    
    // Dividir por headers de nivel 1 y 2
    const sections = text.split(/^#{1,2}\s+/gm).filter(section => section.trim())
    const chapters = []
    
    sections.forEach((section, index) => {
      const lines = section.split('\n')
      const title = lines[0]?.trim() || `Sección ${index + 1}`
      const content = lines.slice(1).join('\n').trim()
      
      if (content) {
        const cleanContent = cleanMarkdown(content)
        const sentences = splitIntoSentences(cleanContent)
        
        chapters.push({
          id: `section-${index + 1}`,
          title: title,
          content: cleanContent,
          sentences: sentences,
          wordCount: cleanContent.split(' ').length
        })
      }
    })
    
    // Si no hay secciones, tratar todo como un capítulo
    if (chapters.length === 0) {
      const cleanContent = cleanMarkdown(text)
      const sentences = splitIntoSentences(cleanContent)
      
      chapters.push({
        id: 'chapter-1',
        title: file.name,
        content: cleanContent,
        sentences: sentences,
        wordCount: cleanContent.split(' ').length
      })
    }
    
    return {
      title: chapters[0]?.title || file.name,
      author: 'Documento Markdown',
      language: 'es',
      chapters: chapters,
      totalSentences: chapters.reduce((sum, ch) => sum + ch.sentences.length, 0),
      format: 'markdown',
      source: file.name
    }
  } catch (error) {
    throw new Error(`Error procesando Markdown: ${error.message}`)
  }
}

/**
 * Parser Texto Plano - Divide en párrafos
 */
export const parseText = async (file) => {
  try {
    const text = await file.text()
    
    // Dividir por párrafos vacíos
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())
    const chapters = []
    
    // Agrupar párrafos en capítulos (cada 3-5 párrafos)
    const paragraphsPerChapter = 4
    
    for (let i = 0; i < paragraphs.length; i += paragraphsPerChapter) {
      const chapterParagraphs = paragraphs.slice(i, i + paragraphsPerChapter)
      const content = chapterParagraphs.join('\n\n').trim()
      
      if (content) {
        const cleanContent = cleanText(content)
        const sentences = splitIntoSentences(cleanContent)
        
        chapters.push({
          id: `chapter-${chapters.length + 1}`,
          title: `Capítulo ${chapters.length + 1}`,
          content: cleanContent,
          sentences: sentences,
          wordCount: cleanContent.split(' ').length
        })
      }
    }
    
    return {
      title: extractTitleFromText(text) || file.name,
      author: 'Texto sin formato',
      language: 'es',
      chapters: chapters,
      totalSentences: chapters.reduce((sum, ch) => sum + ch.sentences.length, 0),
      format: 'text',
      source: file.name
    }
  } catch (error) {
    throw new Error(`Error procesando texto: ${error.message}`)
  }
}

/**
 * Utilidades de limpieza y procesamiento
 */

// Limpiar HTML y extraer solo texto
const cleanHTML = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return cleanText(div.textContent || div.innerText || '')
}

// Limpiar Markdown
const cleanMarkdown = (text) => {
  return text
    .replace(/[*_~`]/g, '') // Quitar markdown formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links: [text](url) -> text
    .replace(/#{1,6}\s*/g, '') // Headers
    .replace(/^[-*+]\s+/gm, '') // Lista items
    .replace(/^\d+\.\s+/gm, '') // Lista numerada
    .trim()
}

// Limpiar texto general
const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ') // Múltiples espacios -> uno
    .replace(/\n+/g, ' ') // Múltiples saltos -> espacio
    .replace(/[\x00-\x1F\x7F]/g, '') // Caracteres de control
    .trim()
}

// Dividir en frases para sincronización de cursor
const splitIntoSentences = (text) => {
  // Expresión regular para detectar finales de frase
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  
  return sentences
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 10) // Filtrar frases muy cortas
    .slice(0, 500) // Limitar a 500 frases por performance
}

// Detectar salto de capítulo en PDF
const detectChapterBreak = (pageText) => {
  const chapterKeywords = [
    /capítulo\s+\d+/i,
    /chapter\s+\d+/i,
    /^\d+\./m,
    /parte\s+\d+/i
  ]
  
  return chapterKeywords.some(regex => regex.test(pageText))
}

// Extraer título de PDF (primera línea en mayúsculas)
const extractTitleFromPdf = (text) => {
  const lines = text.split('\n').slice(0, 10)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 10 && trimmed.length < 100) {
      if (trimmed === trimmed.toUpperCase() || /^[A-Z][^.]*$/.test(trimmed)) {
        return trimmed
      }
    }
  }
  return null
}

// Extraer título de texto (primera línea no vacía)
const extractTitleFromText = (text) => {
  const lines = text.split('\n')
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim()
    if (trimmed.length > 5 && trimmed.length < 100 && !trimmed.includes('\t')) {
      return trimmed
    }
  }
  return null
}

export default {
  parseBook,
  parseEpub,
  parsePdf,
  parseMarkdown,
  parseText
}