/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        coffee: {
          50: '#fdf8f0',
          100: '#f9ecd9',
          200: '#f0d4ac',
          300: '#e5b87a',
          400: '#d8964a',
          500: '#c97c2e',
          600: '#b06523',
          700: '#8f4f1f',
          800: '#6b3a1a',
          900: '#442d1d',
          950: '#2a1a0e',
        },
        cream: '#fffaf1',
        bark: '#ecd7b1',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        steamRise: {
          '0%': { opacity: '0.6', transform: 'translateY(0) scaleX(1)' },
          '50%': { opacity: '0.3', transform: 'translateY(-12px) scaleX(1.3)' },
          '100%': { opacity: '0', transform: 'translateY(-24px) scaleX(0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'steam': 'steamRise 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      }
    },
  },
  plugins: [],
}
