const path = require('path')
const isDevelopment = process.env.NODE_ENV === 'development'

console.log('devmode', isDevelopment)
const pathOut = path.resolve(__dirname, '..', 'public')
const entryPoint = './teamview.js' // this script should require all other files that are needed, each file should export something
const scriptName = 'teamview'

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: entryPoint,
  output: {
    path: pathOut,
    filename: `${scriptName}.js`
  },
  devtool: false
}
