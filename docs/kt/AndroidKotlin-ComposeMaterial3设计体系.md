---
description: 介绍 Jetpack Compose Material 3 的主题系统、动态配色、组件库与设计一致性实践。
tag:
  - Kotlin
  - Compose
  - Material3
sidebar: true
---

# Android Kotlin Compose Material 3 设计体系

## Material 3 核心概念

- 支持动态颜色（Monet）
- 强调自适应布局、个性化与无障碍
- 组件采用新的命名与交互模式（如 `FilledTonalButton`）

## 主题配置

```kotlin
@Composable
fun AppTheme(content: @Composable () -> Unit) {
    val context = LocalContext.current
    val colorScheme = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        dynamicDarkColorScheme(context)
    } else {
        darkColorScheme(
            primary = Color(0xFF4CAF50),
            secondary = Color(0xFF80CBC4)
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
```

## Typography 与 Shapes

```kotlin
val Typography = Typography(
    titleLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp
    ),
    bodyMedium = TextStyle(fontSize = 14.sp)
)

val Shapes = Shapes(
    small = RoundedCornerShape(8.dp),
    large = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
)
```

## Material 3 组件示例

```kotlin
@Composable
fun HomeTopBar(onMenuClick: () -> Unit) {
    CenterAlignedTopAppBar(
        title = { Text("Home") },
        navigationIcon = {
            IconButton(onClick = onMenuClick) {
                Icon(Icons.AutoMirrored.Filled.Menu, contentDescription = "Menu")
            }
        },
        actions = {
            IconButton(onClick = { }) {
                Icon(Icons.Default.Notifications, contentDescription = "Notifications")
            }
        }
    )
}

@Composable
fun ConfirmButton(onClick: () -> Unit) {
    FilledTonalButton(onClick = onClick) {
        Text("确认")
    }
}
```

## 自定义颜色角色

```kotlin
val ExtendedColors = staticCompositionLocalOf { ExtendedColorScheme() }

data class ExtendedColorScheme(val warning = Color(0xFFF57C00))

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    val extended = ExtendedColorScheme()
    CompositionLocalProvider(ExtendedColors provides extended) {
        MaterialTheme(content = content)
    }
}

@Composable
fun WarningText(text: String) {
    Text(text, color = ExtendedColors.current.warning)
}
```

## 动态颜色策略

- Android 12+ 可使用系统壁纸色板。
- 对旧设备提供 fallback 颜色。
- 在暗色模式下手动调整对比度。

## 设计规范协作

| 角色   | 工作                         |
| ------ | ---------------------------- |
| 设计师 | 提供 Material 3 Design Token |
| 开发者 | 将 Token 映射到主题与组件    |
| QA     | 测试深色模式、字体缩放等     |

### Design Token 示例

```
--md-sys-color-primary = #6750A4
--md-sys-typescale-title-large-font-family = "Roboto"
```

通过脚本转换为 Kotlin 常量。

## 与 XML 协同

- Compose 可嵌入 View（`AndroidView`）。
- 对于仍采用 XML 的模块，使用 MaterialComponents 3 主题保证一致性。

## 常见问题

| 问题           | 原因                    | 解决方案                                           |
| -------------- | ----------------------- | -------------------------------------------------- |
| 动态色失效     | 设备版本低于 Android 12 | 提供静态 `colorScheme` 兜底                        |
| 组件样式不一致 | 未覆盖所有组件样式      | 使用 `MaterialTheme` + `CompositionLocal` 统一样式 |
| 字体被覆盖     | 多处定义 Typography     | 集中在单个文件中维护 Typography 配置               |

## 总结

Material 3 为 Compose 带来统一的设计语言。通过主题、颜色和组件配置，结合动态颜色与 Design Token，可以为不同品牌与设备打造一致、个性化的视觉体验。与设计团队保持紧密协作，是成功落地 Material 3 的关键。
