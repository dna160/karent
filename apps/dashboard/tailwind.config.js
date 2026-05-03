/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0a',
          card: '#1a1a1a',
          sidebar: '#0f0f0f',
          hover: '#242424',
          border: '#2a2a2a',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: '#6366f120',
        },
        status: {
          completed: '#22c55e',
          running: '#3b82f6',
          failed: '#ef4444',
          pending: '#eab308',
          review: '#f97316',
          archived: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
