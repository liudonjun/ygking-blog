---
description: 分享 Kotlin 协程在 Android 项目中的实践经验，涵盖网络层、数据库、并发控制与性能调优。
tag:
  - Kotlin
  - 协程
  - Android
sidebar: true
---

# Android Kotlin 协程在实际项目中的应用

## 网络请求最佳实践

### Retrofit + 协程

```kotlin
interface ApiService {
    @GET("/user/profile")
    suspend fun getUserProfile(): ApiResponse<User>
}

class UserRepository @Inject constructor(private val api: ApiService) {
    suspend fun loadProfile(): Result<User> = runCatching {
        api.getUserProfile().requireData()
    }
}
```

- Retrofit 原生支持 `suspend` 函数，无需 `Call` 回调。
- 使用 `runCatching` 包裹异常，结合 `Result` 向上返回。

### 并发请求

```kotlin
class DashboardRepository @Inject constructor(private val api: ApiService) {
    suspend fun loadDashboard(): Dashboard = coroutineScope {
        val userDeferred = async { api.getUserProfile() }
        val feedDeferred = async { api.getFeed() }
        Dashboard(userDeferred.await().data, feedDeferred.await().items)
    }
}
```

## Room 数据库

```kotlin
@Dao
interface ArticleDao {
    @Query("SELECT * FROM article WHERE id = :id")
    suspend fun getById(id: Long): ArticleEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(list: List<ArticleEntity>)
}

class ArticleRepository @Inject constructor(
    private val dao: ArticleDao,
    private val api: ApiService
) {
    fun observeArticles(): Flow<List<Article>> = flow {
        emit(dao.queryAll().map { it.toDomain() })
        val remote = api.fetchArticles()
        dao.insertAll(remote.map { it.toEntity() })
        emit(dao.queryAll().map { it.toDomain() })
    }.flowOn(Dispatchers.IO)
}
```

## UI 层协程模式

### ViewModel

```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: HomeRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState

    fun refresh() = viewModelScope.launch {
        repository.fetchHome()
            .onFailure { _uiState.value = HomeUiState.Error(it) }
            .onSuccess { _uiState.value = HomeUiState.Success(it) }
    }
}
```

### LifecycleScope

```kotlin
class HomeFragment : Fragment(R.layout.fragment_home) {
    private val viewModel: HomeViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { render(it) }
            }
        }
    }
}
```

## 并发控制与节流

### 1. 互斥锁

```kotlin
class TokenManager {
    private val mutex = Mutex()
    private var token: String? = null

    suspend fun refreshToken(force: Boolean = false): String {
        return mutex.withLock {
            if (token == null || force) {
                token = api.refreshToken()
            }
            token!!
        }
    }
}
```

### 2. 限流器

```kotlin
class RateLimiter(private val intervalMs: Long) {
    private var lastTime = 0L

    suspend fun acquire() {
        val now = SystemClock.elapsedRealtime()
        val elapsed = now - lastTime
        if (elapsed < intervalMs) delay(intervalMs - elapsed)
        lastTime = SystemClock.elapsedRealtime()
    }
}
```

## 性能调优

- 使用 `Dispatchers.IO.limitedParallelism(n)` 控制并发数。
- 避免在 `Dispatchers.Main` 执行长时间任务。
- 对频繁触发的事件使用 `debounce` 或 `sample`（Flow）。

```kotlin
viewModelScope.launch {
    searchQuery.debounce(300)
        .distinctUntilChanged()
        .flatMapLatest { keyword -> repository.search(keyword) }
        .flowOn(Dispatchers.IO)
        .collect { result ->
            _uiState.value = HomeUiState.Success(result)
        }
}
```

## 协程测试

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {
    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(dispatcher)
    }

    @Test
    fun `refresh success`() = runTest {
        viewModel.refresh()
        dispatcher.scheduler.advanceUntilIdle()
        assertEquals(HomeUiState.Success(expected), viewModel.uiState.value)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }
}
```

## 常见问题

| 问题                   | 原因                          | 解决方案                                   |
| ---------------------- | ----------------------------- | ------------------------------------------ |
| 协程未取消             | 作用域与生命周期不匹配        | 使用 `viewModelScope`/`lifecycleScope`     |
| 内存泄漏               | `launch` 引用 UI 对象但未取消 | 使用弱引用或在 `onDestroyView` 取消        |
| 并发请求失败不回收资源 | 未使用结构化并发              | 使用 `coroutineScope` 或 `supervisorScope` |

## 总结

1. 协程可简化网络、数据库等异步操作，结合结构化并发保障稳定性。
2. 使用框架提供的作用域（ViewModel、Lifecycle）可自动管理生命周期。
3. 性能调优与测试必不可少，合理使用调度器、互斥锁与限流器是大型项目稳定运行的关键。

下一篇将聚焦 Kotlin Flow，打造响应式的数据流管道。
