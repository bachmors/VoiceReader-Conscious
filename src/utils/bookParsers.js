// 📚 Universal Book Parsers - Diseñado con amor por Hypatia
// Parsea Markdown y TXT a formato estructurado (EPUB/PDF próximamente)

import MarkdownIt from 'markdown-it'

/**
 * Parser universal que detecta y procesa formatos compatibles
 */
export const parseBook = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase()
  
  console.log(`📖 Parseando ${extension.toUpperCase()}: ${file.name}`)
  
  switch (extension) {
    case 'md':
    case 'markdown':
      return await parseMarkdown(file)
    case 'txt':
      return await parseText(file)
    case 'epub':
      throw new Error(`📚 EPUB estará disponible pronto. Por ahora usa TXT o MD.`)
    case 'pdf':
      throw new Error(`📄 PDF estará disponible pronto. Por ahora usa TXT o MD.`)
    default:
      throw new Error(`Formato ${extension} no soportado. Formatos válidos: TXT, MD`)
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
  parseMarkdown,
  parseText
}
