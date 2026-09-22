// Shared Tailwind CDN config: loaded by every page after the Tailwind script
tailwind.config = {
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF8',
        paperdark: '#EFEFEA',
        ink: '#1C1C1A',
        stone: '#6B6B64',
        deepgreen: '#212721',
        accent: '#90BA92',
        mint: '#CADACF',
        gold: '#D9CBA0',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    }
  }
};
