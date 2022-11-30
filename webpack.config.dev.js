const webpack = require("webpack");
const path = require("path");
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.config.common");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = async (env, options) => {
  return merge(commonConfig, {
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
      contentBase: path.join(__dirname, "dist"),
      host: "127.0.0.1",
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "src/index.ejs",
        baseUrl: "http://localhost:8080/",
      }),
    ],
  });
};
