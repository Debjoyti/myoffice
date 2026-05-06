/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', '"Inter"', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',

        text: 'hsl(var(--text))',
        'text-muted': 'hsl(var(--text-muted))',
        'text-subtle': 'hsl(var(--text-subtle))',

        brand: 'hsl(var(--brand))',
        'brand-fg': 'hsl(var(--brand-fg))',
        'brand-tint': 'hsl(var(--brand-tint))',

        success: 'hsl(var(--success))',
        'success-tint': 'hsl(var(--success-tint))',
        warning: 'hsl(var(--warning))',
        'warning-tint': 'hsl(var(--warning-tint))',
        danger: 'hsl(var(--danger))',
        'danger-tint': 'hsl(var(--danger-tint))',
        info: 'hsl(var(--info))',

        // Shadcn/ui mapping fallbacks
        background: 'hsl(var(--bg))',
        foreground: 'hsl(var(--text))',
        card: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--text))'
        },
        popover: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--text))'
        },
        primary: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-fg))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--surface-2))',
          foreground: 'hsl(var(--text))'
        },
        muted: {
          DEFAULT: 'hsl(var(--surface-2))',
          foreground: 'hsl(var(--text-muted))'
        },
        accent: {
          DEFAULT: 'hsl(var(--brand-tint))',
          foreground: 'hsl(var(--brand))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--brand-fg))'
        },
        ring: 'hsl(var(--brand))',
      },
      spacing: {
        1: '0.25rem', // 4px
        2: '0.5rem',  // 8px
        3: '0.75rem', // 12px
        4: '1rem',    // 16px
        5: '1.25rem', // 20px
        6: '1.5rem',  // 24px
        8: '2rem',    // 32px
        10: '2.5rem', // 40px
        12: '3rem',   // 48px
        16: '4rem',   // 64px
      },
      borderRadius: {
        lg: '10px',
        md: '6px',
        sm: '4px',
        modal: '14px',
      },
      boxShadow: {
        level1: '0 1px 2px hsl(var(--border) / 0.4)',
        level2: '0 8px 24px hsl(220 13% 0% / 0.08), 0 2px 6px hsl(220 13% 0% / 0.04)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        page: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
