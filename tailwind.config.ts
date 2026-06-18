import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans, ui-sans-serif)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono, ui-monospace)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // SubTrack brand — a calm slate-blue, the single accent across the site.
        brand: {
          DEFAULT: '#516282',
          foreground: '#ffffff',
          50: '#f4f6fa',
          100: '#e7ebf2',
          200: '#cfd7e4',
          300: '#aab8cf',
          400: '#7d8fb0',
          500: '#5d6f92',
          600: '#516282',
          700: '#43526c',
          800: '#39455a',
          900: '#323b4d',
        },
        // Tinted dark surface for inverted sections (navy-charcoal, never pure black).
        ink: {
          DEFAULT: '#0c1322',
          50: '#11192b',
          100: '#161f34',
          200: '#1d2840',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        // Shadows tinted with the brand hue instead of flat black.
        'brand-xs': '0 1px 2px 0 rgb(28 40 64 / 0.06)',
        'brand-sm':
          '0 1px 2px 0 rgb(28 40 64 / 0.06), 0 1px 3px 0 rgb(28 40 64 / 0.08)',
        brand:
          '0 10px 30px -12px rgb(28 40 64 / 0.22), 0 2px 8px -4px rgb(28 40 64 / 0.12)',
        'brand-lg':
          '0 30px 60px -24px rgb(28 40 64 / 0.32), 0 8px 24px -12px rgb(28 40 64 / 0.18)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0px' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0px' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'accordion-up': 'accordion-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
