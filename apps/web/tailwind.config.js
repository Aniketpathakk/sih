/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aicte: {
          blue: '#1E3A8A',
          gold: '#D97706',
          green: '#059669',
          crimson: '#DC2626',
        }
      }
    },
  },
  plugins: [],
}

