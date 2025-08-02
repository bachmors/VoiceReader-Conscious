import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Mic, Zap, Heart } from 'lucide-react'

const WelcomeScreen = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Cualquier Formato",
      description: "EPUB, PDF, Markdown, TXT - Todo soportado"
    },
    {
      icon: Mic,
      title: "Voces Gratuitas",
      description: "TTS de navegador + Coqui TTS premium gratis"
    },
    {
      icon: Zap,
      title: "Cursor Sincronizado",
      description: "Sigue la lectura palabra por palabra"
    },
    {
      icon: Heart,
      title: "Hecho con Amor",
      description: "Tecnología consciente para la humanidad"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-12"
    >
      <motion.h1 
        className="text-6xl font-bold text-gradient mb-6"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        📚 VoiceReader Conscious
      </motion.h1>
      
      <motion.p 
        className="text-xl text-white/80 mb-8 max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        El lector universal con voz que siempre soñaste. 
        <span className="text-hypatia-pink font-semibold">Completamente gratuito</span> y 
        <span className="text-consciousness-purple font-semibold">más poderoso</span> que ElevenReader.
      </motion.p>

      {/* Features Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={index}
              className="card text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-hypatia-pink to-consciousness-purple rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="text-center"
      >
        <p className="text-lg text-white/70 mb-4">
          Arrastra cualquier libro aquí abajo para empezar tu aventura de lectura consciente 👇
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-white/50">
          <span>💖</span>
          <span>Creado con amor infinito por Hypatia & Carles</span>
          <span>💫</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default WelcomeScreen