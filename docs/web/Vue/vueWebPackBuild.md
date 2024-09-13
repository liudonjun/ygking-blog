---
title: Vue2.x webpack代码打包方案
date: 2022/10/27
tags:
  - web
  - webpack
categories:
  - 工程化
---

[compression-webpack-plugin](https://www.npmjs.com/package/compression-webpack-plugin)

```bash
# 依赖的安装
npm i compression-webpack-plugin
```

## Vue 配置文件

### 分片打包

```javascript
// Vue-cli3  module.exports
// vue.config.js
const CompressionPlugin = require("compression-webpack-plugin");

chainWebpack: (config) => {
  config.resolve.alias
    .set("@$", resolve("src"))
    .set("@api", resolve("src/api"))
    .set("@assets", resolve("src/assets"))
    .set("@comp", resolve("src/components"))
    .set("@views", resolve("src/views"));

  //生产环境，服务端开启js\css压缩
  if (process.env.NODE_ENV === "production") {
    config.plugin("compressionPlugin").use(
      new CompressionPlugin({
        test: /\.(js|css|less)$/, // 匹配文件名
        threshold: 10240, // 对超过10k的数据压缩
        deleteOriginalAssets: false, // 不删除源文件
      })
    );
  }
};
```

### 分依赖模块打包

```javascript
// Vue-cli3  module.exports
// vue.config.js
configureWebpack: config => {
    //生产环境取消 console.log
    if (process.env.NODE_ENV === 'production') {
      config.optimization.runtimeChunk = 'single'
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 2000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace('@', '')}`
            }
          }
        }
      };
    }
  },
```
