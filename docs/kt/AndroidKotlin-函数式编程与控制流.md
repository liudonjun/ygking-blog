---
description: 介绍 Kotlin 的函数式特性、控制流语法与高阶函数技巧，帮助 Android 开发者编写更简洁的业务逻辑。
tag:
  - Kotlin
  - Android
  - 函数式
sidebar: true
---

# Android Kotlin 函数式编程与控制流

## 控制流语法回顾

### when 表达式

```kotlin
fun mapHttpCode(code: Int): String = when (code) {
    in 200..299 -> "Success"
    401, 403 -> "Unauthorized"
    in 500..599 -> "Server Error"
    else -> "Unknown"
}
```

- `when` 可作为表达式，无需 `break`。
- 支持区间、常量、类型检查匹配。

### if 表达式

```kotlin
val indicator = if (isDebug) "DEBUG" else "RELEASE"
```

- Kotlin 中的 `if` 可以返回值，适合赋值语句中使用。

### 循环

```kotlin
for (index in items.indices) {
    println("index=$index value=${items[index]}")
}

items.forEachIndexed { index, value ->
    println("index=$index value=$value")
}
```

## 函数式编程核心概念

### 1. 高阶函数与 Lambda

```kotlin
fun <T> List<T>.customFilter(predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in this) {
        if (predicate(item)) {
            result += item
        }
    }
    return result
}

val activeUsers = users.customFilter { it.isActive }
```

### 2. 匿名函数与命名参数

```kotlin
val comparator = fun(a: Int, b: Int): Int = a - b
val sorted = listOf(3, 1, 2).sortedWith { a, b -> comparator(a, b) }
```

### 3. 扩展函数

```kotlin
fun TextView.setSafeClickListener(interval: Long = 600, action: (View) -> Unit) {
    var lastClick = 0L
    setOnClickListener { view ->
        val now = SystemClock.uptimeMillis()
        if (now - lastClick > interval) {
            lastClick = now
            action(view)
        }
    }
}

button.setSafeClickListener { navigateToDetail() }
```

## 标准库函数家族

| 函数    | 返回值      | 场景                       |
| ------- | ----------- | -------------------------- |
| `let`   | lambda 结果 | 对可空对象链式调用         |
| `run`   | lambda 结果 | 在对象作用域内初始化/配置  |
| `apply` | 原对象      | 初始化 Builder/自定义 View |
| `also`  | 原对象      | 链式副作用，如日志、埋点   |
| `with`  | lambda 结果 | 需要显式传入对象           |

```kotlin
val dialog = MaterialAlertDialogBuilder(context).run {
    setTitle("提示")
    setMessage("确定删除？")
    setPositiveButton("删除", null)
    create()
}.apply {
    setCanceledOnTouchOutside(false)
}
```

## Android 业务实战

### 1. Repository 函数式封装

```kotlin
suspend fun <T> safeRequest(block: suspend () -> T): Result<T> {
    return try {
        Result.success(block())
    } catch (e: Throwable) {
        Result.failure(e)
    }
}

suspend fun loadUserProfile(id: Long): Result<User> = safeRequest {
    apiService.getUser(id)
}
```

### 2. ViewModel 状态转换

```kotlin
val uiState: StateFlow<HomeUiState> = repository.state
    .map { data -> HomeUiState.Success(data) }
    .catch { emit(HomeUiState.Error(it)) }
    .stateIn(viewModelScope, SharingStarted.Lazily, HomeUiState.Loading)
```

### 3. DSL 构建器

```kotlin
inline fun buildLinearLayout(context: Context, block: LinearLayout.() -> Unit): LinearLayout {
    return LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        block()
    }
}

val layout = buildLinearLayout(context) {
    addView(TextView(context).apply { text = "Title" })
    addView(Button(context).apply { text = "Click" })
}
```

## 性能与可读性建议

- 避免在热点循环中频繁创建 Lambda，可提取为顶层函数或成员变量。
- 对于复杂链式操作，适当拆分中间变量提升可读性。
- 利用 `inline` 函数减少高阶函数的额外开销。

## 总结

1. Kotlin 的函数式特性可让 Android 业务逻辑更加简洁，但需注意合理使用以避免可读性下降。
2. 标准库 `scope functions` 能提升对象初始化与空安全处理效率。
3. 函数式思想适用于 Repository 封装、状态映射、DSL Builder 等场景。

下一篇将聚焦 Kotlin 的面向对象特性与委托模式，为构建复杂模块奠定基础。
