---
description: 学习Kotlin/JS中的DOM操作技术、事件处理机制以及浏览器Web API的集成方法，构建交互式Web应用程序。
tag:
  - Kotlin
  - JavaScript
  - DOM
  - Web API
  - 事件处理
sidebar: true
---

# Kotlin/JS DOM 操作与 Web API 集成

## DOM 操作基础

### DOM 接口概述

Kotlin/JS 提供了完整的 DOM（文档对象模型）接口，允许开发者以类型安全的方式操作 HTML 文档。这些接口通过 external 声明映射到浏览器的原生 DOM API。

```kotlin
// 核心DOM接口
external interface Node {
    val nodeType: Int
    val nodeName: String
    val nodeValue: String?
    val parentNode: Node?
    val childNodes: NodeList

    fun appendChild(node: Node): Node
    fun removeChild(node: Node): Node
    fun cloneNode(deep: Boolean): Node
}

external interface Element : Node {
    val tagName: String
    val className: String
    val id: String

    fun getAttribute(name: String): String?
    fun setAttribute(name: String, value: String): Unit
    fun removeAttribute(name: String): Unit

    fun querySelector(selector: String): Element?
    fun querySelectorAll(selector: String): NodeList
}

external interface HTMLElement : Element {
    var innerHTML: String
    var innerText: String
    var style: CSSStyleDeclaration

    fun focus(): Unit
    fun blur(): Unit
    fun click(): Unit
}
```

### 文档访问与元素查找

```kotlin
// 获取文档对象
val document: Document = kotlinx.browser.document

// 查找元素的不同方式
fun findElements() {
    // 通过ID查找
    val elementById = document.getElementById("myElement")

    // 通过类名查找
    val elementsByClass = document.getElementsByClassName("my-class")

    // 通过标签名查找
    val elementsByTag = document.getElementsByTagName("div")

    // 使用CSS选择器
    val firstMatch = document.querySelector(".container > .item")
    val allMatches = document.querySelectorAll("[data-attribute]")
}

// 类型安全的元素查找
inline fun <reified T : HTMLElement> Document.getElementByIdTyped(id: String): T? {
    return getElementById(id) as? T
}

// 使用示例
val button: HTMLButtonElement? = document.getElementByIdTyped("submit-button")
val input: HTMLInputElement? = document.getElementByIdTyped("username-input")
```

### 元素创建与操作

```kotlin
// 创建新元素
fun createElementExample() {
    // 创建div元素
    val div = document.createElement("div") as HTMLDivElement

    // 设置属性
    div.id = "myDiv"
    div.className = "container"
    div.setAttribute("data-role", "main")

    // 设置内容
    div.innerHTML = "<p>Hello, Kotlin/JS!</p>"
    div.innerText = "Plain text content"

    // 添加到文档
    document.body?.appendChild(div)
}

// 创建复杂元素结构
fun createComplexElement() {
    val container = document.createElement("div") as HTMLDivElement

    // 创建子元素
    val title = document.createElement("h2") as HTMLHeadingElement
    title.textContent = "Article Title"

    val content = document.createElement("p") as HTMLParagraphElement
    content.textContent = "This is the article content."

    val button = document.createElement("button") as HTMLButtonElement
    button.textContent = "Click me"
    button.onclick = { event ->
        println("Button clicked!")
    }

    // 组装元素
    container.appendChild(title)
    container.appendChild(content)
    container.appendChild(button)

    // 添加到文档
    document.body?.appendChild(container)
}
```

## 事件处理机制

### 事件监听器

```kotlin
// 基本事件监听
fun setupEventListeners() {
    val button = document.getElementById("myButton") as HTMLButtonElement

    // 添加点击事件监听器
    button.addEventListener("click") { event ->
        println("Button clicked: ${event.type}")
        println("Target: ${event.target}")
    }

    // 添加鼠标事件
    button.addEventListener("mouseover") { event ->
        button.style.backgroundColor = "lightblue"
    }

    button.addEventListener("mouseout") { event ->
        button.style.backgroundColor = ""
    }
}

// 事件委托
fun setupEventDelegation() {
    val container = document.getElementById("container") as HTMLDivElement

    container.addEventListener("click") { event ->
        val target = event.target as? HTMLElement

        when {
            target?.tagName == "BUTTON" -> {
                println("Button clicked: ${target.textContent}")
            }
            target?.classList?.contains("item") == true -> {
                println("Item clicked: ${target.dataset["id"]}")
            }
        }
    }
}
```

