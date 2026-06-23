/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#17161f',      // pour fond principal, menus, barres de navigation
          light: '#e2e1e9',     // pour fonds de cartes ou sections
          gray: '#A5A5A8',      // pour texte secondaire, labels, séparateurs
          white: '#fcfcfd',     // pour textes sur foncé, zones importantes
          accent: '#00BCF2',    // pour accent pour boutons, liens et éléments interactifs
          purple: '#6366f1',    // couleur principale pour éléments interactifs
        },
      },
      fontFamily: {
        sans: ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

