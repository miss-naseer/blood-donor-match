/** Colours and font used across the app. Change them here and every page updates. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blood: { DEFAULT: '#A11D2E', dark: '#7E1523', soft: '#FBEDEE' },
        ink: '#1D2733',
        muted: '#5E6977',
        line: '#DDE2E8',
        canvas: '#F5F6F8',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
