---
description: 本文详细介绍如何在Flutter项目中集成Sentry进行日志收集和错误监控，包括安装配置、使用示例和最佳实践。
tag:
  - Flutter
  - 第三方插件
  - 日志收集
sticky: 1
sidebar: true
---

# Flutter集成Sentry日志收集

## 简介

Sentry是一个开源的实时错误跟踪系统，它能帮助开发者实时监控和修复崩溃。本文将详细介绍如何在Flutter项目中集成Sentry，实现全面的错误监控和日志收集。

## 集成步骤

### 1. 添加依赖

在`pubspec.yaml`文件中添加Sentry依赖：

```yaml
dependencies:
  sentry_flutter: ^7.13.2
```

### 2. 初始化配置

在应用程序入口处初始化Sentry：

```dart
import 'package:flutter/material.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = 'YOUR_DSN_HERE'; // 从Sentry后台获取的DSN
      options.tracesSampleRate = 1.0; // 性能监控采样率
      options.debug = true; // 开发环境建议开启debug模式
    },
    appRunner: () => runApp(MyApp()),
  );
}
```

## 基本使用

### 1. 捕获异常

```dart
try {
  throw Exception('测试异常');
} catch (exception, stackTrace) {
  await Sentry.captureException(
    exception,
    stackTrace: stackTrace,
  );
}
```

### 2. 添加自定义上下文

```dart
// 添加用户信息
Sentry.configureScope((scope) {
  scope.setUser(SentryUser(
    id: 'user-123',
    email: 'user@example.com',
    username: 'username',
  ));
});

// 添加标签
Sentry.configureScope((scope) {
  scope.setTag('page', 'home');
  scope.setTag('network', 'wifi');
});

// 添加额外数据
Sentry.configureScope((scope) {
  scope.setExtra('device_info', {
    'model': 'iPhone 12',
    'os': 'iOS 15.0',
  });
});
```

### 3. 性能监控

```dart
// 监控整个操作的性能
final transaction = Sentry.startTransaction(
  'processOrder',
  'operation',
);

try {
  // 执行耗时操作
  await processOrder();
  transaction.finish(status: SpanStatus.ok());
} catch (exception) {
  transaction.finish(status: SpanStatus.internalError());
  await Sentry.captureException(exception);
}

// 监控特定操作
final span = transaction.startChild(
  'http.client',
  description: '获取用户数据',
);

try {
  await getUserData();
  span.finish(status: SpanStatus.ok());
} catch (exception) {
  span.finish(status: SpanStatus.internalError());
  throw exception;
}
```

## 高级配置

### 1. 过滤敏感信息

```dart
await SentryFlutter.init(
  (options) {
    options.beforeSend = (event, {hint}) {
      // 移除敏感信息
      event.tags?.remove('password');
      event.extra?.remove('creditCard');
      return event;
    };
  },
  appRunner: () => runApp(MyApp()),
);
```

### 2. 自定义事件分组

```dart
await Sentry.captureException(
  exception,
  stackTrace: stackTrace,
  fingerprint: ['unique-error-group'],
);
```

### 3. 离线缓存

```dart
await SentryFlutter.init(
  (options) {
    options.maxCacheItems = 30; // 最大缓存事件数
    options.maxCacheItems = Duration(days: 7); // 缓存时间
  },
  appRunner: () => runApp(MyApp()),
);
```

## 最佳实践

### 1. 错误边界处理

```dart
class ErrorBoundary extends StatelessWidget {
  final Widget child;

  const ErrorBoundary({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ErrorWidget.builder = (FlutterErrorDetails details) {
      Sentry.captureException(
        details.exception,
        stackTrace: details.stack,
      );
      
      return Material(
        child: Center(
          child: Text('发生错误，请稍后重试'),
        ),
      );
    };
  }
}
```

### 2. 网络请求监控

```dart
class SentryHttpClient extends http.BaseClient {
  final http.Client _inner = http.Client();

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final span = Sentry.startTransaction(
      'http.client',
      'http',
      bindToScope: true,
    ).startChild(
      'http.request',
      description: '${request.method} ${request.url}',
    );

    try {
      final response = await _inner.send(request);
      span.finish(status: SpanStatus.ok());
      return response;
    } catch (exception) {
      span.finish(status: SpanStatus.internalError());
      await Sentry.captureException(exception);
      rethrow;
    }
  }
}
```

### 3. 版本管理

```dart
await SentryFlutter.init(
  (options) {
    options.release = 'my-app@1.0.0'; // 应用版本
    options.dist = '1'; // 构建号
    options.environment = 'production'; // 环境标识
  },
  appRunner: () => runApp(MyApp()),
);
```

## 注意事项

1. **DSN安全性**：不要在代码中硬编码DSN，建议通过配置文件或环境变量注入。

2. **性能影响**：合理设置采样率，避免过多的性能监控影响应用性能。

3. **数据隐私**：确保在发送事件前移除所有敏感信息。

4. **调试模式**：开发环境建议开启debug模式，方便排查问题。

5. **错误分组**：合理使用fingerprint功能，避免相似错误产生过多重复事件。

## 总结

Sentry为Flutter应用提供了强大的错误监控和性能追踪能力：

1. 实时错误捕获和报告
2. 详细的错误上下文信息
3. 性能监控和分析
4. 离线事件缓存
5. 自定义事件处理

合理使用这些功能，可以：

- 提高应用稳定性
- 加快问题定位速度
- 优化用户体验
- 提升开发效率