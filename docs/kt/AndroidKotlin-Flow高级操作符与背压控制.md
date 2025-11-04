---
description: 深入探讨 Kotlin Flow 的高级操作符、背压策略以及与外部系统的协同方法。
tag:
  - Kotlin
  - Flow
  - 背压
sidebar: true
---

# Android Kotlin Flow 高级操作符与背压控制

## 高级操作符分类

| 类别     | 操作符示例                                       | 说明                   |
| -------- | ------------------------------------------------ | ---------------------- |
| 合并     | `zip`、`combine`、`merge`                        | 多 Flow 合并或同步发射 |
| 展开     | `flatMapConcat`、`flatMapLatest`、`flatMapMerge` | 控制内层 Flow 执行方式 |
| 背压控制 | `buffer`、`conflate`、`collectLatest`            | 管理上下游速度差异     |
| 时间操作 | `debounce`、`sample`、`timeout`                  | 处理节流、防抖         |

## 合并策略

```kotlin
val userFlow = repository.observeUser()
val configFlow = repository.observeConfig()

val uiState: Flow<UiState> = combine(userFlow, configFlow) { user, config ->
    UiState(user, config)
}

val zipped = userFlow.zip(configFlow) { user, config ->
    user to config
}
```

- `combine` 对任一 Flow 更新即发射。
- `zip` 等待两个 Flow 均发射一次再组合。

## flatMap 系列

| 操作符          | 特点                            |
| --------------- | ------------------------------- |
| `flatMapConcat` | 顺序执行，等待前一个完成        |
| `flatMapMerge`  | 并行收集，最多 `concurrency` 个 |
| `flatMapLatest` | 取消上一个，保留最新子流        |

```kotlin
// 搜索建议：保留最新输入
searchText
    .debounce(300)
    .flatMapLatest { keyword -> repository.search(keyword) }
    .collect { result -> render(result) }
```

## 背压策略

### buffer

```kotlin
flowOnIo()
    .buffer(capacity = Channel.BUFFERED)
    .collect { process(it) }
```

### conflate

```kotlin
stateFlow
    .conflate()
    .collect { latest -> render(latest) }
```

### collectLatest

```kotlin
events.collectLatest { event ->
    delay(500) // 新事件到来时终止旧任务
}
```

## Flow 与外部系统

### 1. Callback 转换

```kotlin
fun View.clicks(): Flow<Unit> = callbackFlow {
    setOnClickListener { trySend(Unit) }
    awaitClose { setOnClickListener(null) }
}
```

### 2. Room + Flow

```kotlin
@Dao
interface ArticleDao {
    @Query("SELECT * FROM article ORDER BY time DESC")
    fun observeArticles(): Flow<List<ArticleEntity>>
}

dao.observeArticles()
    .flowOn(Dispatchers.IO)
    .map { it.map(ArticleEntity::toDomain) }
```

## 错误处理

```kotlin
flow {
    emit(api.load())
}.retryWhen { cause, attempt ->
    (cause is IOException && attempt < 3).also { if (it) delay(2_000) }
}.catch { emit(handleError(it)) }
```

## 性能建议

- 避免在主线程执行 `collect` 上游的重计算，使用 `flowOn` 切换线程。
- 对高频数据使用 `shareIn` 或 `stateIn`，避免重复订阅副作用。
- 合理设置 `buffer` 容量，避免 OOM。

## 测试策略

```kotlin
@Test
fun `flatMapLatest cancels previous`() = runTest {
    val results = mutableListOf<String>()
    val flow = MutableSharedFlow<String>()

    val job = launch {
        flow.flatMapLatest { value -> flowOf(value).onEach { delay(100) } }
            .collect { results += it }
    }

    flow.emit("A")
    flow.emit("B")
    advanceUntilIdle()
    assertEquals(listOf("B"), results)
    job.cancel()
}
```

## 常见问题

| 问题         | 原因                          | 解决方案                                        |
| ------------ | ----------------------------- | ----------------------------------------------- |
| 数据闪烁     | 下游处理慢，上游不断发射      | 使用 `conflate` 或 `collectLatest`              |
| 订阅不到数据 | `shareIn` 范围不正确          | 将 `scope` 设置为 `viewModelScope` 等长生命周期 |
| 内存泄漏     | `callbackFlow` 未关闭 channel | 在 `awaitClose` 中释放资源                      |

## 总结

1. 合理选择 `flatMap`、`combine` 等操作符是构建 Flow 数据流的关键。
2. 背压策略决定上游和下游的协调方式，需根据场景（UI、网络）灵活选取。
3. 与外部系统整合时，注意生命周期与资源释放，确保 Flow 数据流稳定可靠。
