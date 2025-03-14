---
description: 本文深入介绍 Dart 的并发编程特性，包括 Isolate 通信机制、事件循环等高级主题。
tag:
  - Dart
  - 并发编程
sticky: 1
sidebar: true
---

# Dart 并发编程进阶

## Isolate 通信机制

### 1. SendPort 和 ReceivePort

```dart
void main() async {
  // 创建 ReceivePort 接收消息
  final receivePort = ReceivePort();
  
  // 创建新的 Isolate
  final isolate = await Isolate.spawn(
    workerIsolate,
    receivePort.sendPort,
  );
  
  // 监听消息
  receivePort.listen((message) {
    print('收到消息: $message');
    if (message == 'done') {
      receivePort.close();
      isolate.kill();
    }
  });
}

void workerIsolate(SendPort sendPort) {
  // 发送消息给主 Isolate
  sendPort.send('开始工作');
  
  // 执行耗时操作
  for (var i = 0; i < 5; i++) {
    sendPort.send('处理第 $i 个任务');
  }
  
  sendPort.send('done');
}
```

### 2. 双向通信

```dart
void main() async {
  final mainReceivePort = ReceivePort();
  final completer = Completer();
  
  final isolate = await Isolate.spawn(echo, mainReceivePort.sendPort);
  
  late SendPort workerSendPort;
  
  mainReceivePort.listen((message) {
    if (message is SendPort) {
      workerSendPort = message;
      workerSendPort.send('Hello from main!');
    } else {
      print('Main received: $message');
      completer.complete();
    }
  });
  
  await completer.future;
  mainReceivePort.close();
  isolate.kill();
}

void echo(SendPort mainSendPort) {
  final workerReceivePort = ReceivePort();
  mainSendPort.send(workerReceivePort.sendPort);
  
  workerReceivePort.listen((message) {
    print('Worker received: $message');
    mainSendPort.send('Echo: $message');
  });
}
```

## 事件循环机制

### 1. 事件队列

```dart
Future<void> main() async {
  print('主线程开始');
  
  // 添加微任务
  scheduleMicrotask(() {
    print('微任务执行');
  });
  
  // 添加事件任务
  Future(() {
    print('事件任务执行');
  });
  
  // 延迟任务
  Future.delayed(Duration(seconds: 1), () {
    print('延迟任务执行');
  });
  
  print('主线程结束');
}
```

### 2. Zone 机制

```dart
void main() {
  runZoned(
    () {
      // 在自定义 Zone 中运行代码
      Future(() {
        throw Exception('异步错误');
      });
    },
    onError: (error, stackTrace) {
      print('捕获到错误: $error');
      print('堆栈: $stackTrace');
    },
  );
}
```

## 并发模式

### 1. 生产者-消费者模式

```dart
class WorkQueue {
  final _queue = StreamController<int>();
  final _results = StreamController<String>();
  
  Stream<String> get results => _results.stream;
  
  WorkQueue() {
    // 消费者
    _queue.stream.listen((item) async {
      final result = await _processItem(item);
      _results.add(result);
    });
  }
  
  // 生产者
  void addItem(int item) {
    _queue.add(item);
  }
  
  Future<String> _processItem(int item) async {
    await Future.delayed(Duration(seconds: 1));
    return '处理结果: $item';
  }
  
  void dispose() {
    _queue.close();
    _results.close();
  }
}
```

### 2. 并行计算模式

```dart
Future<List<int>> parallelCompute(List<int> data) async {
  final numIsolates = Platform.numberOfProcessors;
  final chunkSize = (data.length / numIsolates).ceil();
  final results = <Future<List<int>>>[];
  
  for (var i = 0; i < numIsolates; i++) {
    final start = i * chunkSize;
    final end = min(start + chunkSize, data.length);
    final chunk = data.sublist(start, end);
    
    results.add(
      compute(processChunk, chunk),
    );
  }
  
  final processed = await Future.wait(results);
  return processed.expand((x) => x).toList();
}

List<int> processChunk(List<int> chunk) {
  return chunk.map((x) => x * 2).toList();
}
```

## 性能优化

### 1. Isolate 池

```dart
class IsolatePool {
  final List<Isolate> _isolates = [];
  final Queue<SendPort> _availablePorts = Queue();
  final int _size;
  
  IsolatePool(this._size);
  
  Future<void> initialize() async {
    for (var i = 0; i < _size; i++) {
      final receivePort = ReceivePort();
      final isolate = await Isolate.spawn(
        worker,
        receivePort.sendPort,
      );
      
      _isolates.add(isolate);
      _availablePorts.add(await receivePort.first);
    }
  }
  
  Future<T> compute<T>(Function fn, dynamic message) async {
    final sendPort = _availablePorts.removeFirst();
    final response = ReceivePort();
    
    sendPort.send([fn, message, response.sendPort]);
    final result = await response.first;
    
    _availablePorts.add(sendPort);
    return result as T;
  }
  
  void dispose() {
    for (final isolate in _isolates) {
      isolate.kill();
    }
  }
}

void worker(SendPort mainSendPort) {
  final receivePort = ReceivePort();
  mainSendPort.send(receivePort.sendPort);
  
  receivePort.listen((message) async {
    final fn = message[0] as Function;
    final data = message[1];
    final replyTo = message[2] as SendPort;
    
    final result = await fn(data);
    replyTo.send(result);
  });
}
```

### 2. 内存优化

```dart
class ResourcePool<T> {
  final Queue<T> _resources = Queue<T>();
  final int _maxSize;
  final T Function() _factory;
  
  ResourcePool(this._maxSize, this._factory);
  
  T acquire() {
    if (_resources.isEmpty) {
      return _factory();
    }
    return _resources.removeFirst();
  }
  
  void release(T resource) {
    if (_resources.length < _maxSize) {
      _resources.add(resource);
    }
  }
}
```

## 最佳实践

### 1. 错误处理

- 使用 Zone 捕获异步错误
- 实现优雅的错误恢复机制
- 合理处理 Isolate 异常

### 2. 性能考虑

- 合理使用 Isolate 数量
- 避免频繁创建和销毁 Isolate
- 优化数据传输大小

### 3. 资源管理

- 及时释放不需要的资源
- 使用资源池管理重复使用的对象
- 监控内存使用情况

## 总结

Dart 的并发编程模型提供了强大的工具来处理复杂的并发场景：

1. Isolate 提供了真正的并行执行能力
2. 事件循环确保了异步代码的可预测性
3. Zone 机制提供了错误处理的灵活性
4. 各种并发模式满足不同场景需求

通过合理使用这些特性，我们可以构建高性能、可靠的 Dart 应用程序。