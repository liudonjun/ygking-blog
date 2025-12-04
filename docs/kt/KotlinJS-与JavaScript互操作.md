---
description: 深入学习Kotlin/JS与JavaScript的互操作机制，掌握external关键字、模块导入、动态类型处理以及第三方库的集成方法。
tag:
  - Kotlin
  - JavaScript
  - 互操作
  - 第三方库
  - external
sidebar: true
---

# Kotlin/JS 与 JavaScript 互操作

## 互操作概述

Kotlin/JS 提供了强大的互操作机制，允许 Kotlin 代码与 JavaScript 代码无缝协作。这种互操作性使得开发者可以在 Kotlin 项目中使用现有的 JavaScript 库，同时保持类型安全和开发效率。

### 互操作的核心概念

1. **external 声明**：描述 JavaScript API 的 Kotlin 接口
2. **模块系统**：导入和导出 JavaScript 模块
3. **动态类型**：处理动态 JavaScript 代码
4. **类型映射**：Kotlin 类型与 JavaScript 类型的转换

## external 关键字的使用

### 基本 external 声明

`external`关键字用于声明存在于 JavaScript 中的函数、类、对象和接口：

```kotlin
// 声明外部函数
external fun alert(message: String): Unit
external fun setTimeout(callback: () -> Unit, delay: Int): Int

// 声明外部属性
external val window: Window
external val document: Document
external val console: Console

// 声明外部类
external class Date() {
    constructor(timestamp: Long)

    fun getTime(): Long
    fun toISOString(): String

    companion object {
        fun now(): Long
    }
}
```

### external 接口

使用 external 接口描述 JavaScript 对象的结构：

```kotlin
external interface Window {
    val document: Document
    val location: Location
    val navigator: Navigator

    fun alert(message: String): Unit
    fun setTimeout(callback: () -> Unit, delay: Int): Int
    fun fetch(url: String): Promise<Response>
}

external interface Document {
    fun createElement(tagName: String): Element
    fun getElementById(id: String): Element?
    val body: HTMLElement?
}

external interface Location {
    val href: String
    val hostname: String
    val pathname: String
    fun reload(): Unit
}
```

### external 对象

声明外部对象来表示 JavaScript 中的单例对象：

```kotlin
external object Math {
    fun random(): Double
    fun floor(x: Double): Int
    fun max(a: Int, b: Int): Int
    val PI: Double
}

external object JSON {
    fun stringify(obj: Any): String
    fun parse(text: String): dynamic
}
```

## JavaScript 模块导入与导出

### @JsModule 注解

使用`@JsModule`注解导入 JavaScript 模块：

```kotlin
@JsModule("lodash")
external val _: Lodash

external interface Lodash {
    fun <T> sortBy(collection: Array<T>, iteratee: (T) -> Any): Array<T>
    fun <T> uniq(collection: Array<T>): Array<T>
    fun debounce(func: () -> Unit, wait: Int): () -> Unit
}

// 使用示例
val numbers = arrayOf(3, 1, 4, 1, 5, 9, 2, 6)
val sortedNumbers = _.sortBy(numbers) { it }
val uniqueNumbers = _.uniq(numbers)
```

### @JsQualifier 注解

当模块导出多个对象时，使用`@JsQualifier`指定限定符：

```kotlin
@file:JsModule("moment")
@file:JsQualifier("moment")

package moment

external fun moment(): Moment
external fun moment(date: String): Moment

external interface Moment {
    fun format(pattern: String): String
    fun add(amount: Int, unit: String): Moment
    fun subtract(amount: Int, unit: String): Moment
}
```

### 导入默认导出

```kotlin
@file:JsModule("axios")
@file:JsDefault

package axios

external interface Axios {
    fun <T> get(url: String): Promise<AxiosResponse<T>>
    fun <T> post(url: String, data: Any): Promise<AxiosResponse<T>>
}

external interface AxiosResponse<T> {
    val data: T
    val status: Int
    val statusText: String
}

external val axios: Axios
```

## 动态类型与类型安全

### dynamic 类型

`dynamic`类型提供了与 JavaScript 动态特性的桥梁：

```kotlin
fun processDynamicObject(obj: dynamic) {
    // 动态访问属性
    println(obj.name)
    println(obj.age)

    // 动态调用方法
    obj.sayHello("World")

    // 动态创建对象
    val newObj = dynamic {
        name = "John"
        age = 30
    }
}
```

### 类型安全的动态访问

```kotlin
// 安全的动态属性访问
fun safeGetProperty(obj: dynamic, propertyName: String): String? {
    return if (obj.hasOwnProperty(propertyName)) {
        obj[propertyName] as? String
    } else {
        null
    }
}

// 类型检查
fun processValue(value: dynamic) {
    when {
        value is String -> println("String: $value")
        value is Number -> println("Number: $value")
        value is Boolean -> println("Boolean: $value")
        value is Array<*> -> println("Array with ${value.size} elements")
        else -> println("Unknown type")
    }
}
```

