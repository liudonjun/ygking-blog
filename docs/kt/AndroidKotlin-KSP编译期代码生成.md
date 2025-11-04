---
description: 讲解 Kotlin Symbol Processing (KSP) 原理、Android 项目实践及性能优化策略。
tag:
  - Kotlin
  - KSP
  - 编译期
sidebar: true
---

# Android Kotlin KSP 编译期代码生成

## KSP 基础

- KSP 是 Kotlin 官方推出的编译期处理框架，用于读取 Kotlin 源码并生成新代码。
- 相比 KAPT，KSP 直接基于 Kotlin 编译器，避免 Java Stub，运行更快。

## 项目配置

```kotlin
plugins {
    kotlin("kapt")
    id("com.google.devtools.ksp") version "1.9.24-1.0.20"
}

dependencies {
    implementation("com.squareup.moshi:moshi:1.15.1")
    ksp("com.squareup.moshi:moshi-kotlin-codegen:1.15.1")
}
```

Gradle 任务：`./gradlew kspDebugKotlin`。

## 自定义 Processor

### 1. 定义注解

```kotlin
@Target(AnnotationTarget.CLASS)
annotation class AutoRegister(val path: String)
```

### 2. 写 Processor

```kotlin
class AutoRegisterProcessor(env: SymbolProcessorEnvironment) : SymbolProcessor {
    private val codeGenerator = env.codeGenerator
    private val logger = env.logger

    override fun process(resolver: Resolver): List<KSAnnotated> {
        val symbols = resolver.getSymbolsWithAnnotation(AutoRegister::class.qualifiedName!!)
        symbols.filterIsInstance<KSClassDeclaration>().forEach { clazz ->
            val path = clazz.getAnnotationsByType(AutoRegister::class).first().path
            generateRegistry(clazz, path)
        }
        return emptyList()
    }

    private fun generateRegistry(clazz: KSClassDeclaration, path: String) {
        val packageName = clazz.packageName.asString()
        val fileName = "${clazz.simpleName.asString()}_Registry"
        codeGenerator.createNewFile(Dependencies(false, clazz.containingFile!!), packageName, fileName).use { out ->
            out.writer().use { writer ->
                writer.appendLine("package $packageName")
                writer.appendLine("object $fileName { const val PATH = \"$path\" }")
            }
        }
    }
}
```

### 3. 注册 Processor

`resources/META-INF/services/com.google.devtools.ksp.processing.SymbolProcessorProvider`

```
com.example.ksp.AutoRegisterProcessorProvider
```

Provider：

```kotlin
class AutoRegisterProcessorProvider : SymbolProcessorProvider {
    override fun create(environment: SymbolProcessorEnvironment): SymbolProcessor {
        return AutoRegisterProcessor(environment)
    }
}
```

## 在 Android 中使用

- 生成的代码位于 `build/generated/ksp/...`。
- 通过 `com.example.MyScreen_Registry.PATH` 获取配置。
- 可结合 `ServiceLoader` 或 `Hilt` 注入实现自动注册。

## 性能与调试

| 问题           | 说明               | 解决方案                                          |
| -------------- | ------------------ | ------------------------------------------------- |
| 处理器执行缓慢 | 遍历符号时重复扫描 | 使用 `resolver.getSymbolsWithAnnotation` 缓存结果 |
| 调试困难       | 无断点             | 使用 `logger.warn` 输出调试信息                   |
| 增量编译失效   | 输出文件未声明依赖 | `Dependencies(aggregating = false, ...)` 指定输入 |

调试命令：`./gradlew :app:kspDebugKotlin --info`。

## 与 KAPT 对比

| 对比项   | KAPT                   | KSP                               |
| -------- | ---------------------- | --------------------------------- |
| 支持语言 | Kotlin/Java            | Kotlin                            |
| 性能     | 需生成 Java Stub，偏慢 | 原生处理 Kotlin AST，更快         |
| 生态支持 | 旧插件众多             | Moshi、Room、Hilt 已提供 KSP 版本 |

## 最佳实践

1. 优先使用官方提供的 KSP 依赖（Room、Hilt、Moshi）。
2. 自研 Processor 时控制生成文件数量，避免冗余代码。
3. 在 CI 中开启 `--no-build-cache` 定位问题，再逐步恢复增量配置。

## 总结

KSP 给 Kotlin 带来高效的编译期扩展能力。Android 项目可通过 KSP 实现自动路由、数据模型生成等，提高开发效率。掌握基本编写流程与调试方式，能让团队更好地利用编译期工具构建高质量基础设施。
