---
description: 介绍 Jetpack Compose Navigation 框架，涵盖路由设计、参数传递、深链与多模块集成。
tag:
  - Kotlin
  - Compose
  - Navigation
sidebar: true
---

# Android Kotlin Compose 导航与深链

## 路由设计

- 采用常量或 sealed class 统一管理。

```kotlin
sealed class Destinations(val route: String) {
    data object Home : Destinations("home")
    data object Detail : Destinations("detail/{id}") {
        fun createRoute(id: Long) = "detail/$id"
    }
}
```

## 基础导航

```kotlin
@Composable
fun AppNavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(navController, startDestination = Destinations.Home.route) {
        composable(Destinations.Home.route) {
            HomeRoute(onOpenDetail = { id ->
                navController.navigate(Destinations.Detail.createRoute(id))
            })
        }
        composable(
            Destinations.Detail.route,
            arguments = listOf(navArgument("id") { type = NavType.LongType })
        ) { entry ->
            val id = entry.arguments?.getLong("id") ?: return@composable
            DetailRoute(id)
        }
    }
}
```

## 多返回栈与 BottomBar

```kotlin
val tabs = listOf("feed", "search", "profile")
val navController = rememberNavController()

NavigationBar {
    tabs.forEach { tab ->
        NavigationBarItem(
            selected = navController.currentDestination?.route == tab,
            onClick = {
                navController.navigate(tab) {
                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            },
            icon = { Icon(Icons.Default.Home, null) },
            label = { Text(tab) }
        )
    }
}
```

## 深链与外部跳转

### Manifest 配置

```xml
<activity
    android:name=".MainActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="app" android:host="example" android:pathPrefix="/detail" />
    </intent-filter>
</activity>
```

### Compose 处理

```kotlin
@Composable
fun MainApp(navController: NavHostController = rememberNavController()) {
    val intent = LocalContext.current.findActivity()?.intent
    LaunchedEffect(intent) {
        intent?.data?.lastPathSegment?.toLongOrNull()?.let { id ->
            navController.navigate(Destinations.Detail.createRoute(id))
        }
    }
    AppNavGraph(navController)
}
```

## 多模块导航

- 在 `core/navigation` 定义 `NavigationHandler` 接口。
- Feature 模块通过 `@Composable fun registerGraph(...)` 暴露路由。

```kotlin
interface NavigationDestination {
    val route: String
    fun register(navGraphBuilder: NavGraphBuilder, navController: NavController)
}

class ProfileDestination @Inject constructor(): NavigationDestination {
    override val route = "profile"
    override fun register(navGraphBuilder: NavGraphBuilder, navController: NavController) {
        navGraphBuilder.composable(route) { ProfileRoute() }
    }
}
```

## 内存与状态保存

- 使用 `navController.currentBackStackEntry?.savedStateHandle` 在页面间传递结果。

```kotlin
navController.currentBackStackEntry?.savedStateHandle?.set("result", result)
navController.popBackStack()

val result = navController.currentBackStackEntry?.savedStateHandle?.getStateFlow("result", null)
```

## 常见问题

| 问题         | 原因                     | 解决方案                                |
| ------------ | ------------------------ | --------------------------------------- |
| 返回栈错乱   | 未设置 `launchSingleTop` | 在 `navigate` 中配置 `launchSingleTop`  |
| 参数解析失败 | 参数类型不匹配           | 使用 `navArgument` 指定类型             |
| 多模块冲突   | 路由名称重复             | 采用命名空间前缀或封装 `Destination` 类 |

## 总结

1. Compose Navigation 提供声明式路由配置，配合 sealed class 管理更清晰。
2. 深链需同时配置 Manifest 与导航逻辑，确保参数安全解析。
3. 在多模块项目中抽象导航接口，避免直接引用具体实现，使路由体系可扩展、可维护。
