const path = require("path");
const webpack = require("webpack");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: "./src/index.jsx",
  mode: "production",
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: { presets: ['env', 'react'] }
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(png|jpg|gif|svg|ttf|woff2|woff|eot)$/,
        use: [{
          loader: 'file-loader',
          options: {}
        }]
      }
    ]
  },
  resolve: { extensions: ['*', '.js', '.jsx'] },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "../index.html"
    }),
    new CopyWebpackPlugin([{
      from: "./data",
      to: '../data/'
    }])
  ],
  output: {
    path: path.resolve(__dirname, "dist/app/"),
    publicPath: "app/",
    filename: "bundle.js"
  }
};
