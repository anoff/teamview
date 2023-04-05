const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const isDevelopment = process.env.NODE_ENV === 'development'

console.log('devmode', isDevelopment)
const pathOut = path.resolve(__dirname, '..', 'public')

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: {
    header: './tv.header.js',
    body: './tv.main.js'
  },
  output: {
    path: pathOut,
    filename: 'teamview.[name].bundle.js'
  },
  devtool: isDevelopment ? 'source-map' : false,
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          minimize: true,
          sources: false // Disables attributes processing
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'teamview.css'
    })
  ],
  watchOptions: {
    poll: 1000
  }
}
