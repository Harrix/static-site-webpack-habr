const path = require("path");
const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

function generateHtmlPlugins(templateDir) {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map((item) => {
    const parts = item.split(".");
    const name = parts[0];
    const extension = parts[1];
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      inject: true, // Automatically injects scripts and styles
      scriptLoading: "blocking", // Blocking script loading
    });
  });
}

const htmlPlugins = generateHtmlPlugins("src/html/views");

const config = {
  entry: ["./src/js/index.js", "./src/scss/style.scss"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/bundle.js",
    clean: true, // Replaces CleanWebpackPlugin in Webpack 5
    assetModuleFilename: "assets/[name][ext]", // For built-in asset modules
  },
  devtool: "source-map",
  mode: "production",
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 9000,
    hot: true,
    open: true,
    watchFiles: ["src/**/*"],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
      new TerserPlugin({
        extractComments: true,
        terserOptions: {
          compress: {
            drop_console: true, // Removes console.log in production
          },
        },
      }),
    ],
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
    runtimeChunk: "single",
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        include: path.resolve(__dirname, "src/scss"),
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              url: false,
            },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.html$/,
        include: path.resolve(__dirname, "src/html/includes"),
        use: ["raw-loader"],
      },
      // Image processing using Webpack 5 built-in modules
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb - files smaller will be embedded as data URL
          },
        },
        generator: {
          filename: "img/[name][ext]",
        },
      },
      // Font processing
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
      // Processing other files (ico, etc.)
      {
        test: /\.(ico|pdf)$/i,
        type: "asset/resource",
        generator: {
          filename: "[name][ext]",
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/style.bundle.css",
    }),
    // CopyPlugin copies static files referenced in HTML templates
    // These files are not imported in JavaScript code, so they need to be copied
    new CopyPlugin({
      patterns: [
        {
          from: "src/fonts",
          to: "fonts",
          noErrorOnMissing: true,
        },
        {
          from: "src/favicon",
          to: "favicon",
          noErrorOnMissing: true,
        },
        {
          from: "src/img",
          to: "img",
          noErrorOnMissing: true,
        },
        {
          from: "src/uploads",
          to: "uploads",
          noErrorOnMissing: true,
        },
      ],
    }),
  ].concat(htmlPlugins),
};

module.exports = (env, argv) => {
  // Production settings
  if (argv.mode === "production") {
    config.output.filename = "js/[name].js";
    config.output.assetModuleFilename = "assets/[name][ext]";

    // Disable hashes for compatibility with external projects
    config.optimization.moduleIds = "named";
    config.optimization.chunkIds = "named";
  } else {
    // Development settings
    config.devtool = "eval-source-map";
    config.optimization.minimize = false;
    config.output.filename = "js/bundle.js";
    config.output.assetModuleFilename = "assets/[name][ext]";
    // Disable code splitting in development for simplicity
    config.optimization.splitChunks = false;
    config.optimization.runtimeChunk = false;
  }

  return config;
};
