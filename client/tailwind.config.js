/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        cosmic: {
          void: '#030712',
          deep: '#050816',
          navy: '#060d1f',
        },
        accent: {
          cyan: '#38bdf8',
          cobalt: '#2563eb',
          purple: '#a855f7',
          indigo: '#6366f1',
          emerald: '#10b981',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'streak': 'streak 4s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-up': 'countUp 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(56,189,248,0.4)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 40px rgba(56,189,248,0.8)' },
        },
        streak: {
          '0%': { transform: 'translateX(-100%) scaleX(0.5)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateX(200%) scaleX(0.5)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        countUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        '4xl': '72px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0,0,0,0.36)',
        'glass-lg': '0 16px 64px 0 rgba(0,0,0,0.48)',
        'glow-cyan': '0 0 30px rgba(56,189,248,0.4)',
        'glow-blue': '0 0 30px rgba(37,99,235,0.5)',
        'glow-purple': '0 0 30px rgba(168,85,247,0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
}
