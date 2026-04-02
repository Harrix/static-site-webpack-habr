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

Предполагается, что [Node.js](https://nodejs.org) версии 20 или новее установлен (в `package.json` задано `engines.node: ">=20"`) и вы умеете работать с командной строкой (в Windows — `cmd` или PowerShell).

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
  "engines": {
    "node": ">=20"
  },
  "main": "src/js/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "devDependencies": {
    "webpack": "^5.105.4",
    "webpack-cli": "^7.0.2",
    "webpack-dev-server": "^5.2.3"
  }
}
```

Дальше по тексту добавляются Bootstrap, скрипты `dev` / `watch` / `start` / `build`, Prettier, лоадеры и плагины; итоговый `package.json` см. в репозитории.

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

В Webpack 5 выходной путь и очистка задаются в `output`. И в development, и в production выходной JS — один файл `js/bundle.js` (без [content hash](https://webpack.js.org/configuration/output/#outputfilename) в имени: так проще предсказуемые пути на хостинге; при необходимости кэш можно сбрасывать иначе или вернуть шаблон вида `js/[name].[contenthash:8].js`). Разбиение на чанки и отдельный runtime не используются.

```javascript
output: {
  path: path.resolve(__dirname, "dist"),
  filename: "js/bundle.js",
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

Для последней команды в `devDependencies` должен быть установлен [Prettier](https://prettier.io/): `npm install prettier --save-dev`.

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

// В package.json (как в репозитории) для корректного tree-shaking при отдельной точке входа для стилей:
// "sideEffects": ["*.scss", "*.css"]

// В module.rules:
{
  test: /\.(sass|scss)$/,
  include: path.resolve(__dirname, "src/scss"),
  use: [
    { loader: MiniCssExtractPlugin.loader, options: {} },
    {
      loader: "css-loader",
      options: { sourceMap: true, url: true },
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

Параметр `url: true` (значение по умолчанию у `css-loader`, в репозитории задан явно) включает разбор `url(...)` в скомпилированном CSS: относительные пути к файлам (например, шрифт в `@font-face` из `../fonts/…` рядом с SCSS) превращаются в модули Webpack и попадают в выходную структуру согласно правилам `asset` / `asset/resource` (у нас шрифты — в `fonts/[name][ext]`). Итоговый CSS в `dist` получает корректные URL относительно выложенного сайта, в том числе при смене `publicPath` или раскладки `dist/`. Ссылки вида `data:…` (иконки форм и навигации в Bootstrap) обрабатываются как данные и не требуют файлов на диске. Файлы из `src/img`, `src/favicon`, `src/uploads` по-прежнему копирует CopyPlugin, если они не подключаются через `url()` в стилях; каталог `src/fonts` тоже копируется — так в сборку попадают шрифты, которые вы положили в папку, но ещё не сослались из SCSS.

Для минификации CSS в production используется `css-minimizer-webpack-plugin`, для JS — `terser-webpack-plugin`:

```shell
npm install css-minimizer-webpack-plugin terser-webpack-plugin --save-dev
```

В конфиге их подключают в `optimization.minimizer`. Разбиение на чанки (`splitChunks`, `runtimeChunk`) в проекте отключено: в обоих режимах собирается один JS-файл `js/bundle.js`, что упрощает подключение скриптов и подходит для небольшого статического сайта. В репозитории экземпляры минификаторов создаёт отдельная функция `createMinimizers()`, а флаг `optimization.minimize` выставляется в `true` только для production (в development — `false`, для ускорения сборки):

```javascript
function createMinimizers() {
  return [
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
  ];
}

// внутри createWebpackConfig(env, argv):
optimization: {
  minimize: argv.mode === "production",
  minimizer: createMinimizers(),
  splitChunks: false,
  runtimeChunk: false,
},
```

## Сборка HTML-страниц

Для HTML используется [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) с шаблонизатором в стиле [lodash.template](https://lodash.com/docs/#template). Для подключения общих фрагментов из `src/html/includes` в конфиге Webpack задаётся функция `include`, которая читает файл по имени и рендерит его через лёгкий шаблонизатор [Eta](https://www.npmjs.com/package/eta) с переданными данными.

Устанавливаем плагин и `eta` (нужен в `webpack.config.js` для рендера includes):

```shell
npm install html-webpack-plugin eta --save-dev
```

Страницы лежат в `src/html/views`. Каждая страница задаёт переменные и подключает общие шапку и футер. Пример `src/html/views/index.html`:

```html
<% var data = {
  title: "Заголовок | Проект",
  description: "Первая страница проекта — сборка статического сайта на Webpack",
  author: "Harrix"
}; %>
<%= include("header.html", data) %>

<div class="container">Первая страница.</div>

<%= include("footer.html", data) %>
```

В `data` передаются переменные страницы (title, description, author и т.д.). Вызов `include("имя.html", data)` подставляет файл из `src/html/includes`; в путь передаётся только basename (без `..` и без подкаталогов), чтобы исключить обход каталога.

В `webpack.config.js` это выглядит так:

```javascript
const fs = require("fs");
const { Eta } = require("eta");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const INCLUDES_DIR = path.resolve(__dirname, "src/html/includes");
const eta = new Eta({ useWith: true, autoEscape: false });

function includeHtml(filename, data) {
  const safeName = path.basename(filename);
  const fullPath = path.resolve(INCLUDES_DIR, safeName);
  const rel = path.relative(INCLUDES_DIR, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Invalid include: ${filename}`);
  }
  const source = fs.readFileSync(fullPath, "utf8");
  return eta.renderString(source, data);
}
```

Для каждого экземпляра `HtmlWebpackPlugin` передаётся `templateParameters: { include: includeHtml }`, чтобы в шаблонах страниц была доступна функция `include`.

Альтернатива — вручную писать `_.template(require('./../includes/header.html'))(data)` при правиле `asset/source` для `includes`; текущий проект использует `include(...)` для более короткой разметки и единообразной проверки путей.

Важно: фрагменты из `includes` не подключают через `html-loader` как обычные шаблоны страниц, иначе в них не будут доступны те же переменные и синтаксис, что в `views`.

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

Чтобы не создавать вручную экземпляр плагина для каждой страницы, список HTML-файлов собирают из папки `src/html/views` (берутся только файлы с расширением `.html`):

```javascript
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

function createPlugins() {
  return [
    new MiniCssExtractPlugin({ filename: "css/style.bundle.css" }),
    new CopyPlugin({ patterns: createCopyPatterns() }), // createCopyPatterns — в разделе «Копирование статических файлов»
    ...generateHtmlPlugins("src/html/views"),
  ];
}

// внутри возвращаемого объекта конфигурации:
plugins: createPlugins(),
```

Так при каждом вызове фабрики конфигурации создаются новые экземпляры плагинов (в том числе для каждой страницы), а не переиспользуется один и тот же массив — это согласуется с подходом без мутации общего объекта `config` (см. раздел про режимы ниже).

С опцией `inject: "body"` плагин сам добавит в конец `<body>` ссылки на собранные JS и CSS, поэтому в шаблонах их прописывать не нужно.

Форматирование готовых HTML-файлов выполняется командой **npm run build** через Prettier (см. скрипт `build` в `package.json`). Отдельный пакет вроде `html-cli` не используется.

## Копирование статических файлов

Изображения, шрифты, favicon и файлы из `uploads` не проходят через JS/SCSS, поэтому копируются плагином [copy-webpack-plugin](https://webpack.js.org/plugins/copy-webpack-plugin/):

```shell
npm install copy-webpack-plugin --save-dev
```

В Webpack 5 используется новый API с `patterns`. В репозитории массив шаблонов вынесен в функцию `createCopyPatterns()`, а сам `CopyPlugin` добавляется в общий список в `createPlugins()`:

```javascript
const CopyPlugin = require("copy-webpack-plugin");

function createCopyPatterns() {
  return [
    { from: "src/fonts", to: "fonts", noErrorOnMissing: true },
    { from: "src/favicon", to: "favicon", noErrorOnMissing: true },
    { from: "src/img", to: "img", noErrorOnMissing: true },
    { from: "src/uploads", to: "uploads", noErrorOnMissing: true },
  ];
}
```

`noErrorOnMissing: true` не даёт сборке падать, если какой-то из каталогов отсутствует.

## Режим разработки и production

В текущем конфиге режим задаётся через `--mode development` или `--mode production`. Экспорт модуля — это функция `(env, argv) => createWebpackConfig(env, argv)`, которая **каждый раз возвращает новый объект** настроек. Общий объект конфигурации между вызовами **не изменяют**: так проще избежать накопления правок, если конфигурационную функцию вызовут повторно в том же процессе (например, в тестах или инструментах).

Внутри `createWebpackConfig` в зависимости от `argv.mode` задаются:

- в development — `optimization.minimize: false`, один выходной файл `js/bundle.js`, CSS — `css/style.bundle.css`, ресурсы из asset modules — `assets/[name][ext]`, `devtool: "eval-source-map"`;
- в production — `optimization.minimize: true` (работают `CssMinimizerPlugin` и `TerserPlugin` из `createMinimizers()`), те же стабильные имена файлов (`js/bundle.js`, `css/style.bundle.css`, `assets/[name][ext]` без content hash), `devtool: "hidden-source-map"` (отдельные `.map` генерируются, но в бандл ссылка на них не вставляется). Разбиение на чанки (`splitChunks`, `runtimeChunk`) отключено в обоих режимах: собирается один JS-бандл.

Для ускорения повторных сборок используется кэш на диске; `devtool` задаётся условно, без одного «глобального» значения на весь файл:

```javascript
function createWebpackConfig(env, argv) {
  const isProduction = argv.mode === "production";
  return {
    // ...
    devtool: isProduction ? "hidden-source-map" : "eval-source-map",
    cache: {
      type: "filesystem",
      buildDependencies: { config: [__filename] },
    },
    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    // optimization, module, plugins — см. репозиторий
  };
}

module.exports = (env, argv) => createWebpackConfig(env, argv);
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

Итоговые конфигурация и список зависимостей см. в репозитории [static-site-webpack-habr](https://github.com/Harrix/static-site-webpack-habr). Команда **npm run build** собирает проект и форматирует HTML; результат лежит в папке `dist`. Имена JS, CSS и файлов в `assets/` без content hash; `HtmlWebpackPlugin` подставляет в страницы ссылки на собранные бандлы.
