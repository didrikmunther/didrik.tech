const tailwindMdBase = require('@geoffcodesthings/tailwind-md-base');
const tailwindMdTheme = require('./tailwind-md.config');


module.exports = {
  theme: {
    markdownBase: tailwindMdTheme,
    backgroundColor: theme => ({
      ...theme('colors'),
      'blue-300': '#90cdf4',
      'gray-800': '#2d3748',
      'gray-400': '#cbd5e0',
      'red-800': '#9b2c2c',
      'blue-800': '#2c5282',
      'yellow-400': '#f6e05e',
      'green-700': '#2f855a',
      'purple-800': '#7340c4'
    }),
    textColor: theme => ({
      ...theme('colors'),
      'gray-800': '#2d3748'
    }),
    borderColor: theme => ({
      ...theme('colors'),
      'gray-400': '#cbd5e0',
      'gray-600': '#718096'
    }),
    extend: {}
  },
  variants: {},
  plugins: [
    tailwindMdBase()
  ],
  purge: [
    './src/**/*.{html,yaml}'
  ]
}
