/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f4f6fa',
          100: '#e9edf5',
          200: '#c8d4e6',
          300: '#a7bace',
          400: '#6586a3',
          500: '#385d7f',
          600: '#2b4b68',
          700: '#1d354c',
          800: '#0f2030',
          900: '#071018',
          950: '#03080c',
        },
        brand: {
          primary: '#0f2030', // Deep Navy
          secondary: '#1d354c',
          teal: '#0ea5e9', // Teal Accent
          green: '#10b981', // Green Accent
          yellow: '#f59e0b', // Warning
          orange: '#f97316', // Critical
          red: '#ef4444', // Exceeded
          background: '#f8fafc', // Light slate background
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(15, 32, 48, 0.06), 0 2px 6px -1px rgba(15, 32, 48, 0.03)',
      }
    },
  },
  plugins: [],
}
