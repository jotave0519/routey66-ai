import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#fff7ed', 500: '#f97316', 700: '#c2410c', 900: '#7c2d12' },
      },
    },
  },
  plugins: [],
}

export default config
