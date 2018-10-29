const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './lib/index.js',
  output: {
    filename: './build/index.js'
  },
  plugins: [
    new UglifyJSPlugin()
  ]
}
