const WebpackUserscript = require('webpack-userscript')
const path = require('path')
const isDevelopment = process.env.NODE_ENV === 'development'

console.log('devmode', isDevelopment)
// configure your script stuff here
const pathOut = path.resolve(__dirname, '..', 'dist')
const entryPoint = './teamview.js' // this script should require all other files that are needed, each file should export something
const scriptName = 'teamview'
const tamperMonkeyHeader = {
  name: scriptName,
  version: '0.0.1',
  description: 'augment galaxy view by sharing planet and spy data with your team',
  author: 'joghurtrucksack',
  require: [
  ],
  include: '/https:\\/\\/(www.|)pr0game\\.com\\/game\\.php.*/',
  grant: [
    'GM_setValue',
    'GM_getValue',
    'GM_xmlhttpRequest'
  ],
  connect: [
    'localhost'
  ]
}
// stop here

// add buildnumber to version to make it unique for hot reload via proxy script
if (isDevelopment) {
  tamperMonkeyHeader.version += '-build.[buildNo].[buildTime]'
}

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: entryPoint,
  output: {
    path: pathOut,
    filename: `${scriptName}.user.js`
  },
  devtool: false,
  plugins: [
    new WebpackUserscript({
      updateBaseUrl: 'https://git.pr0game.com/atain/lazy_pr0gamer/raw/branch/master/dist/',
      headers: tamperMonkeyHeader,
      ssri: true,
      proxyScript: {
        baseUrl: 'file:///Users/anoff/developer/pr0game-teamview/dist',
        filename: '[basename].proxy.user.js',
        enable: isDevelopment
      }
    })
  ]
}
