import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'dusty-rose': 'var(--dusty-rose)',
        'blush': 'var(--blush)',
        'champagne-gold': 'var(--champagne-gold)',
        'ivory': 'var(--ivory)',
        'surface': 'var(--surface)',
        'charcoal': 'var(--charcoal)',
        'warm-grey': 'var(--warm-grey)',
        'petal': 'var(--petal)',
      },
      fontFamily: {
        sans: ["'DM Sans'", 'system-ui', 'sans-serif'],
        display: ["'Cormorant Garamond'", 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
