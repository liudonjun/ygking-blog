---
description: 总结 Kotlin 在现代 Android 架构中的应用，涵盖 Jetpack 组件、Clean Architecture 与多模块协同实践。
tag:
  - Kotlin
  - Android
  - 架构
sidebar: true
---

# Android Kotlin 架构组件与多模块协同

## 架构演进概览

| 层级          | 关键技术栈                             | Kotlin 特性                   |
| ------------- | -------------------------------------- | ----------------------------- |
| 表现层 UI     | Jetpack Compose / XML + ViewModel      | 协程、StateFlow、不可变数据类 |
| 领域层 Domain | UseCase、Repository 接口               | 接口委托、密封类              |
| 数据层 Data   | Retrofit、Room、DataStore、WorkManager | 协程、Flow、扩展函数          |

## 模块划分示例

```
app/                 // 壳模块，包含启动与导航
feature/home/        // 业务模块（UI + ViewModel）
feature/profile/
core/designsystem/   // UI 组件库
core/network/        // 网络层封装
core/database/       // 数据库封装
core/model/          // 数据模型与跨模块实体
core/common/         // 工具、日志、配置
```

### Gradle 配置片段

```kotlin
plugins {
    id("com.android.library")
    kotlin("android")
    kotlin("kapt")
    id("dagger.hilt.android.plugin")
}

android {
    namespace = "com.example.feature.home"
}

dependencies {
    implementation(project(":core:model"))
    implementation(project(":core:network"))
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.4")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
}
```

## Jetpack 核心组件实践

### ViewModel + UseCase

```kotlin
class LoadHomeUseCase @Inject constructor(
    private val repository: HomeRepository
) {
    suspend operator fun invoke(): HomeData = repository.fetchHome()
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val loadHome: LoadHomeUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun refresh() = viewModelScope.launch {
        runCatching { loadHome() }
            .onSuccess { _uiState.value = HomeUiState.Success(it) }
            .onFailure { _uiState.value = HomeUiState.Error(it) }
    }
}
```

### DataStore + Flow

```kotlin
val Context.userPreferences: DataStore<UserPreferences> by dataStore(
    fileName = "user_prefs.pb",
    serializer = UserPreferencesSerializer
)

class UserPreferencesRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    val userTheme: Flow<AppTheme> = context.userPreferences.data
        .map { prefs -> prefs.theme }
        .map { theme -> AppTheme.valueOf(theme) }
}
```

### WorkManager 协程任务

```kotlin
class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters,
    private val repository: SyncRepository
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return runCatching { repository.syncAll() }
            .fold(onSuccess = { Result.success() }, onFailure = { Result.retry() })
    }
}
```

## 多模块协同策略

- **数据模型共享**：在 `core/model` 模块统一定义 `data class` 与密封类，避免重复定义。
- **接口分离**：使用 Kotlin 接口 + `expect/actual`（如需 KMP）实现多平台支撑。
- **依赖注入**：Hilt 或 Koin 统一管理依赖，模块间通过接口通信。
- **版本管理**：使用 `buildSrc` 或 `libs.versions.toml` 管理依赖版本。

```kotlin
// libs.versions.toml
[versions]
kotlin = "1.9.24"
coroutines = "1.8.1"

[libraries]
coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }
```

## API 设计与错误处理

```kotlin
sealed class Resource<out T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val error: Throwable) : Resource<Nothing>()
    data object Loading : Resource<Nothing>()
}

fun <T> Flow<T>.asResource(): Flow<Resource<T>> = flow {
    emit(Resource.Loading)
    try {
        collect { emit(Resource.Success(it)) }
    } catch (e: Throwable) {
        emit(Resource.Error(e))
    }
}
```

- 统一的数据包装类可跨模块复用，提升可观察性。

## 质量保障

- **单元测试**：UseCase、Repository 使用协程测试框架。
- **集成测试**：为特性模块构建 UI 测试，验证 Compose/Fragment 交互。
- **静态检查**：启用 `detekt`、`ktlint`、`compose compiler metrics`。

```kotlin
tasks.register<Copy>("copyComposeReport") {
    from("${buildDir}/compose-metrics")
    into(rootProject.file("compose-reports"))
}
```

## 发布与矩阵

- 多模块可按功能拆分 Feature 模块，结合 Gradle `enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")` 简化依赖。
- 通过 `Dynamic Feature` 发布按需下载模块。

## 总结

1. Kotlin 的语言特性与 Jetpack 组件天然契合，支持清晰分层与响应式数据流。
2. 多模块化可以提高团队协作效率，需配合统一的模型、依赖与质量体系。
3. 持续关注 Compose、KMP 等生态演进，提前规划架构演进路线。

至此，10 篇 Android Kotlin 系列从基础到架构实践已全部完成，可根据项目需求挑选模块深入落地。
