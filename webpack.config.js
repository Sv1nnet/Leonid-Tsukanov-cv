const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin'); // Copy .html content or the whole file
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Remove old files
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Copy files from source to dist
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Move css in separated file
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin'); // Minify css files
const TerserWebpackPlugin = require('terser-webpack-plugin'); // Minify js files
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const filename = (ext) => (isDev ? `[name].${ext}` : `[name].[hash].${ext}`);

const [ localIp ] = Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family==='IPv4' && !i.internal && i.address || []), [])), [])

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all',
    },
  };

  if (isProd) {
    config.minimizer = [
      new OptimizeCssAssetWebpackPlugin(),
      new TerserWebpackPlugin(),
    ];
  }

  return config;
};

const cssLoaders = (...extra) => {
  let cssLoader = [ // webpack comes through loader from right to the left
    // 'style-loader', // inject css into <style> in <head> in .html after script with css import has been loaded
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev, // update changes without reloading page
        reloadAll: true,
      },
    }, // move css in a separated file
    'css-loader', // allows webpack to understand css imports in js files
  ];

  if (extra) {
    cssLoader = [...cssLoader, ...extra];
  }

  return cssLoader;
};

const babelOptions = (...presets) => {
  const opts = {
    presets: [
      '@babel/preset-env',
    ],
  };

  if (presets) {
    opts.presets = [...opts.presets, ...presets];
  }

  return opts;
};

const jsLoaders = () => {
  let loaders = [{
    loader: 'babel-loader',
    options: babelOptions(),
  }];

  if (isDev) {
    loaders = [...loaders, 'eslint-loader']; // add eslint-loader to check for warnings and errors
  }

  return loaders;
};

const plugins = () => {
  const base = [
    new HTMLWebpackPlugin({ // injects files into .html
      filename: 'ru.html',
      template: './ru.html', // set source .html file
      minify: {
        collapseWhitespace: isProd, // remove whitespace from .html file
      },
      inject: true,
      langLink: isDev ? '/index.html' : '/Leonid-Tsukanov-cv/index.html',
    }),
    new HTMLWebpackPlugin({ // injects files into .html
      filename: 'index.html',
      template: './index.html', // set source .html file
      minify: {
        collapseWhitespace: isProd, // remove whitespace from .html file
      },
      inject: true,
      langLink: isDev ? '/ru.html' : '/Leonid-Tsukanov-cv/ru.html',
    }),
    new CleanWebpackPlugin(), // clean dist from old files
    new CopyWebpackPlugin([ // Copy any files
      {
        from: path.resolve(__dirname, 'src/fav.ico'),
        to: path.resolve(__dirname, 'dist'),
      },
      {
        from: path.resolve(__dirname, 'src/assets/**/*.*'),
        to: path.resolve(__dirname, 'dist'),
      },
    ]),
    new MiniCssExtractPlugin({ // move css in separated file
      filename: filename('css'),
    }),
  ];

  if (isProd) {
    base.push(new BundleAnalyzerPlugin());
  }

  return base;
};

module.exports = {
  context: path.resolve(__dirname, 'src'), // Initial folder
  mode: 'development', // default build mode
  entry: './common.blocks/root.scss',
  output: {
    filename: filename('js'), // [name] - name of entry field; [contenthash] - file hash;
    path: path.resolve(__dirname, 'dist'), // build destination
  },
  resolve: {
    extensions: [ // what extensions webpack has to undertand by default in imports
      '.js',
      '.json',
      '.png',
      '.scss',
    ],
    alias: { // path names for import; in import we can specify alias instead of relative path
      '@blocks': path.resolve(__dirname, 'src/common.blocks'),
      '@vars': path.resolve(__dirname, 'src/styles/vars'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimization: optimization(), // allows to move multiple imports in a single separated file
  devServer: {
    host: localIp,
    port: 4242,
    hot: isDev, // update changes without reloading page
    watchContentBase: true, // make live-reloading happen even when changes are made to the static html pages
    overlay: { warnings: true, errors: true }, // show error message on the screen
  },
  devtool: isDev ? 'source-map' : '',
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.css$/, // if file includes this pattern then webpack uses loaders on it
        use: cssLoaders(),
      },
      {
        test: /\.s[ac]ss$/,
        use: cssLoaders('sass-loader'),
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        use: [
          'file-loader', // handle files (e.g. images or fonts)
        ],
      },
      {
        test: /\.(ttf|woff|woff2|eot)$/,
        use: [
          'file-loader',
        ],
      },
    ],
  },
};
