# Простой статический сайт на Webpack 5

Данная статья является документацией к проекту [static-site-webpack-habr](https://github.com/Harrix/static-site-webpack-habr). С помощью пакета Webpack под Node.js и других пакетов, включая HTML-шаблонизатор, создаётся набор HTML-страниц, которые удобно использовать для тестирования HTML-шаблонов или для генерации простого статического сайта.

На Хабре находится устаревшая версия этой [статьи](https://habr.com/ru/post/350886/). За это время некоторые подходы изменились, часть пакетов обновилась, часть устарела. В этой статье представлен переработанный вариант того материала под текущее состояние проекта.

## Постановка задачи

Сайт представляет собой простой набор HTML-страниц со своими CSS-стилями и файлом JavaScript. Нужно собрать сайт из исходников:

- из SASS (точнее [SCSS](https://sass-lang.com/documentation/syntax)) формируется один CSS-файл;
- из библиотек и пользовательского кода формируется один JavaScript-файл;
- HTML-страницы собираются по шаблонам, где шапка и футер вынесены в отдельные файлы.

<details>
<summary>Что не используем</summary>

В собранном сайте не используются [React](https://reactjs.org), [Vue.js](https://vuejs.org/), [Angular](https://angularjs.org/) и подобные фреймворки. Цель примера — универсальный подход без привязки к конкретному JS-фреймворку.

В качестве сборщика выбран [Webpack](https://webpack.js.org/), а не Grunt или Gulp.

</details>

Для примера сверстано несколько страниц на базе [Bootstrap 5](https://getbootstrap.com). Это только пример, можно использовать любой другой фреймворк или писать стили сами.

Предполагается, что [Node.js](https://nodejs.org) установлен и вы умеете работать с командной строкой (в Windows — `cmd` или PowerShell).

В итоге нужен набор готовых HTML-страниц для заливки на хостинг (например, [GitHub Pages](https://pages.github.com/)) или для локального просмотра.

## Структура проекта

```text
.
├── dist                 - папка, куда собирается итоговый сайт
├─┬ src                  - папка с исходниками
│ ├── favicon            - иконки для сайта
│ ├── fonts              - шрифты
│ ├─┬ html
│ │ ├── includes        - встраиваемые шаблоны (header, footer)
│ │ └── views           - сами HTML-страницы (контент без шапки/футера)
│ ├── img                - общие изображения (логотип, иконки)
│ ├── js                 - JavaScript
│ ├── scss               - SCSS-стили
│ └── uploads            - файлы статей (картинки, архивы)
├── package-lock.json
├── package.json
└── webpack.config.js
```

С файлами из примера:

```text
.
├── dist
├─┬ src
│ ├─┬ favicon
│ │ └── favicon.ico
│ ├─┬ fonts
│ │ └── Roboto-Regular.ttf
│ ├─┬ html
│ │ ├─┬ includes
│ │ │ ├── footer.html
│ │ │ └── header.html
│ │ └─┬ views
│ │   ├── index.html
│ │   └── second.html
│ ├─┬ img
│ │ └── logo.svg
│ ├─┬ js
│ │ └── index.js
│ ├─┬ scss
│ │ └── style.scss
│ └─┬ uploads
│   └── test.jpg
├── package-lock.json
├── package.json
└── webpack.config.js
```

Папку `node_modules` в репозиторий не добавляют (её обычно указывают в `.gitignore`).

Создаём папки проекта, переходим в корень проекта в командной строке и инициализируем npm:

```shell
npm init
```

Устанавливаем Webpack и связанные пакеты:

```shell
npm install webpack webpack-cli webpack-dev-server --save-dev
```

На этом этапе `package.json` может выглядеть так (версии пакетов могут отличаться):

```json
{
  "name": "static-site-webpack-habr",
  "version": "2.0.0",
  "description": "HTML template",
  "sideEffects": ["*.scss", "*.css"],
  "main": "src/js/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "devDependencies": {
    "webpack": "^5.105.4",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.3"
  }
}
```

## Сборка JavaScript

Точка входа — `src/js/index.js`. В проекте не используется Babel: современный синтаксис поддерживается целевой конфигурацией Webpack и браузеров.

Для примера подключён Bootstrap 5 (и по необходимости — Popper.js как зависимость Bootstrap):

```shell
npm install bootstrap @popperjs/core
```

Пример `src/js/index.js`:

```javascript
import "bootstrap";

document.body.style.color = "blue";
```

В Webpack 5 выходной путь и очистка задаются в `output`. В production итоговый файл — `js/main.js`, в development — один `js/bundle.js` (разбиение на чанки и отдельный runtime не используются):

```javascript
output: {
  path: path.resolve(__dirname, "dist"),
  filename: "js/bundle.js",  // в production переопределяется на "js/[name].js" → main.js
  clean: true,
  assetModuleFilename: "assets/[name][ext]",
}
```

Параметр `clean: true` перед каждой сборкой очищает папку `dist`, отдельный плагин для этого не нужен.

В `package.json` добавляем скрипты:

```json
"scripts": {
  "dev": "webpack --mode development",
  "watch": "webpack --mode development --watch",
  "start": "webpack serve --no-client-overlay-warnings",
  "build": "webpack --mode production && prettier --print-width=120 --parser html --write dist/*.html"
}
```

- **npm run dev** — однократная сборка в режиме разработки.
- **npm run watch** — сборка при изменении файлов.
- **npm run start** — запуск dev-сервера (по умолчанию порт 9000), с открытием браузера и hot reload.
- **npm run build** — production-сборка и форматирование HTML в `dist` через Prettier.

## Сборка CSS

Стили собираются из SCSS. Используется реализация [sass](https://www.npmjs.com/package/sass) (Dart Sass), а не устаревший `node-sass`.

```shell
npm install sass sass-loader css-loader mini-css-extract-plugin --save-dev
```

В Webpack 5 для выноса CSS в отдельный файл используется [mini-css-extract-plugin](https://webpack.js.org/plugins/mini-css-extract-plugin/); плагин `extract-text-webpack-plugin` больше не применяется.

Пример `src/scss/style.scss`:

```scss
$font-stack: -apple-system, BlinkMacSystemFont, Roboto, "Open Sans", "Helvetica Neue", sans-serif;
$logo-width: 10rem;
$container-img-width: 20rem;

@use "bootstrap/scss/bootstrap" as *;

@font-face {
  font-family: "Roboto";
  font-style: normal;
  font-weight: 400;
  src: url(../fonts/Roboto-Regular.ttf);
}

main {
  flex: 1;
}

body {
  font-family: $font-stack;
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  #logo {
    width: $logo-width;
  }

  .container img {
    width: $container-img-width;
  }
}
```

Bootstrap подключается через его SCSS (`@use "bootstrap/scss/bootstrap" as *`), чтобы при необходимости переопределять переменные и миксины.

В `webpack.config.js` добавляем правило для SCSS и плагин:

```javascript
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// В entry добавляем:
entry: ["./src/js/index.js", "./src/scss/style.scss"],

// В module.rules:
{
  test: /\.(sass|scss)$/,
  include: path.resolve(__dirname, "src/scss"),
  use: [
    { loader: MiniCssExtractPlugin.loader, options: {} },
    {
      loader: "css-loader",
      options: { sourceMap: true, url: false },
    },
    {
      loader: "sass-loader",
      options: {
        sourceMap: true,
        sassOptions: { quietDeps: true },
      },
    },
  ],
},

// В plugins:
new MiniCssExtractPlugin({ filename: "css/style.bundle.css" }),
```

Параметр `url: false` у `css-loader` отключает обработку `url()` в CSS (шрифты, картинки). Пути к таким файлам не меняются, копированием занимается отдельно CopyPlugin (см. ниже). Так проще избежать путаницы с путями из `node_modules` и своих папок.

Для минификации CSS в production используется `css-minimizer-webpack-plugin`, для JS — `terser-webpack-plugin`:

```shell
npm install css-minimizer-webpack-plugin terser-webpack-plugin --save-dev
```

В конфиге их подключают в `optimization.minimizer`. Разбиение на чанки (`splitChunks`, `runtimeChunk`) в проекте отключено: в обоих режимах собирается один JS-файл (в production — `main.js`, в development — `bundle.js`), что упрощает подключение скриптов и подходит для небольшого статического сайта:

```javascript
optimization: {
  minimize: true,
  minimizer: [
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: [
          "default",
          { discardComments: { removeAll: true } },
        ],
      },
    }),
    new TerserPlugin({
      extractComments: true,
      terserOptions: {
        compress: { drop_console: true },
      },
    }),
  ],
},
```

В режиме development минификацию отключают для ускорения сборки.

## Сборка HTML-страниц

Для HTML используется [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) с шаблонизатором lodash (идущим в комплекте с плагином).

Устанавливаем плагин:

```shell
npm install html-webpack-plugin --save-dev
```

Страницы лежат в `src/html/views`. Каждая страница задаёт переменные и подключает общие шапку и футер. Пример `src/html/views/index.html`:

```html
<% var data = {
  title: "Заголовок | Проект",
  description: "Первая страница проекта — сборка статического сайта на Webpack",
  author: "Harrix"
}; %>
<%= _.template(require('./../includes/header.html'))(data) %>

<div class="container">Первая страница.</div>

<%= _.template(require('./../includes/footer.html'))(data) %>
```

В `data` передаются переменные страницы (title, description, author и т.д.). Шаблоны из `includes` подключаются через `_.template(require(...))(data)`.

Важно: подключать нужно именно так (шаблон через `require` и lodash), а не через `html-loader`, иначе в подключаемых файлах не будет работать синтаксис lodash и переменные из `data`.

Пример `src/html/includes/header.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="<%= typeof description !== 'undefined' ? description : 'Статический сайт на Webpack' %>" />

    <link rel="icon" href="favicon/favicon.ico" type="image/x-icon" />

    <title><%= title %></title>
  </head>
  <body>
    <header><img src="img/logo.svg" id="logo" alt="Логотип" /></header>
    <main>
```

Файлы из `includes` должны загружаться как исходный текст. В Webpack 5 для этого используют встроенный тип `asset/source` (вместо отдельного `raw-loader`). Для изображений, шрифтов и прочих ресурсов, подключаемых из JS или CSS, можно использовать встроенные asset modules; статические каталоги по-прежнему копируются CopyPlugin (см. ниже):

```javascript
{
  test: /\.html$/,
  include: path.resolve(__dirname, "src/html/includes"),
  type: "asset/source",
},
// Опционально: изображения и шрифты, импортируемые в коде
{
  test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
  type: "asset",
  parser: { dataUrlCondition: { maxSize: 8 * 1024 } },
  generator: { filename: "img/[name][ext]" },
},
{
  test: /\.(woff|woff2|eot|ttf|otf)$/i,
  type: "asset/resource",
  generator: { filename: "fonts/[name][ext]" },
},
{
  test: /\.(ico|pdf)$/i,
  type: "asset/resource",
  generator: { filename: "[name][ext]" },
},
```

Чтобы не создавать вручную экземпляр плагина для каждой страницы, список HTML-файлов собирают из папки `src/html/views`:

```javascript
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");

function generateHtmlPlugins(templateDir) {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map((item) => {
    const parsedPath = path.parse(item);
    const name = parsedPath.name;
    const extension = parsedPath.ext.substring(1);
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      inject: "body",
      scriptLoading: "defer",
    });
  });
}

const htmlPlugins = generateHtmlPlugins("src/html/views");

// В plugins:
plugins: [/* ... */].concat(htmlPlugins),
```

С опцией `inject: "body"` плагин сам добавит в конец `<body>` ссылки на собранные JS и CSS, поэтому в шаблонах их прописывать не нужно.

Форматирование готовых HTML-файлов выполняется командой **npm run build** через Prettier (см. скрипт `build` в `package.json`). Отдельный пакет вроде `html-cli` не используется.

## Копирование статических файлов

Изображения, шрифты, favicon и файлы из `uploads` не проходят через JS/SCSS, поэтому копируются плагином [copy-webpack-plugin](https://webpack.js.org/plugins/copy-webpack-plugin/):

```shell
npm install copy-webpack-plugin --save-dev
```

В Webpack 5 используется новый API с `patterns`:

```javascript
const CopyPlugin = require("copy-webpack-plugin");

plugins: [
  // ...
  new CopyPlugin({
    patterns: [
      { from: "src/fonts", to: "fonts", noErrorOnMissing: true },
      { from: "src/favicon", to: "favicon", noErrorOnMissing: true },
      { from: "src/img", to: "img", noErrorOnMissing: true },
      { from: "src/uploads", to: "uploads", noErrorOnMissing: true },
    ],
  }),
],
```

`noErrorOnMissing: true` не даёт сборке падать, если какой-то из каталогов отсутствует.

## Режим разработки и production

В текущем конфиге режим задаётся через `--mode development` или `--mode production`. В функции `module.exports = (env, argv) => { ... }` настройки меняют в зависимости от `argv.mode`:

- в development отключают минификацию, используют один выходной файл `js/bundle.js` и `eval-source-map`;
- в production включают `CssMinimizerPlugin` и `TerserPlugin`, задают `output.filename: "js/[name].js"` (итоговый файл — `main.js`), для стабильных имён — `optimization.moduleIds: "named"` и `optimization.chunkIds: "named"`. Разбиение на чанки (`splitChunks`, `runtimeChunk`) отключено в обоих режимах: собирается один JS-бандл.

Для ускорения повторных сборок используется кэш на диске:

```javascript
cache: {
  type: "filesystem",
  buildDependencies: { config: [__filename] },
},
devtool: "source-map",  // в development переопределяется на "eval-source-map"
performance: {
  maxEntrypointSize: 512000,
  maxAssetSize: 512000,
},
```

Dev-сервер настроен так:

```javascript
devServer: {
  static: { directory: path.join(__dirname, "dist") },
  port: 9000,
  hot: true,
  open: true,
  watchFiles: ["src/**/*"],
},
```

Итоговые конфигурация и список зависимостей см. в репозитории [static-site-webpack-habr](https://github.com/Harrix/static-site-webpack-habr). Команда **npm run build** собирает проект и форматирует HTML; результат лежит в папке `dist`.
