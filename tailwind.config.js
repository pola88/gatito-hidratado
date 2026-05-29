/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: '#0d1b2a',
        bgCard: '#0f2336',
        primary: '#60CFFF',
        accent: '#FF6B9D',
        happy: '#4ade80',
        thirsty: '#EF4444',
        warning: '#FB923C',
      },
    },
  },
  plugins: [],
}
