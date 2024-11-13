---
title: Flutter 命名路由详解
description: 详细介绍 Flutter 中的命名路由机制和使用方法。
tag:
 - Flutter
 - 导航
sidebar: true
---

# Flutter 命名路由详解

## 简介

命名路由是一种通过字符串名称来标识和导航到页面的机制。它可以让路由管理更加清晰和集中。

## 基本配置

### 注册路由
```dart
MaterialApp(
  // 注册路由表
  routes: {
    '/': (context) => HomePage(),
    '/login': (context) => LoginPage(),
    '/settings': (context) => SettingsPage(),
    '/profile': (context) => ProfilePage(),
  },
  // 设置初始路由
  initialRoute: '/',
  // 处理未知路由
  onUnknownRoute: (settings) {
    return MaterialPageRoute(
      builder: (context) => NotFoundPage(),
    );
  },
);
```

### 基本导航
```dart
// 导航到命名路由
Navigator.pushNamed(context, '/login');

// 替换当前路由
Navigator.pushReplacementNamed(context, '/home');

// 清空路由栈并导航
Navigator.pushNamedAndRemoveUntil(
  context,
  '/home',
  (route) => false,
);
```

## 路由参数

### 传递参数
```dart
// 导航时传递参数
Navigator.pushNamed(
  context,
  '/detail',
  arguments: {
    'id': '123',
    'title': 'Product Detail',
  },
);

// 接收参数
class DetailPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map;
    return Scaffold(
      appBar: AppBar(
        title: Text(args['title']),
      ),
      body: Center(
        child: Text('ID: ${args['id']}'),
      ),
    );
  }
}
```

## 完整示例

```dart
// 路由配置
class AppRoutes {
  static const String home = '/';
  static const String login = '/login';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String detail = '/detail';
  
  static Map<String, WidgetBuilder> get routes => {
    home: (context) => HomePage(),
    login: (context) => LoginPage(),
    profile: (context) => ProfilePage(),
    settings: (context) => SettingsPage(),
    detail: (context) => DetailPage(),
  };
  
  static Route<dynamic>? onUnknownRoute(RouteSettings settings) {
    return MaterialPageRoute(
      builder: (context) => NotFoundPage(),
    );
  }
}

// 主应用
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Named Routes Demo',
      routes: AppRoutes.routes,
      initialRoute: AppRoutes.home,
      onUnknownRoute: AppRoutes.onUnknownRoute,
    );
  }
}

// 首页
class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Home')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.login,
              ),
              child: Text('Go to Login'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.detail,
                arguments: {
                  'id': '123',
                  'title': 'Product Detail',
                },
              ),
              child: Text('View Detail'),
            ),
          ],
        ),
      ),
    );
  }
}

// 详情页
class DetailPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(args['title']),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('ID: ${args['id']}'),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 路由生成

### onGenerateRoute
```dart
MaterialApp(
  onGenerateRoute: (settings) {
    if (settings.name == '/detail') {
      final args = settings.arguments as Map;
      return MaterialPageRoute(
        builder: (context) => DetailPage(
          id: args['id'],
          title: args['title'],
        ),
      );
    }
    return null;
  },
);
```

## 最佳实践

1. 集中管理路由名称
2. 使用常量定义路由路径
3. 合理组织路由配置
4. 处理未知路由
5. 注意参数类型安全

## 注意事项

1. 路由名称要唯一
2. 处理参数为空的情况
3. 注意路由嵌套
4. 合理使用路由生成器
5. 避免过度复杂的路由逻辑

## 总结

命名路由提供了一种更加结构化的页面导航方式。通过合理使用命名路由,可以让应用的导航逻辑更加清晰和易于维护。 