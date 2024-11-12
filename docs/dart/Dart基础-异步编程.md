---
title: Dart 异步编程详解
description: 详细介绍 Dart 语言中的异步编程机制,包括 Future、async/await 和 Stream。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 异步编程详解

## Future 基础

### Future 创建
```dart
Future<String> fetchUserData() {
  return Future.delayed(
    Duration(seconds: 2),
    () => 'User data',
  );
}

// 使用 async 关键字
Future<String> fetchUserData() async {
  await Future.delayed(Duration(seconds: 2));
  return 'User data';
}
```

### Future 链式调用
```dart
Future<void> example() {
  return fetchUserData()
    .then((data) => processData(data))
    .then((result) => saveData(result))
    .catchError((error) => handleError(error));
}
```

## async/await

### 基本用法
```dart
Future<void> loadUserData() async {
  try {
    String data = await fetchUserData();
    var result = await processData(data);
    await saveData(result);
  } catch (e) {
    print('Error: $e');
  }
}
```

### 并行执行
```dart
Future<void> loadMultipleData() async {
  try {
    final results = await Future.wait([
      fetchUserData(),
      fetchSettings(),
      fetchPreferences(),
    ]);
    print('All data loaded: $results');
  } catch (e) {
    print('Error: $e');
  }
}
```

## Stream

### Stream 创建
```dart
Stream<int> countStream(int max) async* {
  for (int i = 1; i <= max; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}

// StreamController
StreamController<String> controller = StreamController<String>();
```

### Stream 监听
```dart
void listenToStream() async {
  Stream<int> stream = countStream(5);
  
  // 单订阅
  await for (int value in stream) {
    print(value);
  }
  
  // 使用 listen
  stream.listen(
    (data) => print(data),
    onError: (error) => print('Error: $error'),
    onDone: () => print('Stream completed'),
  );
}
```

## 完整示例

```dart
class DataService {
  // 模拟网络请求
  Future<Map<String, dynamic>> fetchUserProfile(String userId) async {
    await Future.delayed(Duration(seconds: 2));
    return {
      'id': userId,
      'name': 'John Doe',
      'email': 'john@example.com',
    };
  }
  
  Future<List<String>> fetchUserPosts(String userId) async {
    await Future.delayed(Duration(seconds: 1));
    return [
      'Post 1',
      'Post 2',
      'Post 3',
    ];
  }
  
  Stream<String> userActivityStream() async* {
    while (true) {
      await Future.delayed(Duration(seconds: 1));
      yield DateTime.now().toString();
    }
  }
}

class UserBloc {
  final DataService _dataService;
  final _activityController = StreamController<String>();
  
  UserBloc(this._dataService);
  
  Stream<String> get activityStream => _activityController.stream;
  
  // 加载用户数据
  Future<void> loadUserData(String userId) async {
    try {
      // 并行加载数据
      final results = await Future.wait([
        _dataService.fetchUserProfile(userId),
        _dataService.fetchUserPosts(userId),
      ]);
      
      final profile = results[0] as Map<String, dynamic>;
      final posts = results[1] as List<String>;
      
      print('User Profile: $profile');
      print('User Posts: $posts');
    } catch (e) {
      print('Error loading user data: $e');
    }
  }
  
  // 监听用户活动
  void startActivityMonitoring() {
    _dataService.userActivityStream().listen(
      (activity) {
        _activityController.add('New activity: $activity');
      },
      onError: (error) {
        _activityController.addError('Error monitoring activity: $error');
      },
    );
  }
  
  void dispose() {
    _activityController.close();
  }
}

void main() async {
  final dataService = DataService();
  final userBloc = UserBloc(dataService);
  
  // 加载用户数据
  await userBloc.loadUserData('123');
  
  // 监听用户活动
  userBloc.activityStream.listen(
    (activity) => print(activity),
    onError: (error) => print('Error: $error'),
  );
  
  userBloc.startActivityMonitoring();
  
  // 等待5秒后结束
  await Future.delayed(Duration(seconds: 5));
  userBloc.dispose();
}
```

## 错误处理

### Future 错误处理
```dart
Future<void> handleErrors() async {
  try {
    await riskyOperation();
  } catch (e) {
    print('Error caught: $e');
  } finally {
    print('Cleanup');
  }
}
```

### Stream 错误处理
```dart
Stream<int> handleStreamErrors() async* {
  try {
    await for (var value in sourceStream()) {
      if (value < 0) {
        throw Exception('Negative value');
      }
      yield value;
    }
  } catch (e) {
    print('Error in stream: $e');
  }
}
```

## 最佳实践

1. 使用 async/await 而不是 then
2. 正确处理错误和异常
3. 及时关闭 StreamController
4. 避免过度使用异步操作
5. 合理使用并行执行

## 注意事项

1. 不要忽略返回的 Future
2. 注意 Stream 的订阅类型
3. 处理所有可能的错误
4. 避免死锁和循环等待
5. 合理管理异步资源

## 总结

Dart 的异步编程机制提供了强大而灵活的工具来处理异步操作。通过合理使用 Future、async/await 和 Stream,可以编写出高效、可维护的异步代码。理解并掌握这些知识对于开发高质量的 Flutter 应用至关重要。 