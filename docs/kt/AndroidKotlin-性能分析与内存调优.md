---
description: 总结 Android Kotlin 项目的性能分析方法，包括启动优化、内存泄漏排查与工具使用。
tag:
  - Kotlin
  - 性能
  - 调优
sidebar: true
---

# Android Kotlin 性能分析与内存调优

## 性能指标体系

| 指标     | 目标值              | 工具                               |
| -------- | ------------------- | ---------------------------------- |
| 启动时间 | 冷启 < 2000 ms      | Android Studio Profiler, Perfetto  |
| 帧率     | 常驻 60fps 以上     | GPU Profiler, Macrobenchmark       |
| 内存占用 | 常驻 < 256 MB       | Memory Profiler, LeakCanary        |
| ANR 率   | < 0.47%（行业参考） | Firebase Performance, Play Console |

## 启动优化

- **App Startup**：延迟非关键组件初始化。
- **SplashScreen API**：替代自定义 Splash Activity。
- **避免主线程阻塞**：使用协程/Handler 推迟重任务。

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        CoroutineScope(Dispatchers.Default).launch {
            initNonCriticalSdk()
        }
    }
}
```

## 帧率与渲染

### 工具使用

- `adb shell setprop debug.hwui.profile true` 显示 GPU 渲染图。
- 使用 `Macrobenchmark` 监控 Compose/Recyclerview 性能。

```kotlin
@ExperimentalCoroutinesApi
class HomeBenchmark {
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun startup() = benchmarkRule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(FrameTimingMetric(), StartupTimingMetric()),
        iterations = 5
    ) {
        startActivityAndWait()
    }
}
```

### Compose 性能

- 使用 `remember` 缓存对象。
- 避免在 recomposition 中执行 I/O。
- 对列表提供稳定 key，减少重组。

## 内存分析

### 工具链

- LeakCanary：开发期检测泄漏。
- Memory Profiler：实时查看堆分配。
- Perfetto：系统级跟踪。

```kotlin
dependencies {
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.14")
}
```

常见泄漏：

| 场景          | 原因                          | 解决方案                                |
| ------------- | ----------------------------- | --------------------------------------- |
| Activity 泄漏 | 静态对象持有 Context          | 使用 Application Context 或弱引用       |
| 协程泄漏      | Job 未取消                    | 使用 `viewModelScope`、`lifecycleScope` |
| Compose 回调  | Lambda 捕获旧 `remember` 状态 | 使用 `rememberUpdatedState`             |

## Kotlin 优化技巧

- 通过 `inline` 减少高阶函数 lambda 开销。
- 使用 `@JvmInline` value class 包装轻量对象。
- 避免创建大量临时对象，必要时使用对象池。

```kotlin
@JvmInline
value class UserId(val value: String)
```

## Crash 与 ANR 分析

- 集成 Firebase Crashlytics、AppCenter 监控崩溃。
- 使用 `adb shell am trace-ipc` 调查 IPC 阻塞。
- 定期查看 `ANR` traces 与 Main Thread 堆栈。

## 持续监控

- 构建性能仪表板（Grafana + Prometheus）。
- 在 CI 中执行 Macrobenchmark、内存基准。
- 对关键指标设置阈值与报警（飞书/钉钉机器人）。

## 总结

1. 性能优化需要指标驱动，先量化再优化。
2. 启动、帧率、内存是最影响体验的指标，应建立固定分析流程。
3. 结合 Kotlin 特性与官方工具（Macrobenchmark、LeakCanary）持续迭代，可显著提升应用稳定性与流畅度。