### 自定义事件

```kotlin
// 创建自定义事件
fun createCustomEvent() {
    val event = js("new CustomEvent('dataLoaded', { detail: { id: 123, name: 'Test' } })")
    document.dispatchEvent(event)
}

// 监听自定义事件
fun listenToCustomEvents() {
    document.addEventListener("dataLoaded") { event ->
        val data = event.detail
        println("Data loaded: ID=${data.id}, Name=${data.name}")
    }
}

// 类型安全的自定义事件
class DataLoadedEvent(val id: Int, val name: String) {
    companion object {
        const val TYPE = "dataLoaded"
    }

    fun toNativeEvent(): Event {
        return js("new CustomEvent(DataLoadedEvent.TYPE, { detail: { id: this.id, name: this.name } })")
    }
}

fun dispatchTypedEvent(data: DataLoadedEvent) {
    document.dispatchEvent(data.toNativeEvent())
}
```

### 事件处理最佳实践

```kotlin
// 事件处理器类
class ButtonHandler(private val buttonId: String) {
    private var clickCount = 0

    fun setup() {
        val button = document.getElementById(buttonId) as HTMLButtonElement
        button.addEventListener("click", ::handleClick)
    }

    private fun handleClick(event: Event) {
        clickCount++
        updateButtonText()
        performAction()
    }

    private fun updateButtonText() {
        val button = document.getElementById(buttonId) as HTMLButtonElement
        button.textContent = "Clicked $clickCount times"
    }

    private fun performAction() {
        console.log("Action performed $clickCount times")
    }

    fun cleanup() {
        val button = document.getElementById(buttonId) as HTMLButtonElement
        button.removeEventListener("click", ::handleClick)
    }
}
```

## CSS 样式操作

### 内联样式操作

```kotlin
// 基本样式操作
fun manipulateStyles() {
    val element = document.getElementById("styledElement") as HTMLElement

    // 直接设置样式
    element.style.color = "red"
    element.style.backgroundColor = "lightgray"
    element.style.fontSize = "18px"
    element.style.border = "1px solid black"

    // 使用CSS变量
    element.style.setProperty("--primary-color", "#007bff")
    element.style.setProperty("--font-size", "16px")
}

// 类型安全的样式操作
class StyleBuilder(private val element: HTMLElement) {
    fun color(value: String) = apply {
        element.style.color = value
    }

    fun backgroundColor(value: String) = apply {
        element.style.backgroundColor = value
    }

    fun fontSize(value: String) = apply {
        element.style.fontSize = value
    }

    fun padding(top: String, right: String, bottom: String, left: String) = apply {
        element.style.paddingTop = top
        element.style.paddingRight = right
        element.style.paddingBottom = bottom
        element.style.paddingLeft = left
    }

    fun margin(all: String) = apply {
        element.style.margin = all
    }
}

// 使用样式构建器
fun applyStyles() {
    val element = document.getElementById("myElement") as HTMLElement

    StyleBuilder(element)
        .color("#333")
        .backgroundColor("#f5f5f5")
        .fontSize("16px")
        .padding("10px", "15px", "10px", "15px")
        .margin("20px")
}
```

### CSS 类操作

```kotlin
// CSS类操作
fun manipulateClasses() {
    val element = document.getElementById("myElement") as HTMLElement

    // 添加类
    element.classList.add("active", "highlighted")

    // 移除类
    element.classList.remove("inactive")

    // 切换类
    element.classList.toggle("visible")

    // 检查类
    val isActive = element.classList.contains("active")

    // 替换类
    element.classList.replace("old-class", "new-class")
}

// 动态样式管理
class StyleManager(private val element: HTMLElement) {
    private val stateClasses = mutableMapOf<String, Boolean>()

    fun setState(state: String, active: Boolean) {
        stateClasses[state] = active
        updateClasses()
    }

    private fun updateClasses() {
        // 清除所有状态类
        stateClasses.keys.forEach { state ->
            element.classList.remove(state)
        }

        // 添加活跃状态类
        stateClasses.filterValues { it }.keys.forEach { state ->
            element.classList.add(state)
        }
    }
}
```

