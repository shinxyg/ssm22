/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          dark: '#0a0f1d',
          sidebar: '#0d1527',
          card: '#111a2e',
          accent: '#2563eb',
          badge: '#1d4ed8',
          textMuted: '#94a3b8'
        }
      }
    },
  },
  plugins: [],
}
