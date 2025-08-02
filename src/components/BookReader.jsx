import React, { useEffect, useRef, useState, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'
import { AudioManager } from '../utils/audioManager'

const BookReader = React.forwardRef(({ 
  book, 
  isReading, 
  currentSentence, 
  onSentenceChange, 
  audioManagerRef, 
  selectedVoice, 
  readingSpeed 
}, ref) => {
  const textContainerRef = useRef(null)
  const [audioManager] = useState(() => new AudioManager())
  const [currentChapter, setCurrentChapter] = useState(0)
  const [sentences, setSentences] = useState([])
  const [selectedText, setSelectedText] = useState('')

  // Exponer métodos del audio manager
  useImperativeHandle(audioManagerRef, () => ({
    play: () => audioManager.play(),
    pause: () => audioManager.pause(),
    skip: (seconds) => audioManager.skip(seconds),
    setSpeed: (speed) => audioManager.setSpeed(speed),
    jumpToSentence: (index) => audioManager.jumpToSentence(index)
  }))

  // Procesar libro cuando cambia
  useEffect(() => {
    if (book && book.chapters && book.chapters.length > 0) {
      const chapter = book.chapters[currentChapter]
      if (chapter && chapter.sentences) {
        setSentences(chapter.sentences)
        audioManager.loadChapter(chapter, selectedVoice)
      }
    }
  }, [book, currentChapter, selectedVoice])

  // Configurar audio manager
  useEffect(() => {
    if (audioManager) {
      audioManager.setSpeed(readingSpeed)
      audioManager.onSentenceChange = onSentenceChange
      audioManager.onProgress = (progress) => {
        // Actualizar UI basado en progreso
        console.log('🎥 Progreso:', progress)
      }
    }
  }, [audioManager, readingSpeed, onSentenceChange])

  // Manejar selección de texto
  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    setSelectedText(text)
    
    if (text) {
      console.log('📝 Texto seleccionado:', text)
    }
  }

  // Reproducir texto seleccionado
  const playSelectedText = async () => {
    if (selectedText && audioManager) {
      await audioManager.speakText(selectedText)
    }
  }

  // Saltar a frase clickeada
  const handleSentenceClick = (sentenceIndex) => {
    onSentenceChange(sentenceIndex)
    if (audioManagerRef.current) {
      audioManagerRef.current.jumpToSentence(sentenceIndex)
    }
  }

  const renderSentence = (sentence, index) => {
    const isCurrent = index === currentSentence
    const isNext = index === currentSentence + 1
    const isPrevious = index < currentSentence
    
    return (
      <motion.span
        key={index}
        className={`
          inline-block cursor-pointer transition-all duration-300 rounded-lg mx-1 px-2 py-1
          ${isCurrent ? 'sentence-current reading-cursor' : ''}
          ${isNext ? 'sentence-next' : ''}
          ${isPrevious ? 'opacity-70' : ''}
          hover:bg-white/10
        `}
        onClick={() => handleSentenceClick(index)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        data-sentence={index}
      >
        {sentence}
        {isCurrent && isReading && (
          <motion.span
            className="inline-block w-1 h-5 bg-hypatia-pink ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.span>
    )
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white/60">
          <p>No hay libro cargado</p>
        </div>
      </div>
    )
  }

  const currentChapterData = book.chapters?.[currentChapter]

  return (
    <div className="h-full flex flex-col">
      {/* Chapter Navigation */}
      {book.chapters && book.chapters.length > 1 && (
        <div className="mb-6 flex items-center gap-4">
          <button
            className="btn-secondary px-3 py-1 text-sm"
            onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
            disabled={currentChapter === 0}
          >
            ← Anterior
          </button>
          <span className="text-white/80 text-sm">
            Capítulo {currentChapter + 1} de {book.chapters.length}
          </span>
          <button
            className="btn-secondary px-3 py-1 text-sm"
            onClick={() => setCurrentChapter(Math.min(book.chapters.length - 1, currentChapter + 1))}
            disabled={currentChapter === book.chapters.length - 1}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Selected Text Controls */}
      {selectedText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-hypatia-pink/10 border border-hypatia-pink/30 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">
              Texto seleccionado: "{selectedText.substring(0, 50)}..."
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary px-3 py-1 text-sm"
                onClick={playSelectedText}
              >
                🔊 Reproducir
              </button>
              <button
                className="btn-secondary px-3 py-1 text-sm"
                onClick={() => setSelectedText('')}
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reading Area */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          ref={textContainerRef}
          className="card h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Chapter Title */}
          {currentChapterData?.title && (
            <motion.h2
              className="text-2xl font-bold mb-6 text-gradient"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentChapterData.title}
            </motion.h2>
          )}

          {/* Text Content */}
          <div
            className="reading-text leading-loose text-justify"
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            {sentences.length > 0 ? (
              <div className="space-y-4">
                {sentences.map((sentence, index) => renderSentence(sentence, index))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentChapterData?.content?.split('.').map((sentence, index) => {
                  if (sentence.trim()) {
                    return renderSentence(sentence.trim() + '.', index)
                  }
                  return null
                })}
              </div>
            )}
          </div>

          {/* Chapter Progress */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex justify-between text-sm text-white/60">
              <span>Progreso del capítulo:</span>
              <span>{Math.round((currentSentence / sentences.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-hypatia-pink to-consciousness-purple"
                initial={{ width: 0 }}
                animate={{ width: `${(currentSentence / sentences.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
})

BookReader.displayName = 'BookReader'

export default BookReader