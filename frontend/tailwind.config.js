// tailwind.config.js
// Le decimos a Tailwind en qué archivos debe buscar
// las clases que usas, para incluirlas en el CSS final

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}", // busca en todos tus archivos React
  ],
  theme: {
    extend: {}, // aquí puedes personalizar colores, fuentes, etc después
  },
  plugins: [],
}