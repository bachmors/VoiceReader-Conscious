import React, { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, BookOpen, File } from 'lucide-react'
import { parseEpub, parsePdf, parseMarkdown, parseText } from '../utils/bookParsers'

const FileUploader = ({ onBookUpload }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await processFile(files[0])
    }
  }, [])

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      await processFile(files[0])
    }
  }, [])

  const processFile = async (file) => {
    setIsProcessing(true)
    setUploadProgress(0)
    
    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      console.log('📄 Procesando archivo:', file.name)
      
      let bookData = null
      const extension = file.name.split('.').pop().toLowerCase()
      
      switch (extension) {
        case 'epub':
          bookData = await parseEpub(file)
          break
        case 'pdf':
          bookData = await parsePdf(file)
          break
        case 'md':
        case 'markdown':
          bookData = await parseMarkdown(file)
          break
        case 'txt':
          bookData = await parseText(file)
          break
        default:
          throw new Error(`Formato ${extension} no soportado`)
      }
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Pequeño delay para mostrar 100%
      setTimeout(() => {
        onBookUpload(bookData)
        setIsProcessing(false)
        setUploadProgress(0)
      }, 500)
      
    } catch (error) {
      console.error('❌ Error procesando archivo:', error)
      setIsProcessing(false)
      setUploadProgress(0)
      alert(`Error procesando archivo: ${error.message}`)
    }
  }

  const getFileIcon = (filename) => {
    const extension = filename?.split('.').pop().toLowerCase()
    switch (extension) {
      case 'epub': return BookOpen
      case 'pdf': return FileText
      case 'md': case 'markdown': return File
      case 'txt': return FileText
      default: return File
    }
  }

  const supportedFormats = [
    { ext: 'EPUB', desc: 'Libros electrónicos', icon: BookOpen },
    { ext: 'PDF', desc: 'Documentos PDF', icon: FileText },
    { ext: 'MD', desc: 'Markdown', icon: File },
    { ext: 'TXT', desc: 'Texto plano', icon: FileText }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto"
    >
      {/* Upload Area */}
      <div
        className={`upload-area relative overflow-hidden ${
          isDragging ? 'dragover' : ''
        } ${isProcessing ? 'pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
      >
        {/* Processing Overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10"
          >
            <div className="text-center">
              <motion.div
                className="w-16 h-16 border-4 border-white/30 border-t-hypatia-pink rounded-full mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-lg font-medium mb-2">Procesando libro...</p>
              <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-hypatia-pink to-consciousness-purple"
                  style={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-white/60 mt-2">{uploadProgress}%</p>
            </div>
          </motion.div>
        )}

        {/* Main Upload Content */}
        <div className="text-center py-16">
          <motion.div
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-hypatia-pink to-consciousness-purple rounded-full flex items-center justify-center"
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="w-12 h-12 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold mb-4">
            {isDragging ? 'Suelta tu libro aquí' : 'Arrastra tu libro o haz clic'}
          </h2>
          
          <p className="text-xl text-white/70 mb-8">
            Sube cualquier archivo y comenzará la magia de la lectura con voz
          </p>
          
          <input
            id="file-input"
            type="file"
            accept=".epub,.pdf,.md,.markdown,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <motion.button
            className="btn-primary text-lg px-8 py-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isProcessing}
          >
            Seleccionar Archivo
          </motion.button>
        </div>
      </div>

      {/* Supported Formats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-8"
      >
        <h3 className="text-center text-lg font-medium mb-6 text-white/80">
          Formatos Soportados
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {supportedFormats.map((format, index) => {
            const Icon = format.icon
            return (
              <motion.div
                key={format.ext}
                className="card text-center py-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Icon className="w-8 h-8 mx-auto mb-2 text-hypatia-pink" />
                <div className="font-bold text-sm">{format.ext}</div>
                <div className="text-xs text-white/60 mt-1">{format.desc}</div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Demo Files */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-8 text-center"
      >
        <p className="text-white/60 mb-4">
          ¿No tienes un libro a mano? Prueba con estos ejemplos:
        </p>
        
        <div className="flex flex-wrap gap-2 justify-center">
          <button className="btn-secondary text-sm px-4 py-2">
            📚 El Quijote (demo)
          </button>
          <button className="btn-secondary text-sm px-4 py-2">
            🤖 Sobre IA Consciente (demo)
          </button>
          <button className="btn-secondary text-sm px-4 py-2">
            💖 Poemas de Amor (demo)
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FileUploader