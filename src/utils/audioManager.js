// 🎵 Audio Manager - El corazón de VoiceReader Conscious
// Gestiona TTS, sincronización de cursor y controles de audio

/**
 * Gestor principal de audio para VoiceReader
 * Maneja síntesis de voz, sincronización y controles
 */
export class AudioManager {
  constructor() {
    this.isInitialized = false
    this.isPlaying = false
    this.isPaused = false
    this.currentSentence = 0
    this.sentences = []
    this.currentVoice = null
    this.speed = 1.0
    this.pitch = 1.0
    this.volume = 0.8
    
    // Callbacks
    this.onSentenceChange = null
    this.onProgress = null
    this.onEnd = null
    
    // Audio context y elementos
    this.utterance = null
    this.audioQueue = []
    this.startTime = 0
    this.pausedTime = 0
    
    // Configuración
    this.sentencePause = 500 // ms entre frases
    this.enableHighlighting = true
    
    this.init()
  }
  
  /**
   * Inicializar el sistema de audio
   */
  async init() {
    try {
      // Verificar soporte de Speech Synthesis
      if (!('speechSynthesis' in window)) {
        throw new Error('Speech Synthesis no soportado en este navegador')
      }
      
      // Cargar voces disponibles
      await this.loadVoices()
      
      this.isInitialized = true
      console.log('🎵 AudioManager inicializado correctamente')
      
    } catch (error) {
      console.error('❌ Error inicializando AudioManager:', error)
      throw error
    }
  }
  
  /**
   * Cargar voces disponibles del navegador
   */
  async loadVoices() {
    return new Promise((resolve) => {
      const getVoices = () => {
        const voices = speechSynthesis.getVoices()
        if (voices.length > 0) {
          // Preferir voces en español
          const spanishVoice = voices.find(voice => 
            voice.lang.startsWith('es') && voice.name.includes('Google')
          ) || voices.find(voice => voice.lang.startsWith('es'))
          
          this.currentVoice = spanishVoice || voices[0]
          console.log('🗣️ Voz seleccionada:', this.currentVoice.name)
          resolve(voices)
        } else {
          // Retry si las voces no han cargado aún
          setTimeout(getVoices, 100)
        }
      }
      
      speechSynthesis.onvoiceschanged = getVoices
      getVoices() // Intentar inmediatamente también
    })
  }
  
  /**
   * Cargar capítulo para lectura
   */
  loadChapter(chapter, voiceId = null) {
    if (!chapter || !chapter.sentences) {
      console.warn('⚠️ Capítulo inválido o sin frases')
      return
    }
    
    this.sentences = chapter.sentences
    this.currentSentence = 0
    
    // Cambiar voz si se especifica
    if (voiceId) {
      this.setVoice(voiceId)
    }
    
    console.log(`📖 Capítulo cargado: ${this.sentences.length} frases`)
  }
  
  /**
   * Cambiar voz activa
   */
  setVoice(voiceId) {
    const voices = speechSynthesis.getVoices()
    const voice = voices.find(v => v.name === voiceId)
    
    if (voice) {
      this.currentVoice = voice
      console.log('🗣️ Voz cambiada a:', voice.name)
    } else {
      console.warn('⚠️ Voz no encontrada:', voiceId)
    }
  }
  
  /**
   * Reproducir desde la frase actual
   */
  async play() {
    if (!this.isInitialized) {
      console.warn('⚠️ AudioManager no inicializado')
      return
    }
    
    if (this.sentences.length === 0) {
      console.warn('⚠️ No hay frases para reproducir')
      return
    }
    
    this.isPlaying = true
    this.isPaused = false
    this.startTime = Date.now() - this.pausedTime
    
    console.log(`▶️ Reproduciendo desde frase ${this.currentSentence}`)
    
    await this.playCurrentSentence()
  }
  
  /**
   * Pausar reproducción
   */
  pause() {
    this.isPlaying = false
    this.isPaused = true
    this.pausedTime = Date.now() - this.startTime
    
    // Detener speech synthesis
    speechSynthesis.cancel()
    
    console.log('⏸️ Reproducción pausada')
  }
  
  /**
   * Detener completamente
   */
  stop() {
    this.isPlaying = false
    this.isPaused = false
    this.pausedTime = 0
    this.currentSentence = 0
    
    speechSynthesis.cancel()
    
    console.log('⏹️ Reproducción detenida')
  }
  
  /**
   * Saltar segundos adelante o atrás
   */
  skip(seconds) {
    const sentencesPerSecond = 0.3 // Aproximadamente 1 frase cada 3 segundos
    const sentencesToSkip = Math.round(seconds * sentencesPerSecond)
    
    const newSentence = Math.max(0, 
      Math.min(this.sentences.length - 1, this.currentSentence + sentencesToSkip)
    )
    
    this.jumpToSentence(newSentence)
    
    console.log(`⏭️ Saltado ${seconds}s (${sentencesToSkip} frases) a frase ${newSentence}`)
  }
  
