---
description: 梳理 WorkManager 在 Android 的使用场景、约束配置、链式任务与协程集成方法。
tag:
  - Kotlin
  - WorkManager
  - 后台任务
sidebar: true
---

# Android Kotlin WorkManager 后台任务策略

## 核心特点

- 适合需要保证执行的延期/周期性任务。
- 支持电量、网络、存储等约束。
- 提供任务链、唯一任务与重试策略。

## 基础配置

```kotlin
dependencies {
    implementation("androidx.work:work-runtime-ktx:2.9.0")
}

class App : Application(), Configuration.Provider {
    override fun getWorkManagerConfiguration(): Configuration {
        return Configuration.Builder()
            .setMinimumLoggingLevel(Log.INFO)
            .build()
    }
}
```

## 定义 Worker

```kotlin
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            repository.sync()
            Result.success()
        } catch (e: IOException) {
            Result.retry()
        }
    }
}
```

## 约束与调度

```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.UNMETERED)
    .setRequiresBatteryNotLow(true)
    .build()

val workRequest = OneTimeWorkRequestBuilder<SyncWorker>()
    .setConstraints(constraints)
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30.seconds)
    .build()

WorkManager.getInstance(context).enqueueUniqueWork(
    "sync", ExistingWorkPolicy.KEEP, workRequest
)
```

## 链式任务

```kotlin
WorkManager.getInstance(context)
    .beginWith(OneTimeWorkRequestBuilder<UploadWorker>().build())
    .then(OneTimeWorkRequestBuilder<NotifyWorker>().build())
    .enqueue()
```

- 使用 `WorkContinuation` 构建串行或并行任务链。

## 周期性任务

```kotlin
val periodicWork = PeriodicWorkRequestBuilder<SyncWorker>(12, TimeUnit.HOURS)
    .setConstraints(constraints)
    .build()

WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "periodic_sync", ExistingPeriodicWorkPolicy.UPDATE, periodicWork
)
```

## 输入输出数据

```kotlin
val request = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(workDataOf("filePath" to filePath))
    .build()

class UploadWorker(...): CoroutineWorker(...) {
    override suspend fun doWork(): Result {
        val filePath = inputData.getString("filePath") ?: return Result.failure()
        val success = uploader.upload(filePath)
        return if (success) Result.success(workDataOf("url" to "https://...")) else Result.retry()
    }
}
```

## 与 Hilt 集成

```kotlin
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: SyncRepository
) : CoroutineWorker(context, params) { ... }

@Module
@InstallIn(SingletonComponent::class)
abstract class WorkerModule {
    @Binds
    abstract fun bindWorkerFactory(factory: HiltWorkerFactoryImpl): ChildWorkerFactory
}
```

## 运行状态监听

```kotlin
WorkManager.getInstance(context)
    .getWorkInfosForUniqueWorkLiveData("sync")
    .observe(lifecycleOwner) { workInfos ->
        workInfos.firstOrNull()?.let { info ->
            when (info.state) {
                WorkInfo.State.SUCCEEDED -> showToast("Sync success")
                WorkInfo.State.FAILED -> showToast("Sync failed")
                else -> Unit
            }
        }
    }
```

## 常见问题

| 问题           | 原因                       | 解决方案                                     |
| -------------- | -------------------------- | -------------------------------------------- |
| 周期任务不执行 | 周期 < 15 分钟或约束不满足 | 确保最小周期大于 15 分钟，检查约束           |
| 任务重复       | 未设置唯一工作策略         | 使用 `enqueueUniqueWork` 或 `KEEP` 策略      |
| 资源占用高     | 过多任务并行               | 通过 `WorkManager.initialize` 设置最大并行数 |

## 总结

1. WorkManager 是保障型后台任务首选，结合协程可编写可读的异步逻辑。
2. 注意唯一工作策略、约束配置，与应用生命周期保持一致。
3. 搭配 Hilt、Flow 等组件能实现状态追踪与依赖注入，提升整体可维护性。
