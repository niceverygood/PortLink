import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 브랜드 토큰 (CLAUDE.md §1.3) — 컴포넌트에서는 항상 이쪽 사용
        brand: {
          navy: '#0A2540',
          'navy-dark': '#061B2E',
          orange: '#FF6B35',
          'orange-dark': '#E5552A',
          'orange-light': '#FFF1EB',
          success: '#059669',
          warning: '#F59E0B',
          error: '#DC2626',
          info: '#0284C7',
        },
        // shadcn/ui 시맨틱 토큰 (CSS 변수 매핑) — UI primitive 내부에서만 사용
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        ring: 'hsl(var(--ring))',
      },
      borderColor: {
        DEFAULT: 'hsl(var(--border))',
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '40px', letterSpacing: '-0.03em' }],
        h1: ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
        h2: ['20px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        body: ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        flat: 'none',
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 12px 32px rgba(0,0,0,0.12)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
    },
  },
  plugins: [animate],
};

export default config;
