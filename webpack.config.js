var path = require('path')
var fs = require('fs')

var ExtractTextPlugin = require('extract-text-webpack-plugin')

var jsLoaders = ['babel?' + JSON.stringify({
  plugins: ['transform-runtime', 'transform-decorators-legacy'],
  presets: ['es2015', 'stage-0']
})]

var serverExternals = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    serverExternals[mod] = 'commonjs ' + mod;
  });

module.exports = [{
  entry: {
    app: './src/public/main',
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].js"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: jsLoaders,
      include: path.join(__dirname, './src')
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('css')
    }, {
      test: /\.(woff|svg|woff2|ttf|eot)$/,
      loader: 'url?limit=25000'
    }, {
      test: /\.(png|jpg|gif|ico)$/,
      loader: 'file?name=[name].[ext]'
    }]
  },
  plugins: [
    new ExtractTextPlugin('[name].css')
  ],
  devServer: {
    port: 3000,
    contentBase: './build/public',
    hot: true,
    publicPath: '/'
  }
}, {
  entry: {
    crawler: './src/crawler/main'
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].js"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: jsLoaders,
      include: path.join(__dirname, './src')
    }]
  },
  externals: serverExternals,
  target: 'node'
}]
