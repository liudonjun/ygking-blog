---
description: 搭建 Kotlin/Android 开发环境，快速熟悉基本语法、包结构与常用工具链，为后续进阶学习打下基础。
tag:
  - Kotlin
  - Android
  - 基础
sidebar: true
---

# Android Kotlin 环境搭建与语法速览

## 开发环境准备

### 1. 安装 JDK

- 推荐使用 Temurin/OpenJDK 17。
- macOS 可通过 `brew install temurin`，Windows 使用 MSI 安装包。

### 2. 安装 Android Studio

- 选择最新稳定版（建议 Flamingo 以上），同时勾选 Android SDK、SDK Platform tools、Android SDK Build-Tools。
- 打开 **SDK Manager**，确保勾选 `Android API 34`、`Android SDK Command-line Tools`、`Google USB Driver`。

### 3. 配置 Kotlin DSL 项目

新建项目时选择 **Empty Activity**，语言选择 Kotlin，构建脚本默认使用 Gradle Kotlin DSL（`build.gradle.kts`）。

```kotlin
// 根目录 settings.gradle.kts
pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

include(":app")
```

## Kotlin 基本语法回顾

### 1. 入口函数与包结构

```kotlin
package com.example.hellokt

fun main() {
    println("Hello Kotlin")
}
```

- `package` 声明需位于文件顶部。
- Kotlin 默认将顶层函数编译为静态方法，Android 中常用于工具类函数。

### 2. 变量与常量

```kotlin
val appName: String = "Demo"   // 只读
var counter: Int = 0           // 可变

val lazyValue by lazy {
    "初始化只会执行一次"
}
```

- 默认采用类型推断，可省略类型声明。
- `lateinit var` 可用于延迟初始化的可变属性（仅限非原始类型）。

### 3. 字符串模板

```kotlin
val name = "Android"
val version = 14
val message = "Hello $name, API $version"
```

### 4. 空安全

```kotlin
val text: String? = null
val length = text?.length ?: 0

fun requireNotNull(value: String?): String {
    return value ?: throw IllegalArgumentException("value is null")
}
```

## Android 工程结构速览

```
app/
├── build.gradle.kts         // 模块配置
├── src/main/
│   ├── AndroidManifest.xml
│   ├── java/                // Kotlin/Java 源码
│   ├── res/                 // 资源文件
│   └── assets/
└── src/test/                // 单元测试
```

常见 Gradle 配置片段：

```kotlin
android {
    namespace = "com.example.demo"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.demo"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    testImplementation("junit:junit:4.13.2")
}
```

## IDE 效率提升技巧

- **Live Templates**：输入 `logd` 自动展开 `Log.d(TAG, "message")`。
- **Kotlin Code Style**：启用 `Tools > Kotlin > Configure Kotlin in Project`，导入官方代码模板。
- **代码检查**：开启 `ktlint` 或 `detekt`，确保团队风格一致。

## 常见问题排查

| 问题                | 可能原因              | 解决办法                                |
| ------------------- | --------------------- | --------------------------------------- |
| Gradle 构建失败     | JDK 版本不兼容        | 检查 `gradle.properties` 的 `JAVA_HOME` |
| Kotlin 插件版本冲突 | Gradle 与 Kotlin 版本 | 将 Kotlin 升级至与 Android Studio 匹配  |
| 设备无法运行        | USB 调试未开启        | 在开发者选项中开启 USB 调试             |

## 总结

1. Kotlin 在 Android Studio 中已成为默认语言，安装官方工具即可开箱即用。
2. 掌握变量、空安全、字符串模板等基础语法，是后续学习协程、Flow 的前提。
3. 熟悉 Gradle Kotlin DSL 与项目结构，可提升团队协作效率。

下一篇将深入 Kotlin 的数据类型与空安全特性，帮助你写出更健壮的 Android 代码。