## 浏览器 API 集成

### LocalStorage 和 SessionStorage

```kotlin
// LocalStorage封装
class LocalStorageManager {
    companion object {
        private val storage = kotlinx.browser.localStorage

        fun setItem(key: String, value: String) {
            storage.setItem(key, value)
        }

        fun getItem(key: String): String? {
            return storage.getItem(key)
        }

        fun removeItem(key: String) {
            storage.removeItem(key)
        }

        fun clear() {
            storage.clear()
        }

        // 类型安全的存储
        fun <T> setObject(key: String, obj: T, serializer: (T) -> String) {
            setItem(key, serializer(obj))
        }

        inline fun <reified T> getObject(key: String, deserializer: (String) -> T): T? {
            val json = getItem(key) ?: return null
            return try {
                deserializer(json)
            } catch (e: Exception) {
                null
            }
        }
    }
}

// 使用示例
data class UserSettings(val theme: String, val language: String)

fun saveUserSettings(settings: UserSettings) {
    LocalStorageManager.setObject("userSettings", settings) { settings ->
        JSON.stringify(settings)
    }
}

fun loadUserSettings(): UserSettings? {
    return LocalStorageManager.getObject<UserSettings>("userSettings") { json ->
        JSON.parse(json)
    }
}
```

### Fetch API

```kotlin
// Fetch封装
class HttpClient {
    companion object {
        suspend fun get(url: String): String {
            return window.fetch(url)
                .await()
                .text()
                .await()
        }

        suspend fun <T> getJson(url: String): T {
            val response = window.fetch(url).await()
            val text = response.text().await()
            return JSON.parse<T>(text)
        }

        suspend fun post(url: String, data: Any): String {
            val options = js("{}")
            options.method = "POST"
            options.headers = js("{}")
            options.headers["Content-Type"] = "application/json"
            options.body = JSON.stringify(data)

            return window.fetch(url, options)
                .await()
                .text()
                .await()
        }
    }
}

// API服务类
class ApiService {
    suspend fun getUsers(): Array<User> {
        return HttpClient.getJson("https://api.example.com/users")
    }

    suspend fun createUser(user: User): User {
        return HttpClient.post("https://api.example.com/users", user)
            .let { JSON.parse<User>(it) }
    }
}

data class User(val id: Int, val name: String, val email: String)
```

### Geolocation API

```kotlin
// 地理位置服务
class LocationService {
    companion object {
        fun getCurrentPosition(
            onSuccess: (Position) -> Unit,
            onError: (String) -> Unit
        ) {
            if (navigator.geolocation == null) {
                onError("Geolocation is not supported")
                return
            }

            navigator.geolocation.getCurrentPosition(
                { position -> onSuccess(position) },
                { error -> onError(getErrorMessage(error)) }
            )
        }

        private fun getErrorMessage(error: dynamic): String {
            return when (error.code) {
                1 -> "Permission denied"
                2 -> "Position unavailable"
                3 -> "Timeout"
                else -> "Unknown error"
            }
        }
    }
}

external interface Position {
    val coords: Coordinates
    val timestamp: Double
}

external interface Coordinates {
    val latitude: Double
    val longitude: Double
    val accuracy: Double
    val altitude: Double?
    val altitudeAccuracy: Double?
    val heading: Double?
    val speed: Double?
}

// 使用示例
fun requestLocation() {
    LocationService.getCurrentPosition(
        onSuccess = { position ->
            println("Location: ${position.coords.latitude}, ${position.coords.longitude}")
        },
        onError = { error ->
            println("Error getting location: $error")
        }
    )
}
```

## 表单处理

### 表单数据获取与验证

