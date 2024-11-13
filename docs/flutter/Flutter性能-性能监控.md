---
title: Flutter 性能监控详解
description: 详细介绍 Flutter 应用性能监控的方法和最佳实践。
tag:
 - Flutter
 - 性能优化
sidebar: true
---

# Flutter 性能监控详解

## 简介

性能监控对于保证应用质量至关重要。本文介绍如何实现 Flutter 应用的性能监控。

## 监控指标

### 1. 帧率监控
```dart
class FPSMonitor {
  static final stopwatch = Stopwatch();
  static int _frameCount = 0;
  static double _fps = 0;
  
  static void start() {
    stopwatch.start();
    SchedulerBinding.instance.addPostFrameCallback(_onFrame);
  }
  
  static void _onFrame(Duration timestamp) {
    _frameCount++;
    if (stopwatch.elapsedMilliseconds >= 1000) {
      _fps = _frameCount * 1000 / stopwatch.elapsedMilliseconds;
      print('FPS: ${_fps.toStringAsFixed(1)}');
      _frameCount = 0;
      stopwatch.reset();
      stopwatch.start();
    }
    SchedulerBinding.instance.addPostFrameCallback(_onFrame);
  }
}
```

### 2. 内存监控
```dart
class MemoryMonitor {
  static void logMemoryUsage() {
    if (kDebugMode) {
      final usage = ProcessInfo.currentRss;
      print('Memory usage: ${usage ~/ 1024 ~/ 1024}MB');
    }
  }
  
  static Timer startPeriodicLogging() {
    return Timer.periodic(Duration(seconds: 5), (_) {
      logMemoryUsage();
    });
  }
}
```

### 3. 页面性能
```dart
class PagePerformanceMonitor {
  static final Map<String, Stopwatch> _pageLoadTimes = {};
  
  static void startPageLoadTimer(String pageName) {
    final stopwatch = Stopwatch()..start();
    _pageLoadTimes[pageName] = stopwatch;
  }
  
  static void endPageLoadTimer(String pageName) {
    final stopwatch = _pageLoadTimes[pageName];
    if (stopwatch != null) {
      stopwatch.stop();
      print('$pageName load time: ${stopwatch.elapsedMilliseconds}ms');
      _pageLoadTimes.remove(pageName);
    }
  }
}
```

## 性能分析工具

### 1. DevTools 集成
```dart
void main() {
  if (kDebugMode) {
    // 启用所有性能叠加层
    debugPaintSizeEnabled = true;
    debugPaintBaselinesEnabled = true;
    debugPaintLayerBordersEnabled = true;
    debugPaintPointersEnabled = true;
    debugRepaintRainbowEnabled = true;
  }
  runApp(MyApp());
}
```

### 2. 自定义性能叠加层
```dart
class PerformanceOverlayWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        Positioned(
          right: 0,
          top: 0,
          child: Container(
            padding: EdgeInsets.all(8),
            color: Colors.black54,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'FPS: ${_fps.toStringAsFixed(1)}',
                  style: TextStyle(color: Colors.white),
                ),
                Text(
                  'Memory: ${_memoryUsage}MB',
                  style: TextStyle(color: Colors.white),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
```

## 完整示例

```dart
class PerformanceMonitor {
  static final PerformanceMonitor _instance = PerformanceMonitor._internal();
  factory PerformanceMonitor() => _instance;
  
  final _metrics = <String, List<double>>{};
  Timer? _reportingTimer;
  
  PerformanceMonitor._internal();
  
  // 启动监控
  void start() {
    // 监控帧率
    FPSMonitor.start();
    
    // 监控内存
    MemoryMonitor.startPeriodicLogging();
    
    // 定期报告
    _reportingTimer = Timer.periodic(
      Duration(minutes: 5),
      (_) => _reportMetrics(),
    );
  }
  
  // 记录指标
  void recordMetric(String name, double value) {
    _metrics.putIfAbsent(name, () => []).add(value);
  }
  
  // 报告指标
  void _reportMetrics() {
    final report = StringBuffer();
    report.writeln('Performance Report:');
    
    _metrics.forEach((name, values) {
      if (values.isEmpty) return;
      
      final avg = values.reduce((a, b) => a + b) / values.length;
      final min = values.reduce(min);
      final max = values.reduce(max);
      
      report.writeln('$name:');
      report.writeln('  Average: ${avg.toStringAsFixed(2)}');
      report.writeln('  Min: ${min.toStringAsFixed(2)}');
      report.writeln('  Max: ${max.toStringAsFixed(2)}');
    });
    
    print(report.toString());
    _metrics.clear();
  }
  
  // 停止监控
  void stop() {
    _reportingTimer?.cancel();
    _reportingTimer = null;
    _metrics.clear();
  }
}

// 使用示例
class PerformanceMonitorDemo extends StatefulWidget {
  @override
  _PerformanceMonitorDemoState createState() => _PerformanceMonitorDemoState();
}

class _PerformanceMonitorDemoState extends State<PerformanceMonitorDemo> {
  final monitor = PerformanceMonitor();
  final stopwatch = Stopwatch();
  
  @override
  void initState() {
    super.initState();
    monitor.start();
  }
  
  @override
  void dispose() {
    monitor.stop();
    super.dispose();
  }
  
  void _performHeavyTask() {
    stopwatch.start();
    
    // 模拟耗时任务
    List<int> numbers = List.generate(10000000, (i) => i);
    numbers.sort();
    
    stopwatch.stop();
    monitor.recordMetric(
      'heavy_task_duration',
      stopwatch.elapsedMilliseconds.toDouble(),
    );
    stopwatch.reset();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Performance Monitor')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: _performHeavyTask,
              child: Text('Perform Heavy Task'),
            ),
            SizedBox(height: 20),
            StreamBuilder<PerformanceMetrics>(
              stream: monitor.metricsStream,
              builder: (context, snapshot) {
                if (!snapshot.hasData) return Container();
                
                final metrics = snapshot.data!;
                return Column(
                  children: [
                    Text('FPS: ${metrics.fps.toStringAsFixed(1)}'),
                    Text('Memory: ${metrics.memoryUsage}MB'),
                    Text('Last Task: ${metrics.lastTaskDuration}ms'),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
```

## 最佳实践

1. 合理设置监控频率
2. 优化数据存储
3. 及时清理数据
4. 控制监控开销
5. 设置报警阈值

## 注意事项

1. 避免影响性能
2. 控制日志大小
3. 保护敏感信息
4. 处理异常情况
5. 注意电量消耗

## 总结

性能监控是保证应用质量的重要手段。通过合理的监控方案,可以及时发现和解决性能问题,提供更好的用户体验。 