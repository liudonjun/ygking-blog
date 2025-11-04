---
description: 结合 Kotlin 讲解 Hilt 依赖注入在 Android 项目中的模块划分、作用域管理与测试策略。
tag:
  - Kotlin
  - Hilt
  - DI
sidebar: true
---

# Android Kotlin Hilt 依赖注入实战

## Hilt 结构

- 基于 Dagger 的依赖注入框架。
- 提供 Application/Activity/ViewModel 等作用域的默认组件。
- 与 Kotlin 协程、ViewModel、Compose 深度整合。

## 项目配置

```kotlin
plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("kapt")
    id("com.google.dagger.hilt.android")
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-android-compiler:2.51.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
}
```

Application：

```kotlin
@HiltAndroidApp
class App : Application()
```

## 模块定义

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides
    fun provideRetrofit(client: OkHttpClient): Retrofit = Retrofit.Builder()
        .baseUrl("https://api.example.com")
        .client(client)
        .addConverterFactory(MoshiConverterFactory.create())
        .build()
}
```

ViewModel 注入：

```kotlin
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: HomeRepository
) : ViewModel() {
    val uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
}

@AndroidEntryPoint
class HomeActivity : ComponentActivity() {
    private val viewModel: HomeViewModel by viewModels()
}
```

## 自定义作用域

```kotlin
@Scope
@Retention(AnnotationRetention.RUNTIME)
annotation class FeatureScope

@Module
@InstallIn(ActivityRetainedComponent::class)
object FeatureModule {
    @Provides
    @FeatureScope
    fun provideFeatureRepository(api: FeatureApi): FeatureRepository {
        return FeatureRepository(api)
    }
}
```

- `ActivityRetainedComponent` 适用于跨 Fragment 共享 ViewModel。

## 与 Compose 集成

```kotlin
@Composable
fun HomeRoute(viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()
    HomeScreen(state)
}
```

## 动态特性模块

```kotlin
@EntryPoint
@InstallIn(SingletonComponent::class)
interface FeatureEntryPoint {
    fun homeNavigator(): HomeNavigator
}

fun Context.loadFeature(): HomeNavigator {
    val entryPoint = EntryPointAccessors.fromApplication(this, FeatureEntryPoint::class.java)
    return entryPoint.homeNavigator()
}
```

## 测试策略

- 使用 `HiltAndroidRule` 注入测试双。
- 使用 `@UninstallModules` 替换生产模块。

```kotlin
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
class HomeViewModelTest {
    @get:Rule
    val hiltRule = HiltAndroidRule(this)

    @BindValue
    lateinit var repository: HomeRepository

    @Before
    fun setup() {
        repository = FakeHomeRepository()
        hiltRule.inject()
    }
}
```

## 常见问题

| 问题           | 原因                                 | 解决方案                                     |
| -------------- | ------------------------------------ | -------------------------------------------- |
| 找不到入口     | Application 未标记 `@HiltAndroidApp` | 检查清单与注解                               |
| 多模块依赖冲突 | 不同模块重复定义 `@InstallIn`        | 使用 `@EntryPoint` 接入跨模块依赖            |
| 热启动慢       | 初始化对象过多                       | 分离懒加载，使用 `@Provides @Singleton` 缓存 |

## 总结

1. Hilt 简化了 Dagger 配置，搭配 Kotlin 特性可实现清晰的依赖图。
2. 注意作用域与模块划分，确保依赖生命周期与业务一致。
3. 构建完整的测试替换策略，有助于验证依赖注入是否正确配置。
