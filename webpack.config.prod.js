const webpack = require('webpack');
const path = require('path');
const { merge } = require('webpack-merge')
const commonConfig = require('./webpack.config.common')
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(commonConfig, {
  mode: 'production',
  // no source maps on production: devtool: 'source-map',
  optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
            parallel: true,
            terserOptions: {
                compress: {
                    pure_funcs: ['console.log', 'console.dir', 'console.info', 'console.time', 'console.timeEnd']
                }
            }
        })
      ]
  },
  plugins: [
    new HtmlWebpackPlugin({
       template: 'src/index.ejs',
       baseUrl: 'https://iframe-pdftableutil.possiblenull.com/'
    })
  ]
});
