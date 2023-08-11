const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.tsx', './components/**/*.tsx'],
  theme: {
    textColor: {
      transparent: 'transparent',
      black: '#000000',
      'blue-500': '#2C7BD8',
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
      white: '#FFFFFF',
    },
    backgroundColor: {
      transparent: 'transparent',
      black: '#000000',
      'blue-25': '#F3F8FD',
      'blue-50': '#DCEAFA',
      'blue-100': '#B1D1F6',
      'blue-200': '#8BBBF3',
      'blue-300': '#61A2EE',
      'blue-400': '#3B8CEB',
      'blue-500': '#2C7BD8',
      'blue-600': '#226FCA',
      'blue-700': '#1660B8',
      'blue-800': '#0F58AE',
      'dark-gray-800': '#1D2532',
      'gray-25': '#FBFBFD',
      'gray-50': '#F5F6F7',
      'gray-100': '#EEF0F2',
      'gray-200': '#E3E6E9',
      'gray-300': '#CFD3D8',
      'gray-400': '#B8BEC5',
      'gray-500': '#AAB0BA',
      'gray-600': '#9AA2AD',
      'gray-700': '#8C94A1',
      'gray-800': '#838C9A',
      'green-50': '#DDF1E7',
      'green-200': '#9ACEB2',
      'green-300': '#71B892',
      'green-400': '#4EA476',
      'orange-200': '#F9D093',
      'orange-300': '#F6BE6A',
      'orange-400': '#F2A93C',
      'purple-200': '#BEA4F6',
      'purple-300': '#9F78F3',
      'purple-400': '#7D48EF',
      'red-25': '#FFF3F1',
      'red-50': '#FDE5E0',
      'red-100': '#F4BBAF',
      'red-200': '#EC9987',
      'red-300': '#E4735B',
      'red-400': '#DC4F30',
      'red-500': '#C64629',
      'red-600': '#AC3B21',
      'red-700': '#902F18',
      'red-800': '#832A14',
      'yellow-200': '#FAE3A8',
      'yellow-300': '#F8D784',
      'yellow-400': '#F6CD65',
      white: '#FFFFFF',
    },
    borderColor: {
      transparent: 'transparent',
      black: '#000000',
      'blue-50': '#DCEAFA',
      'blue-100': '#B1D1F6',
      'blue-400': '#3B8CEB',
      'blue-500': '#2C7BD8',
      'blue-600': '#226FCA',
      'gray-25': '#FBFBFD',
      'gray-50': '#F5F6F7',
      'gray-100': '#EEF0F2',
      'gray-200': '#E3E6E9',
      'gray-300': '#CFD3D8',
      'gray-400': '#B8BEC5',
      'gray-500': '#AAB0BA',
      'gray-600': '#9AA2AD',
      'gray-700': '#8C94A1',
      'gray-800': '#838C9A',
      'red-50': '#FDE5E0',
      white: '#FFFFFF',
    },
    fontSize: {
      sm: '0.79rem',
      base: '.92rem'
    },
    textDecorationColor: {
      'blue-100': '#B1D1F6',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        shimmer: 'shimmer 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
}
