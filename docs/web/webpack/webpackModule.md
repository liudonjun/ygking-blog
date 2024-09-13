---
title: webpack处理html和模块化打包
date: 2022/8/03
tags:
  - Vue
  - webpack
categories:
  - 进阶
---

## webpack 入门

### 初始化 npm 项目

```bash
# 初始化项目
npm init -y
# 全局安装webpack
npm i webpack -g
# 项目中安装webpack --save-dev 开发环境依赖
npm i webpack -D
# 安装webpack cli 脚手架工具
npm i webpack-cli -D
# 检测安装是否成功
webpack -v
# ----------------------------------------------------
  System:
    OS: Windows 10 10.0.22000
    CPU: (16) x64 AMD Ryzen 7 5800H with Radeon Graphics
    Memory: 7.49 GB / 15.86 GB
  Binaries:
    Node: 16.14.0 - C:\Program Files\nodejs\node.EXE
    Yarn: 1.22.19 - C:\Program Files\nodejs\yarn.CMD
    npm: 8.3.1 - C:\Program Files\nodejs\npm.CMD
  Browsers:
    Edge: Spartan (44.22000.120.0), Chromium (109.0.1518.78)
    Internet Explorer: 11.0.22000.120
  Packages:
    webpack: ^5.75.0 => 5.75.0
    webpack-cli: ^5.0.1 => 5.0.1
```

### webpack configuration 介绍

- mode：构建模式
- entry :配置入口资源
- output:配置编译后的资源
- module:资源处理
- resolve:配置资源别名/扩展名等
- plugins:插件，比 loader 更强大

### 创建 webpack 配置文件

项目根目录创建 webpack.config.js

```bash
const webpack = require("webpack");

console.log(webpack)
# 命令行运行
node webpack.config.js
#---------- 检验安装是否成功

[Function: f] {
  webpack: [Getter],
  validate: [Getter],
  validateSchema: [Getter],
  version: [Getter],
  cli: [Getter],
  AutomaticPrefetchPlugin: [Getter],
  AsyncDependenciesBlock: [Getter],
  BannerPlugin: [Getter],
  Cache: [Getter],
  Chunk: [Getter],
  ChunkGraph: [Getter],
  CleanPlugin: [Getter],
  Compilation: [Getter],
  Compiler: [Getter],
  ConcatenationScope: [Getter],
  ContextExclusionPlugin: [Getter],
  ContextReplacementPlugin: [Getter],
  DefinePlugin: [Getter],
  DelegatedPlugin: [Getter],
  Dependency: [Getter],
  DllPlugin: [Getter],
  DllReferencePlugin: [Getter],
  DynamicEntryPlugin: [Getter],
  EntryOptionPlugin: [Getter],
  EntryPlugin: [Getter],
  EnvironmentPlugin: [Getter],
  EvalDevToolModulePlugin: [Getter],
  EvalSourceMapDevToolPlugin: [Getter],
  ExternalModule: [Getter],
  ExternalsPlugin: [Getter],
  Generator: [Getter],
  HotUpdateChunk: [Getter],
  HotModuleReplacementPlugin: [Getter],
  IgnorePlugin: [Getter],
  JavascriptModulesPlugin: [Getter],
  LibManifestPlugin: [Getter],
  LibraryTemplatePlugin: [Getter],
  LoaderOptionsPlugin: [Getter],
  LoaderTargetPlugin: [Getter],
  Module: [Getter],
  ModuleFilenameHelpers: [Getter],
  ModuleGraph: [Getter],
  ModuleGraphConnection: [Getter],
  NoEmitOnErrorsPlugin: [Getter],
  NormalModule: [Getter],
  NormalModuleReplacementPlugin: [Getter],
  MultiCompiler: [Getter],
  Parser: [Getter],
  PrefetchPlugin: [Getter],
  ProgressPlugin: [Getter],
  ProvidePlugin: [Getter],
  RuntimeGlobals: [Getter],
  RuntimeModule: [Getter],
  SingleEntryPlugin: [Getter],
  SourceMapDevToolPlugin: [Getter],
  Stats: [Getter],
  Template: [Getter],
  UsageState: [Getter],
  WatchIgnorePlugin: [Getter],
  WebpackError: [Getter],
  WebpackOptionsApply: [Getter],
  WebpackOptionsDefaulter: [Getter],
  WebpackOptionsValidationError: [Getter],
  ValidationError: [Getter],
  cache: { MemoryCachePlugin: [Getter] },
  config: {
    getNormalizedWebpackOptions: [Getter],
    applyWebpackOptionsDefaults: [Getter]
  },
  dependencies: {
    ModuleDependency: [Getter],
    HarmonyImportDependency: [Getter],
    ConstDependency: [Getter],
    NullDependency: [Getter]
  },
  ids: {
    ChunkModuleIdRangePlugin: [Getter],
    NaturalModuleIdsPlugin: [Getter],
    OccurrenceModuleIdsPlugin: [Getter],
    NamedModuleIdsPlugin: [Getter],
    DeterministicChunkIdsPlugin: [Getter],
    DeterministicModuleIdsPlugin: [Getter],
    NamedChunkIdsPlugin: [Getter],
    OccurrenceChunkIdsPlugin: [Getter],
    HashedModuleIdsPlugin: [Getter]
  },
  javascript: {
    EnableChunkLoadingPlugin: [Getter],
    JavascriptModulesPlugin: [Getter],
    JavascriptParser: [Getter]
  },
  optimize: {
    AggressiveMergingPlugin: [Getter],
    AggressiveSplittingPlugin: [Getter],
    InnerGraph: [Getter],
    LimitChunkCountPlugin: [Getter],
    MinChunkSizePlugin: [Getter],
    ModuleConcatenationPlugin: [Getter],
    RealContentHashPlugin: [Getter],
    RuntimeChunkPlugin: [Getter],
    SideEffectsFlagPlugin: [Getter],
    SplitChunksPlugin: [Getter]
  },
    createHash: [Getter],
    comparators: [Getter],
    runtime: [Getter],
    serialization: [Getter],
    cleverMerge: [Getter],
    LazySet: [Getter]
  },
  sources: [Getter],
  experiments: {
    schemes: { HttpUriPlugin: [Getter] },
    ids: { SyncModuleIdsPlugin: [Getter] }
  }
}
```