### js()函数

`js()`函数允许在 Kotlin 代码中嵌入 JavaScript 代码片段：

```kotlin
// 简单的JavaScript表达式
fun getCurrentUrl(): String = js("window.location.href")

// 多行JavaScript代码
fun createComplexObject(): dynamic = js("""
    ({
        name: 'Complex Object',
        data: [1, 2, 3, 4, 5],
        method: function(x) {
            return x * 2;
        }
    })
""")

// 带参数的JavaScript代码
fun calculateDistance(x1: Double, y1: Double, x2: Double, y2: Double): Double = js("""
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
""")
```

## JavaScript 库的封装与调用

### 封装简单的 JavaScript 库

假设有一个简单的 JavaScript 工具库：

```javascript
// utils.js
export function formatDate(date, pattern) {
  // 格式化日期的实现
  return formattedDate;
}

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export const constants = {
  API_URL: "https://api.example.com",
  VERSION: "1.0.0",
};
```

在 Kotlin 中封装这个库：

```kotlin
@file:JsModule("./utils")

package utils

external fun formatDate(date: Date, pattern: String): String
external fun validateEmail(email: String): Boolean
external val constants: Constants

external interface Constants {
    val API_URL: String
    val VERSION: String
}
```

### 封装复杂的 JavaScript 库

以 Chart.js 为例：

```kotlin
@file:JsModule("chart.js")

package chart

external class Chart(ctx: dynamic, config: ChartConfig) {
    fun update(): Unit
    fun destroy(): Unit
    fun resize(): Unit

    val data: ChartData
    val options: ChartOptions
}

external interface ChartConfig {
    val type: String
    val data: ChartData
    val options: ChartOptions?
}

external interface ChartData {
    val labels: Array<String>
    val datasets: Array<ChartDataset>
}

external interface ChartDataset {
    val label: String
    val data: Array<Number>
    val backgroundColor: dynamic // 可以是String或Array<String>
    val borderColor: dynamic
    val borderWidth: Int?
}

external interface ChartOptions {
    val responsive: Boolean?
    val scales: dynamic
    val plugins: dynamic
}
```

使用封装的 Chart.js：

```kotlin
fun createLineChart(canvasId: String): Chart {
    val ctx = js("document.getElementById(canvasId).getContext('2d')")

    val config: ChartConfig = js("{}")
    config.type = "line"
    config.data = js("{}")
    config.data.labels = arrayOf("Jan", "Feb", "Mar", "Apr", "May")
    config.data.datasets = arrayOf(
        js("{}").apply {
            label = "Sales"
            data = arrayOf(12, 19, 3, 5, 2)
            borderColor = "rgb(75, 192, 192)"
            backgroundColor = "rgba(75, 192, 192, 0.2)"
        }
    )

    return Chart(ctx, config)
}
```

## 回调函数与事件处理

### JavaScript 回调函数

```kotlin
// 声明接受回调的函数
external fun addEventListener(
    type: String,
    listener: (Event) -> Unit,
    options: dynamic = definedExternally
): Unit

// 使用回调
fun setupButtonListener() {
    val button = document.getElementById("myButton")
    button?.addEventListener("click") { event ->
        println("Button clicked: ${event.type}")
        console.log("Event details:", event)
    }
}
```

### Promise 处理

```kotlin
// 声明返回Promise的函数
external fun fetch(url: String): Promise<Response>

external interface Response {
    fun json(): Promise<dynamic>
    fun text(): Promise<String>
    val ok: Boolean
    val status: Int
}

// 使用Promise
fun fetchData(url: String): Promise<dynamic> {
    return fetch(url).then { response ->
        if (response.ok) {
            response.json()
        } else {
            throw Error("HTTP error! status: ${response.status}")
        }
    }
}

// 异步处理
fun loadUserData(userId: String) {
    fetchData("https://api.example.com/users/$userId")
        .then { user ->
            println("User loaded: ${user.name}")
        }
        .catch { error ->
            println("Error loading user: ${error.message}")
        }
}
```

### 自定义事件

```kotlin
// 创建自定义事件
fun createCustomEvent(type: String, detail: dynamic): Event {
    return js("new CustomEvent(type, { detail: detail })")
}

// 派发自定义事件
fun dispatchCustomEvent(target: EventTarget, type: String, detail: dynamic) {
    val event = createCustomEvent(type, detail)
    target.dispatchEvent(event)
}

// 监听自定义事件
fun setupCustomEventListener() {
    window.addEventListener("userDataLoaded") { event ->
        val userData = event.detail
        println("User data loaded: ${userData}")
    }
}
```

