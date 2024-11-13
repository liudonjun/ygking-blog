---
title: Flutter 基础导航详解
description: 详细介绍 Flutter 中的基础导航方法和使用技巧。
tag:
 - Flutter
 - 导航
sidebar: true
---

# Flutter 基础导航详解

## 简介

导航是应用程序中不可或缺的功能，Flutter 提供了简单而强大的导航 API。本文介绍 Flutter 中最基本的导航方法。

## 基本导航

### 页面跳转
```dart
// 跳转到新页面
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => SecondPage(),
  ),
);

// 返回上一页
Navigator.pop(context);
```

### 带返回值的导航
```dart
// 跳转并等待返回值
final result = await Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => SelectionPage(),
  ),
);

// 返回并传值
Navigator.pop(context, 'selected value');
```

## 路由动画

### 自定义转场动画
```dart
Navigator.push(
  context,
  PageRouteBuilder(
    pageBuilder: (context, animation, secondaryAnimation) => SecondPage(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(1.0, 0.0),
          end: Offset.zero,
        ).animate(animation),
        child: child,
      );
    },
  ),
);
```

### 常用转场效果
```dart
// 淡入淡出
FadeTransition(
  opacity: animation,
  child: child,
);

// 缩放
ScaleTransition(
  scale: animation,
  child: child,
);

// 旋转
RotationTransition(
  turns: animation,
  child: child,
);
```

## 完整示例

```dart
class NavigationDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Navigation Demo'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => _navigateToSecondPage(context),
              child: Text('Go to Second Page'),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => _navigateAndWaitForResult(context),
              child: Text('Select an Option'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _navigateToSecondPage(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SecondPage(),
      ),
    );
  }

  Future<void> _navigateAndWaitForResult(BuildContext context) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SelectionPage(),
      ),
    );

    if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Selected: $result')),
      );
    }
  }
}

class SecondPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Second Page'),
      ),
      body: Center(
        child: ElevatedButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Go Back'),
        ),
      ),
    );
  }
}

class SelectionPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Make a Selection'),
      ),
      body: ListView(
        children: [
          ListTile(
            title: Text('Option 1'),
            onTap: () => Navigator.pop(context, 'Option 1'),
          ),
          ListTile(
            title: Text('Option 2'),
            onTap: () => Navigator.pop(context, 'Option 2'),
          ),
          ListTile(
            title: Text('Option 3'),
            onTap: () => Navigator.pop(context, 'Option 3'),
          ),
        ],
      ),
    );
  }
}
```

## 最佳实践

1. 合理使用 pop 和 push
2. 处理返回值
3. 注意内存管理
4. 使用适当的动画
5. 处理手势返回

## 注意事项

1. 避免过多层级嵌套
2. 注意路由栈管理
3. 处理页面状态保持
4. 合理使用转场动画
5. 注意性能影响

## 总结

基础导航是 Flutter 应用开发中的重要组成部分。通过合理使用 Navigator 的 push 和 pop 方法，可以实现流畅的页面跳转效果。掌握基础导航对于开发高质量的 Flutter 应用至关重要。 