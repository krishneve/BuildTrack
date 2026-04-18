/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0f172a',
          primary: '#3b82f6',
          base: '#f1f5f9',
          muted: '#64748b',
          accent: '#94a3b8',
        }
      },
      boxShadow: {
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
