---
description: 深入学习Kotlin/JS中的异步编程模式，掌握协程在JavaScript环境中的应用，以及Promise与协程的互操作。
tag:
  - Kotlin
  - JavaScript
  - 异步编程
  - 协程
  - Promise
sidebar: true
---

# Kotlin/JS 异步编程与协程

## 异步编程概述

JavaScript 环境本质上是异步的，从网络请求到用户事件处理，都需要异步编程模式。Kotlin/JS 通过协程提供了强大而优雅的异步编程解决方案，使开发者能够以顺序的方式编写异步代码。

### JavaScript 异步模式回顾

```javascript
// 传统回调模式
function fetchData(callback) {
  setTimeout(() => {
    callback("Data loaded");
  }, 1000);
}

fetchData(function (data) {
  console.log(data);
});

// Promise模式
function fetchDataPromise() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Data loaded");
    }, 1000);
  });
}

fetchDataPromise()
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
```

### Kotlin 协程的优势

```kotlin
// Kotlin协程模式
suspend fun fetchData(): String {
    delay(1000)
    return "Data loaded"
}

// 使用协程
fun main() {
    GlobalScope.launch {
        val data = fetchData()
        println(data)
    }
}
```

## Kotlin 协程在 JS 环境中的实现

### 协程基础配置

在`build.gradle.kts`中添加协程支持：

```kotlin
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-js:1.7.3")
}
```

### 基本协程使用

```kotlin
import kotlinx.coroutines.*
import kotlinx.browser.window

// 基本协程示例
fun basicCoroutineExample() {
    // 启动协程
    GlobalScope.launch {
        println("Coroutine started")
        delay(1000) // 非阻塞延迟
        println("Coroutine resumed after 1 second")
    }

    println("Main thread continues")
}

// 使用runBlocking在测试中
fun testCoroutineExample() {
    runBlocking {
        val result = async {
            delay(500)
            "Async result"
        }

        println("Waiting for result...")
        println("Result: ${result.await()}")
    }
}
```

### 协程调度器

```kotlin
// 不同的调度器
fun dispatcherExamples() {
    // 主线程调度器（用于UI操作）
    GlobalScope.launch(Dispatchers.Main) {
        println("Running on main thread")
        // 更新UI元素
        document.body?.innerHTML = "Updated from coroutine"
    }

    // 默认调度器
    GlobalScope.launch(Dispatchers.Default) {
        println("Running on default dispatcher")
        // CPU密集型任务
        val result = heavyComputation()
        withContext(Dispatchers.Main) {
            // 切换回主线程更新UI
            updateUI(result)
        }
    }
}

// 自定义调度器
fun customDispatcher() {
    val customDispatcher = newSingleThreadContext("CustomThread")

    GlobalScope.launch(customDispatcher) {
        println("Running on custom thread")
        // 执行特定任务
    }
}
```

## Promise 与协程的互操作

### Promise 转换为协程

```kotlin
// 将JavaScript Promise转换为Kotlin协程
suspend fun <T> Promise<T>.await(): T = suspendCancellableCoroutine { continuation ->
    then({ value ->
        continuation.resume(value)
    }, { error ->
        continuation.resumeWithException(error)
    })
}

// 使用示例
fun fetchWithCoroutines() {
    GlobalScope.launch {
        try {
            val response = window.fetch("https://api.example.com/data").await()
            val text = response.text().await()
            println("Data: $text")
        } catch (e: Exception) {
            println("Error: ${e.message}")
        }
    }
}
```

### 协程转换为 Promise

```kotlin
// 将协程转换为JavaScript Promise
fun <T> CoroutineScope.promise(
    context: CoroutineContext = EmptyCoroutineContext,
    block: suspend CoroutineScope.() -> T
): Promise<T> = Promise { resolve, reject ->
    launch(context) {
        try {
            resolve(block())
        } catch (e: Throwable) {
            reject(e)
        }
    }
}

// 使用示例
fun coroutineToPromiseExample() {
    val promise = GlobalScope.promise {
        delay(1000)
        "Result from coroutine"
    }

    promise.then { result ->
        console.log("Promise resolved: $result")
    }
}
```

