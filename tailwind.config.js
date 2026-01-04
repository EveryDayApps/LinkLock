export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#141414',
        'bg-tertiary': '#1f1f1f',
        'bg-accent': '#2a2a2a',
        'text-primary': '#e5e5e5',
        'text-secondary': '#a3a3a3',
        'text-muted': '#666666',
        'border': '#2a2a2a',
        'border-focus': '#404040',
        'accent-primary': '#FFBF3B',
        'accent-danger': '#ef4444',
        'accent-success': '#10b981',
        'accent-warning': '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
      },
      borderRadius: {
        'btn': '0.5rem',
        'input': '0.5rem',
        'card': '0.75rem',
      },
    },
  },
  plugins: [],
};
