---
description: Flutter 中的错误处理和日志管理是保证应用稳定性和可维护性的关键要素，本文将详细介绍相关概念和最佳实践。
tag:
  - Flutter
  - 基础
sticky: 1
sidebar: true
---

# Flutter 错误处理和日志管理

## 错误处理机制

### 1. try-catch 异常捕获

```dart
try {
  // 可能抛出异常的代码
  final result = await someAsyncOperation();
} catch (e) {
  print('发生错误: $e');
} finally {
  // 清理资源
}
```

### 2. 全局错误处理

```dart
void main() {
  runZonedGuarded(
    () {
      WidgetsFlutterBinding.ensureInitialized();
      FlutterError.onError = (FlutterErrorDetails details) {
        // 处理 Flutter 框架错误
        print('Flutter 错误: ${details.exception}');
      };
      runApp(MyApp());
    },
    (error, stack) {
      // 处理未捕获的异步错误
      print('未捕获的错误: $error\n$stack');
    },
  );
}
```

### 3. Widget 错误边界

```dart
class ErrorBoundary extends StatelessWidget {
  final Widget child;

  ErrorBoundary({required this.child});

  @override
  Widget build(BuildContext context) {
    return ErrorWidget.builder = (FlutterErrorDetails details) {
      return Container(
        padding: EdgeInsets.all(16),
        child: Text('发生错误: ${details.exception}'),
      );
    };
  }
}
```

## 日志管理

### 1. 日志级别

```dart
enum LogLevel {
  debug,
  info,
  warning,
  error,
}

class Logger {
  static void log(LogLevel level, String message) {
    final timestamp = DateTime.now().toIso8601String();
    print('[$timestamp][${level.toString()}] $message');
  }
}
```

### 2. 结构化日志

```dart
class LogEntry {
  final DateTime timestamp;
  final LogLevel level;
  final String message;
  final Map<String, dynamic>? metadata;

  LogEntry({
    required this.level,
    required this.message,
    this.metadata,
  }) : timestamp = DateTime.now();

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'level': level.toString(),
    'message': message,
    'metadata': metadata,
  };
}
```

### 3. 日志存储

```dart
class LogStorage {
  static const String logFileName = 'app.log';

  static Future<void> saveLog(LogEntry entry) async {
    final file = await _getLogFile();
    final logLine = jsonEncode(entry.toJson()) + '\n';
    await file.writeAsString(logLine, mode: FileMode.append);
  }

  static Future<File> _getLogFile() async {
    final directory = await getApplicationDocumentsDirectory();
    return File('${directory.path}/$logFileName');
  }
}
```

## 最佳实践

### 1. 错误处理策略

```dart
class ErrorHandler {
  static void handleError(dynamic error, StackTrace? stackTrace) {
    // 1. 记录错误日志
    Logger.log(LogLevel.error, error.toString());

    // 2. 上报错误到监控平台
    reportErrorToMonitoring(error, stackTrace);

    // 3. 显示用户友好的错误信息
    showErrorDialog();
  }

  static void reportErrorToMonitoring(dynamic error, StackTrace? stackTrace) {
    // 实现错误上报逻辑
  }

  static void showErrorDialog() {
    // 实现错误提示对话框
  }
}
```

### 2. 日志管理策略

```dart
class LogManager {
  static const int maxLogSize = 10 * 1024 * 1024; // 10MB

  static Future<void> initialize() async {
    // 1. 检查日志文件大小
    await _checkLogFileSize();

    // 2. 清理过期日志
    await _cleanupOldLogs();

    // 3. 配置日志记录器
    _configureLogger();
  }

  static Future<void> _checkLogFileSize() async {
    final file = await LogStorage._getLogFile();
    if (await file.length() > maxLogSize) {
      await _rotateLogFile();
    }
  }

  static Future<void> _rotateLogFile() async {
    // 实现日志文件轮转逻辑
  }

  static Future<void> _cleanupOldLogs() async {
    // 清理超过保留期限的日志文件
  }

  static void _configureLogger() {
    // 配置日志记录器
  }
}
```

### 3. 开发调试支持

```dart
class DebugLogger {
  static bool get isDebugMode {
    bool inDebugMode = false;
    assert(inDebugMode = true);
    return inDebugMode;
  }

  static void log(String message) {
    if (isDebugMode) {
      print('[DEBUG] $message');
    }
  }

  static void logNetwork(String url, dynamic response) {
    if (isDebugMode) {
      print('[NETWORK] $url\nResponse: $response');
    }
  }
}
```

## 常见问题和解决方案

### 1. 内存泄漏问题

- 及时关闭日志文件
- 定期清理日志文件
- 控制日志文件大小

### 2. 性能影响

- 异步写入日志
- 批量处理日志
- 合理设置日志级别

### 3. 安全性考虑

- 加密敏感信息
- 控制日志访问权限
- 定期清理敏感日志

## 总结

错误处理和日志管理是 Flutter 应用程序开发中的重要组成部分：

1. 合理的错误处理可以提高应用的稳定性
2. 完善的日志系统有助于问题诊断和分析
3. 良好的实践可以提升应用的可维护性
4. 注意性能和安全性的平衡

通过实施适当的错误处理策略和日志管理机制，我们可以构建更加健壮和可维护的 Flutter 应用程序。