const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const INCLUDES_DIR = path.resolve(__dirname, "src/html/includes");

/**
 * Renders a partial from src/html/includes (basename only; path traversal safe).
 * Use in views: <%= include("header.html", data) %>
 */
function includeHtml(filename, data) {
  const safeName = path.basename(filename);
  const fullPath = path.resolve(INCLUDES_DIR, safeName);
  const rel = path.relative(INCLUDES_DIR, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Invalid include: ${filename}`);
  }
  const source = fs.readFileSync(fullPath, "utf8");
  return _.template(source)(data);
}

function generateHtmlPlugins(templateDir) {
  const templateFiles = fs
    .readdirSync(path.resolve(__dirname, templateDir))
    .filter((item) => path.parse(item).ext.toLowerCase() === ".html");
  return templateFiles.map((item) => {
    const parsedPath = path.parse(item);
    const name = parsedPath.name;
    const extension = parsedPath.ext.substring(1);
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      inject: "body",
      scriptLoading: "defer",
      templateParameters: {
        include: includeHtml,
      },
    });
  });
}

const htmlPlugins = generateHtmlPlugins("src/html/views");

const config = {
  entry: ["./src/js/index.js", "./src/scss/style.scss"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/bundle.js",
    clean: true,
    assetModuleFilename: "assets/[name][ext]",
  },
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },
  devtool: "source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 9000,
    hot: true,
    open: true,
    watchFiles: ["src/**/*"],
  },
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
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
            drop_console: true,
          },
        },
      }),
    ],
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
              sourceMap: true,
              sassOptions: {
                quietDeps: true,
              },
            },
          },
        ],
      },
      {
        test: /\.html$/,
        include: path.resolve(__dirname, "src/html/includes"),
        type: "asset/source",
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024,
          },
        },
        generator: {
          filename: "img/[name][ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
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
  const miniCssPlugin = config.plugins.find((p) => p instanceof MiniCssExtractPlugin);

  if (argv.mode === "production") {
    config.output.filename = "js/[name].[contenthash:8].js";
    config.output.assetModuleFilename = "assets/[name].[contenthash:8][ext]";
    config.devtool = "hidden-source-map";
    if (miniCssPlugin) {
      miniCssPlugin.options.filename = "css/[name].[contenthash:8].css";
    }
  } else {
    config.devtool = "eval-source-map";
    config.optimization.minimize = false;
    config.output.filename = "js/bundle.js";
    config.output.assetModuleFilename = "assets/[name][ext]";
    if (miniCssPlugin) {
      miniCssPlugin.options.filename = "css/style.bundle.css";
    }
  }

  config.optimization.splitChunks = false;
  config.optimization.runtimeChunk = false;

  return config;
};
