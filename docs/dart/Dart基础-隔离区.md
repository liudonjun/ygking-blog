---
title: Dart 隔离区(Isolate)详解
description: 详细介绍 Dart 语言中的隔离区机制,包括创建、通信和最佳实践。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 隔离区(Isolate)详解

## 简介

Isolate 是 Dart 中实现并发的方式。每个 Isolate 都有自己的内存堆和事件循环,Isolate 之间通过消息传递进行通信。

## 基本概念

### 创建 Isolate
```dart
import 'dart:isolate';

void isolateFunction(SendPort sendPort) {
  // Isolate 中的计算
  int result = complexComputation();
  // 发送结果回主 Isolate
  sendPort.send(result);
}

Future<void> main() async {
  // 创建通信端口
  ReceivePort receivePort = ReceivePort();
  
  // 启动新的 Isolate
  await Isolate.spawn(isolateFunction, receivePort.sendPort);
  
  // 接收结果
  final result = await receivePort.first;
  print('Result: $result');
}
```

### 双向通信
```dart
void isolateFunction(SendPort sendPort) {
  // 创建接收端口
  final receivePort = ReceivePort();
  
  // 发送此 Isolate 的 SendPort 到主 Isolate
  sendPort.send(receivePort.sendPort);
  
  // 处理接收到的消息
  receivePort.listen((message) {
    if (message is int) {
      final result = message * 2;
      sendPort.send(result);
    }
  });
}

Future<void> main() async {
  final receivePort = ReceivePort();
  await Isolate.spawn(isolateFunction, receivePort.sendPort);
  
  // 获取新 Isolate 的 SendPort
  final SendPort sendPort = await receivePort.first;
  
  // 发送数据并等待响应
  sendPort.send(42);
  final result = await receivePort.elementAt(1);
  print('Result: $result');
}
```

## 数据传递

### 可传递的数据类型
```dart
// 基本类型
sendPort.send(42);
sendPort.send('Hello');
sendPort.send(true);

// 集合
sendPort.send([1, 2, 3]);
sendPort.send({'a': 1, 'b': 2});

// SendPort
sendPort.send(anotherSendPort);

// 自定义类型(需要实现特定接口)
class TransferableData {
  final int id;
  final String data;
  
  TransferableData(this.id, this.data);
  
  // 转换为可传输格式
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'data': data,
    };
  }
  
  // 从可传输格式恢复
  factory TransferableData.fromMap(Map<String, dynamic> map) {
    return TransferableData(
      map['id'] as int,
      map['data'] as String,
    );
  }
}
```

## 错误处理

### 异常捕获
```dart
void isolateFunction(SendPort sendPort) {
  try {
    throw Exception('Something went wrong');
  } catch (e) {
    sendPort.send({'error': e.toString()});
  }
}

Future<void> main() async {
  final receivePort = ReceivePort();
  
  try {
    await Isolate.spawn(isolateFunction, receivePort.sendPort);
    final result = await receivePort.first;
    
    if (result is Map && result.containsKey('error')) {
      print('Error in isolate: ${result['error']}');
    }
  } catch (e) {
    print('Error spawning isolate: $e');
  }
}
```

## 完整示例

```dart
import 'dart:isolate';
import 'dart:math';

// 计算密集型任务
class ComputeTask {
  final int start;
  final int end;
  
  ComputeTask(this.start, this.end);
  
  Map<String, dynamic> toMap() => {
    'start': start,
    'end': end,
  };
  
  factory ComputeTask.fromMap(Map<String, dynamic> map) => 
    ComputeTask(map['start'], map['end']);
}

// 计算结果
class ComputeResult {
  final int sum;
  final Duration duration;
  
  ComputeResult(this.sum, this.duration);
  
  Map<String, dynamic> toMap() => {
    'sum': sum,
    'duration': duration.inMilliseconds,
  };
  
  factory ComputeResult.fromMap(Map<String, dynamic> map) => 
    ComputeResult(
      map['sum'],
      Duration(milliseconds: map['duration']),
    );
}

// Isolate ���作函数
void computeIsolate(SendPort sendPort) {
  final receivePort = ReceivePort();
  sendPort.send(receivePort.sendPort);
  
  receivePort.listen((message) {
    if (message is Map) {
      final task = ComputeTask.fromMap(message);
      final stopwatch = Stopwatch()..start();
      
      // 执行计算密集型任务
      int sum = 0;
      for (int i = task.start; i <= task.end; i++) {
        sum += i;
        // 模拟复杂计算
        sum += sqrt(i).floor();
      }
      
      stopwatch.stop();
      final result = ComputeResult(sum, stopwatch.elapsed);
      sendPort.send(result.toMap());
    }
  });
}

class ComputeManager {
  SendPort? _sendPort;
  ReceivePort? _receivePort;
  Isolate? _isolate;
  
  Future<void> initialize() async {
    _receivePort = ReceivePort();
    _isolate = await Isolate.spawn(computeIsolate, _receivePort!.sendPort);
    _sendPort = await _receivePort!.first;
  }
  
  Future<ComputeResult> compute(ComputeTask task) async {
    if (_sendPort == null) {
      throw StateError('ComputeManager not initialized');
    }
    
    final responsePort = ReceivePort();
    _sendPort!.send(task.toMap());
    final resultMap = await responsePort.first;
    return ComputeResult.fromMap(resultMap);
  }
  
  void dispose() {
    _receivePort?.close();
    _isolate?.kill();
    _sendPort = null;
    _receivePort = null;
    _isolate = null;
  }
}

void main() async {
  final manager = ComputeManager();
  await manager.initialize();
  
  // 执行多个计算任务
  final tasks = [
    ComputeTask(1, 1000000),
    ComputeTask(1000001, 2000000),
    ComputeTask(2000001, 3000000),
  ];
  
  for (var task in tasks) {
    try {
      final result = await manager.compute(task);
      print('Task ${task.start}-${task.end}:');
      print('Sum: ${result.sum}');
      print('Duration: ${result.duration.inMilliseconds}ms\n');
    } catch (e) {
      print('Error computing task: $e');
    }
  }
  
  manager.dispose();
}
```

## 最佳实践

1. 合理划分计算任务
2. 注意数据传输开销
3. 及时释放资源
4. 处理好异常情况
5. 避免过多的 Isolate

## 注意事项

1. Isolate 之间不共享内存
2. 注意数据序列化成本
3. 合理控制 Isolate 数量
4. 处理好生命周期
5. 注意平台限制

## 总结

Isolate 是 Dart 中实现并发的重要机制,通过合理使用可以充分利用多核性能。理解并掌握 Isolate 的使用对于开发高性能的 Dart 应用很有帮助。 