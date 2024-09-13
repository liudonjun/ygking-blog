---
title: 让程序自动处理规范化内容
date: 2022/07/4
tags:
  - web
  - ESLint
  - GitHooks
  - husky
  - prettier
categories:
  - 基础
---

## 代码规范

旨在增强团队开发协作、提高代码质量和打造开发基石的编码规范，统一团队的 JS 语法风格和书写习惯，减少程序出错的概率,没有统一的代码规范合并代码就是灾难性的、难以维护的,有的人会说啊 eslint 算了算了，空格都报错哈哈哈，没错就是它，如何让它格式化就变成 eslint 想要的样子呢

## 让程序自动处理规范化内容 eslint+prettier

让程序自动处理规范化内容，所用到的就是下面两个插件

[Prettier](https://prettier.io/)代码格式化插件，可以在 VSCode 插件中心找到

[ESlint](https://eslint.org/)代码规范检查和格式化工具

都可以在 VSCode 插件中心找到

### 依赖的安装

```bash
# ESlint所需依赖
yarn add eslint-config-standard eslint-plugin-import eslint-plugin-promise eslint-plugin-node eslint-plugin-n -D
# 安装完成ESlint部分就可以啦
```

Prettier 有着自己的配置详细配置可以前往官网配置
下面这个是 angular 的.prettierrc 配置文件

根目录创建 .prettierrc

```bash
{
  "printWidth": 100,
  "tabWidth": 2,
  "tabs": false,
  "singleQuote": true,
  "semicolon": true,
  "quoteProps": "preserve",
  "bracketSpacing": true
}
```

关闭保存时自动格式化 format on save 避免每次保存都要格式化
<!-- ![logo](/articleImg/formatOnSave.png) -->

又有人会说嘿我关闭了这个我不格式化直接 push 代码 🤣,我们可以把这个拦截操作提前，在本地提交代码的时候，不符合 commit 信息规范的禁止提交。而不是在合并公仓的时候才发现

## husky

husky 是一个让配置 git 钩子变得更简单的工具。支持所有的 git 钩子。

```bash
# 依赖项安装
yarn add husky -D
# husky
npx husky install
# 配置package.json script  那些文件需要校验
"lint": "eslint --ext .js --ext .vue src/"
# 添加commit前校验
npx husky add .husky/pre-commit "npm run lint"
```

### 提交时校验

使用 [commitizen](https://www.npmjs.com/package/commitizen) 提交时，系统会提示你在提交时填写任何必需的提交字段。不再需要等到稍后让 git 提交钩子运行并拒绝您的提交

```bash
  # 依赖安装
  npm install -g commitizen@4.2.4
  # 使用git cz 代替传统的git commit
  git cz
```

### 根目录创建 .cz-config.js

```
module.exports = {
  types:[
    {value:'feat',name:'feat: 添加新特性'},
    {value:'fix',name:'fix: 修复bug'},
    {value:'docs',name:'docs: 仅仅修改了文档'},
    {value:'style',name:'style: 仅仅修改了空格、格式缩进、都好等等，不改变代码逻辑'},
    {value:'refactor',name:'refactor: 代码重构，没有加新功能或者修复bug'},
    {value:'perf',name:'perf: 增加代码进行性能测试'},
    {value:'test',name:'test: 增加测试用例'},
    {value:'chore',name:'chore: 改变构建流程、或者增加依赖库、工具等'},
  ],
  messages:{
    type:'请选择提交类型:',
    // customScope:'请输入修改范围(可选):',
    customScope:'按规范不需要填写直接回车跳过(Enter):',
    subject:'请简要描述提交(必填):',
    body:'请输入详细描述(可选):',
    footer:'请输入要关闭的issue(可选):',
    confirmCommit:'确认要使用以上信息提交? (y/n)'
  },
  // 跳过步骤
  skipQuestions:['body','footer'],
  // 默认长度72
  subjectLimit:72
}
```
