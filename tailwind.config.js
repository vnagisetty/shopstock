/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#E0F2F1',
          600: '#00897B',
          700: '#00796B',
        },
      },
    },
  },
  plugins: [],
}
