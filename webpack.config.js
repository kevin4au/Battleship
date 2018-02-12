module.exports = {
  entry: __dirname + '/app/scripts/src/main.js',
  output: {
    path: __dirname + '/app/scripts/dist',
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',

        query: {
           presets: ['es2015', 'react']
        }
      },
      {
        test: /\.css/,
        loaders: ['style-loader', 'css-loader'],
        include: __dirname + '/app'
      }
    ],
  }
};