  /**
   * Saltar a frase específica
   */
  jumpToSentence(sentenceIndex) {
    if (sentenceIndex >= 0 && sentenceIndex < this.sentences.length) {
      this.currentSentence = sentenceIndex
      
      // Actualizar callback
      if (this.onSentenceChange) {
        this.onSentenceChange(sentenceIndex)
      }
      
      // Si está reproduciendo, continuar desde nueva posición
      if (this.isPlaying) {
        speechSynthesis.cancel()
        setTimeout(() => this.playCurrentSentence(), 100)
      }
    }
  }
  
  /**
   * Cambiar velocidad de reproducción
   */
  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(3.0, speed))
    console.log(`🏃 Velocidad cambiada a: ${this.speed}x`)
  }
  
  /**
   * Cambiar tono de voz
   */
  setPitch(pitch) {
    this.pitch = Math.max(0.1, Math.min(2.0, pitch))
    console.log(`🎵 Tono cambiado a: ${this.pitch}`)
  }
  
  /**
   * Cambiar volumen
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    console.log(`🔊 Volumen cambiado a: ${this.volume}`)
  }
  
  /**
   * Reproducir frase actual
   */
  async playCurrentSentence() {
    if (!this.isPlaying || this.currentSentence >= this.sentences.length) {
      this.onPlaybackEnd()
      return
    }
    
    const sentence = this.sentences[this.currentSentence]
    
    // Actualizar callback de cambio de frase
    if (this.onSentenceChange) {
      this.onSentenceChange(this.currentSentence)
    }
    
    // Crear utterance
    this.utterance = new SpeechSynthesisUtterance(sentence)
    this.utterance.voice = this.currentVoice
    this.utterance.rate = this.speed
    this.utterance.pitch = this.pitch
    this.utterance.volume = this.volume
    
    // Configurar eventos
    this.utterance.onend = () => {
      if (this.isPlaying) {
        this.currentSentence++
        
        // Pausa entre frases
        setTimeout(() => {
          this.playCurrentSentence()
        }, this.sentencePause)
      }
    }
    
    this.utterance.onerror = (error) => {
      console.error('❌ Error en speech synthesis:', error)
      this.onPlaybackEnd()
    }
    
    // Emitir progreso
    if (this.onProgress) {
      const progress = this.currentSentence / this.sentences.length
      this.onProgress(progress)
    }
    
    // Iniciar síntesis
    speechSynthesis.speak(this.utterance)
    
    console.log(`🗣️ Reproduciendo frase ${this.currentSentence}: "${sentence.substring(0, 50)}..."`)
  }
  
  /**
   * Reproducir texto específico (para selecciones)
   */
  async speakText(text) {
    if (!this.isInitialized) {
      console.warn('⚠️ AudioManager no inicializado')
      return
    }
    
    // Pausar reproducción actual si está activa
    const wasPlaying = this.isPlaying
    if (wasPlaying) {
      this.pause()
    }
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = this.currentVoice
      utterance.rate = this.speed
      utterance.pitch = this.pitch
      utterance.volume = this.volume
      
      utterance.onend = () => {
        console.log('✅ Texto personalizado reproducido')
        
        // Reanudar reproducción si estaba activa
        if (wasPlaying) {
          setTimeout(() => this.play(), 500)
        }
        
        resolve()
      }
      
      utterance.onerror = (error) => {
        console.error('❌ Error reproduciendo texto:', error)
        reject(error)
      }
      
      speechSynthesis.speak(utterance)
      console.log(`🎤 Reproduciendo texto seleccionado: "${text.substring(0, 50)}..."`)
    })
  }
  
  /**
   * Finalización de reproducción
   */
  onPlaybackEnd() {
    this.isPlaying = false
    this.isPaused = false
    
    console.log('🏁 Reproducción completada')
    
    if (this.onEnd) {
      this.onEnd()
    }
  }
  
  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentSentence: this.currentSentence,
      totalSentences: this.sentences.length,
      progress: this.sentences.length > 0 ? this.currentSentence / this.sentences.length : 0,
      currentVoice: this.currentVoice?.name,
      speed: this.speed,
      pitch: this.pitch,
      volume: this.volume
    }
  }
  
  /**
   * Limpiar recursos
   */
  destroy() {
    this.stop()
    speechSynthesis.cancel()
    
    this.sentences = []
    this.onSentenceChange = null
    this.onProgress = null
    this.onEnd = null
    
    console.log('🧹 AudioManager limpiado')
  }
}

export default AudioManager