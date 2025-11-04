---
description: 介绍 Kotlin Multiplatform Mobile 的基本概念、工程结构与在 Android 项目中的集成方式。
tag:
  - Kotlin
  - KMM
  - Android
sidebar: true
---

# Android Kotlin Multiplatform 入门

## 为什么选择 KMM

- **复用业务逻辑**：以 Kotlin 编写共享代码，同时生成 iOS/Android 产物。
- **灵活集成**：保持原生 UI，不强制统一框架。
- **生态支持**：官方 `kotlinx` 系列库提供协程、序列化等跨平台实现。

## 工程结构

```
project/
├── androidApp/             # Android 原生应用
├── iosApp/                 # iOS 应用（SwiftUI 或 UIKit）
└── shared/
    ├── src/commonMain/     # 共享代码（Kotlin）
    ├── src/androidMain/    # Android 专用实现
    ├── src/iosMain/        # iOS 专用实现
    └── build.gradle.kts
```

### Gradle 配置核心

```kotlin
kotlin {
    androidTarget()
    iosX64()
    iosArm64()

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
            }
        }
        val androidMain by getting {
            dependencies {
                implementation("androidx.core:core-ktx:1.13.1")
            }
        }
    }
}
```

## 与 Android 工程集成

1. 在 `settings.gradle` 中引入 `include(":shared")`。
2. Android 模块依赖：`implementation(project(":shared"))`。
3. 通过 `SharedModule().createService()` 获取共享逻辑。

```kotlin
class Greeting(private val platform: Platform) {
    fun greet(): String = "Hello, ${platform.name}!"
}

expect class Platform()

actual class Platform actual constructor() {
    actual val name: String = "Android ${Build.VERSION.SDK_INT}"
}
```

- `expect/actual` 用于声明平台差异。

## 网络层示例

```kotlin
class HttpClientProvider {
    val httpClient = HttpClient {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
        install(Logging) {
            logger = Logger.DEFAULT
        }
    }
}

class ArticleRepository(private val client: HttpClient) {
    suspend fun fetchArticles(): List<Article> = client.get("/articles").body()
}
```

Android 端注入：

```kotlin
val client = HttpClientProvider().httpClient
val repository = ArticleRepository(client)
```

## 测试策略

- 共享层使用 `kotlin.test`。
- Android 层通过 `Robolectric` 或 `Instrumented Test` 验证集成。
- iOS 层使用 XCTest 直接调用共享模块。

```kotlin
class GreetingTest {
    @Test
    fun testGreeting() {
        val greeting = Greeting(Platform())
        assertTrue(greeting.greet().contains("Android"))
    }
}
```

## 发布与依赖管理

- 使用 `Gradle Version Catalog` 管理跨模块依赖。
- 引入 `Kotlin Multiplatform Mobile` 插件获得模板与助手。
- CI 中执行 `./gradlew shared:assembleSharedDebugFramework` 生成 iOS Framework。

## 常见问题

| 问题               | 原因           | 解决方案                               |
| ------------------ | -------------- | -------------------------------------- |
| CocoaPods 集成失败 | Pod 版本过旧   | 升级 CocoaPods，执行 `pod repo update` |
| iOS 编译缓慢       | 重复编译       | 启用 Xcode incremental build           |
| API 差异处理麻烦   | 平台特性不一致 | 通过 `expect/actual` 或接口注入适配    |

## 总结

1. KMM 适合在保证原生体验的前提下复用核心逻辑。
2. Android 集成只需引用 `shared` 模块，并处理平台差异。
3. 梳理团队协作流程（共享代码合并、测试、发布）是成功落地 KMM 的关键。
