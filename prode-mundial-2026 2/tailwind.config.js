/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030a1a',
          900: '#050d1f',
          800: '#081428',
          700: '#0d1f3c',
          600: '#132b52',
        },
        gold: {
          300: '#ffe066',
          400: '#ffd700',
          500: '#f0a500',
          600: '#d4920a',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        body: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
