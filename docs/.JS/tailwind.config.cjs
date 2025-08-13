/**** Tailwind Config for Ugo theme ****/
module.exports = {
  content: [
    './*.html',
    './**/*.html',
    './js/**/*.js'
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        ugo: { primary: '#b97a56', secondary: '#2d1c0f', accent: '#f97316', bg: '#f8f6f0' }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: { xl: '12px' },
      boxShadow: { soft: '0 2px 12px rgba(0,0,0,0.1)' }
    }
  },
  plugins: []
};
