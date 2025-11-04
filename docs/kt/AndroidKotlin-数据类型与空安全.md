---
description: 深入理解 Kotlin 的数据类型体系、空安全与类型转换技巧，避免 Android 开发中的 NPE 与类型隐患。
tag:
  - Kotlin
  - Android
  - 基础
sidebar: true
---

# Android Kotlin 数据类型与空安全

## 数据类型总览

| 分类     | 类型示例                       | 说明                                      |
| -------- | ------------------------------ | ----------------------------------------- |
| 数值类型 | `Byte`、`Short`、`Int`、`Long` | Kotlin 没有隐式拓宽，需要显式转换         |
| 小数类型 | `Float`、`Double`              | 默认 `Double`，使用 `f` 或 `F` 声明 Float |
| 布尔     | `Boolean`                      | 与 Java 一致                              |
| 字符     | `Char`                         | 使用单引号 `'a'`                          |
| 字符串   | `String`                       | 支持模板与多行字符串                      |
| 数组     | `IntArray`、`Array<String>`    | 原生类型数组与对象数组区分                |

```kotlin
val numbers: IntArray = intArrayOf(1, 2, 3)
val names: Array<String> = arrayOf("Alice", "Bob")
```

## 空安全核心语法

### 1. 可空类型与安全调用

```kotlin
val content: String? = fetchFromCache()
val length = content?.length ?: 0
```

- `?` 表示变量可为空。
- `?.` 表示安全调用，避免 `NullPointerException`。
- `?:` Elvis 操作符可提供默认值。

### 2. 非空断言

```kotlin
val text: String? = intent.getStringExtra("title")
val upper = text!!.uppercase() // 若 text 为空将抛出异常
```

仅在逻辑上可以确保不为空时使用 `!!`，否则建议改用 `requireNotNull`。

### 3. let / run / also / apply

```kotlin
val userName = sharedPreferences.getString("user_name", null)?.let { name ->
    name.trim().ifEmpty { "Guest" }
}
```

- `let` 常用于可空类型链式操作。
- `apply` 适合对象初始化。
- `also` 保留原对象并执行副作用。

## 类型转换与智能类型推断

```kotlin
fun printLength(value: Any) {
    if (value is String) {
        println(value.length) // 智能转换，无需显式 cast
    }
}

val number = "123".toIntOrNull() ?: 0
```

- `is`/`!is` 支持类型检查并自动智能转换。
- `toIntOrNull` 避免 `NumberFormatException`。

## 数据类与解构

```kotlin
data class User(val id: Long, val name: String?, val age: Int)

val (id, name, age) = User(1, null, 18)
```

- 数据类自动生成 `equals`、`hashCode`、`copy` 等方法。
- 解构配合 `componentN` 自动展开字段。

## Android 场景实战

### 1. Intent 参数读取

```kotlin
val count = intent.extras?.getInt("count") ?: 0
val userId = intent.getStringExtra("user_id")?.toLongOrNull()
```

### 2. Room Entity 默认值

```kotlin
@Entity
data class Article(
    @PrimaryKey val id: Long,
    val title: String = "",
    val content: String? = null,
    val publishTime: Instant? = null
)
```

### 3. Retrofit 数据模型

```kotlin
data class ApiResponse<T>(
    val code: Int,
    val data: T?,
    val message: String?
)

fun <T> ApiResponse<T>.requireData(): T {
    return data ?: throw IllegalStateException("data is null, code=$code")
}
```

## 常见空指针来源

| 来源               | 说明                                | 应对策略                              |
| ------------------ | ----------------------------------- | ------------------------------------- |
| Java 互操作        | Java 返回可空值但未标记 `@Nullable` | 手动标注 `@file:JvmName` 共用扩展函数 |
| 第三方 SDK         | 未引入 Kotlin 空安全注解            | 使用 `?.`/`?:` 防御性处理             |
| 全局变量延迟初始化 | `lateinit var` 未赋值               | 在访问前调用 `::var.isInitialized`    |

## 总结

1. Kotlin 通过类型系统从语言层面杜绝大部分空指针问题，但仍需谨慎使用 `!!`。
2. 利用智能类型转换与 `let`/`run` 等函数，可以显著提升代码可读性。
3. 在 Android 项目中与 Java 混编时，必须关注可空性注解，必要时封装安全访问层。

下一篇将深入函数与 Lambda，了解 Kotlin 在函数式编程方面的特性。
