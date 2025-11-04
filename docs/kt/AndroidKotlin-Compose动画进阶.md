---
description: 深入掌握 Jetpack Compose 动画体系，包括动画规格、Gesture 动画与性能优化。
tag:
  - Kotlin
  - Compose
  - 动画
sidebar: true
---

# Android Kotlin Compose 动画进阶

## 动画 API 总览

| API                          | 用途               |
| ---------------------------- | ------------------ |
| `animate*AsState`            | 基于状态的简单动画 |
| `updateTransition`           | 管理多个动画属性   |
| `AnimatedVisibility`         | 显隐动画           |
| `rememberInfiniteTransition` | 循环动画           |
| `Animatable`                 | 手势驱动、物理动画 |
| `AnimationSpec`              | 自定义动画曲线     |

## 复杂场景示例

### 1. 多属性过渡

```kotlin
enum class CardState { Collapsed, Expanded }

@Composable
fun ExpandableCard(state: CardState) {
    val transition = updateTransition(state, label = "cardTransition")
    val height by transition.animateDp(label = "height") {
        if (it == CardState.Expanded) 240.dp else 72.dp
    }
    val alpha by transition.animateFloat(label = "alpha") {
        if (it == CardState.Expanded) 1f else 0f
    }

    Card(modifier = Modifier.height(height)) {
        Text("Details", modifier = Modifier.alpha(alpha))
    }
}
```

### 2. Gesture + Animatable

```kotlin
@Composable
fun SwipeToDismiss(onDismissed: () -> Unit) {
    val offsetX = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()

    Box(modifier = Modifier
        .pointerInput(Unit) {
            detectHorizontalDragGestures(
                onDragEnd = {
                    scope.launch {
                        if (offsetX.value > size.width * 0.4f) {
                            offsetX.animateTo(size.width.toFloat(), tween(200))
                            onDismissed()
                        } else {
                            offsetX.animateTo(0f, spring())
                        }
                    }
                }
            ) { _, dragAmount ->
                scope.launch { offsetX.snapTo((offsetX.value + dragAmount).coerceAtLeast(0f)) }
            }
        }
        .offset { IntOffset(offsetX.value.roundToInt(), 0) }
    ) {
        // content
    }
}
```

### 3. 无限动画

```kotlin
@Composable
fun LoadingDots() {
    val infiniteTransition = rememberInfiniteTransition(label = "loading")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutLinearInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    Box(modifier = Modifier.size(12.dp).background(Color.White.copy(alpha = alpha), CircleShape))
}
```

## AnimationSpec

- `tween`：线性或自定义 Easing。
- `spring`：基于物理参数（阻尼、刚度）。
- `keyframes`：指定时间点。
- `snap`：无过渡。

示例：

```kotlin
val spec = keyframes {
    durationMillis = 1200
    0f at 0 with LinearOutSlowInEasing
    1.2f at 400
    0.95f at 800
    1f at 1200
}
```

## 性能优化

- 避免在动画过程中重新创建 `AnimationSpec`。
- 对昂贵的动画效果使用 `Layer` 或 Canvas。
- 在 `rememberInfiniteTransition` 中控制动画数量。
- 使用 `Macrobenchmark` 衡量动画帧稳定性。

## 动画与导航

```kotlin
composable(
    route = "detail",
    enterTransition = { fadeIn(tween(200)) + slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Left) },
    exitTransition = { fadeOut(tween(200)) }
) { DetailScreen() }
```

## 调试技巧

- `Compose Layout Inspector` 中查看动画参数。
- 使用 `animation = DebugAnimationClockObserver` 手动控制时间轴。
- 开启 `adb shell setprop debug.hwui.show_layers_updates true` 观察重绘区域。

## 常见问题

| 问题     | 原因                      | 解决方案                               |
| -------- | ------------------------- | -------------------------------------- |
| 动画闪烁 | 状态更新频繁或 key 不稳定 | 保证 `remember` 使用正确，设置稳定 key |
| 手势滞后 | Animatable 更新频繁       | 使用 `snapTo` 控制更新频率             |
| 帧率不稳 | 动画逻辑在主线程阻塞      | 将重运算转移到 `Dispatchers.Default`   |

## 总结

Compose 动画体系灵活强大。掌握 Transition、Animatable、InfiniteTransition 等核心 API，可实现复杂交互动效。结合性能调优与调试工具，可以确保动画在不同设备上保持顺滑体验。
