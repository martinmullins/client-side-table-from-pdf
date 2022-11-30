const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = {
  node: {
    fs: 'empty',
  },
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  resolve: {
    modules: [
      "node_modules",
      path.resolve(__dirname)
    ],
    alias: {
      "pdfjs-lib": path.join(__dirname, 'pdf.js/src/pdf'),
      "pdfjs-web": path.join(__dirname, 'pdf.js/web'),
      "pdfjs": path.join(__dirname, 'pdf.js/src'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-proposal-object-rest-spread"]
          }
        }
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            }
          }
        ]
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'less-loader', // compiles Less to CSS
          }
        ]
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        test: /\.(png|jpe?g|gif|cur|svg)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: 
        [
          { from: 'pdf.js/build/generic-es5/web', to: 'web' },
          { from: 'pdf.js/build/generic-es5/build', to: 'build' },
          { from: 'node_modules/tesseract.js-core', to: 'tesseract' },
          { from: 'node_modules/tesseract.js/dist', to: 'tesseract-dist' },
          { from: 'lang-data', to: 'lang-data' },
          //{ from: 'src/uih/help.html', to: 'help.html' },
          //{ from: 'src/uih/privacy.html', to: 'privacy.html' },
          { from: 'images', to: 'images' },
          { from: 'ico', to: 'ico' },
          { from: 'node_modules/pace-js/themes/black/pace-theme-center-simple.css', to: 'pace.css' },
          { from: 'node_modules/pace-js/pace.min.js', to: 'pace.min.js' },
          { from: 'src/opencv.js', to: 'opencv.js' },
        ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    }),
    // new BundleAnalyzerPlugin()
  ]
};

module.exports = config;
