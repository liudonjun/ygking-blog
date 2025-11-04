---
description: 解析 Kotlin Channel 在 Android 中的使用场景，包括生产者消费者、背压策略与协程并发模式。
tag:
  - Kotlin
  - 协程
  - 并发
sidebar: true
---

# Android Kotlin Channel 与并发通信模式

## Channel 基础

| Channel 类型         | 特点                      |
| -------------------- | ------------------------- |
| `Channel.UNLIMITED`  | 无界，容易 OOM            |
| `Channel.BUFFERED`   | 默认缓冲 64，常用         |
| `Channel.CONFLATED`  | 只保留最新值              |
| `Channel.RENDEZVOUS` | 无缓冲，发送/接收需要配对 |

```kotlin
val channel = Channel<Int>(capacity = Channel.BUFFERED)

launch {
    repeat(10) { channel.send(it) }
    channel.close()
}

launch {
    for (value in channel) {
        println(value)
    }
}
```

## 生产者/消费者模式

```kotlin
fun CoroutineScope.produceEvents(): ReceiveChannel<Event> = produce(capacity = Channel.BUFFERED) {
    while (isActive) {
        send(Event(System.currentTimeMillis()))
        delay(1000)
    }
}

val events = produceEvents()
launch {
    events.consumeEach { handleEvent(it) }
}
```

## 背压控制

### 限制发送速率

```kotlin
val channel = Channel<Task>(capacity = 10)

launch {
    channel.consumeEach { task ->
        semaphore.withPermit { process(task) }
    }
}
```

### 使用 `Flow` 转换

```kotlin
val flow = channel.receiveAsFlow()
    .buffer(Channel.CONFLATED)
    .collectLatest { process(it) }
```

## Select 表达式

```kotlin
select<Unit> {
    channel.onReceiveCatching { value ->
        value.getOrNull()?.let(::handle)
    }
    timeoutChannel.onReceive { handleTimeout() }
}
```

## Android 场景

### 1. 上传队列

```kotlin
class UploadManager {
    private val channel = Channel<UploadTask>(Channel.BUFFERED)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    init {
        repeat(3) {
            scope.launch { workerLoop() }
        }
    }

    fun enqueue(task: UploadTask) {
        scope.launch { channel.send(task) }
    }

    private suspend fun workerLoop() {
        for (task in channel) {
            runCatching { uploader.upload(task) }
                .onFailure { delay(3000); channel.send(task) } // 重试
        }
    }
}
```

### 2. UI 事件节流

```kotlin
val clickChannel = Channel<Unit>(Channel.CONFLATED)

LaunchedEffect(Unit) {
    clickChannel.consumeAsFlow().debounce(300).collect { onConfirm() }
}

Button(onClick = { clickChannel.trySend(Unit) }) { Text("确认") }
```

## 调试与测试

```kotlin
@Test
fun `channel processes tasks sequentially`() = runTest {
    val results = mutableListOf<Int>()
    val channel = Channel<Int>(Channel.RENDEZVOUS)

    val job = launch {
        for (value in channel) {
            delay(10)
            results += value
        }
    }

    channel.send(1)
    channel.send(2)
    channel.close()
    job.join()
    assertEquals(listOf(1, 2), results)
}
```

## 常见问题

| 问题         | 原因              | 解决方案                                 |
| ------------ | ----------------- | ---------------------------------------- |
| Channel 泄漏 | 未关闭或未消费    | 在适当时机调用 `close()`，确保消费者退出 |
| OOM          | 无界缓冲导致堆积  | 使用 `capacity` 限制或 `Flow` 背压       |
| 死锁         | 同步发送/接收阻塞 | 使用 `launch` 嵌套或 `Channel.BUFFERED`  |

## 总结

Channel 适合构建生产者-消费者模型、实现异步队列。结合 Flow、Select 可构建复杂并发模式。合理设置容量、关闭通道并编写单元测试，能保证 Channel 在 Android 项目中的稳定性。
