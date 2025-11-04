---
description: 介绍 Jetpack Compose 应用的无障碍适配策略，包括语义、对比度、动态字体与 TalkBack 支持。
tag:
  - Kotlin
  - Compose
  - 无障碍
sidebar: true
---

# Android Kotlin Compose 可访问性与无障碍

## 可访问性目标

- 支持 TalkBack 阅读与焦点导航。
- 满足动态字体尺寸、色彩对比度要求。
- 提供语义信息与操作提示。

## 语义描述

```kotlin
@Composable
fun AccessibleButton(onClick: () -> Unit, enabled: Boolean) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier.semantics {
            contentDescription = "提交订单"
            stateDescription = if (enabled) "可点击" else "不可用"
        }
    ) {
        Text("提交")
    }
}
```

### 隐藏内容

```kotlin
Modifier.clearAndSetSemantics { }
```

- 用于视觉上展示但无语义的装饰元素。

## 焦点导航

```kotlin
val focusRequester = remember { FocusRequester() }

LaunchedEffect(Unit) {
    focusRequester.requestFocus()
}

TextField(
    value = text,
    onValueChange = { text = it },
    modifier = Modifier
        .focusRequester(focusRequester)
        .focusProperties { next = FocusRequester.Default }
)
```

## 动态字体与布局

- 使用 `sp` 与 `TextUnit.Unspecified`。
- 通过 `LocalDensity` 响应字体缩放。

```kotlin
val fontScale = LocalDensity.current.fontScale
val adaptivePadding = 16.dp * fontScale

Text(
    text = title,
    modifier = Modifier.padding(horizontal = adaptivePadding)
)
```

## 色彩对比

- Material 3 默认提供符合 WCAG 的调色板。
- 对自定义颜色使用 `ContrastChecker` 工具。

```kotlin
MaterialTheme(colorScheme = dynamicColorScheme(context)) {
    // composables
}
```

## TalkBack 交互

| 场景         | 处理方式                                      |
| ------------ | --------------------------------------------- |
| 分页内容     | `PagerState` + announce 当前页                |
| 动画提示     | 使用 `Snackbar` 或 `announceForAccessibility` |
| 手势操作提示 | 提供 `contentDescription` 说明                |

```kotlin
val context = LocalContext.current
LaunchedEffect(selectedTab) {
    context.getSystemService(AccessibilityManager::class.java)
        ?.let { manager ->
            if (manager.isEnabled) {
                manager.interrupt()
                manager.sendAccessibilityEvent(AccessibilityEvent.obtain().apply {
                    eventType = AccessibilityEvent.TYPE_ANNOUNCEMENT
                    text.add("切换到第${selectedTab + 1}个标签")
                })
            }
        }
}
```

## 辅助技术调试

- 使用 Android Studio 的 `Accessibility Scanner`。
- 开启 TalkBack，逐屏体验。
- 通过 `uiautomatorviewer` 检查节点属性。

## 常见问题

| 问题              | 原因                     | 解决方案                                      |
| ----------------- | ------------------------ | --------------------------------------------- |
| TalkBack 报读错误 | 缺少语义描述或描述不准确 | 使用 `semantics { contentDescription = ... }` |
| 焦点丢失          | 动态视图未设置焦点顺序   | 使用 `focusProperties`、`focusRequester`      |
| 对比度不足        | 自定义颜色亮度不足       | 调整色值或启用高对比模式                      |

## 总结

1. Compose 提供语义树，合理设置 `semantics` 可大幅提升无障碍体验。
2. 关注字体缩放、对比度与焦点导航，确保用户在不同环境下都能顺畅操作。
3. 将无障碍检查纳入测试流程，持续优化，使应用符合行业法规与用户期望。
