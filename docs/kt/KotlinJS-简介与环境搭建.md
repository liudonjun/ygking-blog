---
description: 介绍Kotlin/JS的基本概念、优势以及如何搭建开发环境，创建第一个Kotlin/JS项目。
tag:
  - Kotlin
  - JavaScript
  - 基础
  - 环境搭建
sidebar: true
---

# Kotlin/JS 简介与环境搭建

## 什么是 Kotlin/JS

Kotlin/JS 是 Kotlin 语言的一个目标平台，允许开发者使用 Kotlin 语法编写代码，然后编译成可在浏览器或 Node.js 环境中运行的 JavaScript 代码。作为 Kotlin Multiplatform 生态系统的重要组成部分，Kotlin/JS 为 Web 开发带来了类型安全、空安全和现代语言特性的优势。

### Kotlin/JS 的核心优势

1. **类型安全**：编译时类型检查，减少运行时错误
2. **空安全**：Kotlin 的空安全机制帮助避免 NullPointerException
3. **现代语法**：简洁的语法糖，提高代码可读性和开发效率
4. **互操作性**：与现有 JavaScript 代码和库无缝集成
5. **工具支持**：优秀的 IDE 支持和调试体验
6. **代码复用**：可与 Kotlin Multiplatform 项目共享业务逻辑

## 开发环境准备

### 1. 安装 JDK

Kotlin/JS 开发需要 Java Development Kit（JDK）。推荐使用 JDK 17 或更高版本：

```bash
# macOS使用Homebrew安装
brew install openjdk@17

# Windows可从Oracle官网下载安装包
# Linux使用包管理器安装，如Ubuntu
sudo apt update
sudo apt install openjdk-17-jdk
```

验证安装：

```bash
java -version
javac -version
```

### 2. 安装 IDE

推荐使用 IntelliJ IDEA，它对 Kotlin/JS 提供了最好的支持：

- **IntelliJ IDEA Ultimate**：提供完整的 Web 开发支持
- **IntelliJ IDEA Community**：免费版本，支持基本的 Kotlin/JS 开发

