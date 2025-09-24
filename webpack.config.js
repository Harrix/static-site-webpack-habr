const path = require("path");
const fs = require("fs");
// CleanWebpackPlugin больше не нужен - используем встроенную опцию clean: true
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
      inject: true, // Автоматически вставляет скрипты и стили
      scriptLoading: "blocking", // Блокирующая загрузка скриптов
    });
  });
}

const htmlPlugins = generateHtmlPlugins("src/html/views");

const config = {
  entry: ["./src/js/index.js", "./src/scss/style.scss"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/bundle.js",
    clean: true, // Заменяет CleanWebpackPlugin в Webpack 5
    assetModuleFilename: "assets/[name][ext]", // Для встроенных модулей ресурсов
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
            drop_console: true, // Удаляет console.log в production
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
      // Обработка изображений с помощью встроенных модулей Webpack 5
      {
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb - файлы меньше будут встроены как data URL
          },
        },
        generator: {
          filename: "img/[name][ext]",
        },
      },
      // Обработка шрифтов
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
      // Обработка других файлов (ico, etc.)
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
    // CopyPlugin копирует статические файлы, которые не импортируются в коде
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
  // Настройки для production
  if (argv.mode === "production") {
    config.output.filename = "js/[name].js";
    config.output.assetModuleFilename = "assets/[name][ext]";

    // Отключаем хеши для совместимости с внешними проектами
    config.optimization.moduleIds = "named";
    config.optimization.chunkIds = "named";
  } else {
    // Настройки для development
    config.devtool = "eval-source-map";
    config.optimization.minimize = false;
    config.output.filename = "js/bundle.js";
    config.output.assetModuleFilename = "assets/[name][ext]";
    // Отключаем code splitting в development для простоты
    config.optimization.splitChunks = false;
    config.optimization.runtimeChunk = false;
  }

  return config;
};
