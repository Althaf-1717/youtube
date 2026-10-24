/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#F5F3EE',
          surface: '#FFFFFF',
          secondary: '#ECEAE4',
          text: '#292825',
          muted: '#77746D',
          border: '#DEDAD2',
          accent: '#C96442',
          accentHover: '#B85535',
          accentLight: '#F7EBE6',
          hover: '#EAE7DF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(41, 40, 37, 0.04), 0 1px 3px 0 rgba(41, 40, 37, 0.05)',
        'card': '0 1px 3px 0 rgba(41, 40, 37, 0.04), 0 3px 8px -1px rgba(41, 40, 37, 0.06)',
        'dropdown': '0 4px 14px 0 rgba(41, 40, 37, 0.09), 0 2px 5px -1px rgba(41, 40, 37, 0.04)',
        'modal': '0 12px 30px -4px rgba(41, 40, 37, 0.12), 0 6px 12px -3px rgba(41, 40, 37, 0.06)',
      },
    },
  },
  plugins: [],
};