```kotlin
// 表单处理类
class FormHandler(private val formId: String) {
    private val form: HTMLFormElement = document.getElementById(formId) as HTMLFormElement

    fun getData(): Map<String, String> {
        val data = mutableMapOf<String, String>()

        for (i in 0 until form.elements.length) {
            val element = form.elements[i] as HTMLElement
            when (element.tagName) {
                "INPUT" -> {
                    val input = element as HTMLInputElement
                    when (input.type) {
                        "text", "email", "password" -> data[input.name] = input.value
                        "checkbox" -> data[input.name] = input.checked.toString()
                        "radio" -> if (input.checked) data[input.name] = input.value
                    }
                }
                "SELECT" -> {
                    val select = element as HTMLSelectElement
                    data[select.name] = select.value
                }
                "TEXTAREA" -> {
                    val textarea = element as HTMLTextAreaElement
                    data[textarea.name] = textarea.value
                }
            }
        }

        return data
    }

    fun validate(): Boolean {
        var isValid = true

        for (i in 0 until form.elements.length) {
            val element = form.elements[i] as HTMLElement
            if (element.hasAttribute("required")) {
                val input = element as HTMLInputElement
                if (input.value.isBlank()) {
                    showError(input, "This field is required")
                    isValid = false
                } else {
                    clearError(input)
                }
            }
        }

        return isValid
    }

    private fun showError(input: HTMLInputElement, message: String) {
        input.classList.add("error")

        // 创建或更新错误消息
        var errorElement = document.getElementById("${input.id}-error")
        if (errorElement == null) {
            errorElement = document.createElement("div") as HTMLDivElement
            errorElement.id = "${input.id}-error"
            errorElement.className = "error-message"
            input.parentNode?.insertBefore(errorElement, input.nextSibling)
        }
        errorElement.textContent = message
    }

    private fun clearError(input: HTMLInputElement) {
        input.classList.remove("error")
        val errorElement = document.getElementById("${input.id}-error")
        errorElement?.remove()
    }
}
```

## 动画与视觉效果

### CSS 动画控制

```kotlin
// 动画控制器
class AnimationController(private val element: HTMLElement) {
    fun fadeIn(duration: Int = 300) {
        element.style.opacity = "0"
        element.style.display = "block"

        window.setTimeout({
            element.style.transition = "opacity $duration ms"
            element.style.opacity = "1"
        }, 10)
    }

    fun fadeOut(duration: Int = 300, onComplete: () -> Unit = {}) {
        element.style.transition = "opacity $duration ms"
        element.style.opacity = "0"

        window.setTimeout({
            element.style.display = "none"
            onComplete()
        }, duration.toLong())
    }

    fun slideIn(direction: String = "left", duration: Int = 300) {
        val startTransform = when (direction) {
            "left" -> "translateX(-100%)"
            "right" -> "translateX(100%)"
            "top" -> "translateY(-100%)"
            "bottom" -> "translateY(100%)"
            else -> "translateX(0)"
        }

        element.style.transform = startTransform
        element.style.transition = "transform $duration ms"

        window.setTimeout({
            element.style.transform = "translateX(0)"
        }, 10)
    }
}
```

## 性能优化技巧

### DOM 操作优化

```kotlin
// 批量DOM操作
class BatchDOMUpdater {
    private val pendingOperations = mutableListOf<() -> Unit>()

    fun scheduleUpdate(operation: () -> Unit) {
        pendingOperations.add(operation)
        scheduleFlush()
    }

    private fun scheduleFlush() {
        window.requestAnimationFrame { flush() }
    }

    private fun flush() {
        if (pendingOperations.isEmpty()) return

        val operations = pendingOperations.toList()
        pendingOperations.clear()

        operations.forEach { it() }
    }
}

// 使用示例
val batchUpdater = BatchDOMUpdater()

fun updateMultipleElements() {
    for (i in 1..100) {
        batchUpdater.scheduleUpdate {
            val element = document.getElementById("item-$i") as HTMLElement
            element.textContent = "Updated item $i"
        }
    }
}
```

## 最佳实践

1. **使用类型安全的 DOM 操作**：避免直接使用`dynamic`类型
2. **合理使用事件委托**：减少事件监听器数量
3. **批量 DOM 操作**：使用 requestAnimationFrame 优化性能
4. **正确清理事件监听器**：避免内存泄漏
5. **使用 CSS 类而不是内联样式**：提高可维护性
6. **实现渐进增强**：确保基本功能在不支持高级 API 的浏览器中也能工作

## 总结

Kotlin/JS 提供了完整的 DOM 操作和 Web API 集成能力，使开发者能够以类型安全的方式构建交互式 Web 应用程序。通过掌握 DOM 操作、事件处理、样式管理和浏览器 API 集成，你可以创建功能丰富、性能优良的 Web 应用。

在下一篇文章中，我们将深入探讨 Kotlin/JS 的异步编程和协程，学习如何高效处理异步操作。
