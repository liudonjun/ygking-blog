---
description: 深入了解Kotlin/JS的模块系统、依赖管理策略，以及如何有效地组织和管理大型项目的模块和依赖关系。
tag:
  - Kotlin
  - JavaScript
  - 模块化
  - 依赖管理
  - Gradle
sidebar: true
---

# Kotlin/JS 模块化与依赖管理

## 模块系统概述

Kotlin/JS 支持多种 JavaScript 模块系统，包括 CommonJS、ES Modules（ESM）、UMD 和 AMD。选择合适的模块系统对于项目的可维护性和部署策略至关重要。

### JavaScript 模块系统对比

| 模块系统       | 特点                   | 适用场景             | 语法示例                                  |
| -------------- | ---------------------- | -------------------- | ----------------------------------------- |
| **CommonJS**   | 同步加载，Node.js 默认 | 服务器端，构建工具   | `const module = require('module')`        |
| **ES Modules** | 静态分析，树摇优化     | 现代浏览器，打包工具 | `import module from 'module'`             |
| **UMD**        | 通用模块，兼容多种环境 | 库开发，跨平台使用   | `define(['module'], function(module) {})` |
| **AMD**        | 异步加载，RequireJS    | 浏览器环境，按需加载 | `define(['module'], function(module) {})` |

## Gradle 配置与模块设置

### 基本模块配置

在`build.gradle.kts`中配置模块系统：

```kotlin
plugins {
    kotlin("js") version "1.9.20"
}

kotlin {
    js {
        // 目标环境配置
        browser {
            // Webpack配置
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }

            // 运行任务配置
            runTask {
                port = 8080
                sourceMaps = true
            }
        }

        // 模块类型配置
        moduleName = "my-app"
        moduleKind = ModuleKind.ES // 可选：COMMONJS, UMD, AMD

        // 生成可执行文件
        binaries.executable()

        // 编译器选项
        useEsClasses()
        useCommonJs()
    }
}
```

### 不同模块系统的配置

```kotlin
// ES Modules配置（推荐用于现代浏览器）
kotlin {
    js {
        browser {
            webpackTask {
                output.libraryTarget = "module"
            }
        }
        moduleKind = ModuleKind.ES
    }
}

// CommonJS配置（适用于Node.js环境）
kotlin {
    js {
        nodejs {
            // Node.js特定配置
        }
        moduleKind = ModuleKind.COMMONJS
    }
}

// UMD配置（适用于库开发）
kotlin {
    js {
        browser {
            webpackTask {
                output.libraryTarget = "umd"
                output.library = "MyLibrary"
            }
        }
        moduleKind = ModuleKind.UMD
    }
}
```

## 依赖管理策略

### 添加 Kotlin 依赖

```kotlin
dependencies {
    // Kotlin标准库
    implementation(kotlin("stdlib-js"))

    // Kotlin协程
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-js:1.7.3")

    // Kotlin序列化
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

    // Kotlin HTML DSL
    implementation("org.jetbrains.kotlinx:kotlinx-html-js:0.9.1")
}
```

### 集成 npm 包

```kotlin
dependencies {
    // 直接使用npm包
    implementation(npm("lodash", "4.17.21"))
    implementation(npm("axios", "1.6.0"))

    // 带类型定义的npm包
    implementation(npm("@types/lodash", "4.14.200"))

    // 开发依赖
    implementation(devNpm("webpack-cli", "5.1.4"))
}
```

### 版本管理

```kotlin
// 使用版本目录（Gradle 7.0+）
dependencies {
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.lodash)
    implementation(libs.axios)
}

// 在gradle/libs.versions.toml中定义版本
[versions]
kotlinx-coroutines = "1.7.3"
kotlinx-serialization = "1.6.0"
lodash = "4.17.21"
axios = "1.6.0"

[libraries]
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core-js", version.ref = "kotlinx-coroutines" }
kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinx-serialization" }
lodash = { module = "npm:lodash", version.ref = "lodash" }
axios = { module = "npm:axios", version.ref = "axios" }
```

## 模块导出与导入

### Kotlin 模块导出

```kotlin
// 使用@JsExport注解导出Kotlin代码
@JsExport
class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun subtract(a: Int, b: Int): Int = a - b
}

@JsExport
object MathUtils {
    fun factorial(n: Int): Int {
        return if (n <= 1) 1 else n * factorial(n - 1)
    }
}

@JsExport
fun greet(name: String): String {
    return "Hello, $name!"
}

@JsExport
data class User(val id: Int, val name: String, val email: String)
```

### JavaScript 中导入 Kotlin 模块

```javascript
// ES Modules方式
import { Calculator, MathUtils, greet, User } from "./my-app.js";

const calc = new Calculator();
console.log(calc.add(5, 3)); // 8

console.log(MathUtils.factorial(5)); // 120

console.log(greet("World")); // Hello, World!

const user = new User(1, "John Doe", "john@example.com");
console.log(user.name); // John Doe

// CommonJS方式
const { Calculator, MathUtils, greet, User } = require("./my-app.js");
```

