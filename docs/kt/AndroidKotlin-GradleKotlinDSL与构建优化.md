---
description: 总结 Gradle Kotlin DSL 在 Android 项目中的使用技巧、版本管理与构建性能优化方案。
tag:
  - Kotlin
  - Gradle
  - 构建
sidebar: true
---

# Android Kotlin Gradle Kotlin DSL 与构建优化

## Kotlin DSL 优势

- 类型安全补全，减少笔误。
- 与 Kotlin 共享工具链，易于提取公共函数。
- 更好地支持多模块与版本管理。

## 基础示例

`build.gradle.kts`

```kotlin
plugins {
    id("com.android.application") version "8.6.0"
    kotlin("android")
}

android {
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 3
        versionName = "1.2.0"
    }
}
```

## Version Catalog 管理依赖

`gradle/libs.versions.toml`

```
[versions]
kotlin = "1.9.24"
androidx-core = "1.13.1"

[libraries]
androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "androidx-core" }

[plugins]
android-application = { id = "com.android.application", version = "8.6.0" }
```

`settings.gradle.kts`

```kotlin
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")
dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}
```

使用：`implementation(libs.androidx.core.ktx)`。

## 构建逻辑模块化

创建 `build-logic` 自定义插件：

```
build-logic/
└── convention/
    ├── build.gradle.kts
    └── src/main/kotlin/AndroidApplicationConventionPlugin.kt
```

```kotlin
class AndroidApplicationConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        pluginManager.apply("com.android.application")
        pluginManager.apply("org.jetbrains.kotlin.android")

        extensions.configure<ApplicationExtension> {
            compileSdk = 34
            defaultConfig.minSdk = 24
        }
    }
}
```

模块使用：

```kotlin
plugins {
    id("com.example.android.application")
}
```

## 构建性能优化

| 优化项        | 操作                                    |
| ------------- | --------------------------------------- |
| 配置缓存      | `org.gradle.configuration-cache=true`   |
| Gradle 缓存   | `org.gradle.caching=true`               |
| 并行构建      | `org.gradle.parallel=true`              |
| Kotlin Daemon | 默认启用，确保 JDK 版本一致             |
| R8 优化       | `minifyEnabled false` -> Release 再开启 |

`gradle.properties`

```
org.gradle.jvmargs=-Xmx4g -Dfile.encoding=UTF-8
kotlin.incremental=true
kotlin.incremental.java=true
kapt.incremental.apt=true
```

## 任务调试

- `./gradlew tasks` 查看任务列表。
- `./gradlew assembleDebug --scan` 分析构建。
- `./gradlew lint --profile` 生成构建性能报告。

## 常见问题

| 问题             | 原因                    | 解决方案                                   |
| ---------------- | ----------------------- | ------------------------------------------ |
| 类型不匹配       | Kotlin DSL 类型推断失败 | 显式指定类型或导入 `com.android.build.api` |
| 插件顺序导致异常 | 依赖插件未提前应用      | 在 Convention Plugin 中统一应用顺序        |
| 构建缓存命中率低 | 任务输入不稳定          | 确保 `@Input` 标记正确，避免随机路径       |

## 总结

1. 使用 Kotlin DSL + Version Catalog，可让依赖管理更规范。
2. 构建逻辑模块化、开启缓存与并行度，是提升构建速度的关键。
3. 对于大型项目，建议结合 Gradle Enterprise 或 Build Scan 定期审计构建健康度。