## 高级互操作技巧

### 扩展 JavaScript 类型

```kotlin
// 为JavaScript类型添加扩展函数
fun String.formatDate(): String {
    return utils.formatate(Date(this), "YYYY-MM-DD")
}

fun Array<*>.toJsArray(): dynamic {
    return js("Array.from(this)")
}

// 使用扩展
val formattedDate = "2023-12-25".formatDate()
val jsArray = arrayOf(1, 2, 3).toJsArray()
```

### 类型安全的构建器

```kotlin
// 类型安全的对象构建器
class ChartBuilder {
    private val config = js("{}")

    fun type(type: String) = apply {
        config.type = type
    }

    fun labels(labels: Array<String>) = apply {
        if (config.data == undefined) {
            config.data = js("{}")
        }
        config.data.labels = labels
    }

    fun dataset(label: String, data: Array<Number>, init: DatasetBuilder.() -> Unit = {}) = apply {
        if (config.data == undefined) {
            config.data = js("{}")
        }
        if (config.data.datasets == undefined) {
            config.data.datasets = arrayOf()
        }

        val dataset = DatasetBuilder().apply(init).build()
        dataset.label = label
        dataset.data = data
        config.data.datasets.push(dataset)
    }

    fun build(): ChartConfig = config
}

class DatasetBuilder {
    private val dataset = js("{}")

    fun backgroundColor(color: String) = apply {
        dataset.backgroundColor = color
    }

    fun borderColor(color: String) = apply {
        dataset.borderColor = color
    }

    fun borderWidth(width: Int) = apply {
        dataset.borderWidth = width
    }

    fun build(): dynamic = dataset
}

// 使用构建器
val chartConfig = ChartBuilder()
    .type("line")
    .labels(arrayOf("Jan", "Feb", "Mar"))
    .dataset("Sales", arrayOf(10, 20, 15)) {
        backgroundColor("rgba(75, 192, 192, 0.2)")
        borderColor("rgb(75, 192, 192)")
        borderWidth(2)
    }
    .build()
```

### 条件性 external 声明

```kotlin
// 根据平台条件性声明
external val window: Window? = definedExternally

// 可选的API
external fun optionalFunction(): String? = definedExternally

// 使用可选API
fun useOptionalAPI() {
    try {
        val result = optionalFunction()
        println("Result: $result")
    } catch (e: Throwable) {
        println("Optional API not available: ${e.message}")
    }
}
```

## 错误处理与调试

### JavaScript 异常处理

```kotlin
// 捕获JavaScript异常
fun safeJavaScriptOperation() {
    try {
        val result = js("someRiskyOperation()")
        println("Operation succeeded: $result")
    } catch (e: Throwable) {
        when {
            e is JsError -> println("JavaScript error: ${e.message}")
            e is TypeError -> println("Type error: ${e.message}")
            else -> println("Unknown error: ${e.message}")
        }
    }
}

// 自定义JavaScript错误
external class JsError(message: String) : Throwable {
    val name: String
    val stack: String?
}

external class TypeError(message: String) : JsError
```

### 调试技巧

```kotlin
// 使用console进行调试
fun debugJavaScriptCode() {
    val obj = js("{ name: 'Debug', value: 42 }")

    // 在浏览器控制台中输出
    console.log("Debug object:", obj)
    console.dir(obj)

    // 条件性调试
    if (js("typeof debug !== 'undefined' && debug")) {
        console.log("Debug mode is enabled")
    }
}

// 性能监控
fun measurePerformance() {
    val start = js("performance.now()")

    // 执行一些操作
    val result = someComplexOperation()

    val end = js("performance.now()")
    console.log("Operation took ${end - start} milliseconds")
}
```

## 最佳实践

1. **优先使用类型安全的 external 声明**：避免过度使用`dynamic`类型
2. **创建类型安全的封装层**：为 JavaScript 库提供 Kotlin 友好的 API
3. **合理使用 js()函数**：仅用于无法通过 external 声明表达的代码
4. **处理可选 API**：使用 try-catch 处理可能不存在的 JavaScript 功能
5. **保持接口简洁**：external 接口应该反映 JavaScript API 的实际结构
6. **文档化互操作代码**：清楚地标记哪些代码与 JavaScript 交互

## 总结

Kotlin/JS 的互操作机制为开发者提供了强大的工具，可以在保持类型安全的同时充分利用 JavaScript 生态系统。通过掌握 external 声明、模块系统、动态类型处理和错误处理，你可以无缝集成现有的 JavaScript 库，构建功能丰富的 Web 应用程序。

在下一篇文章中，我们将学习 Kotlin/JS 的 DOM 操作和 Web API 集成，探索如何使用 Kotlin 与浏览器环境进行交互。
