---
description: 构建 Android Kotlin 应用的日志体系、崩溃监控与性能指标采集，实现端到端可观测性。
tag:
  - Kotlin
  - 可观测性
  - 日志
sidebar: true
---

# Android Kotlin 日志监控与可观测性

## 可观测性组件

| 维度     | 工具                                 | 目标                 |
| -------- | ------------------------------------ | -------------------- |
| 日志     | Timber、Logger、Logcat               | 记录调试与业务轨迹   |
| 崩溃     | Firebase Crashlytics、Sentry         | 捕获崩溃与非致命异常 |
| 性能     | Firebase Performance、Macrobenchmark | 监控启动、网络、帧率 |
| 业务指标 | 自建埋点、Analytics SDK              | 分析用户行为         |

## 日志体系

### Kotlin 封装

```kotlin
object AppLogger {
    fun init() {
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            Timber.plant(ReleaseTree())
        }
    }

    fun d(message: String, vararg args: Any?) = Timber.d(message, *args)
    fun e(throwable: Throwable, message: String, vararg args: Any?) = Timber.e(throwable, message, *args)
}

class ReleaseTree : Timber.Tree() {
    override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
        if (priority >= Log.ERROR) {
            Crashlytics.log(priority, tag, message)
            t?.let { Crashlytics.recordException(it) }
        }
    }
}
```

### 日志脱敏

```kotlin
fun String.maskMiddle(): String {
    return if (length > 7) replaceRange(3, length - 4, "***") else this
}

AppLogger.d("phone=%s", phone.maskMiddle())
```

## 崩溃监控

- Crashlytics 初始化

```kotlin
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        AppLogger.init()
    }
}
```

- 捕获协程异常：

```kotlin
val crashHandler = CoroutineExceptionHandler { _, throwable ->
    Crashlytics.recordException(throwable)
}

viewModelScope.launch(crashHandler) { ... }
```

## 性能指标

- Firebase Performance：监控网络请求与启动。
- Macrobenchmark：离线性能回归。
- 自建指标：OKHttp Interceptor 记录耗时。

```kotlin
class MetricInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val start = SystemClock.elapsedRealtime()
        return try {
            chain.proceed(chain.request())
        } finally {
            val cost = SystemClock.elapsedRealtime() - start
            Metrics.logNetwork(chain.request().url.toString(), cost)
        }
    }
}
```

## 事件追踪与关联

- 使用 `traceId` 把日志、崩溃、接口串起来。

```kotlin
val traceId = UUID.randomUUID().toString()
AppLogger.d("traceId=%s start login", traceId)

Crashlytics.setCustomKey("traceId", traceId)
```

## Monitoring 仪表板

- ELK/EFK：收集 Logcat -> Logstash -> Elasticsearch -> Kibana。
- Grafana + Prometheus：展示性能与业务指标。
- 飞书/钉钉机器人：发送告警。

```json
{
  "alerts": [
    {
      "metric": "app_startup_time",
      "condition": "> 3000",
      "notify": ["lark-webhook-url"]
    }
  ]
}
```

## 本地调试技巧

- `adb logcat -s AppLogger` 过滤。
- `adb shell dumpsys dropbox` 查看崩溃。
- 使用 `Stetho`/`Flipper` 观察网络与数据库。

## 常见问题

| 问题         | 原因                      | 解决方案                            |
| ------------ | ------------------------- | ----------------------------------- |
| 日志过多     | 调试日志在 Release 未关闭 | 根据 BuildConfig 控制日志级别       |
| 崩溃无 Trace | 混淆未保留符号表          | 上传符号文件，保留 Crashlytics 映射 |
| 指标不准确   | 采集点不统一              | 统一埋点规范与时钟，避免重复上报    |

## 总结

可观测性是保障应用质量的关键。通过构建标准化的日志、崩溃与性能监控体系，结合自动化报警与仪表板，可快速发现问题、定位根因，支撑稳定迭代。Kotlin 提供的封装能力可让这些工具更易于使用与维护。
