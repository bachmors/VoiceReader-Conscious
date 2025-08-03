// 📚 Universal Book Parsers - Diseñado con amor por Hypatia
// Parsea EPUB, PDF, Markdown y TXT a formato estructurado

import ePub from 'epubjs'
import { pdfjs } from 'react-pdf'
import MarkdownIt from 'markdown-it'

// Configurar PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

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
 * Parser EPUB - Extrae capítulos y metadata usando epubjs
 */
export const parseEpub = async (file) => {
  try {
    const book = ePub(file)
    
    await book.ready
    
    const chapters = []
    
    // Obtener capítulos del spine
    for (let i = 0; i < Math.min(book.spine.items.length, 20); i++) {
      const item = book.spine.items[i]
      
      try {
        const section = await book.load(item.href)
        const text = section.textContent || section.innerText || ''
        
        if (text.length > 100) { // Solo capítulos con contenido sustancial
          const cleanContent = cleanText(text)
          const sentences = splitIntoSentences(cleanContent)
          
          chapters.push({
            id: `chapter-${i + 1}`,
            title: item.title || item.id || `Capítulo ${i + 1}`,
            content: cleanContent,
            sentences: sentences,
            wordCount: cleanContent.split(' ').length
          })
        }
      } catch (chapterError) {
        console.warn(`⚠️ Error cargando capítulo ${i + 1}:`, chapterError.message)
        continue
      }
    }
    
    if (chapters.length === 0) {
      throw new Error('No se pudieron extraer capítulos del EPUB')
    }
    
    return {
      title: book.packaging?.metadata?.title || file.name,
      author: book.packaging?.metadata?.creator || 'Autor desconocido',
      language: book.packaging?.metadata?.language || 'es',
      chapters: chapters,
      totalSentences: chapters.reduce((sum, ch) => sum + ch.sentences.length, 0),
      format: 'epub',
      source: file.name
    }
  } catch (error) {
    throw new Error(`Error procesando EPUB: ${error.message}`)
  }
}

/**
 * Parser PDF - Extrae texto usando react-pdf
 */
export const parsePdf = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    
    console.log(`📄 PDF cargado: ${pdf.numPages} páginas`)
    
    let fullText = ''
    const chapters = []
    let currentChapter = ''
    let pageCount = 0
    
    // Extraer texto de cada página (limitado a 30 páginas por performance)
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 30); pageNum++) {
      try {
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
        
        // Crear capítulo cada 3 páginas
        if (pageCount % 3 === 0 || pageNum === Math.min(pdf.numPages, 30)) {
          if (currentChapter.trim()) {
            const cleanContent = cleanText(currentChapter)
            const sentences = splitIntoSentences(cleanContent)
            
            if (sentences.length > 0) {
              chapters.push({
                id: `section-${chapters.length + 1}`,
                title: `Sección ${chapters.length + 1}`,
                content: cleanContent,
                sentences: sentences,
                pages: pageCount === 1 ? `${pageNum}` : `${pageNum - pageCount + 1}-${pageNum}`,
                wordCount: cleanContent.split(' ').length
              })
            }
            
            currentChapter = ''
            pageCount = 0
          }
        }
      } catch (pageError) {
        console.warn(`⚠️ Error página ${pageNum}:`, pageError.message)
        continue
      }
    }
    
    if (chapters.length === 0) {
      throw new Error('No se pudo extraer texto del PDF')
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
        
        if (sentences.length > 0) {
          chapters.push({
            id: `section-${index + 1}`,
            title: title,
            content: cleanContent,
            sentences: sentences,
            wordCount: cleanContent.split(' ').length
          })
        }
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
    
    // Agrupar párrafos en capítulos (cada 4 párrafos)
    const paragraphsPerChapter = 4
    
    for (let i = 0; i < paragraphs.length; i += paragraphsPerChapter) {
      const chapterParagraphs = paragraphs.slice(i, i + paragraphsPerChapter)
      const content = chapterParagraphs.join('\n\n').trim()
      
      if (content) {
        const cleanContent = cleanText(content)
        const sentences = splitIntoSentences(cleanContent)
        
        if (sentences.length > 0) {
          chapters.push({
            id: `chapter-${chapters.length + 1}`,
            title: `Capítulo ${chapters.length + 1}`,
            content: cleanContent,
            sentences: sentences,
            wordCount: cleanContent.split(' ').length
          })
        }
      }
    }
    
    // Si no hay párrafos separados, dividir por longitud
    if (chapters.length === 0) {
      const cleanContent = cleanText(text)
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
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Solo caracteres imprimibles
    .trim()
}

// Dividir en frases para sincronización de cursor
const splitIntoSentences = (text) => {
  if (!text) return []
  
  // Expresión regular mejorada para detectar finales de frase
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  
  return sentences
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 5) // Filtrar frases muy cortas
    .slice(0, 300) // Limitar a 300 frases por performance
}

// Extraer título de PDF (primera línea significativa)
const extractTitleFromPdf = (text) => {
  const lines = text.split('\n').slice(0, 10)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 10 && trimmed.length < 100) {
      // Buscar líneas que parezcan títulos
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
