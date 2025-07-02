import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,tsx}',
    './layouts/**/*.{js,ts,tsx}',
    './data/**/*.mdx',
  ],
  theme: {
    extend: {
      rotate: {
        135: '135deg',
        315: '315deg',
      },
      screens: {
        xs: '500px',
        sm: '640px',
        md: '768px',
        lg: '992px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '2000px',
        short: { raw: '(max-height: 769px)' },
        medium: { raw: '(max-height: 900px)' },
      },
      spacing: {
        '9/16': '56.25%',
      },
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      fontFamily: {
        'space-grotesk': ['"Space Grotesk"', 'sans-serif'],
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        'barlow-semi-condensed': ['Barlow Semi Condensed', 'sans'],
      },

      colors: {
        primary: colors.blue,
        gray: colors.neutral,
        blue: {
          200: '#7599d1',
          300: '#5883c8',
          400: '#3e6eba',
          500: '#345D9D',
          600: '#2e528a',
          700: '#274677',
          800: '#213b64',
          900: '#122036',
        },
        btc: {
          100: '#fff7eb',
          200: '#ffe7c4',
          500: '#ff9900',
          600: '#d88100',
          700: '#b16a00',
          800: '#895200',
          900: '#4e2f00',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--tw-prose-body)',
            a: {
              color: 'var(--tw-prose-links)',
              '&:hover': {
                color: 'var(--tw-prose-links-hover)',
              },
              code: { color: 'var(--tw-prose-code)' },
            },
            h1: {
              fontWeight: '600',
              letterSpacing: '-0.025em',
              color: 'var(--tw-prose-headings)',
              fontFamily: '"Space Grotesk", sans-serif',
            },
            h2: {
              fontWeight: '600',
              letterSpacing: '-0.025em',
              color: 'var(--tw-prose-headings)',
              fontFamily: '"Space Grotesk", sans-serif',
            },
            h3: {
              fontWeight: '600',
              color: 'var(--tw-prose-headings)',
              letterSpacing: '-0.025em',
              fontFamily: '"Space Grotesk", sans-serif',
            },
            'h4,h5,h6': {
              color: 'var(--tw-prose-headings)',
            },
            pre: {
              backgroundColor: 'var(--tw-prose-pre-bg)',
            },
            code: {
              color: 'var(--tw-prose-code)',
              backgroundColor: 'var(--tw-prose-code-bg)',
              paddingLeft: '4px',
              paddingRight: '4px',
              paddingTop: '2px',
              paddingBottom: '2px',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            details: {
              backgroundColor: 'var(--tw-prose-code-bg)',
              paddingLeft: '4px',
              paddingRight: '4px',
              paddingTop: '2px',
              paddingBottom: '2px',
              borderRadius: '0.25rem',
            },
            hr: { borderColor: 'var(--tw-prose-hr)' },
            'ol li::marker': {
              fontWeight: '600',
              color: 'var(--tw-prose-counters)',
            },
            'ul li::marker': {
              backgroundColor: 'var(--tw-prose-bullets)',
            },
            strong: { color: 'var(--tw-prose-bold)' },
            blockquote: {
              color: 'var(--tw-prose-quotes)',
              borderLeftColor: 'var(--tw-prose-quote-borders)',
            },
          },
        },
      },
    },
  },
  plugins: [],
}
export default config
