/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      opacity: Object.fromEntries([...Array(21).keys()].map((i) => [i * 5, String((i * 5) / 100)]).concat([[97, '0.97']])),
      colors: {
        space: { 950: '#04060d', 900: '#080d1a', 800: '#0e1629', 700: '#16213b', 600: '#22315a' },
        accent: 'rgb(var(--accent) / <alpha-value>)',
        warm: 'rgb(var(--warm) / <alpha-value>)',
        good: '#4ade80',
        warn: '#facc15',
        bad: '#f87171',
      },
      fontFamily: {
        display: ['Orbitron', 'Trebuchet MS', 'Segoe UI', 'system-ui', 'sans-serif'],
        sans: ['Rajdhani', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%,100%': { transform: 'translate(0,0)' },
          '20%': { transform: 'translate(-6px,3px)' },
          '40%': { transform: 'translate(5px,-4px)' },
          '60%': { transform: 'translate(-4px,-2px)' },
          '80%': { transform: 'translate(4px,3px)' },
        },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        ring: { '0%': { boxShadow: '0 0 0 0 rgb(var(--accent) / .75)' }, '100%': { boxShadow: '0 0 0 14px rgb(var(--accent) / 0)' } },
      },
      animation: { shake: 'shake .45s ease-in-out 2', floaty: 'floaty 3.2s ease-in-out infinite', ring: 'ring 1.3s ease-out infinite' },
    },
  },
  plugins: [],
};
