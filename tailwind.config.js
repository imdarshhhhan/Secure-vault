/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#0f1d2b', 700: '#2b3a4a', 500: '#5b6a79', 300: '#aab4be', 200: '#d5dbe1', 100: '#eaeef1', 50: '#f5f7f8' },
        vault: { 700: '#0b5d63', 600: '#0f7078', 500: '#16868f', 100: '#d9eef0', 50: '#eef8f9' },
        brass: { 700: '#8a5a00', 100: '#fbf0d2' },
        alarm: { 700: '#a12b2b', 100: '#fbe4e4' },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