### 封装异步 API

```kotlin
// 封装Fetch API
class ApiClient {
    suspend fun get(url: String): String {
        val response = window.fetch(url).await()
        if (!response.ok) {
            throw Error("HTTP error: ${response.status}")
        }
        return response.text().await()
    }

    suspend fun post(url: String, data: Any): String {
        val options = js("{}")
        options.method = "POST"
        options.headers = js("{}")
        options.headers["Content-Type"] = "application/json"
        options.body = JSON.stringify(data)

        val response = window.fetch(url, options).await()
        return response.text().await()
    }

    suspend fun <T> getJson(url: String): T {
        val text = get(url)
        return JSON.parse(text)
    }
}

// 使用封装的API
fun useApiClient() {
    val apiClient = ApiClient()

    GlobalScope.launch {
        try {
            val users = apiClient.getJson<Array<User>>("https://api.example.com/users")
            println("Loaded ${users.size} users")

            for (user in users) {
                println("User: ${user.name}")
            }
        } catch (e: Exception) {
            println("Error loading users: ${e.message}")
        }
    }
}

data class User(val id: Int, val name: String, val email: String)
```

## 流式数据处理

### Flow 基础

```kotlin
import kotlinx.coroutines.flow.*

// 创建Flow
fun createFlow(): Flow<String> = flow {
    for (i in 1..5) {
        delay(1000)
        emit("Item $i")
    }
}

// 使用Flow
fun flowExample() {
    GlobalScope.launch {
        createFlow()
            .map { it.uppercase() }
            .filter { it.contains("3") || it.contains("5") }
            .collect { item ->
                println("Collected: $item")
            }
    }
}

// 转换JavaScript事件为Flow
fun eventsToFlow() {
    val clickFlow = callbackFlow {
        val button = document.getElementById("myButton") as HTMLButtonElement

        val listener: (Event) -> Unit = { event ->
            trySend(event)
        }

        button.addEventListener("click", listener)

        awaitClose {
            button.removeEventListener("click", listener)
        }
    }

    GlobalScope.launch {
        clickFlow.collect { event ->
            println("Button clicked at ${Date()}")
        }
    }
}
```

### 高级 Flow 操作

```kotlin
// 复杂的Flow处理
fun advancedFlowExample() {
    GlobalScope.launch {
        flow {
            emit(1)
            delay(100)
            emit(2)
            delay(100)
            emit(3)
            delay(100)
            emit(4)
            delay(100)
            emit(5)
        }
        .buffer() // 缓冲发射的值
        .conflate() // 只保留最新的值
        .debounce(50) // 防抖
        .distinctUntilChanged() // 去重
        .onEach { value ->
            println("Processing: $value")
        }
        .catch { error ->
            println("Error: ${error.message}")
        }
        .onCompletion {
            println("Flow completed")
        }
        .collect { value ->
            println("Final value: $value")
        }
    }
}

// 组合多个Flow
fun combineFlows() {
    val flow1 = flow {
        for (i in 1..3) {
            delay(1000)
            emit("A$i")
        }
    }

    val flow2 = flow {
        for (i in 1..3) {
            delay(1500)
            emit("B$i")
        }
    }

    GlobalScope.launch {
        flow1.zip(flow2) { a, b -> "$a + $b" }
            .collect { combined ->
                println("Combined: $combined")
            }
    }
}
```

## 错误处理与异常管理

### 协程异常处理

```kotlin
// 基本异常处理
fun exceptionHandlingExample() {
    GlobalScope.launch {
        try {
            val result = riskyOperation()
            println("Success: $result")
        } catch (e: Exception) {
            println("Error: ${e.message}")
        } finally {
            println("Cleanup")
        }
    }
}

suspend fun riskyOperation(): String {
    delay(500)
    throw RuntimeException("Something went wrong")
}

// 使用CoroutineExceptionHandler
fun exceptionHandlerExample() {
    val exceptionHandler = CoroutineExceptionHandler { _, exception ->
        println("Caught exception: ${exception.message}")
    }

    GlobalScope.launch(exceptionHandler) {
        throw RuntimeException("Unhandled exception")
    }
}

// SupervisorJob防止异常传播
fun supervisorJobExample() {
    val supervisorJob = SupervisorJob()

    GlobalScope.launch(supervisorJob) {
        launch {
            try {
                delay(1000)
                throw RuntimeException("Child 1 failed")
            } catch (e: Exception) {
                println("Child 1 error handled: ${e.message}")
            }
        }

        launch {
            delay(2000)
            println("Child 2 completed successfully")
        }
    }
}
```

