const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'quark.js',
    path: path.resolve(__dirname, 'dist'),
    library: '$$',
    libraryTarget: 'umd',
  },
  externals: [
    'axios',
    'crossroads',
    'hasher',
    'knockout',
    'signals',
    'sizzle',
  ],
};
