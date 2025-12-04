# Kotlin/JS 系列文章导航

## 系列概述

本系列文章全面介绍 Kotlin/JS 开发，从基础入门到高级应用，帮助开发者掌握使用 Kotlin 编写 JavaScript 应用程序的技能。系列采用渐进式学习路径，适合不同层次的读者。

## 文章列表

### 📚 基础篇

#### 1. [Kotlin/JS 简介与环境搭建](./docs/kt/KotlinJS-简介与环境搭建.md)

- **难度**：⭐⭐
- **阅读时间**：15 分钟
- **主要内容**：了解 Kotlin/JS 的基本概念，搭建开发环境，创建第一个项目
- **前置知识**：基础 Kotlin 语法，HTML/CSS 基础

#### 2. [Kotlin/JS 基础语法与类型映射](./docs/kt/KotlinJS-基础语法与类型映射.md)

- **难度**：⭐⭐⭐
- **阅读时间**：20 分钟
- **主要内容**：掌握 Kotlin/JS 的语法特性，理解类型系统映射
- **前置知识**：Kotlin 基础语法，JavaScript 基础

### 🔧 进阶篇

#### 3. [Kotlin/JS 与 JavaScript 互操作](./docs/kt/KotlinJS-与JavaScript互操作.md)

- **难度**：⭐⭐⭐⭐
- **阅读时间**：25 分钟
- **主要内容**：学习如何在 Kotlin 中调用 JavaScript 代码，处理第三方库
- **前置知识**：前两篇文章内容，JavaScript 模块系统

#### 4. [Kotlin/JS DOM 操作与 Web API 集成](./docs/kt/KotlinJS-DOM操作与WebAPI集成.md)

- **难度**：⭐⭐⭐⭐
- **阅读时间**：30 分钟
- **主要内容**：掌握 DOM 操作，集成浏览器 API，处理用户交互
- **前置知识**：JavaScript DOM 操作，事件处理基础

#### 5. [Kotlin/JS 异步编程与协程](./docs/kt/KotlinJS-异步编程与协程.md)

- **难度**：⭐⭐⭐⭐⭐
- **阅读时间**：35 分钟
- **主要内容**：深入理解 Kotlin 协程在 JS 环境中的应用，处理异步操作
- **前置知识**：Kotlin 协程基础，JavaScript 异步编程

#### 6. [Kotlin/JS 模块化与依赖管理](./docs/kt/KotlinJS-模块化与依赖管理.md)

- **难度**：⭐⭐⭐⭐
- **阅读时间**：25 分钟
- **主要内容**：掌握模块系统，管理项目依赖，优化构建流程
- **前置知识**：Gradle 基础，npm 包管理

### 🚀 高级篇

#### 7. [Kotlin/JS React 集成与组件开发](./docs/kt/KotlinJS-React集成与组件开发.md)

- **难度**：⭐⭐⭐⭐⭐
- **阅读时间**：40 分钟
- **主要内容**：学习使用 Kotlin/JS 开发 React 应用，构建现代 Web 界面
- **前置知识**：React 基础，前六篇文章内容

#### 8. [Kotlin/JS 性能优化与调试技巧](./docs/kt/KotlinJS-性能优化与调试技巧.md)

- **难度**：⭐⭐⭐⭐⭐
- **阅读时间**：30 分钟
- **主要内容**：掌握性能优化策略，学习调试技巧，解决常见问题
- **前置知识**：Web 性能优化基础，浏览器开发者工具

#### 9. [Kotlin/JS 与 Kotlin Multiplatform 协同开发](./docs/kt/KotlinJS-与KotlinMultiplatform协同开发.md)

- **难度**：⭐⭐⭐⭐⭐
- **阅读时间**：35 分钟
- **主要内容**：了解多平台开发，实现代码共享，构建跨平台应用
- **前置知识**：Kotlin Multiplatform 基础，前八篇文章内容

#### 10. [Kotlin/JS 实战项目与最佳实践](./docs/kt/KotlinJS-实战项目与最佳实践.md)

- **难度**：⭐⭐⭐⭐⭐
- **阅读时间**：45 分钟
- **主要内容**：综合应用所学知识，构建完整项目，总结最佳实践
- **前置知识**：全系列文章内容

## 学习路径建议

### 🎯 初学者路径

1. 文章 1 → 文章 2 → 文章 3 → 文章 4
2. 完成后可以尝试构建简单的 Web 应用

### 🎯 中级开发者路径

1. 快速浏览文章 1-2（重点看差异部分）
2. 深入学习文章 3-6
3. 根据需要选择文章 7 或文章 8

### 🎯 高级开发者路径

1. 直接从文章 5 开始
2. 重点学习文章 7-9
3. 参考文章 10 的最佳实践

## 配套资源

### 🛠️ 开发工具

- [IntelliJ IDEA](https://www.jetbrains.com/idea/) - 推荐 IDE
- [VS Code](https://code.visualstudio.com/) - 轻量级选择
- [Gradle](https://gradle.org/) - 构建工具

### 📖 参考资料

- [Kotlin/JS 官方文档](https://kotlinlang.org/docs/js-overview.html)
- [Kotlin 语言文档](https://kotlinlang.org/docs/home.html)
- [MDN Web 文档](https://developer.mozilla.org/) - Web API 参考

### 🎯 示例项目

- [Kotlin/JS 示例仓库](https://github.com/Kotlin/kotlin-wrappers)
- [React-Kotlin 示例](https://github.com/JetBrains/kotlin-wrappers/tree/master/examples/react)

## 常见问题

### Q: 我需要先学习 JavaScript 吗？

A: 建议有基础的 JavaScript 知识，但不是必需的。Kotlin/JS 提供了良好的抽象层。

### Q: Kotlin/JS 生成的代码体积大吗？

A: 现代 Kotlin/JS 编译器已经大幅优化，通过 Tree Shaking 可以生成紧凑的代码。

### Q: 可以在现有 JavaScript 项目中使用 Kotlin 吗？

A: 可以，Kotlin/JS 支持渐进式集成，可以与现有 JavaScript 代码无缝协作。

### Q: Kotlin/JS 支持哪些浏览器？

A: 支持所有现代浏览器，包括 Chrome、Firefox、Safari、Edge 等。

## 贡献指南

如果您发现文章中的错误或有改进建议，欢迎提交 Issue 或 Pull Request。

## 更新日志

- **2024-01-15**: 系列文章创建
- **2024-01-20**: 添加学习路径建议
- **2024-01-25**: 更新配套资源链接

---

_本系列文章持续更新中，欢迎关注最新内容！_