### Flow 错误处理

```kotlin
// Flow中的错误处理
fun flowErrorHandling() {
    GlobalScope.launch {
        flow {
            emit(1)
            emit(2)
            throw RuntimeException("Flow error")
            emit(3)
        }
        .catch { error ->
            println("Flow error caught: ${error.message}")
            emit(-1) // 发生错误时发送默认值
        }
        .collect { value ->
            println("Collected: $value")
        }
    }
}

// 重试机制
fun retryMechanism() {
    GlobalScope.launch {
        var retryCount = 0
        val maxRetries = 3

        while (retryCount < maxRetries) {
            try {
                val result = fetchWithRetry()
                println("Success: $result")
                break
            } catch (e: Exception) {
                retryCount++
                println("Attempt $retryCount failed: ${e.message}")

                if (retryCount >= maxRetries) {
                    println("Max retries reached")
                    throw e
                }

                delay(1000 * retryCount) // 指数退避
            }
        }
    }
}

suspend fun fetchWithRetry(): String {
    if (Math.random() > 0.7) {
        return "Success"
    } else {
        throw RuntimeException("Random failure")
    }
}
```

## 实际应用场景

### 并发网络请求

```kotlin
// 并发执行多个网络请求
suspend fun loadUserData(userId: String): UserData {
    val deferredUser = async { fetchUser(userId) }
    val deferredPosts = async { fetchUserPosts(userId) }
    val deferredComments = async { fetchUserComments(userId) }

    val user = deferredUser.await()
    val posts = deferredPosts.await()
    val comments = deferredComments.await()

    return UserData(user, posts, comments)
}

// 使用示例
fun loadUserDataExample() {
    GlobalScope.launch {
        try {
            val userData = loadUserData("123")
            println("Loaded data for user: ${userData.user.name}")
            println("Posts: ${userData.posts.size}")
            println("Comments: ${userData.comments.size}")
        } catch (e: Exception) {
            println("Error loading user data: ${e.message}")
        }
    }
}

data class UserData(
    val user: User,
    val posts: List<Post>,
    val comments: List<Comment>
)
```

### 实时数据更新

```kotlin
// 使用Flow实现实时数据更新
class RealTimeDataService {
    private val _data = MutableStateFlow<List<Item>>(emptyList())
    val data: StateFlow<List<Item>> = _data.asStateFlow()

    fun startUpdates() {
        GlobalScope.launch {
            while (true) {
                try {
                    val newData = fetchLatestData()
                    _data.value = newData
                    delay(5000) // 每5秒更新一次
                } catch (e: Exception) {
                    println("Error updating data: ${e.message}")
                    delay(10000) // 错误时等待更长时间
                }
            }
        }
    }

    private suspend fun fetchLatestData(): List<Item> {
        // 模拟网络请求
        delay(1000)
        return listOf(
            Item(1, "Item 1", Date().getTime()),
            Item(2, "Item 2", Date().getTime())
        )
    }
}

data class Item(val id: Int, val name: String, val timestamp: Double)

// 使用实时数据服务
fun useRealTimeData() {
    val service = RealTimeDataService()

    GlobalScope.launch {
        service.data.collect { items ->
            updateUI(items)
        }
    }

    service.startUpdates()
}

fun updateUI(items: List<Item>) {
    val container = document.getElementById("data-container") as HTMLElement
    container.innerHTML = items.joinToString("") { item ->
        "<div>${item.name} - ${Date(item.timestamp)}</div>"
    }
}
```

### 用户界面响应

