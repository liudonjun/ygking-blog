---
title: node版本管理
date: 2022/07/03
tags:
  - node
  - nvm
categories:
  - 工具
---

### 使用 nvm 来进行 node 版本管理

[nvm](http://nvm.uihtm.com/)全英文也叫 node.js version management，是一个 nodejs 的版本管理工具。nvm 和 n 都是 node.js 版本管理工具，为了解决 node.js 各种版本存在不兼容现象可以通过它可以安装和切换不同版本的 node.js

安装之前需要先卸载之前的 Node,nvm 傻瓜式安装

```bash
# nvm list available 显示可下载版本的部分列表
nvm list available
# nvm install latest 安装最新版本 
nvm install latest
# npm install version 安装指定版本Node,也可以是最新稳定版本latest
npm install v14.16.0
# nvm uninstall version 卸载指定版本node
npm uninstall v14.16.0
# nvm use version 使用指定版本node
nvm use v14.16.0
# nvm version 显示nvm版本
nvm version
# nvm list 显示已安装的列表可简写nvm ls
nvm list | nvm ls
```
