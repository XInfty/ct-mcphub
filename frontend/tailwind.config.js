/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Use class strategy for dark mode
  theme: {
    extend: {
      colors: {
        'xinfty-orange': '#ff6600',
        'xinfty-dark-orange': '#cc5200',
        'xinfty-black': '#000000',
        'xinfty-gray': '#333333',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
