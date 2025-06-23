const path = require('path');

module.exports = {
  entry: './media/main.jsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'media'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  mode: 'development'
};