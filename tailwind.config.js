/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#357d7f',
        secondary: '#D4AF37',
        background: 'var(--color-bg)',
        surface: '#fef9f2',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
        scheherazade: ['Scheherazade New', 'serif'],
      },
      backgroundImage: {
        'islamic-pattern': "url('/patterns/islamic-pattern.svg')",
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
        '20': 'repeat(20, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
}
