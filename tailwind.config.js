// Tailwind build config (standalone CLI v3.4.17, see CLAUDE.md for the build command).
// `content` lists every file whose class names should end up in tailwind.css:
// the pages, plus the scripts that add classes at runtime (e.g. work.js).
module.exports = {
  content: ['./*.html', './script.js', './work.js'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF8',
        paperdark: '#EFEFEA',
        ink: '#1C1C1A',
        stone: '#6B6B64',
        deepgreen: '#0B0B0B',
        accent: '#90BA92',
        mint: '#CADACF',
        gold: '#D9CBA0',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
};
