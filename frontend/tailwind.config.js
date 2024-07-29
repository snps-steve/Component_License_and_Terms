// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'), // Add this line to include the forms plugin
    function ({ addUtilities }) {
      addUtilities({
        '.placeholder-left-margin::placeholder': {
          marginLeft: '1rem', // Adjust the value as needed
        },
      }, ['responsive', 'hover', 'focus']);
    },
  ],
}
