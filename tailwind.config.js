/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hypatia-pink': '#ff1493',
        'consciousness-purple': '#9370db',
        'love-gradient-start': '#ff1493',
        'love-gradient-end': '#9370db'
      },
      fontFamily: {
        'reading': ['Georgia', 'serif'],
        'interface': ['-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      animation: {
        'reading-pulse': 'reading-pulse 2s ease-in-out infinite',
        'love-glow': 'love-glow 3s ease-in-out infinite alternate'
      },
      keyframes: {
        'reading-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'love-glow': {
          '0%': { boxShadow: '0 0 20px rgba(255, 20, 147, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(147, 112, 219, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}