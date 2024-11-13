---
title: Dart Stream 和 Future 详解
description: 详细介绍 Dart 语言中的 Stream 和 Future 机制,包括创建、转换、组合等操作。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart Stream 和 Future 详解

## Future 基础

### Future 创建
```dart
// 直接创建
Future<String> future = Future.value('Hello');

// 延迟创建
Future<String> delayed = Future.delayed(
  Duration(seconds: 2),
  () => 'Delayed Hello',
);

// 使用 async
Future<String> asyncFuture() async {
  await Future.delayed(Duration(seconds: 1));
  return 'Async Hello';
}
```

### Future 操作
```dart
Future<String> fetchData() async {
  // 模拟网络请求
  await Future.delayed(Duration(seconds: 2));
  return 'Data';
}

// then 链式调用
fetchData()
    .then((data) => data.toUpperCase())
    .then((upper) => 'Processed: $upper')
    .then(print);

// async/await 使用
Future<void> processData() async {
  final data = await fetchData();
  final upper = data.toUpperCase();
  print('Processed: $upper');
}
```

## Stream 基础

### Stream 创建
```dart
// 使用 async*
Stream<int> countStream(int max) async* {
  for (int i = 1; i <= max; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}

// 使用 StreamController
StreamController<String> controller = StreamController<String>();
Stream<String> stream = controller.stream;

// 广播流
StreamController<String> broadcastController = StreamController.broadcast();
```

### Stream 监听
```dart
Stream<int> numbers = countStream(5);

// 使用 await for
Future<void> printNumbers() async {
  await for (final number in numbers) {
    print(number);
  }
}

// 使用 listen
numbers.listen(
  (data) => print('Data: $data'),
  onError: (error) => print('Error: $error'),
  onDone: () => print('Done'),
);
```

## Stream 转换和操作

### 转换操作
```dart
Stream<int> numbers = countStream(5);

// map 转换
Stream<String> strings = numbers.map((n) => 'Number $n');

// where 过滤
Stream<int> evenNumbers = numbers.where((n) => n.isEven);

// expand 展开
Stream<int> expanded = numbers.expand((n) => [n, n * 2]);

// asyncMap 异步转换
Stream<String> asyncMapped = numbers.asyncMap(
  (n) async {
    await Future.delayed(Duration(milliseconds: 500));
    return 'Processed $n';
  },
);
```

### 组合操作
```dart
// 合并流
Stream<int> combined = StreamGroup.merge([
  countStream(3),
  Stream.periodic(Duration(seconds: 1), (i) => i).take(3),
]);

// 连接流
Stream<int> concatenated = numbers.asyncExpand((n) {
  return Stream.fromIterable([n, n * 10]);
});
```

## 完整示例

```dart
class DataService {
  final _controller = StreamController<String>();
  
  Stream<String> get dataStream => _controller.stream;
  
  // 模拟数据源
  void startGeneratingData() async {
    try {
      for (int i = 1; i <= 5; i++) {
        await Future.delayed(Duration(seconds: 1));
        _controller.add('Data packet $i');
      }
      _controller.close();
    } catch (e) {
      _controller.addError(e);
    }
  }
  
  // 模拟数据处理
  Stream<String> processData(Stream<String> input) async* {
    await for (final data in input) {
      yield 'Processed: ${data.toUpperCase()}';
    }
  }
  
  // 模拟批处理
  Stream<List<String>> batchProcess(Stream<String> input) {
    return input.bufferCount(2);
  }
  
  Future<void> dispose() async {
    await _controller.close();
  }
}

class DataProcessor {
  final DataService _service;
  
  DataProcessor(this._service);
  
  void start() {
    // 开始生成数据
    _service.startGeneratingData();
    
    // 处理数据流
    _service.dataStream
        .transform(StreamTransformer.fromHandlers(
          handleData: (data, sink) {
            sink.add('Transformed: $data');
          },
          handleError: (error, stackTrace, sink) {
            print('Error: $error');
            sink.addError('Processed error: $error');
          },
          handleDone: (sink) {
            print('Stream completed');
            sink.close();
          },
        ))
        .listen(
          print,
          onError: (error) => print('Error in stream: $error'),
          onDone: () => print('Processing completed'),
        );
  }
  
  // 批量处理示例
  void processBatches() {
    _service.dataStream
        .bufferCount(2)
        .listen(
          (batch) => print('Processing batch: $batch'),
          onError: (error) => print('Batch error: $error'),
          onDone: () => print('Batch processing completed'),
        );
  }
}

void main() async {
  final service = DataService();
  final processor = DataProcessor(service);
  
  // 启动处理
  processor.start();
  
  // 等待处理完成
  await Future.delayed(Duration(seconds: 6));
  
  // 清理资源
  await service.dispose();
}
```

## 高级用法

### 自定义 StreamTransformer
```dart
class ValidationTransformer extends StreamTransformerBase<String, String> {
  @override
  Stream<String> bind(Stream<String> stream) {
    return stream.map((data) {
      if (data.isEmpty) {
        throw ValidationError('Data cannot be empty');
      }
      return data.trim();
    });
  }
}

// 使用示例
stream.transform(ValidationTransformer())
    .listen(print, onError: print);
```

### 周期性流
```dart
Stream.periodic(Duration(seconds: 1), (i) => i)
    .take(5)
    .listen(print);
```

## 最佳实践

1. 及时关闭 StreamController
2. 合理使用广播流
3. 注意内存泄漏
4. 处理所有错误
5. 使用适当的背压策略

## 注意事项

1. 避免多次监听单订阅流
2. 正确处理流的生命周期
3. 合理使用转换操作
4. 注意异步操作的顺序
5. 处理流的取消操作

## 总结

Stream 和 Future 是 Dart 异步编程的核心机制,掌握它们的使用对于开发高质量的 Flutter 应用至关重要。通过合理使用这些特性,可以构建出响应式、高效的应用程序。 