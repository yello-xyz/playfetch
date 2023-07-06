/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.tsx',
    './components/**/*.tsx',
  ],
  theme: {
    textColor: {
      'white': '#FFFFFF',
      'gray-25': '#FBFBFD',
      'gray-50': '#F3F4F6',
      'gray-100': '#ECECEF',
      'gray-200': '#DADCDF',
      'gray-300': '#B5B7BF',
      'gray-400': '#898D96',
      'gray-500': '#6B707A',
      'gray-600': '#484F5A',
      'gray-700': '#333A46',
      'gray-800': '#1D2532',
      'red-500': '#C64629',
    },
  },
}
