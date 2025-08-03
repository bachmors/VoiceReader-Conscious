// 📚 Sistema de Marcadores - VoiceReader Conscious
// Guarda progreso de lectura usando localStorage
// Creado con amor consciente por Hypatia & Carles

/**
 * Generar ID único para un libro basado en título y tamaño
 */
export const generateBookId = (book) => {
  const title = book.title || 'untitled'
  const content = book.chapters?.[0]?.content?.substring(0, 100) || ''
  return btoa(encodeURIComponent(title + content)).substring(0, 20)
}

/**
 * Guardar marcador de lectura
 */
export const saveBookmark = (book, position) => {
  try {
    const bookId = generateBookId(book)
    
    const bookmark = {
      bookId,
      title: book.title,
      author: book.author,
      format: book.format,
      chapterIndex: position.chapterIndex || 0,
      sentenceIndex: position.sentenceIndex || 0,
      chapterTitle: book.chapters?.[position.chapterIndex]?.title || 'Capítulo 1',
      percentage: calculatePercentage(book, position),
      timestamp: Date.now(),
      lastRead: new Date().toLocaleDateString('es-ES')
    }
    
    // Guardar marcador individual
    localStorage.setItem(`voicereader_bookmark_${bookId}`, JSON.stringify(bookmark))
    
    // Actualizar lista de libros recientes
    updateRecentBooks(bookmark)
    
    console.log('📖 Marcador guardado:', bookmark)
    return bookmark
  } catch (error) {
    console.error('❌ Error guardando marcador:', error)
    return null
  }
}

/**
 * Cargar marcador de lectura
 */
export const loadBookmark = (book) => {
  try {
    const bookId = generateBookId(book)
    const saved = localStorage.getItem(`voicereader_bookmark_${bookId}`)
    
    if (saved) {
      const bookmark = JSON.parse(saved)
      console.log('📖 Marcador cargado:', bookmark)
      return bookmark
    }
    
    return null
  } catch (error) {
    console.error('❌ Error cargando marcador:', error)
    return null
  }
}

/**
 * Calcular porcentaje de progreso
 */
const calculatePercentage = (book, position) => {
  if (!book.chapters || book.chapters.length === 0) return 0
  
  const totalSentences = book.totalSentences || 
    book.chapters.reduce((sum, ch) => sum + (ch.sentences?.length || 0), 0)
  
  if (totalSentences === 0) return 0
  
  // Contar frases hasta la posición actual
  let sentencesRead = 0
  
  for (let i = 0; i < position.chapterIndex; i++) {
    sentencesRead += book.chapters[i]?.sentences?.length || 0
  }
  
  sentencesRead += position.sentenceIndex || 0
  
  return Math.min(Math.round((sentencesRead / totalSentences) * 100), 100)
}

/**
 * Actualizar lista de libros recientes
 */
const updateRecentBooks = (bookmark) => {
  try {
    let recentBooks = getRecentBooks()
    
    // Remover el libro si ya existe
    recentBooks = recentBooks.filter(book => book.bookId !== bookmark.bookId)
    
    // Añadir al inicio
    recentBooks.unshift(bookmark)
    
    // Mantener solo los 10 más recientes
    recentBooks = recentBooks.slice(0, 10)
    
    localStorage.setItem('voicereader_recent_books', JSON.stringify(recentBooks))
  } catch (error) {
    console.error('❌ Error actualizando libros recientes:', error)
  }
}

/**
 * Obtener libros recientes
 */
export const getRecentBooks = () => {
  try {
    const saved = localStorage.getItem('voicereader_recent_books')
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('❌ Error cargando libros recientes:', error)
    return []
  }
}

/**
 * Eliminar marcador
 */
export const removeBookmark = (book) => {
  try {
    const bookId = generateBookId(book)
    localStorage.removeItem(`voicereader_bookmark_${bookId}`)
    
    // También remover de libros recientes
    let recentBooks = getRecentBooks()
    recentBooks = recentBooks.filter(book => book.bookId !== bookId)
    localStorage.setItem('voicereader_recent_books', JSON.stringify(recentBooks))
    
    console.log('🗑️ Marcador eliminado:', bookId)
    return true
  } catch (error) {
    console.error('❌ Error eliminando marcador:', error)
    return false
  }
}

/**
 * Obtener estadísticas de lectura
 */
export const getReadingStats = () => {
  try {
    const recentBooks = getRecentBooks()
    
    const stats = {
      totalBooks: recentBooks.length,
      completedBooks: recentBooks.filter(book => book.percentage >= 100).length,
      averageProgress: recentBooks.length > 0 
        ? Math.round(recentBooks.reduce((sum, book) => sum + book.percentage, 0) / recentBooks.length)
        : 0,
      favoriteFormat: getMostFrequentFormat(recentBooks),
      totalReadingDays: new Set(recentBooks.map(book => book.lastRead)).size
    }
    
    return stats
  } catch (error) {
    console.error('❌ Error calculando estadísticas:', error)
    return {
      totalBooks: 0,
      completedBooks: 0,
      averageProgress: 0,
      favoriteFormat: 'txt',
      totalReadingDays: 0
    }
  }
}

/**
 * Obtener formato más usado
 */
const getMostFrequentFormat = (books) => {
  if (books.length === 0) return 'txt'
  
  const formatCount = {}
  books.forEach(book => {
    formatCount[book.format] = (formatCount[book.format] || 0) + 1
  })
  
  return Object.keys(formatCount).reduce((a, b) => 
    formatCount[a] > formatCount[b] ? a : b
  )
}

/**
 * Exportar todos los marcadores (para backup)
 */
export const exportBookmarks = () => {
  try {
    const recentBooks = getRecentBooks()
    const allBookmarks = {}
    
    recentBooks.forEach(book => {
      const fullBookmark = localStorage.getItem(`voicereader_bookmark_${book.bookId}`)
      if (fullBookmark) {
        allBookmarks[book.bookId] = JSON.parse(fullBookmark)
      }
    })
    
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      recentBooks,
      bookmarks: allBookmarks,
      stats: getReadingStats()
    }
    
    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    console.error('❌ Error exportando marcadores:', error)
    return null
  }
}

/**
 * Importar marcadores desde backup
 */
export const importBookmarks = (jsonData) => {
  try {
    const data = JSON.parse(jsonData)
    
    if (data.version && data.bookmarks && data.recentBooks) {
      // Importar marcadores individuales
      Object.keys(data.bookmarks).forEach(bookId => {
        localStorage.setItem(`voicereader_bookmark_${bookId}`, JSON.stringify(data.bookmarks[bookId]))
      })
      
      // Importar libros recientes
      localStorage.setItem('voicereader_recent_books', JSON.stringify(data.recentBooks))
      
      console.log('📥 Marcadores importados correctamente')
      return true
    } else {
      throw new Error('Formato de backup inválido')
    }
  } catch (error) {
    console.error('❌ Error importando marcadores:', error)
    return false
  }
}

export default {
  saveBookmark,
  loadBookmark,
  getRecentBooks,
  removeBookmark,
  getReadingStats,
  exportBookmarks,
  importBookmarks,
  generateBookId
}