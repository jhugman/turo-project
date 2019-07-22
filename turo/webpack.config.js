const paths = require('../config/paths');
const path = require('path');

module.exports = {
  devtool: 'source-map',
  target: 'node',

  resolve: {
    extensions: ['.js', '.json', '.jsx', '.turo', '.pegjs'],
    alias: {
      'turo': path.join(__dirname, '../turo'),
      'turo-model': path.join(__dirname, '../turo-model'),
      'turo-documents': path.join(__dirname, '../turo-documents'),
      // Support React Native Web
      'react-native': 'react-native-web',
    }
  },
 
  entry: './lib/index.js',
  output: {
    filename: './build/index.js',
    libraryTarget: 'commonjs',
  },


  module: {
    strictExportPresence: true,
    rules: [
      // Process JS with Babel.
      {
        test: [/\.turo$/, /\.txt$/],
        use: 'raw-loader',
      },
      {
        test: /\.(js|jsx)$/,
        include: paths.appSrc,
        loader: require.resolve('babel-loader'),
        options: {
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          // cacheDirectory: true,
        },
      },
      {
        test: /\.pegjs$/,
        loader: require.resolve('pegjs-loader'),
        options: {
          allowedStartRules: [
            'DocumentFirstParse',
            'EditorText',
            'Statement',
            'NumberLiteral',
            'PaddedStatement',
            'EditorText'
          ],
        }
      },

    ]
  },
  plugins: [
  ]
}
