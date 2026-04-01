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

function createCopyPatterns() {
  return [
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
  ];
}

function createPlugins() {
  return [
    new MiniCssExtractPlugin({
      filename: "css/style.bundle.css",
    }),
    new CopyPlugin({
      patterns: createCopyPatterns(),
    }),
    ...generateHtmlPlugins("src/html/views"),
  ];
}

function createMinimizers() {
  return [
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
  ];
}

function createWebpackConfig(env, argv) {
  const isProduction = argv.mode === "production";

  return {
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
    devtool: isProduction ? "hidden-source-map" : "eval-source-map",
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
      minimize: isProduction,
      minimizer: createMinimizers(),
      splitChunks: false,
      runtimeChunk: false,
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
    plugins: createPlugins(),
  };
}

module.exports = (env, argv) => createWebpackConfig(env, argv);