```kotlin
// 响应用户输入的搜索功能
class SearchService {
    private val _searchResults = MutableStateFlow<List<SearchResult>>(emptyList())
    val searchResults: StateFlow<List<SearchResult>> = _searchResults.asStateFlow()

    private val searchQuery = MutableStateFlow("")

    init {
        GlobalScope.launch {
            searchQuery
                .debounce(300) // 防抖
                .distinctUntilChanged() // 去重
                .map { query ->
                    if (query.isBlank()) {
                        emptyList()
                    } else {
                        performSearch(query)
                    }
                }
                .catch { error ->
                    println("Search error: ${error.message}")
                    emptyList()
                }
                .collect { results ->
                    _searchResults.value = results
                }
        }
    }

    fun updateQuery(query: String) {
        searchQuery.value = query
    }

    private suspend fun performSearch(query: String): List<SearchResult> {
        // 模拟搜索API调用
        delay(500)
        return listOf(
            SearchResult(1, "Result 1 for $query"),
            SearchResult(2, "Result 2 for $query")
        )
    }
}

data class SearchResult(val id: Int, val title: String)

// 设置搜索界面
fun setupSearchInterface() {
    val searchService = SearchService()
    val searchInput = document.getElementById("search-input") as HTMLInputElement
    val resultsContainer = document.getElementById("search-results") as HTMLElement

    // 监听输入变化
    searchInput.addEventListener("input") { event ->
        val query = (event.target as HTMLInputElement).value
        searchService.updateQuery(query)
    }

    // 监听搜索结果
    GlobalScope.launch {
        searchService.searchResults.collect { results ->
            resultsContainer.innerHTML = results.joinToString("") { result ->
                "<div class='search-result'>${result.title}</div>"
            }
        }
    }
}
```

## 性能优化技巧

### 协程池管理

```kotlin
// 使用有限的协程池
class CoroutinePoolManager {
    private val dispatcher = Dispatchers.Default.limitedParallelism(4)

    fun <T> submitTask(task: suspend () -> T): Deferred<T> {
        return GlobalScope.async(dispatcher) {
            task()
        }
    }

    fun <T> submitTasks(tasks: List<suspend () -> T>): List<Deferred<T>> {
        return tasks.map { submitTask(it) }
    }
}

// 使用协程池
fun useCoroutinePool() {
    val poolManager = CoroutinePoolManager()

    GlobalScope.launch {
        val tasks = (1..10).map { i ->
            poolManager.submitTask {
                delay(1000)
                "Task $i completed"
            }
        }

        tasks.awaitAll().forEach { result ->
            println(result)
        }
    }
}
```

### 内存管理

```kotlin
// 避免内存泄漏的协程管理
class ComponentWithCoroutines {
    private val scope = MainScope()

    fun start() {
        scope.launch {
            // 长时间运行的任务
            while (true) {
                delay(1000)
                updateUI()
            }
        }
    }

    fun stop() {
        scope.cancel() // 取消所有协程
    }

    private fun updateUI() {
        // 更新UI逻辑
    }
}

// 使用示例
fun componentLifecycleExample() {
    val component = ComponentWithCoroutines()

    // 组件启动
    component.start()

    // 组件销毁时
    window.addEventListener("beforeunload") {
        component.stop()
    }
}
```

## 最佳实践

1. **使用适当的调度器**：UI 操作使用 Main 调度器，计算密集型任务使用 Default 调度器
2. **合理处理异常**：使用 try-catch 和 CoroutineExceptionHandler
3. **避免阻塞操作**：使用 suspend 函数而不是阻塞调用
4. **管理协程生命周期**：使用适当的 CoroutineScope 避免内存泄漏
5. **使用 Flow 处理数据流**：对于连续的数据流，优先使用 Flow
6. **实现适当的错误恢复**：添加重试机制和降级策略

## 总结

Kotlin/JS 的协程为 Web 异步编程提供了强大而优雅的解决方案。通过掌握协程、Promise 互操作、Flow 和错误处理，你可以编写出简洁、高效、可维护的异步代码。

在下一篇文章中，我们将学习 Kotlin/JS 的模块化与依赖管理，了解如何组织大型项目和管理依赖关系。
