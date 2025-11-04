---
description: 介绍 Kotlin 在 Wear OS 与手机端协同开发中的 Compose 布局、数据同步与测试方法。
tag:
  - Kotlin
  - Compose
  - WearOS
sidebar: true
---

# Android Kotlin Wear OS 与 Compose 多端协同

## 开发环境

- Android Studio Iguana+。
- Wear OS SDK、Emulator。
- `compose-material3` + `compose-material3-windowsizeclass`。

Gradle 配置：

```kotlin
dependencies {
    implementation("androidx.wear.compose:compose-foundation:1.3.0")
    implementation("androidx.wear.compose:compose-material:1.3.0")
    implementation("androidx.wear.tiles:tiles:1.3.0")
    implementation("androidx.wear.tiles:tiles-material:1.3.0")
}
```

## Compose 布局差异

- Wear OS 使用 `ScalingLazyColumn`、`TimeText` 等组件。
- 圆形屏幕需关注安全区域与滚动交互。

```kotlin
@Composable
fun WearHomeScreen() {
    Scaffold(
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
        positionIndicator = { PositionIndicator() }
    ) {
        ScalingLazyColumn {
            item { Text("心率", style = MaterialTheme.typography.titleMedium) }
            items(steps) { step -> Text(step.toString()) }
        }
    }
}
```

## 手机与手表协同

- 使用 `Data Layer API`（`DataClient`、`MessageClient`）。
- 借助 `Kotlinx Serialization` 统一数据格式。

```kotlin
@Serializable
data class HealthSnapshot(val steps: Int, val heartRate: Int)

suspend fun sendSnapshot(client: MessageClient, nodeId: String, snapshot: HealthSnapshot) {
    val payload = Json.encodeToString(snapshot).encodeToByteArray()
    client.sendMessage(nodeId, "/health", payload)
}
```

手表端接收：

```kotlin
class WearMessageService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path == "/health") {
            val snapshot = Json.decodeFromString<HealthSnapshot>(String(messageEvent.data))
            scope.launch { repository.update(snapshot) }
        }
    }
}
```

## Tiles 与 Complications

```kotlin
class StepsTileService : TileService() {
    override fun onTileRequest(requestParams: TileRequest): ListenableFuture<Tile> {
        val timeline = Timeline.Builder()
            .addTimelineEntry(TimelineEntry.Builder().setLayout(stepsLayout()).build())
            .build()
        return Futures.immediateFuture(Tile.Builder().setResourcesVersion("1").setTimeline(timeline).build())
    }
}
```

## 测试与调试

- 使用 Wear OS Emulator Pairing。
- `adb -e logcat` 查看手表日志。
- 使用 Macrobenchmark 测量功耗与启动。

## 性能与功耗

- 减少不必要的重绘，使用 `remember` 缓存状态。
- 控制数据同步频率，提供省电模式。
- 使用 `WorkManager` + `NetworkType.NOT_ROAMING` 控制同步条件。

## 常见问题

| 问题         | 原因                                   | 解决方案                                            |
| ------------ | -------------------------------------- | --------------------------------------------------- |
| 数据延迟     | 蓝牙或网络连接不稳定                   | 在发送前检测节点连接状态，增加重试                  |
| UI 截断      | 圆形屏幕未处理安全区域                 | 使用 `Modifier.fillMaxSize().padding(innerPadding)` |
| 编译依赖冲突 | Wear Compose 与手机 Compose 版本不一致 | 对齐 Compose BOM 版本                               |

## 总结

动手表端 Compose 需要适应圆形屏幕与功耗限制。通过 Data Layer API 实现手机与手表数据同步，结合 Tiles 提供一目了然的信息展示。合理规划同步频率与布局，可实现跨端一致体验。
