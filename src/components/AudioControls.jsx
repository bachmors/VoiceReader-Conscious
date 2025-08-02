import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Settings,
  Repeat,
  Shuffle
} from 'lucide-react'

const AudioControls = ({ 
  isReading, 
  onPlayPause, 
  onSkip, 
  currentSentence, 
  totalSentences, 
  readingSpeed, 
  onSpeedChange 
}) => {
  const [volume, setVolume] = useState(80)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off', 'one', 'all'
  const [isShuffleOn, setIsShuffleOn] = useState(false)

  // Simular progreso de tiempo (en una implementación real vendría del audio manager)
  useEffect(() => {
    let interval
    if (isReading) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1
          if (newTime >= totalTime && totalTime > 0) {
            return totalTime
          }
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isReading, totalTime])

  // Estimar tiempo total basado en frases (aprox 3 segundos por frase)
  useEffect(() => {
    if (totalSentences > 0) {
      setTotalTime(totalSentences * 3)
    }
  }, [totalSentences])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = Math.floor(percentage * totalTime)
    setCurrentTime(newTime)
    
    // En implementación real, saltar a ese punto en el audio
    console.log('🔊 Saltando a:', newTime, 'segundos')
  }

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume)
    // En implementación real, cambiar volumen del audio manager
    console.log('🔊 Volumen:', newVolume)
  }

  const toggleRepeat = () => {
    const modes = ['off', 'one', 'all']
    const currentIndex = modes.indexOf(repeatMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setRepeatMode(nextMode)
  }

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one': return '🔂'
      case 'all': return '🔁'
      default: return '🔁'
    }
  }

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="audio-controls w-full"
    >
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-white/60 mb-2">
          <span>Frase {currentSentence + 1} de {totalSentences}</span>
          <span>{formatTime(currentTime)} / {formatTime(totalTime)}</span>
        </div>
        
        <div 
          className="w-full h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-hypatia-pink to-consciousness-purple relative"
            style={{ width: `${totalTime > 0 ? (currentTime / totalTime) * 100 : 0}%` }}
            transition={{ duration: 0.1 }}
          >
            <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
          </motion.div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        {/* Left Side - Secondary Controls */}
        <div className="flex items-center gap-3">
          <motion.button
            className={`p-2 rounded-lg transition-colors ${
              repeatMode !== 'off' ? 'bg-hypatia-pink/20 text-hypatia-pink' : 'hover:bg-white/10'
            }`}
            onClick={toggleRepeat}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={`Repetir: ${repeatMode}`}
          >
            <span className="text-lg">{getRepeatIcon()}</span>
          </motion.button>
          
          <motion.button
            className={`p-2 rounded-lg transition-colors ${
              isShuffleOn ? 'bg-hypatia-pink/20 text-hypatia-pink' : 'hover:bg-white/10'
            }`}
            onClick={() => setIsShuffleOn(!isShuffleOn)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Orden aleatorio"
          >
            <Shuffle className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Center - Primary Controls */}
        <div className="flex items-center gap-4">
          <motion.button
            className="p-3 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => onSkip('back')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Retroceder 10 segundos"
          >
            <SkipBack className="w-6 h-6" />
          </motion.button>

          <motion.button
            className="w-16 h-16 bg-gradient-to-r from-hypatia-pink to-consciousness-purple rounded-full flex items-center justify-center text-white shadow-lg"
            onClick={onPlayPause}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isReading ? { boxShadow: "0 0 20px rgba(255, 20, 147, 0.5)" } : {}}
          >
            {isReading ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </motion.button>

          <motion.button
            className="p-3 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => onSkip('forward')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Avanzar 10 segundos"
          >
            <SkipForward className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Right Side - Settings */}
        <div className="flex items-center gap-3">
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-white/60" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-white/60 w-8">{volume}%</span>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <select
              value={readingSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
            >
              {speedOptions.map(speed => (
                <option key={speed} value={speed} className="bg-black">
                  {speed}x
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Settings Toggle */}
          <motion.button
            className={`p-2 rounded-lg transition-colors ${
              showAdvanced ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            onClick={() => setShowAdvanced(!showAdvanced)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Configuración avanzada"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Advanced Controls Panel */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 pt-4 border-t border-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Reading Mode */}
            <div>
              <label className="block text-white/60 mb-2">Modo de lectura</label>
              <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2">
                <option value="continuous" className="bg-black">Continuo</option>
                <option value="sentence" className="bg-black">Frase por frase</option>
                <option value="paragraph" className="bg-black">Párrafo por párrafo</option>
              </select>
            </div>

            {/* Voice Settings */}
            <div>
              <label className="block text-white/60 mb-2">Configuración de voz</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Tono:</span>
                  <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" className="w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Pausa:</span>
                  <input type="range" min="0" max="2" step="0.1" defaultValue="0.5" className="w-20" />
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <label className="block text-white/60 mb-2">Atajos de teclado</label>
              <div className="space-y-1 text-xs text-white/50">
                <div>Espacio: Play/Pausa</div>
                <div>←/→: Retroceder/Avanzar</div>
                <div>↑/↓: Velocidad +/-</div>
                <div>R: Repetir</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default AudioControls