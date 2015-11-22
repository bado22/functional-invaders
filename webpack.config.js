
module.exports = {
  entry: ['webpack/hot/dev-server', './src'],

  output: {
    filename: '[name].js',
    path: __dirname + '/build'
  },

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', exclude: /node_modules/ },
      { test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/, loader: "file" }
    ]
  }
};