### 导入 JavaScript 模块到 Kotlin

```kotlin
// 导入整个模块
@JsModule("lodash")
external val _: Lodash

external interface Lodash {
    fun <T> sortBy(collection: Array<T>, iteratee: (T) -> Any): Array<T>
    fun <T> uniq(collection: Array<T>): Array<T>
}

// 导入特定函数
@JsModule("axios")
external fun <T> get(url: String): Promise<AxiosResponse<T>>

external interface AxiosResponse<T> {
    val data: T
    val status: Int
}

// 导入默认导出
@JsModule("moment")
@JsDefault
external val moment: Moment

external interface Moment {
    fun format(pattern: String): String
    fun add(amount: Int, unit: String): Moment
}
```

## 项目结构组织

### 单模块项目结构

```
kotlin-js-project/
├── build.gradle.kts
├── settings.gradle.kts
├── package.json
├── webpack.config.js
├── src/
│   ├── main/
│   │   ├── kotlin/
│   │   │   ├── main/
│   │   │   │   ├── App.kt
│   │   │   │   ├── components/
│   │   │   │   │   ├── Button.kt
│   │   │   │   │   └── Modal.kt
│   │   │   │   ├── services/
│   │   │   │   │   ├── ApiService.kt
│   │   │   │   │   └── StorageService.kt
│   │   │   │   └── utils/
│   │   │   │       ├── Extensions.kt
│   │   │   │       └── Validators.kt
│   │   │   └── index.kt
│   │   └── resources/
│   │       ├── index.html
│   │       ├── styles/
│   │       │   └── main.css
│   │       └── images/
│   └── test/
│       └── kotlin/
│           ├── AppTest.kt
│           └── components/
│               └── ButtonTest.kt
└── build/
    └── js/
        └── packages/
            └── kotlin-js-project/
```

### 多模块项目结构

```
kotlin-js-multi-module/
├── build.gradle.kts
├── settings.gradle.kts
├── shared/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           └── kotlin/
│               ├── common/
│               │   ├── models/
│               │   │   └── User.kt
│               │   └── utils/
│               │       └── Extensions.kt
│               └── js/
│                   └── main/
│                       └── kotlin/
│                           └── platform/
│                               └── JsPlatform.kt
├── frontend/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           └── kotlin/
│               ├── main/
│               │   ├── App.kt
│               │   └── components/
│               └── index.kt
└── backend/
    ├── build.gradle.kts
    └── src/
        └── main/
            └── kotlin/
                └── main/
                    └── Server.kt
```

### 多模块配置示例

```kotlin
// 根目录 build.gradle.kts
plugins {
    kotlin("multiplatform") version "1.9.20" apply false
    kotlin("js") version "1.9.20" apply false
}

subprojects {
    group = "com.example"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

// settings.gradle.kts
include(":shared")
include(":frontend")
include(":backend")

// shared/build.gradle.kts
plugins {
    kotlin("multiplatform")
}

kotlin {
    js {
        browser()
        nodejs()
    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(kotlin("stdlib"))
            }
        }

        val jsMain by getting {
            dependencies {
                implementation(kotlin("stdlib-js"))
            }
        }
    }
}

// frontend/build.gradle.kts
plugins {
    kotlin("js")
}

dependencies {
    implementation(project(":shared"))
    implementation(kotlin("stdlib-js"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-js:1.7.3")
}
```

## 构建优化策略

### Webpack 配置优化

```kotlin
// 自定义Webpack配置
kotlin {
    js {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }

                // 代码分割配置
                config {
                    optimization = js("""
                        {
                            splitChunks: {
                                chunks: 'all',
                                cacheGroups: {
                                    vendor: {
                                        test: /[\\/]node_modules[\\/]/,
                                        name: 'vendors',
                                        chunks: 'all'
                                    }
                                }
                            }
                        }
                    """.trimIndent())
                }
            }

            webpackTask {
                // 生产环境优化
                mode = if (project.hasProperty("production")) "production" else "development"

                // 输出配置
                output.library = "MyApp"
                output.libraryTarget = "umd"
            }
        }
    }
}
```

### 代码分割与懒加载

```kotlin
// 使用动态导入实现懒加载
suspend fun loadAdminModule(): AdminModule {
    return js("import('./admin/AdminModule.js')")
}

class App {
    suspend fun loadFeature(featureName: String) {
        when (featureName) {
            "admin" -> {
                val adminModule = loadAdminModule()
                adminModule.initialize()
            }
            "dashboard" -> {
                val dashboardModule = loadDashboardModule()
                dashboardModule.initialize()
            }
        }
    }
}

// 模块定义
@JsModule("./admin/AdminModule.js")
external class AdminModule {
    fun initialize()
}

@JsModule("./dashboard/DashboardModule.js")
external class DashboardModule {
    fun initialize()
}
```

### Tree Shaking 优化

