/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#333333',
        success: '#4CAF50',
      },
    },
  },
  plugins: [],
}
