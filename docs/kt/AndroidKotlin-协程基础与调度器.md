---
description: 系统梳理 Kotlin 协程的基础概念、作用域与调度器，为在 Android 中编写高质量异步代码做好准备。
tag:
  - Kotlin
  - 协程
  - Android
sidebar: true
---

# Android Kotlin 协程基础与调度器

## 核心概念速览

- **协程（Coroutine）**：轻量级线程，可在挂起点暂停与恢复。
- **挂起函数（suspend）**：可在不阻塞线程的情况下挂起协程。
- **作用域（CoroutineScope）**：定义协程的生命周期与上下文。
- **调度器（Dispatcher）**：决定协程运行的线程。

```kotlin
suspend fun fetchUser(): User {
    return apiService.getUser()
}

GlobalScope.launch {
    val user = fetchUser()
    println(user)
}
```

> 实际 Android 开发不推荐使用 `GlobalScope`，请使用生命周期感知的作用域。

## 协程作用域

| 作用域                  | 用途                                  |
| ----------------------- | ------------------------------------- |
| `GlobalScope`           | 全局生命周期，避免使用                |
| `lifecycleScope`        | `LifecycleOwner`（Activity/Fragment） |
| `viewModelScope`        | ViewModel 生命周期                    |
| `CoroutineScope` 自定义 | 业务层自定义生命周期                  |

```kotlin
class MainViewModel : ViewModel() {
    fun load() = viewModelScope.launch {
        val data = repository.fetch()
        _uiState.value = data
    }
}
```

## 调度器与线程切换

| 调度器                   | 描述                 | 场景                  |
| ------------------------ | -------------------- | --------------------- |
| `Dispatchers.Main`       | 主线程，UI 更新      | 更新 UI、Compose 状态 |
| `Dispatchers.IO`         | IO 密集任务          | 网络请求、磁盘操作    |
| `Dispatchers.Default`    | CPU 密集任务         | 解析 JSON、加密运算   |
| `Dispatchers.Unconfined` | 不限制线程，谨慎使用 | 调试、测试            |

```kotlin
lifecycleScope.launch(Dispatchers.IO) {
    val result = api.getArticles()
    withContext(Dispatchers.Main) {
        render(result)
    }
}
```

## 协程构建器

- `launch`：返回 `Job`，不关心返回值。
- `async`：返回 `Deferred<T>`，用于并发计算。
- `withContext`：切换调度器，返回结果。

```kotlin
val user = async { repository.fetchUser() }
val posts = async { repository.fetchPosts() }
val homeData = awaitAll(user, posts)
```

## 异常处理

```kotlin
val handler = CoroutineExceptionHandler { _, throwable ->
    Timber.e(throwable, "coroutine error")
}

viewModelScope.launch(handler) {
    try {
        repository.fetch()
    } catch (e: IOException) {
        _uiState.value = UiState.Error(e)
    }
}
```

- 结构化并发确保子协程失败会取消父协程。
- 在 `async` 中抛出的异常会延迟到 `await()` 调用时抛出。

## 结构化并发

```kotlin
suspend fun refreshData() = coroutineScope {
    val userDeferred = async { repository.fetchUser() }
    val feedDeferred = async { repository.fetchFeed() }
    val user = userDeferred.await()
    val feed = feedDeferred.await()
    user to feed
}
```

- 使用 `coroutineScope` 确保子任务完成或取消后才返回。

## 协程与传统回调的对比

| 特点     | 回调方式   | 协程方式           |
| -------- | ---------- | ------------------ |
| 可读性   | 回调地狱   | 线性代码           |
| 错误处理 | 需逐层捕获 | 结构化并发统一处理 |
| 资源释放 | 容易泄漏   | 作用域取消自动释放 |

## 常见误区

- 在主线程执行 CPU 密集任务：请使用 `Dispatchers.Default`。
- 使用 `runBlocking` 阻塞主线程：仅适合单元测试。
- 忘记取消协程：确保在 `onCleared` 或相应生命周期中取消。

## 总结

1. 协程提供轻量级并发机制，通过作用域与调度器管理生命周期和线程。
2. 结构化并发有助于统一错误处理并避免资源泄漏。
3. 掌握 `launch`、`async`、`withContext` 等常用构建器，是进阶 Flow 与 Compose 的基础。

下一篇将把协程应用到 Android 实战，涵盖网络请求、Room 与 UI 协同。
