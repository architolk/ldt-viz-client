const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
  mode: 'development', // development | production
  entry: './src/index.js',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  },
  output: {
    filename: 'rdfvizlib.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'rdfvizlib'
  },
  plugins: [
    new NodePolyfillPlugin()
  ]
};
