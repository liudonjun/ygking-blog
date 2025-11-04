---
description: 从冷启动路径、同步阻塞、App Startup 库到启动指标监控，系统化优化 Android 应用启动性能。
tag:
  - Kotlin
  - 启动优化
  - Android
sidebar: true
---

# Android Kotlin App Startup 优化策略

## 启动阶段划分

| 阶段   | 描述                     |
| ------ | ------------------------ |
| 冷启动 | App 进程首次创建         |
| 热启动 | App 前后台切换           |
| 温启动 | 进程存在但 Activity 销毁 |

本文聚焦冷启动优化。

## 指标采集

- `androidx.startup:startup-runtime`
- `ProcessLifecycleOwner`
- Firebase Performance / Macrobenchmark

```kotlin
class StartupTracer : Initializer<Unit> {
    override fun create(context: Context) {
        val start = SystemClock.elapsedRealtime()
        ProcessLifecycleOwner.get().lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onStart(owner: LifecycleOwner) {
                val cost = SystemClock.elapsedRealtime() - start
                Timber.i("App cold start: ${cost}ms")
            }
        })
    }

    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
```

## App Startup 库

`AndroidManifest.xml`

```xml
<provider
    android:name="androidx.startup.InitializationProvider"
    android:authorities="${applicationId}.startup"
    android:exported="false">
    <meta-data
        android:name="com.example.startup.StartupTracer"
        android:value="androidx.startup" />
</provider>
```

## 延迟初始化策略

| 模块      | 优化策略                           |
| --------- | ---------------------------------- |
| 日志 SDK  | 初始化在后台线程，使用懒加载       |
| 图片库    | 首屏只加载必要配置，延迟解码器注册 |
| Analytics | 使用 WorkManager 延迟上传          |
| Room DB   | 异步预加载或按需打开               |

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        CoroutineScope(SupervisorJob() + Dispatchers.Default).launch {
            initAnalytics()
            initLog()
        }
    }
}
```

## 布局与资源优化

- 减少 Application Theme 中的复杂样式。
- 使用 `@font/` 资源替代动态加载字体。
- 启用 `android:windowSplashScreenBackground`，避免自定义启动页。

## SplashScreen API

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen().apply {
            setKeepOnScreenCondition { viewModel.uiState.value is UiState.Loading }
        }
        super.onCreate(savedInstanceState)
    }
}
```

## 多模块与初始化顺序

- 使用 `AppStartup` + `dependencies()` 确定顺序。
- 对第三方 SDK 封装 `Initializer`，集中管理。
- 在 `debug` 构建中输出初始化耗时。

```kotlin
class CrashReporterInitializer : Initializer<Unit> {
    override fun create(context: Context) {
        val start = SystemClock.elapsedRealtime()
        CrashReporter.init(context)
        Timber.d("CrashReporter init ${SystemClock.elapsedRealtime() - start}ms")
    }

    override fun dependencies(): List<Class<out Initializer<*>>> = listOf(LoggingInitializer::class.java)
}
```

## 工具与监控

- `adb shell am start -W`：测量启动时间。
- `perfetto`/`systrace`：定位卡顿。
- `Macrobenchmark`：自动化测量。

## 常见问题

| 问题                          | 原因                          | 解决方案                                   |
| ----------------------------- | ----------------------------- | ------------------------------------------ |
| 冷启动白屏                    | Theme 未配置 WindowBackground | 设置 `windowSplashScreenBackground`        |
| Application onCreate 耗时过长 | 同步初始化过多                | 拆分异步任务、懒加载                       |
| 初始化顺序问题                | 依赖未显式声明                | 使用 `Initializer.dependencies()` 指定依赖 |

## 总结

1. 利用 App Startup 库管理初始化顺序，结合协程延迟非关键任务。
2. 通过 SplashScreen + 主题优化改善视觉体验。
3. 建立启动指标监控与优化流程，持续追踪首屏性能。