下载地址：[https://www.jetbrains.com/idea/](https://www.jetbrains.com/idea/)

### 3. 安装构建工具

Kotlin/JS 项目使用 Gradle 作为构建工具。确保安装了 Gradle 7.0 或更高版本：

```bash
# 使用Homebrew安装（macOS）
brew install gradle

# 或者使用Gradle Wrapper（推荐）
# 项目创建后会自动包含gradlew
```

## 创建第一个 Kotlin/JS 项目

### 方法一：使用 IntelliJ IDEA 向导

1. 打开 IntelliJ IDEA
2. 选择"File" → "New" → "Project"
3. 选择"Kotlin Multiplatform"模板
4. 配置项目信息：
   - 项目名称
   - 位置
   - 构建系统（选择 Gradle）
   - JDK 版本
5. 在平台选择中，勾选"JavaScript"
6. 点击"Create"完成创建

### 方法二：手动创建项目结构

创建项目目录结构：

```
kotlin-js-demo/
├── build.gradle.kts
├── settings.gradle.kts
├── src/
│   └── main/
│       └── kotlin/
│           └── Main.kt
└── src/
    └── main/
        └── resources/
            └── index.html
```

#### 配置 build.gradle.kts

```kotlin
plugins {
    kotlin("js") version "1.9.20"
}

group = "com.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

kotlin {
    js {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
        }
        binaries.executable()
    }
}
```

#### 配置 settings.gradle.kts

```kotlin
rootProject.name = "kotlin-js-demo"
```

#### 创建主程序文件

`src/main/kotlin/Main.kt`:

```kotlin
import kotlinx.browser.document
import kotlinx.html.dom.append
import kotlinx.html.js.div

fun main() {
    document.body?.append {
        div {
            +"Hello, Kotlin/JS!"
        }
    }
}
```

#### 创建 HTML 入口文件

`src/main/resources/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>Kotlin/JS Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="kotlin-js-demo.js"></script>
  </body>
</html>
```

## 构建与运行项目

### 使用 Gradle 命令

在项目根目录执行以下命令：

```bash
# 构建项目
./gradlew build

# 启动开发服务器
./gradlew jsBrowserDevelopmentRun

# 构建生产版本
./gradlew jsBrowserProductionBuild
```

### 使用 IntelliJ IDEA

1. 打开 Gradle 工具窗口（右侧边栏）
2. 展开"Tasks" → "kotlin browser" → "developmentRun"
3. 双击"developmentRun"任务
4. 浏览器将自动打开并显示应用

## 项目结构解析

### 标准目录结构

```
kotlin-js-demo/
├── build.gradle.kts          # 构建配置
├── settings.gradle.kts       # 项目设置
├── gradle/                   # Gradle配置
│   └── wrapper/
├── src/
│   ├── main/
│   │   ├── kotlin/           # Kotlin源代码
│   │   └── resources/        # 资源文件（HTML、CSS等）
│   └── test/
│       └── kotlin/           # 测试代码
└── build/                    # 构建输出
    ├── js/
    │   ├── packages/         # 生成的JavaScript包
    │   └── processedResources/
    └── distributions/       # 分发包
```

### 关键配置说明

#### Kotlin/JS 配置选项

```kotlin
kotlin {
    js {
        // 目标环境：browser（浏览器）或 nodejs（Node.js）
        browser {
            // Webpack配置
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)  // 启用CSS支持
                }
            }

            // 运行任务配置
            runTask {
                // 开发服务器端口
                port = 8080
            }
        }

        // 生成可执行的JavaScript文件
        binaries.executable()

        // 模块类型：UMD、CommonJS、ES等
        moduleKind = ModuleKind.UMD

        // 输出文件名
        outputModuleName = "my-app"
    }
}
```

## 常见问题与解决方案

### 1. 构建失败：JDK 版本不兼容

**问题**：构建时出现 JDK 版本错误
**解决方案**：

```kotlin
// 在build.gradle.kts中指定JDK版本
kotlin {
    jvmToolchain(17)
}
```

### 2. 浏览器控制台出现模块加载错误

**问题**：JavaScript 模块无法正确加载
**解决方案**：

- 检查 HTML 中的 script 标签路径是否正确
- 确保使用正确的模块类型（UMD、ES 等）
- 验证构建输出目录结构

### 3. 开发服务器无法启动

**问题**：端口被占用或服务器启动失败
**解决方案**：

```kotlin
// 在build.gradle.kts中修改端口
browser {
    runTask {
        port = 3000  // 使用其他端口
    }
}
```

### 4. CSS 样式不生效

**问题**：CSS 文件未被正确处理
**解决方案**：

```kotlin
// 确保启用CSS支持
browser {
    commonWebpackConfig {
        cssSupport {
            enabled.set(true)
        }
    }
}
```

## 下一步

现在你已经成功搭建了 Kotlin/JS 开发环境并创建了第一个项目。接下来可以：

1. 学习 Kotlin/JS 的基础语法和类型映射
2. 探索与 JavaScript 的互操作
3. 尝试 DOM 操作和 Web API 集成
4. 了解异步编程和协程在 JS 环境中的应用

## 相关资源

- [Kotlin/JS 官方文档](https://kotlinlang.org/docs/js-overview.html)
- [Kotlin Multiplatform 文档](https://kotlinlang.org/docs/multiplatform.html)
- [Kotlin Web Wrappers](https://github.com/Kotlin/kotlin-wrappers)
- [Kotlin/JS 示例项目](https://github.com/Kotlin/kotlin-wrappers/tree/master/examples)

## 总结

Kotlin/JS 为 Web 开发带来了类型安全和现代语言特性的优势。通过本文的指导，你应该能够：

- 理解 Kotlin/JS 的核心价值和优势
- 成功搭建 Kotlin/JS 开发环境
- 创建并运行第一个 Kotlin/JS 项目
- 解决常见的环境配置问题

在下一篇文章中，我们将深入探讨 Kotlin/JS 的基础语法和类型映射，帮助你更好地理解 Kotlin 代码如何转换为 JavaScript。