```kotlin
// 使用@JsExport选择性导出
@JsExport
class PublicAPI {
    // 公共API
    fun publicMethod(): String = "Public"

    // 私有方法不会被导出
    private fun privateMethod(): String = "Private"
}

// 使用@Suppress来避免不必要的导出
@Suppress("unused")
@JsExport
object Utils {
    // 只导出需要的工具函数
    @JsExport
    fun formatCurrency(amount: Double): String = "$$amount"

    // 内部工具函数不会被导出
    internal fun internalHelper(): String = "Internal"
}
```

## 版本管理与发布

### 语义化版本控制

```kotlin
// 在build.gradle.kts中配置版本
group = "com.example"
version = "1.2.3"

// 使用git信息自动生成版本
fun getVersion(): String {
    val process = ProcessBuilder("git", "describe", "--tags").start()
    return process.inputStream.bufferedReader().readText().trim()
}

// 或者使用gradle-git-version插件
plugins {
    id("com.palantir.git-version") version "3.0.0"
}

version = gitVersion()
```

### 发布配置

```kotlin
// 配置npm发布
kotlin {
    js {
        browser {
            webpackTask {
                // 配置输出
                output.library = "MyLibrary"
                output.libraryTarget = "umd"
            }
        }

        // 生成TypeScript定义文件
        generateTypeScriptDefinitions()
    }
}

// 创建npm包配置
tasks.register("createNpmPackage") {
    doLast {
        // 创建package.json
        val packageJson = mapOf(
            "name" to "my-kotlin-js-library",
            "version" to project.version,
            "description" to "A Kotlin/JS library",
            "main" to "my-library.js",
            "types" to "my-library.d.ts",
            "files" to listOf("*.js", "*.d.ts", "*.js.map"),
            "keywords" to listOf("kotlin", "javascript", "library"),
            "author" to "Your Name",
            "license" to "MIT"
        )

        file("build/js/packages/my-library/package.json")
            .writeText(JSON.stringify(packageJson, null, 2))
    }
}
```

## 依赖冲突解决

### 版本冲突检测

```kotlin
// 使用gradle-dependency-analyze插件
plugins {
    id("ca.cutterslade.analyze") version "1.8.0"
}

// 配置依赖分析
analyzeClassesDependencies {
    justWarn = true // 只警告而不失败
}
```

### 强制版本解析

```kotlin
configurations.all {
    resolutionStrategy {
        // 强制使用特定版本
        force("org.jetbrains.kotlinx:kotlinx-coroutines-core-js:1.7.3")

        // 排除特定依赖
        exclude(group = "org.example", module = "unwanted-dependency")

        // 替换依赖
        dependencySubstitution {
            substitute(module("old:dependency:1.0"))
                .using(module("new:dependency:2.0"))
        }
    }
}
```

## 最佳实践

### 1. 模块设计原则

```kotlin
// 按功能组织模块
// api/ - 公共API
@JsExport
interface UserService {
    suspend fun getUser(id: String): User
    suspend fun createUser(user: CreateUserRequest): User
}

// impl/ - 实现细节
class UserServiceImpl(
    private val apiClient: ApiClient
) : UserService {
    override suspend fun getUser(id: String): User {
        return apiClient.get("/users/$id")
    }

    override suspend fun createUser(user: CreateUserRequest): User {
        return apiClient.post("/users", user)
    }
}

// factory/ - 工厂方法
object ServiceFactory {
    fun createUserService(): UserService {
        return UserServiceImpl(ApiClient())
    }
}
```

### 2. 依赖注入

```kotlin
// 使用简单的依赖注入容器
class DIContainer {
    private val services = mutableMapOf<Class<*>, Any>()

    fun <T> register(clazz: Class<T>, instance: T) {
        services[clazz] = instance
    }

    @Suppress("UNCHECKED_CAST")
    fun <T> get(clazz: Class<T>): T {
        return services[clazz] as T
    }
}

// 使用示例
val container = DIContainer()
container.register(ApiClient::class.js, ApiClient())
container.register(UserService::class.js, ServiceFactory.createUserService())

val userService = container.get(UserService::class.js)
```

### 3. 配置管理

```kotlin
// 配置接口
external interface AppConfig {
    val apiUrl: String
    val debug: Boolean
    val version: String
}

// 配置加载器
object ConfigLoader {
    private val config: AppConfig by lazy {
        loadConfig()
    }

    fun getConfig(): AppConfig = config

    private fun loadConfig(): AppConfig {
        return js("require('./config.json')")
    }
}

// 使用配置
class ApiClient {
    private val baseUrl = ConfigLoader.getConfig().apiUrl

    suspend fun get(endpoint: String): String {
        return window.fetch("$baseUrl$endpoint").await().text().await()
    }
}
```

## 总结

Kotlin/JS 的模块化和依赖管理为构建大型、可维护的 Web 应用程序提供了强大的支持。通过合理选择模块系统、组织项目结构、优化构建流程和管理依赖关系，你可以创建出高效、可扩展的 Kotlin/JS 项目。

在下一篇文章中，我们将学习 Kotlin/JS 与 React 的集成，探索如何使用 Kotlin 构建现代化的 React 应用程序。
