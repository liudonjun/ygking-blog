---
description: 探索 Kotlin 集合框架与标准库扩展函数，提升 Android 业务数据处理效率与代码可读性。
tag:
  - Kotlin
  - Android
  - 集合
sidebar: true
---

# Android Kotlin 集合操作与标准库实战

## Kotlin 集合体系

| 接口               | 功能        | 可变性 |
| ---------------- | --------- | --- |
| `List<T>`        | 有序集合，允许重复 | 不可变 |
| `MutableList<T>` | 可变列表      | 可变  |
| `Set<T>`         | 无重复元素集合   | 不可变 |
| `Map<K, V>`      | 键值对映射     | 不可变 |

```kotlin
val immutableList = listOf("A", "B")
val mutableList = mutableListOf("A", "B").apply { add("C") }
```

## 常用扩展函数

### 1. 变换类

- `map`、`flatMap`、`mapIndexed`、`mapNotNull`

```kotlin
val titles = articles.mapNotNull { it.title?.takeIf(String::isNotBlank) }
```

### 2. 过滤类

- `filter`、`filterNot`、`filterIsInstance`

```kotlin
val systemNotifications = notifications.filterIsInstance<Notification.System>()
```

### 3. 汇总类

- `fold`、`reduce`、`groupBy`、`associateBy`

```kotlin
val totalUnread = dialogs.fold(0) { acc, dialog -> acc + dialog.unreadCount }

val dialogMap = dialogs.associateBy { it.id }
```

### 4. 排序与去重

- `sortedBy`、`sortedWith`、`distinctBy`

```kotlin
val sorted = messages.sortedWith(compareByDescending<Message> { it.pinned }.thenByDescending { it.timestamp })
```

## 序列（Sequence）

```kotlin
val result = generateSequence(1) { it + 1 }
    .map { it * 2 }
    .take(5)
    .toList() // [2,4,6,8,10]
```

- 序列采用惰性求值，适合处理大数据量或无限序列。
- 注意在 Android 中避免在主线程执行复杂序列操作。

## Android 业务案例

### 1. 列表差分更新

```kotlin
fun calculateDiff(old: List<User>, new: List<User>): DiffUtil.DiffResult {
    val callback = object : DiffUtil.Callback() {
        override fun getOldListSize() = old.size
        override fun getNewListSize() = new.size
        override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int) =
            old[oldItemPosition].id == new[newItemPosition].id
        override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int) =
            old[oldItemPosition] == new[newItemPosition]
    }
    return DiffUtil.calculateDiff(callback)
}
```

结合 `map`、`groupBy` 可在数据刷新前进行预处理。

### 2. 多模块配置合并

```kotlin
val config = buildList {
    addAll(commonConfig)
    if (BuildConfig.DEBUG) add(debugConfig)
    addAll(remoteConfig)
}

val configMap = config.associateBy({ it.key }, { it.value })
```

### 3. Flow 数据映射

```kotlin
val uiState = repository.observeArticles()
    .map { list ->
        list.groupBy { it.category }
            .mapValues { (_, items) -> items.sortedByDescending { it.publishTime } }
    }
```

## 性能优化建议

- 使用 `Sequence` 或 `asSequence()` 处理大型集合。
- 避免嵌套 `map`/`filter` 导致多次遍历，可组合使用 `mapNotNull` 等函数减少中间集合。
- 对频繁调用的计算结果使用 `cache` 或 `lazy` 缓存。

## 调试技巧

```kotlin
val result = items
    .onEach { Timber.d("step1=$it") }
    .filter { it.isValid }
    .onEach { Timber.d("step2=$it") }
    .map { it.toUiModel() }
```

- `onEach` 可用于插入调试日志而不影响链式结果。

## 总结

1. Kotlin 集合框架通过丰富的扩展函数简化数据处理流程。
2. 合理利用序列与不可变集合，可提升性能并减少副作用。
3. 在 Android 场景中，将集合操作与 DiffUtil、Flow 等框架结合，能实现简洁高效的数据流处理。

下一篇将介绍协程基础与调度器，为异步任务打下扎实基础。
