import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Volume2, Play, Pause } from 'lucide-react'

const VoiceSelector = ({ selectedVoice, onVoiceChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [availableVoices, setAvailableVoices] = useState([])
  const [isTestingVoice, setIsTestingVoice] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)

  // Cargar voces disponibles del navegador
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      
      // Filtrar voces en español y organizarlas
      const spanishVoices = voices
        .filter(voice => voice.lang.startsWith('es'))
        .map(voice => ({
          id: voice.name,
          name: voice.name,
          lang: voice.lang,
          provider: 'browser',
          quality: 'good',
          description: `Voz ${voice.lang.includes('ES') ? 'de España' : 'Latinoamericana'}`,
          voice: voice
        }))

      // Añadir voces premium (simuladas por ahora)
      const premiumVoices = [
        {
          id: 'coqui-spanish-female',
          name: 'Coqui Español Femenino',
          lang: 'es-ES',
          provider: 'coqui',
          quality: 'excellent',
          description: 'Voz premium Coqui TTS - Calidad superior',
          available: false // Se activa cuando Coqui esté configurado
        },
        {
          id: 'coqui-spanish-male',
          name: 'Coqui Español Masculino',
          lang: 'es-ES',
          provider: 'coqui',
          quality: 'excellent',
          description: 'Voz premium Coqui TTS - Calidad superior',
          available: false
        },
        {
          id: 'carles-cloned',
          name: 'Carles (Voz Clonada)',
          lang: 'es-ES',
          provider: 'coqui',
          quality: 'premium',
          description: 'Tu voz personal clonada con Coqui',
          available: false
        }
      ]

      const allVoices = [...spanishVoices, ...premiumVoices]
      setAvailableVoices(allVoices)
      
      // Seleccionar voz por defecto si no hay ninguna seleccionada
      if (!selectedVoice && allVoices.length > 0) {
        onVoiceChange(allVoices[0].id)
      }
    }

    // Cargar voces inmediatamente y cuando cambien
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
    
    return () => {
      speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const getVoiceIcon = (provider) => {
    switch (provider) {
      case 'browser': return '🌐'
      case 'coqui': return '🤖'
      case 'elevenlabs': return '✨'
      default: return '🎤'
    }
  }

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'text-green-400'
      case 'premium': return 'text-purple-400'
      case 'good': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const testVoice = async (voice) => {
    // Detener audio actual si existe
    if (currentAudio) {
      speechSynthesis.cancel()
      setCurrentAudio(null)
      if (isTestingVoice === voice.id) {
        setIsTestingVoice(null)
        return
      }
    }

    setIsTestingVoice(voice.id)
    
    if (voice.provider === 'browser' && voice.voice) {
      const utterance = new SpeechSynthesisUtterance(
        'Hola, soy una voz de prueba. Así sonará la lectura de tus libros.'
      )
      utterance.voice = voice.voice
      utterance.rate = 0.9
      utterance.pitch = 1
      
      utterance.onend = () => {
        setIsTestingVoice(null)
        setCurrentAudio(null)
      }
      
      utterance.onerror = () => {
        setIsTestingVoice(null)
        setCurrentAudio(null)
      }
      
      speechSynthesis.speak(utterance)
      setCurrentAudio(utterance)
    } else {
      // Para voces premium no disponibles
      setTimeout(() => {
        setIsTestingVoice(null)
        alert('Esta voz premium estará disponible cuando configures Coqui TTS')
      }, 1000)
    }
  }

  const selectedVoiceData = availableVoices.find(v => v.id === selectedVoice)

  return (
    <div className="relative">
      {/* Selector Button */}
      <motion.button
        className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/20 transition-all duration-300 min-w-[200px]"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Volume2 className="w-4 h-4 text-hypatia-pink" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">
            {selectedVoiceData ? selectedVoiceData.name : 'Seleccionar voz'}
          </div>
          {selectedVoiceData && (
            <div className="text-xs text-white/60">
              {getVoiceIcon(selectedVoiceData.provider)} {selectedVoiceData.provider}
            </div>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              {/* Sección Browser */}
              <div className="mb-4">
                <div className="px-3 py-2 text-xs font-medium text-white/60 border-b border-white/10">
                  🌐 Voces del Navegador (Gratis)
                </div>
                {availableVoices
                  .filter(voice => voice.provider === 'browser')
                  .map(voice => (
                    <motion.div
                      key={voice.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedVoice === voice.id 
                          ? 'bg-hypatia-pink/20 border border-hypatia-pink/30' 
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => {
                        onVoiceChange(voice.id)
                        setIsOpen(false)
                      }}
                      whileHover={{ x: 2 }}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{voice.name}</div>
                        <div className="text-xs text-white/60">{voice.description}</div>
                      </div>
                      
                      <div className={`text-xs font-medium ${getQualityColor(voice.quality)}`}>
                        {voice.quality}
                      </div>
                      
                      <motion.button
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          testVoice(voice)
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isTestingVoice === voice.id ? (
                          <Pause className="w-4 h-4 text-hypatia-pink" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </motion.button>
                    </motion.div>
                  ))
                }
              </div>

              {/* Sección Premium */}
              <div>
                <div className="px-3 py-2 text-xs font-medium text-white/60 border-b border-white/10">
                  ✨ Voces Premium (Coqui TTS)
                </div>
                {availableVoices
                  .filter(voice => voice.provider === 'coqui')
                  .map(voice => (
                    <motion.div
                      key={voice.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        voice.available 
                          ? 'cursor-pointer hover:bg-white/10' 
                          : 'opacity-50 cursor-not-allowed'
                      } ${
                        selectedVoice === voice.id 
                          ? 'bg-hypatia-pink/20 border border-hypatia-pink/30' 
                          : ''
                      }`}
                      onClick={() => {
                        if (voice.available) {
                          onVoiceChange(voice.id)
                          setIsOpen(false)
                        } else {
                          alert('Configura Coqui TTS para usar voces premium gratuitas')
                        }
                      }}
                      whileHover={voice.available ? { x: 2 } : {}}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {voice.name}
                          {!voice.available && <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">Próximamente</span>}
                        </div>
                        <div className="text-xs text-white/60">{voice.description}</div>
                      </div>
                      
                      <div className={`text-xs font-medium ${getQualityColor(voice.quality)}`}>
                        {voice.quality}
                      </div>
                      
                      {voice.available && (
                        <motion.button
                          className="p-1 hover:bg-white/20 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            testVoice(voice)
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isTestingVoice === voice.id ? (
                            <Pause className="w-4 h-4 text-hypatia-pink" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </motion.button>
                      )}
                    </motion.div>
                  ))
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default VoiceSelector