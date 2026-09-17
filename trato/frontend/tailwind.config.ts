import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tinta: {
          DEFAULT: '#0F1B2D',
          suave: '#3D4A5C',
          tenue: '#6B7684',
        },
        trato: {
          50: '#EEF6FF',
          100: '#D9EBFF',
          200: '#BCDBFF',
          300: '#8EC4FF',
          400: '#59A3FF',
          500: '#2F80FF',
          600: '#1A5FE0',
          700: '#164BB5',
          800: '#173F8F',
          900: '#183872',
        },
        cierre: {
          50: '#ECFDF3',
          100: '#D1FADF',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        carta: '0 1px 2px rgba(15,27,45,0.04), 0 8px 24px -12px rgba(15,27,45,0.12)',
        alta: '0 2px 4px rgba(15,27,45,0.04), 0 16px 40px -16px rgba(15,27,45,0.18)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
