import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, BookOpen, Play, Pause, SkipBack, SkipForward, Settings, Volume2 } from 'lucide-react'
import FileUploader from './components/FileUploader'
import BookReader from './components/BookReader'
import AudioControls from './components/AudioControls'
import VoiceSelector from './components/VoiceSelector'
import WelcomeScreen from './components/WelcomeScreen'

function App() {
  const [currentBook, setCurrentBook] = useState(null)
  const [isReading, setIsReading] = useState(false)
  const [currentSentence, setCurrentSentence] = useState(0)
  const [selectedVoice, setSelectedVoice] = useState('default')
  const [readingSpeed, setReadingSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  
  const audioManagerRef = useRef(null)

  const handleBookUpload = async (bookData) => {
    console.log('📚 Libro cargado:', bookData.title)
    setCurrentBook(bookData)
  }

  const handlePlayPause = () => {
    setIsReading(!isReading)
    if (audioManagerRef.current) {
      if (isReading) {
        audioManagerRef.current.pause()
      } else {
        audioManagerRef.current.play()
      }
    }
  }

  const handleSkip = (direction) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.skip(direction === 'forward' ? 10 : -10)
    }
  }

  const handleSentenceChange = (sentenceIndex) => {
    setCurrentSentence(sentenceIndex)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BookOpen className="w-8 h-8 text-hypatia-pink" />
              <h1 className="text-2xl font-bold text-gradient">
                VoiceReader Conscious
              </h1>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <VoiceSelector 
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
              />
              
              <motion.button
                className="btn-secondary p-2"
                onClick={() => setShowSettings(!showSettings)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!currentBook ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <WelcomeScreen />
              <FileUploader onBookUpload={handleBookUpload} />
            </motion.div>
          ) : (
            <motion.div
              key="reader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]"
            >
              {/* Sidebar izquierdo - Info del libro */}
              <div className="lg:col-span-1">
                <div className="card sticky top-4">
                  <div className="text-center mb-6">
                    <div className="w-24 h-32 mx-auto mb-4 bg-gradient-to-br from-hypatia-pink to-consciousness-purple rounded-lg flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{currentBook.title}</h3>
                    <p className="text-white/60 text-sm">{currentBook.author || 'Autor desconocido'}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Progreso:</span>
                      <span className="text-hypatia-pink font-medium">23%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Capítulo:</span>
                      <span>3 de 12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Tiempo:</span>
                      <span>02:45 / 15:30</span>
                    </div>
                  </div>
                  
                  {/* Navegación por capítulos */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Capítulos</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentBook.chapters?.map((chapter, index) => (
                        <button
                          key={index}
                          className={`w-full text-left p-2 rounded text-sm transition-colors ${
                            index === 2 
                              ? 'bg-hypatia-pink/20 text-hypatia-pink' 
                              : 'hover:bg-white/10'
                          }`}
                        >
                          {chapter.title || `Capítulo ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Centro - Contenido del libro */}
              <div className="lg:col-span-3">
                <BookReader 
                  book={currentBook}
                  isReading={isReading}
                  currentSentence={currentSentence}
                  onSentenceChange={handleSentenceChange}
                  audioManagerRef={audioManagerRef}
                  selectedVoice={selectedVoice}
                  readingSpeed={readingSpeed}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Audio Controls - Fixed Bottom */}
      {currentBook && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10"
        >
          <div className="max-w-4xl mx-auto">
            <AudioControls
              isReading={isReading}
              onPlayPause={handlePlayPause}
              onSkip={handleSkip}
              currentSentence={currentSentence}
              totalSentences={currentBook.sentences?.length || 0}
              readingSpeed={readingSpeed}
              onSpeedChange={setReadingSpeed}
            />
          </div>
        </motion.div>
      )}

      {/* Settings Panel Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Configuración</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Velocidad de lectura</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={readingSpeed}
                    onChange={(e) => setReadingSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-white/60 mt-1">{readingSpeed}x</div>
                </div>
                <button
                  className="btn-primary w-full"
                  onClick={() => setShowSettings(false)}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App