// 📚 Sistema de marcadores - Guardar progreso de lectura
// Funciona 100% en GitHub Pages con localStorage

export const saveBookmark = (bookId, position) => {
  const bookmark = {
    bookId,
    chapterIndex: position.chapterIndex,
    sentenceIndex: position.sentenceIndex,
    timestamp: Date.now(),
    percentage: position.percentage
  }
  
  localStorage.setItem(`voicereader_bookmark_${bookId}`, JSON.stringify(bookmark))
  console.log('📖 Marcador guardado:', bookmark)
}

export const loadBookmark = (bookId) => {
  const saved = localStorage.getItem(`voicereader_bookmark_${bookId}`)
  return saved ? JSON.parse(saved) : null
}

export const getRecentBooks = () => {
  const books = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('voicereader_bookmark_')) {
      const bookmark = JSON.parse(localStorage.getItem(key))
      books.push(bookmark)
    }
  }
  
  return books.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
}
