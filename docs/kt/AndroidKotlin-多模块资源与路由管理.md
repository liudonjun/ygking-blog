---
description: 探讨大型 Android Kotlin 项目中的多模块资源划分、路由通信与依赖管理策略。
tag:
  - Kotlin
  - 多模块
  - 架构
sidebar: true
---

# Android Kotlin 多模块资源与路由管理

## 模块划分原则

| 模块类型  | 内容                                        |
| --------- | ------------------------------------------- |
| `app`     | 壳工程、导航入口、依赖注入                  |
| `feature` | 独立业务（Home、Profile）                   |
| `core`    | 基础能力（network、database、designsystem） |
| `library` | 通用工具、日志、分析等                      |

## 资源管理

### 1. 命名规范

- 使用前缀区分模块：`feature_home_title`。
- 在 `core/designsystem` 中集中管理颜色、字体、尺寸。

```kotlin
object Dimens {
    val screenPadding = 16.dp
}

val LocalDimens = staticCompositionLocalOf { Dimens }
```

### 2. 共享资源

- 使用 `gradle` `androidResources { additionalParameters += "--stable-ids" }` 保证资源 id 稳定。
- 在 `core/designsystem` 导出公共组件与 theme。

## 路由通信

### 接口化导航

```kotlin
interface HomeNavigator {
    fun openDetail(context: Context, id: Long)
}

class HomeNavigatorImpl @Inject constructor() : HomeNavigator {
    override fun openDetail(context: Context, id: Long) {
        val intent = Intent(context, DetailActivity::class.java)
        intent.putExtra("id", id)
        context.startActivity(intent)
    }
}
```

- 在 `app` 模块通过 Hilt 注入具体实现。

### Compose 导航模块化

```kotlin
interface NavGraphInstaller {
    val route: String
    fun install(builder: NavGraphBuilder, navController: NavController)
}

@Module
@InstallIn(SingletonComponent::class)
abstract class NavigationModule {
    @Binds @IntoSet
    abstract fun bindHomeInstaller(installer: HomeNavInstaller): NavGraphInstaller
}

@Composable
fun AppNavHost(installers: Set<NavGraphInstaller>) {
    val navController = rememberNavController()
    NavHost(navController, startDestination = "home") {
        installers.forEach { it.install(this, navController) }
    }
}
```

## 依赖管理

- 使用 Version Catalog (`libs`) 管理依赖版本。
- 在 `build-logic` 中创建 Convention Plugins。
- Feature 模块只依赖必要的 `core` 模块，避免环依赖。

```kotlin
plugins {
    id("com.example.android.feature")
}

dependencies {
    implementation(projects.core.designsystem)
    implementation(projects.core.model)
}
```

## 动态特性模块

- 使用 Play Feature Delivery 或 SplitCompat。
- 路由通过接口访问，模块加载后再反射或 `ServiceLoader` 获取实现。

```kotlin
fun Context.loadFeatureNavigator(): FeatureNavigator? {
    return try {
        Class.forName("com.example.feature.FeatureNavigatorImpl")
            .getDeclaredConstructor()
            .newInstance() as FeatureNavigator
    } catch (e: ClassNotFoundException) {
        null
    }
}
```

## 常见问题

| 问题         | 原因                 | 解决方案                             |
| ------------ | -------------------- | ------------------------------------ |
| 资源命名冲突 | 跨模块使用相同资源名 | 引入命名空间前缀，或使用专用资源模块 |
| 依赖环       | 模块互相引用         | 拆分基础模块，通过接口转移依赖关系   |
| 路由更新困难 | 模块直接构造 Intent  | 使用接口 + DI 管理路由               |

## 总结

多模块工程需要统一的资源命名、路由接口与依赖管理策略。通过设计系统模块、导航接口与 Gradle Convention 插件，可以构建更可维护的 Kotlin Android 项目架构，为规模化团队协作提供保障。
