---
title: Dart 错误处理详解
description: 详细介绍 Dart 语言中的错误处理机制,包括异常捕获、自定义异常和错误传播等。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 错误处理详解

## 异常基础

### 抛出异常
```dart
void checkAge(int age) {
  if (age < 0) {
    throw ArgumentError('Age cannot be negative');
  }
  if (age > 120) {
    throw RangeError('Invalid age value');
  }
}
```

### 捕获异常
```dart
try {
  checkAge(-5);
} on ArgumentError catch (e) {
  print('Invalid argument: $e');
} on RangeError catch (e) {
  print('Out of range: $e');
} catch (e) {
  print('Unknown error: $e');
} finally {
  print('Finished checking age');
}
```

## 常见异常类型

### 内置异常
```dart
// 参数错误
throw ArgumentError('Invalid argument');

// 范围错误
throw RangeError('Index out of range');

// 状态错误
throw StateError('Invalid operation');

// 格式错误
throw FormatException('Invalid format');

// 类型错误
throw TypeError();
```

### 自定义异常
```dart
class CustomException implements Exception {
  final String message;
  final DateTime timestamp;
  
  CustomException(this.message) : timestamp = DateTime.now();
  
  @override
  String toString() => 'CustomException: $message (at $timestamp)';
}

void riskyOperation() {
  throw CustomException('Something went wrong');
}
```

## 异步错误处理

### Future 错误处理
```dart
Future<void> fetchData() async {
  try {
    final result = await someAsyncOperation();
    processResult(result);
  } catch (e) {
    print('Error fetching data: $e');
    rethrow; // 重新抛出异常
  }
}

// 使用 catchError
fetchData()
    .then((value) => print('Success'))
    .catchError((error) => print('Error: $error'))
    .whenComplete(() => print('Completed'));
```

### Stream 错误处理
```dart
Stream<int> countStream() async* {
  for (int i = 0; i < 10; i++) {
    if (i == 5) {
      throw Exception('Error at count 5');
    }
    yield i;
  }
}

void handleStream() {
  countStream().listen(
    (data) => print('Data: $data'),
    onError: (error) => print('Error: $error'),
    onDone: () => print('Stream completed'),
  );
}
```

## 完整示例

```dart
class DataService {
  // 模拟网络请求
  Future<Map<String, dynamic>> fetchUserData(String userId) async {
    try {
      await Future.delayed(Duration(seconds: 1));
      
      if (userId.isEmpty) {
        throw ArgumentError('User ID cannot be empty');
      }
      
      if (userId == 'error') {
        throw CustomException('Failed to fetch user data');
      }
      
      return {
        'id': userId,
        'name': 'John Doe',
        'email': 'john@example.com',
      };
    } on ArgumentError catch (e) {
      print('Invalid argument: $e');
      rethrow;
    } on CustomException catch (e) {
      print('Custom error: $e');
      rethrow;
    } catch (e) {
      print('Unknown error: $e');
      rethrow;
    }
  }
  
  // 模拟数据流
  Stream<int> dataStream() async* {
    try {
      for (int i = 0; i < 5; i++) {
        if (i == 3) {
          throw StateError('Error at count 3');
        }
        await Future.delayed(Duration(seconds: 1));
        yield i;
      }
    } catch (e) {
      print('Stream error: $e');
      rethrow;
    }
  }
}

class ErrorHandler {
  static void handleError(Object error, StackTrace stackTrace) {
    print('Error occurred: $error');
    print('Stack trace: $stackTrace');
    
    // 可以在这里添加错误日志记录、错误报告等逻辑
  }
  
  static Future<T> wrap<T>(Future<T> Function() operation) async {
    try {
      return await operation();
    } catch (e, stackTrace) {
      handleError(e, stackTrace);
      rethrow;
    }
  }
}

void main() async {
  final service = DataService();
  
  // 测试异步错误处理
  try {
    await ErrorHandler.wrap(() => service.fetchUserData(''));
  } catch (e) {
    print('Caught error: $e');
  }
  
  // 测试 Stream 错误处理
  service.dataStream().listen(
    (data) => print('Received: $data'),
    onError: (error) => print('Stream error: $error'),
    onDone: () => print('Stream completed'),
  );
}
```

## 错误处理策略

### 1. 错误恢复
```dart
Future<String> fetchDataWithRetry() async {
  for (int i = 0; i < 3; i++) {
    try {
      return await fetchData();
    } catch (e) {
      if (i == 2) rethrow;
      await Future.delayed(Duration(seconds: 1));
    }
  }
  throw StateError('Failed after 3 retries');
}
```

### 2. 错误转换
```dart
Future<T> convertError<T>(Future<T> Function() operation) async {
  try {
    return await operation();
  } on HttpException catch (e) {
    throw CustomException('Network error: ${e.message}');
  } on FormatException catch (e) {
    throw CustomException('Format error: ${e.message}');
  }
}
```

## 最佳实践

1. 只捕获预期的异常
2. 提供有意义的错误信息
3. 合理使用 rethrow
4. 实现全局错误处理
5. 记录错误日志

## 注意事项

1. 避免捕获过于宽泛的异常
2. 不要忽略异常
3. 合理使用 finally 块
4. 注意异步错误处理
5. 保持错误处理的一致性

## 总结

Dart 提供了完善的错误处理机制,通过合理使用 try-catch、自定义异常和错误传播,可以构建更加健壮的应用程序。理解并掌握错误处理对于开发高质量的 Flutter 应用至关重要。 