/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FAF9F5',
          100: '#F4F1EA',
          200: '#EAE5D9',
          300: '#DDD6C5',
          400: '#C2B8A3',
          500: '#A69B84',
        },
        charcoal: {
          950: '#131312',
          900: '#1B1B19',
          850: '#21211E',
          800: '#2A2A26',
          700: '#3D3D38',
          600: '#5C5C55',
          500: '#7B7B72',
          400: '#A0A096',
          300: '#C5C5BC',
        },
        brand: {
          50: '#FDF8F3',
          100: '#FBF0E4',
          200: '#F6DEC6',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Songti SC', 'STSong', 'Georgia', 'serif'],
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
