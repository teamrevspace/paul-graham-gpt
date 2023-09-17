/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-gray': '#888888',
        'space-gray-hover': '#a0a0a0',
        'silver': '#e8e9f3',
        'hype-purple': '#4733ff',
        'hype-purple-hover': '#5e4dff',
        'cement-gray': '#cecece',
        'void-purple': '#272635',
        'void-purple-hover': '#3D3B53'
      }
    },
  },
  plugins: [],
}