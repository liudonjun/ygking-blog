---
description: 汇总 Kotlin 在 Jetpack Compose 中的核心用法，从基础组件到状态管理、SideEffect 与性能优化。
tag:
  - Kotlin
  - Compose
  - Android
sidebar: true
---

# Android Kotlin Jetpack Compose 实战指南

## 基本组件与函数签名

```kotlin
@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(text = "Hello $name!", modifier = modifier.padding(16.dp))
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    Greeting("Android")
}
```

- `@Composable` 标记函数可在 Compose 运行时参与 UI 组合。
- 参数默认不可变，建议使用 `modifier` 提供扩展能力。

## 状态管理

### remember 与 mutableStateOf

```kotlin
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) {
        Text("点击次数：$count")
    }
}
```

- `remember` 在重组过程中保留状态。
- 使用 `by` 委托简化读写。

### rememberSaveable

```kotlin
var text by rememberSaveable { mutableStateOf("") }
```

- 可在配置变更（旋转）后保留状态。

### StateFlow + collectAsStateWithLifecycle

```kotlin
@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    when (state) {
        is UiState.Loading -> Loading()
        is UiState.Success -> ArticleList(state.data)
        is UiState.Error -> ErrorView(state.error)
    }
}
```

## 布局与 Modifier

- 常用组合：`Column`、`Row`、`Box`。
- 使用 `Modifier.padding()`、`Modifier.fillMaxWidth()` 等链式调用。

```kotlin
val listModifier = Modifier
    .fillMaxSize()
    .background(MaterialTheme.colorScheme.background)

LazyColumn(modifier = listModifier) {
    items(articles) { article -> ArticleItem(article) }
}
```

## 副作用处理

| API                    | 用途                           |
| ---------------------- | ------------------------------ |
| `LaunchedEffect`       | 启动协程执行一次性任务         |
| `DisposableEffect`     | 注册/注销监听                  |
| `rememberUpdatedState` | 捕捉最新 lambda，避免闭包问题  |
| `SideEffect`           | 在每次成功重组后与外部世界同步 |

```kotlin
@Composable
fun AutoRefresh(onRefresh: () -> Unit) {
    val latestOnRefresh by rememberUpdatedState(onRefresh)
    LaunchedEffect(Unit) {
        while (true) {
            delay(5_000)
            latestOnRefresh()
        }
    }
}
```

## 动画

```kotlin
val alpha by animateFloatAsState(
    targetValue = if (visible) 1f else 0f,
    animationSpec = tween(durationMillis = 300)
)

AnimatedVisibility(visible = expanded) {
    Text("详情内容")
}
```

## Compose + Navigation

```kotlin
@Composable
fun AppNavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(navController, startDestination = "home") {
        composable("home") { HomeScreen(onNavigate = { navController.navigate("detail/$it") }) }
        composable(
            route = "detail/{id}",
            arguments = listOf(navArgument("id") { type = NavType.LongType })
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getLong("id") ?: return@composable
            DetailScreen(id)
        }
    }
}
```

## 性能优化

- 避免在 Composable 中执行耗时操作，使用 `LaunchedEffect` 或 ViewModel。
- 将可组合函数 `@Stable` 或使用 `immutable` 类型，减少不必要重组。
- 使用 `remember` 缓存昂贵对象，如 `Painter`、`CoroutineScope`。
- 在 `LazyList` 中为 item 提供稳定的 `key`。

```kotlin
LazyColumn {
    items(items = messages, key = { it.id }) { message ->
        MessageItem(message)
    }
}
```

## 测试策略

```kotlin
@RunWith(AndroidJUnit4::class)
class HomeScreenTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun showLoading() {
        composeRule.onNodeWithText("加载中").assertExists()
    }
}
```

- 使用 `createComposeRule`/`createAndroidComposeRule` 构建测试环境。
- 调用 `onNode` 系列方法查找组件、断言状态。

## 常见问题

| 问题     | 原因                                    | 解决方案                            |
| -------- | --------------------------------------- | ----------------------------------- |
| 重组频繁 | 状态对象不稳定                          | 使用 `remember`、`derivedStateOf`   |
| 滚动跳动 | LazyList item 未提供稳定 key            | 在 `items` 中提供唯一 key           |
| 状态丢失 | 使用 `remember` 而非 `rememberSaveable` | 对需持久状态使用 `rememberSaveable` |

## 总结

1. Jetpack Compose 通过函数式 UI 与 Kotlin 状态管理提升开发效率。
2. 熟练掌握 `remember`、`Flow`、`SideEffect` 等 API，可构建响应式界面。
3. 关注性能与测试，才能在大型项目中稳定落地 Compose。

下一篇将探讨 Kotlin 在架构组件与多模块协同中的实践。
