---
description: 探讨 Kotlin 在 Android 中的面向对象特性，包括类、数据类、密封类、委托与接口实现模式。
tag:
  - Kotlin
  - Android
  - OOP
sidebar: true
---

# Android Kotlin 面向对象与委托模式

## 类与构造函数

```kotlin
class UserService(private val api: ApiService) {
    fun load(id: Long): User = api.getUser(id)
}

class UserRepository @Inject constructor(
    private val local: UserLocalDataSource,
    private val remote: UserRemoteDataSource
) {
    fun getUser(id: Long): Flow<User> {
        return remote.fetchUser(id)
            .onEach { local.save(it) }
            .catch { emitAll(local.observe(id)) }
    }
}
```

### 次构造函数

```kotlin
class ErrorResponse(val code: Int, val message: String) {
    constructor(exception: Throwable) : this(500, exception.message ?: "Unknown")
}
```

## 数据类与复制

```kotlin
data class UiState(
    val loading: Boolean = false,
    val data: List<Article> = emptyList(),
    val error: Throwable? = null
)

val newState = oldState.copy(loading = true)
```

- 数据类自动生成 `copy`、`equals`、`hashCode`，适合不可变状态管理。

## 密封类与枚举

```kotlin
sealed interface LoginResult {
    data class Success(val user: User) : LoginResult
    data class Failure(val error: Throwable) : LoginResult
    data object Loading : LoginResult
}

fun render(result: LoginResult) = when (result) {
    is LoginResult.Success -> showUser(result.user)
    is LoginResult.Failure -> showError(result.error)
    LoginResult.Loading -> showLoading()
}
```

- 密封类限制子类范围，`when` 匹配时可无需 `else`。
- `data object`（Kotlin 1.9+）适合表示单例状态。

## 接口与委托

### 1. 接口实现

```kotlin
interface Analytics {
    fun track(event: String)
}

class FirebaseAnalytics : Analytics {
    override fun track(event: String) {
        Log.d("analytics", "track=$event")
    }
}
```

### 2. 类委托

```kotlin
class AnalyticsLogger(private val analytics: Analytics) : Analytics by analytics {
    override fun track(event: String) {
        Log.d("analytics", "event=$event")
        analytics.track(event)
    }
}

val analytics: Analytics = AnalyticsLogger(FirebaseAnalytics())
```

- `Analytics by analytics` 表示除重写方法外，其余调用委托给原实现。

### 3. 属性委托

```kotlin
class PreferenceDelegate<T>(
    private val prefs: SharedPreferences,
    private val key: String,
    private val default: T
) {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return when (default) {
            is String -> prefs.getString(key, default) as T
            is Int -> prefs.getInt(key, default) as T
            else -> default
        }
    }

    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        prefs.edit().apply {
            when (value) {
                is String -> putString(key, value)
                is Int -> putInt(key, value)
            }
        }.apply()
    }
}

class UserPreferences(prefs: SharedPreferences) {
    var token: String by PreferenceDelegate(prefs, "token", "")
}
```

## 组件化中的委托案例

### 1. Activity 结果回调

```kotlin
class PhotoPickerHandler(activity: ComponentActivity) {
    private val launcher = activity.registerForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri?.let(onPhotoPicked)
    }

    var onPhotoPicked: (Uri) -> Unit = {}

    fun selectPhoto() {
        launcher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
    }
}
```

- 利用委托对象封装复杂回调，Activity 只需保留引用。

### 2. Compose 状态持有

```kotlin
class UiStateHolder(initial: UiState) {
    var state by mutableStateOf(initial)
        private set

    fun update(block: UiState.() -> UiState) {
        state = block(state)
    }
}
```

## 设计建议

- 优先使用不可变数据类管理 UI 状态。
- 对多状态场景使用密封类提升类型安全。
- 属性委托可封装 SharedPreferences、数据库字段等重复逻辑。
- 类委托便利但要警惕过度封装导致的调用链复杂。

## 总结

1. Kotlin 的面向对象特性与 Java 兼容，同时提供数据类、密封类等增强特性。
2. 委托模式可减少样板代码，广泛适用于属性持有、能力增强、状态封装等场景。
3. 合理结合 OOP 与函数式能力，是构建可维护 Android 架构的关键。

下一篇将进入集合操作与标准库，探索 Kotlin 如何提升数据处理效率。