### 编写配置文件

**目录结构**
<!-- ![image](/webpack/image(2).png) -->

```bash
const path = require("path");
module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, "src/scripts/app.js"),
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build/scripts"),
  },
};

```

<!-- ![image](/webpack/image(3).png) -->
<!-- ![image](/webpack/image(4).png) -->
**执行打包命令**

```javascript
PS D:\Code\webpack\webpackStudy> webpack
asset main.js 2.62 KiB [emitted] (name: main)
./src/scripts/app.js 72 bytes [built] [code generated]
./src/scripts/index.js 77 bytes [built] [code genera
```

```bash
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>webpack test demo</title>
  </head>
  <body>
    hello webpack
    <script src="../build/scripts/main.js"></script>
  </body>
</html>
```

<!-- ![image1](</webpack/image(1).png>) -->

```javascript

"scripts": {
  "dev": "webpack --mode development",
  "build": "webpack --mode production"
},
```

[webpackStudy.zip](https://www.yuque.com/attachments/yuque/0/2023/zip/26969329/1676816692893-972971ee-4b86-4a47-9c0b-a4b1b23e173e.zip?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Fzip%2F26969329%2F1676816692893-972971ee-4b86-4a47-9c0b-a4b1b23e173e.zip%22%2C%22name%22%3A%22webpackStudy.zip%22%2C%22size%22%3A29027%2C%22ext%22%3A%22zip%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22taskId%22%3A%22udd85b1a3-7ac4-44cf-9719-0c3f1581775%22%2C%22taskType%22%3A%22transfer%22%2C%22type%22%3A%22application%2Fx-zip-compressed%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22ue723ecb1%22%2C%22card%22%3A%22file%22%7D)

[https://www.webpackjs.com/concepts/output/#advanced](https://www.webpackjs.com/concepts/output/#advanced)

### plugins 的配置

```javascript
const htmlWebpackPlugin = require("html-webpack-plugin");

// html-webpack-plugin 将js自动引入到指定html中
plugins: [
    new htmlWebpackPlugin({
      filename: "index.html",
      template: path.resolve(__dirname, "src/index.html"),
    }),
  ],
```

### loader 的配置

注意：与 1.x 版本有区别
[https://www.webpackjs.com/loaders/css-loader/](https://www.webpackjs.com/loaders/css-loader/)

```javascript
module: {
    rules: [
      {
        test: /\.css$/, //正则表达式，匹配文件类型
        use: ["style-loader", "css-loader"], //申明使用什么loader进行处理
      },
    ],
  },
-----------1.0
  module:{
      rules:[
          {
              test:/\.css$/, //正则表达式，匹配文件类型
              loader:'style-loader!css-loader' //申明使用什么loader进行处理
          }
      ]
  }
```

### resolve 资源别名的配置

```javascript
resolve: {
    extensions: ["", ".js", ".css"],
  },
```

webapck 更新日志
[https://github.com/webpack/webpack/releases](https://github.com/webpack/webpack/releases)
