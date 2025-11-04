---
description: 介绍 Kotlin Flow 在 Android 中的使用模式，涵盖热流、冷流、状态管理与背压策略。
tag:
  - Kotlin
  - Flow
  - Android
sidebar: true
---

# Android Kotlin Flow 数据流与状态管理

## 冷流与热流

| 类型      | 代表实现                  | 特点                           |
| --------- | ------------------------- | ------------------------------ |
| 冷流 Cold | `flow {}`、`asFlow()`     | 每次订阅重新执行，惰性、无粘性 |
| 热流 Hot  | `StateFlow`、`SharedFlow` | 持续存在，订阅者共享数据       |

```kotlin
val coldFlow = flow {
    emit(api.fetch())
}

val hotState = MutableStateFlow(HomeUiState.Loading)
```

## Flow 基础操作

```kotlin
val result = flowOf(1, 2, 3)
    .map { it * 2 }
    .filter { it > 2 }
    .onEach { Timber.d("value=$it") }
    .toList()
```

- 操作符分为中间操作（`map`、`filter`）和末端操作（`collect`、`toList`）。
- Flow 默认在调用线程执行，使用 `flowOn` 切换线程。

## StateFlow 与 UI 状态

```kotlin
sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(val data: List<Article>) : HomeUiState
    data class Error(val error: Throwable) : HomeUiState
}

class HomeViewModel @Inject constructor(
    private val repository: HomeRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun refresh() = viewModelScope.launch {
        repository.observeArticles()
            .map<HomeResult, HomeUiState> { HomeUiState.Success(it.list) }
            .catch { emit(HomeUiState.Error(it)) }
            .collect { _uiState.value = it }
    }
}
```

- `StateFlow` 具备粘性，订阅时立即获得最新值。
- 适合替代 `LiveData` 持有 UI 状态。

## SharedFlow 与事件总线

```kotlin
class EventBus {
    private val _events = MutableSharedFlow<AppEvent>(extraBufferCapacity = 64)
    val events: SharedFlow<AppEvent> = _events.asSharedFlow()

    suspend fun emit(event: AppEvent) {
        _events.emit(event)
    }
}

viewModelScope.launch {
    eventBus.events.filterIsInstance<AppEvent.Toast>().collect { event ->
        _toastState.value = event.message
    }
}
```

- `MutableSharedFlow` 可配置缓冲与重放策略。
- 常用于一次性事件或多模块消息分发。

## 背压策略与节流

```kotlin
searchQuery
    .debounce(300)
    .distinctUntilChanged()
    .flatMapLatest { keyword -> repository.search(keyword) }
    .conflate() // 仅保留最新值，丢弃旧值
    .collect { result -> render(result) }
```

- `debounce`、`sample`、`conflate`、`buffer` 可应对高频发射。
- `flatMapLatest` 会取消旧的子流，仅保留最新请求结果。

## Flow 与 Compose

```kotlin
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    when (state) {
        is HomeUiState.Loading -> LoadingView()
        is HomeUiState.Success -> ArticleList(state.data)
        is HomeUiState.Error -> ErrorView(state.error)
    }
}
```

- `collectAsStateWithLifecycle` 确保与生命周期同步。

## 多数据源合并

```kotlin
val uiState = combine(
    userRepository.observeUser(),
    configRepository.observeConfig()
) { user, config ->
    UiState(user = user, config = config)
}.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = UiState()
)
```

- `combine` 支持多个 Flow 合并。
- `stateIn` 将冷流转换为热流，提供初始值。

## 测试 Flow

```kotlin
@Test
fun `emit states`() = runTest {
    val flow = repository.observeArticles()
    val collectJob = launch(UnconfinedTestDispatcher()) {
        flow.test {
            assertEquals(HomeUiState.Loading, awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }
    collectJob.join()
}
```

- 使用 `turbine`（`app.cash.turbine`）测试 Flow 发射值。

## 常见问题

| 问题               | 原因                          | 解决方案                                       |
| ------------------ | ----------------------------- | ---------------------------------------------- |
| shareIn 内存泄漏   | `scope` 生命周期过长          | 使用 `viewModelScope` 或手动取消               |
| collect 阻塞主线程 | 在主线程执行了耗时操作        | 添加 `flowOn(Dispatchers.IO)` 或 `withContext` |
| 重复请求           | 未使用 `distinctUntilChanged` | 比较数据差异，或在 Repository 层缓存           |

## 总结

1. Flow 提供统一的响应式数据流模型，结合 `StateFlow`/`SharedFlow` 可覆盖大部分 UI 状态与事件需求。
2. 借助 `combine`、`flatMapLatest` 等操作符，能够灵活拼装多数据源。
3. 管理好生命周期、背压策略与测试，是 Flow 在实际项目中稳定运行的关键。

下一篇将探讨 Kotlin 在 Jetpack Compose 中的应用与最佳实战。
