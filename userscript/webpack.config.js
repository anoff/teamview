const path = require('path')
const isDevelopment = process.env.NODE_ENV === 'development'

console.log('devmode', isDevelopment)
const pathOut = path.resolve(__dirname, '..', 'public')

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: {
    header: './teamviewHeader.js',
    body: './teamview.js'
  },
  output: {
    path: pathOut,
    filename: 'teamview.[name].bundle.js'
  },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          minimize: true
        }
      }
    ]
  }
}
