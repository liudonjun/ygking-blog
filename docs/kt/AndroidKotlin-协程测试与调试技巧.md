---
description: 总结 Kotlin 协程的测试框架、调试工具与典型问题排查方法。
tag:
  - Kotlin
  - 协程
  - 测试
sidebar: true
---

# Android Kotlin 协程测试与调试技巧

## 测试工具包

- `kotlinx-coroutines-test`：提供 `runTest`、测试调度器。
- `Turbine`：Flow 测试工具。
- `MockK`/`Mockito`：模拟挂起函数。

Gradle 依赖：

```kotlin
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
testImplementation("app.cash.turbine:turbine:1.1.0")
```

## 单元测试示例

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {
    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `refresh success`() = runTest {
        val repository = FakeRepository(result = Result.success(listOf("A")))
        val viewModel = HomeViewModel(repository)

        viewModel.refresh()
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(listOf("A"), viewModel.state.value.items)
    }
}
```

### Flow 测试

```kotlin
@Test
fun `state emits loading then success`() = runTest {
    val flow = repository.observeState()
    flow.test {
        assertEquals(State.Loading, awaitItem())
        assertTrue(awaitItem() is State.Success)
        cancelAndIgnoreRemainingEvents()
    }
}
```

## 调试技巧

### 1. 协程调试器

- Android Studio 7.0+ 支持协程调试视图。
- 在 `View > Tool Windows > Debug` 中查看 Coroutine 栈。

### 2. 日志追踪

```kotlin
val coroutineExceptionHandler = CoroutineExceptionHandler { _, throwable ->
    Timber.e(throwable, "Coroutine error")
}

viewModelScope.launch(coroutineExceptionHandler) {
    // ...
}
```

### 3. 调度器标签

- 使用 `Dispatchers.IO.limitedParallelism(n)` 控制线程数。
- `DebugProbes` 追踪协程状态（开发期间）：

```kotlin
DebugProbes.install()
DebugProbes.dumpCoroutines(PrintWriter(System.out))
```

## 常见问题排查

| 问题         | 原因                  | 排查步骤                                           |
| ------------ | --------------------- | -------------------------------------------------- |
| 协程未取消   | Job 未保存在作用域    | 检查 `viewModelScope`、`launch` 返回值             |
| 测试卡住     | 使用真实调度器 + 延迟 | 替换为 `TestDispatcher`，使用 `advanceUntilIdle()` |
| Flow 未触发  | 缺少收集者            | 检查 collect 位置，确认未忘记 `collect`            |
| 线程切换异常 | 调度器混用            | 使用 `withContext` 明确线程切换                    |

## 最佳实践

1. 所有 ViewModel 协程统一使用 `viewModelScope`。
2. 对 `launch` 结果命名保存，用于取消或测试。
3. 在测试中使用 `runTest` + `StandardTestDispatcher` 控制时间。
4. 使用 `assertThrows` 验证错误场景，确保异常路径覆盖。

## 总结

协程调试需要结合 IDE 工具与日志追踪；测试阶段通过 `kotlinx-coroutines-test` 可以模拟时间、线程环境。建立标准调试流程与测试模板，有助于快速定位并发问题，提升协程相关代码的可靠性。
