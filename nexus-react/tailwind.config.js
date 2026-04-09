/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:    { DEFAULT: '#0a0c12', 2: '#10131c', 3: '#181c28', 4: '#1f2433' },
        line:   { DEFAULT: '#252d42', soft: 'rgba(37,45,66,0.6)' },
        tx:     { 1: '#edf0f7', 2: '#8b93ab', 3: '#4e566e', 4: '#2e3448' },
        brand:  '#3b82f6',
        success:'#10b981',
        warn:   '#f59e0b',
        danger: '#ef4444',
        purple: '#a78bfa',
        teal:   '#14b8a6',
        pink:   '#ec4899',
        indigo: '#6366f1',
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      borderRadius: {
        xs: '6px', sm: '10px', md: '14px', lg: '18px', xl: '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)',
        md:   '0 4px 16px rgba(0,0,0,0.4)',
        lg:   '0 20px 60px rgba(0,0,0,0.6)',
        glow: '0 0 20px rgba(59,130,246,0.4)',
      },
      animation: {
        'fade-up':  'fadeUp 0.28s cubic-bezier(0.2,0,0,1)',
        'fade-in':  'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.2,0,0,1)',
        'orb':      'orbFloat 8s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'scale(0.96) translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        orbFloat: { '0%,100%': { transform: 'scale(1) translateY(0)' }, '50%': { transform: 'scale(1.08) translateY(-20px)' } },
      },
    },
  },
  plugins: [],
}
