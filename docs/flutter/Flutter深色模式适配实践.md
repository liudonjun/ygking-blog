---
description: 本文详细介绍Flutter深色模式的适配实践，包括主题切换机制、自定义组件适配、动态切换等内容，帮助开发者实现完善的深色模式支持。
tag:
  - Flutter
  - 主题切换
  - 深色模式
sticky: 1
sidebar: true
---

# Flutter深色模式适配实践

## 简介

深色模式（Dark Mode）已成为现代应用的标配功能，本文将详细介绍如何在Flutter应用中实现深色模式支持，包括系统主题跟随、手动切换、自定义组件适配等内容。

## 基础配置

### 1. 定义主题数据

```dart
import 'package:flutter/material.dart';

class AppTheme {
  static final ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    primarySwatch: Colors.blue,
    scaffoldBackgroundColor: Colors.white,
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.blue,
      foregroundColor: Colors.white,
    ),
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: Colors.black87),
      bodyMedium: TextStyle(color: Colors.black87),
    ),
  );

  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primarySwatch: Colors.blue,
    scaffoldBackgroundColor: Colors.grey[900],
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.grey[850],
      foregroundColor: Colors.white,
    ),
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: Colors.white70),
      bodyMedium: TextStyle(color: Colors.white70),
    ),
  );
}
```

### 2. 主题状态管理

```dart
import 'package:flutter/material.dart';

class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  bool get isDarkMode {
    if (_themeMode == ThemeMode.system) {
      return WidgetsBinding.instance.window.platformBrightness == Brightness.dark;
    }
    return _themeMode == ThemeMode.dark;
  }

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }
}
```

### 3. 应用主题配置

```dart
import 'package:provider/provider.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            home: HomePage(),
          );
        },
      ),
    );
  }
}
```

## 自定义组件适配

### 1. 颜色适配

```dart
class AdaptiveColors {
  static Color getBackgroundColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.grey[900]!
        : Colors.white;
  }

  static Color getTextColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.white70
        : Colors.black87;
  }

  static Color getCardColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.grey[850]!
        : Colors.white;
  }
}
```

### 2. 自定义组件示例

```dart
class AdaptiveCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;

  const AdaptiveCard({
    Key? key,
    required this.child,
    this.padding = const EdgeInsets.all(16.0),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AdaptiveColors.getCardColor(context),
        borderRadius: BorderRadius.circular(8.0),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.black26
                : Colors.grey.withOpacity(0.1),
            blurRadius: 4.0,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}
```

## 主题切换实现

### 1. 主题切换按钮

```dart
class ThemeToggleButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(
        Provider.of<ThemeProvider>(context).isDarkMode
            ? Icons.light_mode
            : Icons.dark_mode,
      ),
      onPressed: () {
        var provider = Provider.of<ThemeProvider>(context, listen: false);
        provider.setThemeMode(
          provider.isDarkMode ? ThemeMode.light : ThemeMode.dark,
        );
      },
    );
  }
}
```

### 2. 主题设置页面

```dart
class ThemeSettingsPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('主题设置')),
      body: Consumer<ThemeProvider>(
        builder: (context, provider, child) {
          return ListView(
            children: [
              RadioListTile<ThemeMode>(
                title: Text('跟随系统'),
                value: ThemeMode.system,
                groupValue: provider.themeMode,
                onChanged: (value) => provider.setThemeMode(value!),
              ),
              RadioListTile<ThemeMode>(
                title: Text('浅色模式'),
                value: ThemeMode.light,
                groupValue: provider.themeMode,
                onChanged: (value) => provider.setThemeMode(value!),
              ),
              RadioListTile<ThemeMode>(
                title: Text('深色模式'),
                value: ThemeMode.dark,
                groupValue: provider.themeMode,
                onChanged: (value) => provider.setThemeMode(value!),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

## 图片资源适配

### 1. 图片资源管理

```dart
class AdaptiveImage {
  static ImageProvider getImage(BuildContext context, String name) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AssetImage('assets/images/${isDark ? "dark" : "light"}/$name');
  }
}
```

### 2. 使用示例

```dart
Image(
  image: AdaptiveImage.getImage(context, 'background.png'),
  fit: BoxFit.cover,
)
```

## 动态切换优化

### 1. 平滑过渡动画

```dart
class ThemeAnimationWrapper extends StatelessWidget {
  final Widget child;

  const ThemeAnimationWrapper({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AnimatedTheme(
      data: Theme.of(context),
      duration: Duration(milliseconds: 200),
      child: child,
    );
  }
}
```

### 2. 主题切换回调

```dart
class ThemeAwareWidget extends StatefulWidget {
  final Widget Function(BuildContext context, bool isDark) builder;

  const ThemeAwareWidget({Key? key, required this.builder}) : super(key: key);

  @override
  _ThemeAwareWidgetState createState() => _ThemeAwareWidgetState();
}

class _ThemeAwareWidgetState extends State<ThemeAwareWidget> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // 主题变化时的处理逻辑
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return widget.builder(context, isDark);
  }
}
```

## 最佳实践

### 1. 主题配置分离

- 将主题配置抽离到单独的配置文件
- 使用常量定义颜色值和主题参数
- 保持主题配置的一致性

### 2. 性能优化

- 避免频繁切换主题
- 合理使用缓存机制
- 优化资源加载策略

### 3. 用户体验

- 提供平滑的切换动画
- 保存用户主题偏好
- 提供预览功能

### 4. 测试建议

- 深浅色模式下的UI测试
- 动态切换场景测试
- 不同设备适配测试

## 总结

完善的深色模式支持能够：

1. 提升用户体验
2. 减少用户视觉疲劳
3. 适应不同场景需求
4. 展现应用专业度

通过合理的架构设计和优化措施，可以实现：

- 流畅的主题切换
- 统一的视觉风格
- 良好的扩展性
- 优秀的用户体验