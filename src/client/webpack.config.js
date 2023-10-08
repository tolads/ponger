const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');

module.exports = {
  entry: './view.ts',
  output: {
    filename: 'bundle.js',
    path: path.join(projectRoot, 'dist', 'public', 'js'),
  },
  mode: 'development',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
  },
};
