'use strict';
const path = require('path');
const SizePlugin = require('size-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ChromeExtensionReloaderPlugin = require('webpack-chrome-extension-reloader');

module.exports = (env, argv) => ({
  devtool: 'sourcemap',
  stats: {
    colors: true,
    modules: true,
    reasons: true,
    errorDetails: true,
  },
  entry: {
    content: './src/content',
    background: './src/background',
    options: './src/options',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            query: {
              compilerOptions: {
                // With this, TS will error but the file will still be generated (on watch only)
                noEmitOnError: argv.watch === false,
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new SizePlugin(),
    new CopyWebpackPlugin([
      {
        from: '*',
        context: 'src',
        ignore: ['*.js', '*.ts', '*.tsx'],
      },
      {
        from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
      },
      {
        from: 'content',
        context: 'src',
        to: 'content',
      },
      {
        from: 'manifest.json',
      },
    ]),
    new ChromeExtensionReloaderPlugin({
      entries: {
        // The entries used for the content/background scripts
        contentScript: 'content', // Use the entry names, not the file name or the path
        background: 'background', // required
      },
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    // Without this, function names will be garbled and enableFeature won't work
    concatenateModules: true,

    // Automatically enabled on production; keeps it somewhat readable for AMO reviewers
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          mangle: false,
          compress: false,
          output: {
            beautify: true,
            indent_level: 2, // eslint-disable-line @typescript-eslint/camelcase
          },
        },
      }),
    ],
  },
});
