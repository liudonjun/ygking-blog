---
description: 本文详细介绍Flutter应用如何与各种传感器进行桥接交互，包括加速度计、陀螺仪、磁力计、光线传感器、距离传感器等核心功能，以及Android和iOS平台的具体实现细节。
tag:
  - Flutter
  - 传感器
  - 加速度计
  - 陀螺仪
  - 磁力计
  - 光线传感器
sticky: 1
sidebar: true
---

# Flutter 与传感器桥接

## 故事开始：小陈的健身追踪应用

小陈正在开发一个健身追踪应用，需要利用手机的传感器来监测用户的运动状态、步数、方向等信息。他发现 Flutter 中的传感器功能比想象中要复杂。

"传感器数据涉及频率控制、数据滤波、传感器融合、功耗优化等多个方面，而且 Android 和 iOS 的传感器 API 差异很大。"小陈在开发笔记中写道。

## 第一章：传感器技术基础

### 1.1 传感器类型概述

现代移动设备配备了丰富的传感器：

**运动传感器：**

- **加速度计（Accelerometer）**：测量三轴加速度
- **陀螺仪（Gyroscope）**：测量三轴角速度
- **磁力计（Magnetometer）**：测量三轴磁场强度
- **重力传感器（Gravity）**：测量重力加速度
- **线性加速度计（Linear Acceleration）**：去除重力影响的加速度

**姿态传感器：**

- **方向传感器（Orientation）**：设备方向角度
- **旋转矢量传感器（Rotation Vector）**：设备旋转四元数
- **游戏旋转矢量传感器（Game Rotation Vector）**：游戏优化的旋转数据

**环境传感器：**

- **光线传感器（Light）**：环境光照强度
- **距离传感器（Proximity）**：物体距离检测
- **气压计（Pressure）**：大气压力
- **温度传感器（Temperature）**：环境温度
- **湿度传感器（Humidity）**：环境湿度

**健康传感器：**

- **心率传感器（Heart Rate）**：心率监测
- **步数计（Step Counter）**：步数统计
- **计步器（Step Detector）**：步数检测

### 1.2 传感器数据特性

**数据精度：**

- **低精度**：适合一般应用
- **中精度**：适合大多数应用
- **高精度**：适合专业应用

**采样频率：**

- **游戏模式**：高频率，低延迟
- **UI 模式**：中等频率，平衡性能
- **正常模式**：标准频率，省电

**数据滤波：**

- **低通滤波**：去除高频噪声
- **高通滤波**：去除低频漂移
- **卡尔曼滤波**：最优估计

### 1.3 Flutter 传感器开发生态

Flutter 中传感器开发主要有以下几种方案：

1. **sensors_plus** - 官方推荐的传感器插件
2. **flutter_sensors** - 轻量级传感器插件
3. **自定义平台通道** - 完全自定义实现

## 第二章：环境搭建与基础配置

### 2.1 添加依赖

```yaml
dependencies:
  flutter:
    sdk: flutter
  sensors_plus: ^4.0.1
  permission_handler: ^11.0.1
```

### 2.2 权限配置

**Android 权限配置（android/app/src/main/AndroidManifest.xml）**

```xml
<!-- 身体传感器权限 -->
<uses-permission android:name="android.permission.BODY_SENSORS" />
<uses-permission android:name="android.permission.BODY_SENSORS_BACKGROUND" />

<!-- 位置权限（某些传感器需要） -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- 后台传感器权限 -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

**iOS 权限配置（ios/Runner/Info.plist）**

```xml
<!-- 运动和健身权限 -->
<key>NSMotionUsageDescription</key>
<string>此应用需要运动权限来监测您的健身活动</string>

<!-- 位置权限 -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>此应用需要位置权限来提供更准确的传感器数据</string>

<!-- 后台位置权限 -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>此应用需要后台位置权限来持续监测传感器数据</string>
```

### 2.3 权限管理实现

```dart
import 'package:permission_handler/permission_handler.dart';

class SensorPermissionManager {
  static Future<bool> requestMotionPermissions() async {
    if (Platform.isAndroid) {
      final motion = await Permission.sensors.request();
      return motion.isGranted;
    } else {
      // iOS需要用户在设置中授权
      return await Permission.sensors.isGranted;
    }
  }

  static Future<bool> requestLocationPermissions() async {
    final location = await Permission.location.request();
    return location.isGranted;
  }

  static Future<bool> checkMotionPermissions() async {
    return await Permission.sensors.isGranted;
  }

  static Future<bool> checkLocationPermissions() async {
    return await Permission.location.isGranted;
  }

  static Future<void> openSettings() async {
    await openAppSettings();
  }
}
```

## 第三章：运动传感器实现

### 3.1 加速度计管理器

```dart
import 'package:sensors_plus/sensors_plus.dart';

class AccelerometerManager {
  static final AccelerometerManager _instance = AccelerometerManager._internal();
  factory AccelerometerManager() => _instance;
  AccelerometerManager._internal();

  final StreamController<AccelerometerData> _dataController =
      StreamController<AccelerometerData>.broadcast();
  bool _isListening = false;
  double _frequency = SensorInterval.normalInterval;

  Stream<AccelerometerData> get accelerometerStream => _dataController.stream;
  bool get isListening => _isListening;
  double get frequency => _frequency;

  Future<void> startListening({double? frequency}) async {
    if (_isListening) return;

    final hasPermission = await SensorPermissionManager.checkMotionPermissions();
    if (!hasPermission) {
      final granted = await SensorPermissionManager.requestMotionPermissions();
      if (!granted) {
        throw SensorException('需要传感器权限');
      }
    }

    if (frequency != null) {
      _frequency = frequency;
      accelerometerEvent.listen(_onAccelerometerEvent,
          samplingPeriod: _frequency);
    } else {
      accelerometerEvent.listen(_onAccelerometerEvent);
    }

    _isListening = true;
  }

  void stopListening() {
    if (!_isListening) return;

    accelerometerEvent.cancel();
    _isListening = false;
  }

  void _onAccelerometerEvent(AccelerometerEvent event) {
    final data = AccelerometerData(
      x: event.x,
      y: event.y,
      z: event.z,
      timestamp: DateTime.now(),
    );

    _dataController.add(data);
  }

  void dispose() {
    stopListening();
    _dataController.close();
  }
}

class AccelerometerData {
  final double x;
  final double y;
  final double z;
  final DateTime timestamp;

  AccelerometerData({
    required this.x,
    required this.y,
    required this.z,
    required this.timestamp,
  });

  double get magnitude {
    return sqrt(x * x + y * y + z * z);
  }

  double get pitch {
    return atan2(y, sqrt(x * x + z * z)) * 180 / pi;
  }

  double get roll {
    return atan2(-x, y) * 180 / pi;
  }

  Map<String, dynamic> toJson() {
    return {
      'x': x,
      'y': y,
      'z': z,
      'timestamp': timestamp.toIso8601String(),
      'magnitude': magnitude,
      'pitch': pitch,
      'roll': roll,
    };
  }
}
```

### 3.2 陀螺仪管理器

```dart
class GyroscopeManager {
  static final GyroscopeManager _instance = GyroscopeManager._internal();
  factory GyroscopeManager() => _instance;
  GyroscopeManager._internal();

  final StreamController<GyroscopeData> _dataController =
      StreamController<GyroscopeData>.broadcast();
  bool _isListening = false;
  double _frequency = SensorInterval.normalInterval;

  Stream<GyroscopeData> get gyroscopeStream => _dataController.stream;
  bool get isListening => _isListening;
  double get frequency => _frequency;

  Future<void> startListening({double? frequency}) async {
    if (_isListening) return;

    final hasPermission = await SensorPermissionManager.checkMotionPermissions();
    if (!hasPermission) {
      final granted = await SensorPermissionManager.requestMotionPermissions();
      if (!granted) {
        throw SensorException('需要传感器权限');
      }
    }

    if (frequency != null) {
      _frequency = frequency;
      gyroscopeEvent.listen(_onGyroscopeEvent,
          samplingPeriod: _frequency);
    } else {
      gyroscopeEvent.listen(_onGyroscopeEvent);
    }

    _isListening = true;
  }

  void stopListening() {
    if (!_isListening) return;

    gyroscopeEvent.cancel();
    _isListening = false;
  }

  void _onGyroscopeEvent(GyroscopeEvent event) {
    final data = GyroscopeData(
      x: event.x,
      y: event.y,
      z: event.z,
      timestamp: DateTime.now(),
    );

    _dataController.add(data);
  }

  void dispose() {
    stopListening();
    _dataController.close();
  }
}

class GyroscopeData {
  final double x;
  final double y;
  final double z;
  final DateTime timestamp;

  GyroscopeData({
    required this.x,
    required this.y,
    required this.z,
    required this.timestamp,
  });

  double get magnitude {
    return sqrt(x * x + y * y + z * z);
  }

  Map<String, dynamic> toJson() {
    return {
      'x': x,
      'y': y,
      'z': z,
      'timestamp': timestamp.toIso8601String(),
      'magnitude': magnitude,
    };
  }
}
```

### 3.3 磁力计管理器

```dart
class MagnetometerManager {
  static final MagnetometerManager _instance = MagnetometerManager._internal();
  factory MagnetometerManager() => _instance;
  MagnetometerManager._internal();

  final StreamController<MagnetometerData> _dataController =
      StreamController<MagnetometerData>.broadcast();
  bool _isListening = false;
  double _frequency = SensorInterval.normalInterval;

  Stream<MagnetometerData> get magnetometerStream => _dataController.stream;
  bool get isListening => _isListening;
  double get frequency => _frequency;

  Future<void> startListening({double? frequency}) async {
    if (_isListening) return;

    final hasPermission = await SensorPermissionManager.checkMotionPermissions();
    if (!hasPermission) {
      final granted = await SensorPermissionManager.requestMotionPermissions();
      if (!granted) {
        throw SensorException('需要传感器权限');
      }
    }

    if (frequency != null) {
      _frequency = frequency;
      magnetometerEvent.listen(_onMagnetometerEvent,
          samplingPeriod: _frequency);
    } else {
      magnetometerEvent.listen(_onMagnetometerEvent);
    }

    _isListening = true;
  }

  void stopListening() {
    if (!_isListening) return;

    magnetometerEvent.cancel();
    _isListening = false;
  }

  void _onMagnetometerEvent(MagnetometerEvent event) {
    final data = MagnetometerData(
      x: event.x,
      y: event.y,
      z: event.z,
      timestamp: DateTime.now(),
    );

    _dataController.add(data);
  }

  void dispose() {
    stopListening();
    _dataController.close();
  }
}

class MagnetometerData {
  final double x;
  final double y;
  final double z;
  final DateTime timestamp;

  MagnetometerData({
    required this.x,
    required this.y,
    required this.z,
    required this.timestamp,
  });

  double get magnitude {
    return sqrt(x * x + y * y + z * z);
  }

  double get heading {
    return atan2(y, x) * 180 / pi;
  }

  Map<String, dynamic> toJson() {
    return {
      'x': x,
      'y': y,
      'z': z,
      'timestamp': timestamp.toIso8601String(),
      'magnitude': magnitude,
      'heading': heading,
    };
  }
}
```

## 第四章：传感器融合与姿态检测

### 4.1 传感器融合管理器

```dart
class SensorFusionManager {
  static final SensorFusionManager _instance = SensorFusionManager._internal();
  factory SensorFusionManager() => _instance;
  SensorFusionManager._internal();

  final AccelerometerManager _accelerometerManager = AccelerometerManager();
  final GyroscopeManager _gyroscopeManager = GyroscopeManager();
  final MagnetometerManager _magnetometerManager = MagnetometerManager();

  final StreamController<OrientationData> _orientationController =
      StreamController<OrientationData>.broadcast();
  final StreamController<MotionData> _motionController =
      StreamController<MotionData>.broadcast();

  bool _isListening = false;
  OrientationData? _lastOrientation;
  MotionData? _lastMotion;

  Stream<OrientationData> get orientationStream => _orientationController.stream;
  Stream<MotionData> get motionStream => _motionController.stream;
  bool get isListening => _isListening;

  Future<void> startListening() async {
    if (_isListening) return;

    final hasPermission = await SensorPermissionManager.checkMotionPermissions();
    if (!hasPermission) {
      final granted = await SensorPermissionManager.requestMotionPermissions();
      if (!granted) {
        throw SensorException('需要传感器权限');
      }
    }

    // 启动所有传感器
    await _accelerometerManager.startListening();
    await _gyroscopeManager.startListening();
    await _magnetometerManager.startListening();

    // 监听传感器数据
    _accelerometerManager.accelerometerStream.listen(_onAccelerometerData);
    _gyroscopeManager.gyroscopeStream.listen(_onGyroscopeData);
    _magnetometerManager.magnetometerStream.listen(_onMagnetometerData);

    _isListening = true;
  }

  void stopListening() {
    if (!_isListening) return;

    _accelerometerManager.stopListening();
    _gyroscopeManager.stopListening();
    _magnetometerManager.stopListening();

    _isListening = false;
  }

  void _onAccelerometerData(AccelerometerData data) {
    _updateMotionData(data);
  }

  void _onGyroscopeData(GyroscopeData data) {
    _updateOrientationData(data);
  }

  void _onMagnetometerData(MagnetometerData data) {
    _updateOrientationData(data);
  }

  void _updateMotionData(AccelerometerData accelData) {
    final motion = MotionData(
      acceleration: accelData.magnitude,
      timestamp: accelData.timestamp,
      isMoving: accelData.magnitude > 12.0, // 运动阈值
      shakeDetected: accelData.magnitude > 20.0, // 摇晃检测
    );

    _lastMotion = motion;
    _motionController.add(motion);
  }

  void _updateOrientationData(dynamic sensorData) {
    // 简化的方向计算
    // 实际应用中应该使用更复杂的传感器融合算法
    final orientation = OrientationData(
      azimuth: 0.0, // 需要磁力计数据计算
      pitch: 0.0,  // 需要加速度计数据计算
      roll: 0.0,   // 需要加速度计数据计算
      timestamp: DateTime.now(),
    );

    _lastOrientation = orientation;
    _orientationController.add(orientation);
  }

  OrientationData? get currentOrientation => _lastOrientation;
  MotionData? get currentMotion => _lastMotion;

  void dispose() {
    stopListening();
    _orientationController.close();
    _motionController.close();
  }
}

class OrientationData {
  final double azimuth;  // 方位角
  final double pitch;    // 俯仰角
  final double roll;     // 滚转角
  final DateTime timestamp;

  OrientationData({
    required this.azimuth,
    required this.pitch,
    required this.roll,
    required this.timestamp,
  });

  String get orientationDescription {
    if (pitch.abs() < 30) {
      if (azimuth >= 315 || azimuth < 45) return '北';
      if (azimuth >= 45 && azimuth < 135) return '东';
      if (azimuth >= 135 && azimuth < 225) return '南';
      if (azimuth >= 225 && azimuth < 315) return '西';
    } else if (pitch > 30) {
      return '倒置';
    } else if (pitch < -30) {
      return '竖直';
    }

    return '未知';
  }

  Map<String, dynamic> toJson() {
    return {
      'azimuth': azimuth,
      'pitch': pitch,
      'roll': roll,
      'timestamp': timestamp.toIso8601String(),
      'orientation': orientationDescription,
    };
  }
}

class MotionData {
  final double acceleration;
  final DateTime timestamp;
  final bool isMoving;
  final bool shakeDetected;

  MotionData({
    required this.acceleration,
    required this.timestamp,
    required this.isMoving,
    required this.shakeDetected,
  });

  Map<String, dynamic> toJson() {
    return {
      'acceleration': acceleration,
      'timestamp': timestamp.toIso8601String(),
      'isMoving': isMoving,
      'shakeDetected': shakeDetected,
    };
  }
}
```

### 4.2 步数检测器

```dart
class StepDetectorManager {
  static final StepDetectorManager _instance = StepDetectorManager._internal();
  factory StepDetectorManager() => _instance;
  StepDetectorManager._internal();

  final StreamController<StepData> _stepController =
      StreamController<StepData>.broadcast();
  bool _isListening = false;
  int _totalSteps = 0;
  DateTime? _lastStepTime;
  List<double> _accelerationHistory = [];

  Stream<StepData> get stepStream => _stepController.stream;
  bool get isListening => _isListening;
  int get totalSteps => _totalSteps;

  Future<void> startListening() async {
    if (_isListening) return;

    final hasPermission = await SensorPermissionManager.checkMotionPermissions();
    if (!hasPermission) {
      final granted = await SensorPermissionManager.requestMotionPermissions();
      if (!granted) {
        throw SensorException('需要传感器权限');
      }
    }

    // 使用加速度计检测步数
    final accelerometerManager = AccelerometerManager();
    await accelerometerManager.startListening(frequency: SensorInterval.uiInterval);

    accelerometerManager.accelerometerStream.listen(_onAccelerometerData);

    _isListening = true;
  }

  void stopListening() {
    if (!_isListening) return;

    _isListening = false;
  }

  void _onAccelerometerData(AccelerometerData data) {
    _accelerationHistory.add(data.magnitude);

    // 保持历史记录在合理范围内
    if (_accelerationHistory.length > 50) {
      _accelerationHistory.removeAt(0);
    }

    // 简单的步数检测算法
    if (_detectStep(data)) {
      _totalSteps++;

      final stepData = StepData(
        stepCount: _totalSteps,
        timestamp: data.timestamp,
        stepFrequency: _calculateStepFrequency(),
      );

      _stepController.add(stepData);
      _lastStepTime = data.timestamp;
    }
  }

  bool _detectStep(AccelerometerData data) {
    // 基本步数检测逻辑
    final now = data.timestamp;

    // 检查时间间隔（避免重复检测）
    if (_lastStepTime != null) {
      final timeDiff = now.difference(_lastStepTime!).inMilliseconds;
      if (timeDiff < 200) return false; // 最小步数间隔200ms
    }

    // 检查加速度阈值
    if (data.magnitude < 10.0) return false;

    // 检查加速度模式（简化版）
    if (_accelerationHistory.length < 10) return false;

    // 寻找加速度的峰值模式
    final recent = _accelerationHistory.sublist(_accelerationHistory.length - 10);
    final maxAccel = recent.reduce((a, b) => a > b ? a : b);
    final minAccel = recent.reduce((a, b) => a < b ? a : b);

    // 检测到明显的加速度变化
    return (maxAccel - minAccel) > 8.0;
  }

  double _calculateStepFrequency() {
    if (_lastStepTime == null) return 0.0;

    final now = DateTime.now();
    final timeDiff = now.difference(_lastStepTime!).inMilliseconds;

    if (timeDiff == 0) return 0.0;

    return 1000.0 / timeDiff; // 步数/秒
  }

  void resetSteps() {
    _totalSteps = 0;
    _lastStepTime = null;
    _accelerationHistory.clear();
  }

  void dispose() {
    stopListening();
    _stepController.close();
  }
}

class StepData {
  final int stepCount;
  final DateTime timestamp;
  final double stepFrequency;

  StepData({
    required this.stepCount,
    required this.timestamp,
    required this.stepFrequency,
  });

  Map<String, dynamic> toJson() {
    return {
      'stepCount': stepCount,
      'timestamp': timestamp.toIso8601String(),
      'stepFrequency': stepFrequency,
    };
  }
}
```

## 第五章：环境传感器实现

### 5.1 光线传感器管理器

```dart
class LightSensorManager {
  static final LightSensorManager _instance = LightSensorManager._internal();
  factory LightSensorManager() => _instance;
  LightSensorManager._internal();

  final StreamController<LightData> _dataController =
      StreamController<LightData>.broadcast();
  bool _isListening = false;

  Stream<LightData> get lightStream => _dataController.stream;
  bool get isListening => _isListening;

  Future<void> startListening() async {
    if (_isListening) return;

    final hasPermission = await SensorPermissionManager.checkMotionPermissions();
    if (!hasPermission) {
      final granted = await SensorPermissionManager.requestMotionPermissions();
      if (!granted) {
        throw SensorException('需要传感器权限');
      }
    }

    // 使用光线传感器
    userAccelerometerEvent.listen(_onLightEvent);

    _isListening = true;
  }

  void stopListening() {
    if (!_isListening) return;

    userAccelerometerEvent.cancel();
    _isListening = false;
  }

  void _onLightEvent(UserAccelerometerEvent event) {
    // 注意：这里使用userAccelerometer作为示例
    // 实际应该使用专门的光线传感器API
    final lightLevel = _calculateLightLevel(event);

    final data = LightData(
      illuminance: lightLevel,
      timestamp: DateTime.now(),
      environmentType: _getEnvironmentType(lightLevel),
    );

    _dataController.add(data);
  }

  double _calculateLightLevel(UserAccelerometerEvent event) {
    // 模拟光线传感器数据
    // 实际应用中应该使用真实的光线传感器
    return (event.x.abs() + event.y.abs() + event.z.abs()) * 100;
  }

  LightEnvironmentType _getEnvironmentType(double illuminance) {
    if (illuminance < 10) {
      return LightEnvironmentType.dark;
    } else if (illuminance < 50) {
      return LightEnvironmentType.dim;
    } else if (illuminance < 200) {
      return LightEnvironmentType.normal;
    } else if (illuminance < 500) {
      return LightEnvironmentType.bright;
    } else {
      return LightEnvironmentType.veryBright;
    }
  }

  void dispose() {
    stopListening();
    _dataController.close();
  }
}

class LightData {
  final double illuminance; // 光照强度（lux）
  final DateTime timestamp;
  final LightEnvironmentType environmentType;

  LightData({
    required this.illuminance,
    required this.timestamp,
    required this.environmentType,
  });

  Map<String, dynamic> toJson() {
    return {
      'illuminance': illuminance,
      'timestamp': timestamp.toIso8601String(),
      'environmentType': environmentType.toString(),
    };
  }
}

enum LightEnvironmentType {
  dark,
  dim,
  normal,
  bright,
  veryBright,
}
```

### 5.2 距离传感器管理器

```dart
class ProximitySensorManager {
  static final ProximitySensorManager _instance = ProximitySensorManager._internal();
  factory ProximitySensorManager() => _instance;
  ProximitySensorManager._internal();

  final StreamController<ProximityData> _dataController =
      StreamController<ProximityData>.broadcast();
  bool _isListening = false;

  Stream<ProximityData> get proximityStream => _dataController.stream;
  bool get isListening => _isListening;

  Future<void> startListening() async {
    if (_isListening) return;

    final hasPermission = await SensorPermissionManager.checkMotionPermissions();
    if (!hasPermission) {
      final granted = await SensorPermissionManager.requestMotionPermissions();
      if (!granted) {
        throw SensorException('需要传感器权限');
      }
    }

    // 使用距离传感器
    userAccelerometerEvent.listen(_onProximityEvent);

    _isListening = true;
  }

  void stopListening() {
    if (!_isListening) return;

    userAccelerometerEvent.cancel();
    _isListening = false;
  }

  void _onProximityEvent(UserAccelerometerEvent event) {
    // 注意：这里使用userAccelerometer作为示例
    // 实际应用中应该使用专门的距离传感器API
    final isNear = _detectProximity(event);

    final data = ProximityData(
      isNear: isNear,
      timestamp: DateTime.now(),
      distance: isNear ? 0.0 : 10.0, // 模拟距离值
    );

    _dataController.add(data);
  }

  bool _detectProximity(UserAccelerometerEvent event) {
    // 模拟距离传感器检测
    // 实际应用中应该使用真实的距离传感器
    final totalAcceleration = event.x.abs() + event.y.abs() + event.z.abs();
    return totalAcceleration > 15.0; // 阈值检测
  }

  void dispose() {
    stopListening();
    _dataController.close();
  }
}

class ProximityData {
  final bool isNear;
  final DateTime timestamp;
  final double distance; // 距离（cm）

  ProximityData({
    required this.isNear,
    required this.timestamp,
    required this.distance,
  });

  Map<String, dynamic> toJson() {
    return {
      'isNear': isNear,
      'timestamp': timestamp.toIso8601String(),
      'distance': distance,
    };
  }
}
```

## 第六章：实际应用案例

### 6.1 健身追踪应用

```dart
class FitnessTracker {
  final SensorFusionManager _sensorFusion = SensorFusionManager();
  final StepDetectorManager _stepDetector = StepDetectorManager();
  final LightSensorManager _lightSensor = LightSensorManager();

  final StreamController<FitnessData> _fitnessController =
      StreamController<FitnessData>.broadcast();

  bool _isTracking = false;
  DateTime? _startTime;
  int _lastStepCount = 0;
  double _totalDistance = 0.0;
  List<AccelerometerData> _motionHistory = [];

  Stream<FitnessData> get fitnessStream => _fitnessController.stream;
  bool get isTracking => _isTracking;

  Future<void> startTracking() async {
    if (_isTracking) return;

    try {
      await _sensorFusion.startListening();
      await _stepDetector.startListening();
      await _lightSensor.startListening();

      _isTracking = true;
      _startTime = DateTime.now();
      _lastStepCount = _stepDetector.totalSteps;
      _motionHistory.clear();

      // 监听传感器数据
      _sensorFusion.motionStream.listen(_onMotionData);
      _stepDetector.stepStream.listen(_onStepData);
      _lightSensor.lightStream.listen(_onLightData);

    } catch (e) {
      throw SensorException('开始追踪失败：${e.toString()}');
    }
  }

  void stopTracking() {
    if (!_isTracking) return;

    _sensorFusion.stopListening();
    _stepDetector.stopListening();
    _lightSensor.stopListening();

    _isTracking = false;
    _startTime = null;
  }

  void _onMotionData(MotionData motionData) {
    _motionHistory.add(AccelerometerData(
      x: 0, y: 0, z: motionData.acceleration,
      timestamp: motionData.timestamp,
    ));

    // 保持历史记录在合理范围内
    if (_motionHistory.length > 100) {
      _motionHistory.removeAt(0);
    }

    _emitFitnessData();
  }

  void _onStepData(StepData stepData) {
    final newSteps = stepData.stepCount - _lastStepCount;
    if (newSteps > 0) {
      // 估算步长（简化计算）
      final stepLength = 0.7; // 平均步长70cm
      _totalDistance += newSteps * stepLength;
      _lastStepCount = stepData.stepCount;
    }

    _emitFitnessData();
  }

  void _onLightData(LightData lightData) {
    _emitFitnessData();
  }

  void _emitFitnessData() {
    if (!_isTracking || _startTime == null) return;

    final now = DateTime.now();
    final duration = now.difference(_startTime!);

    final fitnessData = FitnessData(
      steps: _stepDetector.totalSteps,
      distance: _totalDistance,
      duration: duration,
      calories: _calculateCalories(),
      speed: _calculateSpeed(),
      timestamp: now,
      isMoving: _sensorFusion.currentMotion?.isMoving ?? false,
      environmentType: _lightSensor.currentEnvironmentType,
    );

    _fitnessController.add(fitnessData);
  }

  double _calculateCalories() {
    // 简化的卡路里计算
    // 实际应用中应该考虑体重、年龄、性别等因素
    final minutes = _startTime != null
        ? DateTime.now().difference(_startTime!).inMinutes
        : 0;
    return minutes * 5.0; // 假设每分钟消耗5卡路里
  }

  double _calculateSpeed() {
    if (_startTime == null) return 0.0;

    final duration = DateTime.now().difference(_startTime!);
    if (duration.inSeconds == 0) return 0.0;

    return (_totalDistance / 100) / (duration.inSeconds / 60); // km/h
  }

  void resetTracking() {
    _stepDetector.resetSteps();
    _totalDistance = 0.0;
    _motionHistory.clear();
    _startTime = DateTime.now();
  }

  void dispose() {
    stopTracking();
    _fitnessController.close();
  }
}

class FitnessData {
  final int steps;
  final double distance; // 米
  final Duration duration;
  final double calories;
  final double speed; // km/h
  final DateTime timestamp;
  final bool isMoving;
  final LightEnvironmentType environmentType;

  FitnessData({
    required this.steps,
    required this.distance,
    required this.duration,
    required this.calories,
    required this.speed,
    required this.timestamp,
    required this.isMoving,
    required this.environmentType,
  });

  String get formattedDistance {
    if (distance < 1000) {
      return '${distance.toStringAsFixed(1)}m';
    } else {
      return '${(distance / 1000).toStringAsFixed(2)}km';
    }
  }

  String get formattedDuration {
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    final seconds = duration.inSeconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:'
             '${minutes.toString().padLeft(2, '0')}:'
             '${seconds.toString().padLeft(2, '0')}';
    } else {
      return '${minutes.toString().padLeft(2, '0')}:'
             '${seconds.toString().padLeft(2, '0')}';
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'steps': steps,
      'distance': distance,
      'duration': duration.inSeconds,
      'calories': calories,
      'speed': speed,
      'timestamp': timestamp.toIso8601String(),
      'isMoving': isMoving,
      'environmentType': environmentType.toString(),
      'formattedDistance': formattedDistance,
      'formattedDuration': formattedDuration,
    };
  }
}
```

### 6.2 传感器数据可视化

```dart
class SensorVisualizationPage extends StatefulWidget {
  @override
  _SensorVisualizationPageState createState() => _SensorVisualizationPageState();
}

class _SensorVisualizationPageState extends State<SensorVisualizationPage> {
  final AccelerometerManager _accelerometerManager = AccelerometerManager();
  final GyroscopeManager _gyroscopeManager = GyroscopeManager();
  final MagnetometerManager _magnetometerManager = MagnetometerManager();

  List<AccelerometerData> _accelerometerData = [];
  List<GyroscopeData> _gyroscopeData = [];
  List<MagnetometerData> _magnetometerData = [];

  @override
  void initState() {
    super.initState();
    _startSensorListening();
  }

  @override
  void dispose() {
    _stopSensorListening();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('传感器可视化'),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            _buildAccelerometerCard(),
            SizedBox(height: 16),
            _buildGyroscopeCard(),
            SizedBox(height: 16),
            _buildMagnetometerCard(),
            SizedBox(height: 16),
            _build3DVisualization(),
          ],
        ),
      ),
    );
  }

  Widget _buildAccelerometerCard() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '加速度计',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            _buildDataChart(
              _accelerometerData.map((data) => data.magnitude).toList(),
              '加速度 (m/s²)',
              Colors.blue,
            ),
            SizedBox(height: 16),
            _buildCurrentValues(
              'X: ${_getCurrentAccelerometer()?.x.toStringAsFixed(2)}',
              'Y: ${_getCurrentAccelerometer()?.y.toStringAsFixed(2)}',
              'Z: ${_getCurrentAccelerometer()?.z.toStringAsFixed(2)}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGyroscopeCard() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '陀螺仪',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            _buildDataChart(
              _gyroscopeData.map((data) => data.magnitude).toList(),
              '角速度 (rad/s)',
              Colors.green,
            ),
            SizedBox(height: 16),
            _buildCurrentValues(
              'X: ${_getCurrentGyroscope()?.x.toStringAsFixed(2)}',
              'Y: ${_getCurrentGyroscope()?.y.toStringAsFixed(2)}',
              'Z: ${_getCurrentGyroscope()?.z.toStringAsFixed(2)}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMagnetometerCard() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '磁力计',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            _buildDataChart(
              _magnetometerData.map((data) => data.magnitude).toList(),
              '磁场强度 (μT)',
              Colors.red,
            ),
            SizedBox(height: 16),
            _buildCurrentValues(
              'X: ${_getCurrentMagnetometer()?.x.toStringAsFixed(2)}',
              'Y: ${_getCurrentMagnetometer()?.y.toStringAsFixed(2)}',
              'Z: ${_getCurrentMagnetometer()?.z.toStringAsFixed(2)}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataChart(List<double> data, String label, Color color) {
    return Container(
      height: 150,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label),
          SizedBox(height: 8),
          Expanded(
            child: data.isEmpty
                ? Center(child: Text('等待数据...'))
                : LineChart(
                    LineChartData(
                      lineBarsData: [
                        LineChartBarData(
                          spots: data.asMap().entries.map((entry) {
                            return FlSpot(entry.key.toDouble(), entry.value);
                          }).toList(),
                          isCurved: true,
                          color: color,
                          strokeWidth: 2,
                        ),
                      ],
                      titlesData: FlTitlesData(show: false),
                      gridData: FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      minX: 0,
                      maxX: (data.length - 1).toDouble(),
                      minY: 0,
                      maxY: data.isNotEmpty ? data.reduce((a, b) => a > b ? a : b) * 1.2 : 1,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentValues(String x, String y, String z) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildValueChip('X', x, Colors.red),
        _buildValueChip('Y', y, Colors.green),
        _buildValueChip('Z', z, Colors.blue),
      ],
    );
  }

  Widget _buildValueChip(String label, String value, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _build3DVisualization() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '3D 方向可视化',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            Container(
              height: 200,
              child: Center(
                child: CustomPaint(
                  painter: CompassPainter(
                    accelerometer: _getCurrentAccelerometer(),
                    magnetometer: _getCurrentMagnetometer(),
                  ),
                  child: Container(
                    width: 200,
                    height: 200,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  AccelerometerData? _getCurrentAccelerometer() {
    return _accelerometerData.isNotEmpty ? _accelerometerData.last : null;
  }

  GyroscopeData? _getCurrentGyroscope() {
    return _gyroscopeData.isNotEmpty ? _gyroscopeData.last : null;
  }

  MagnetometerData? _getCurrentMagnetometer() {
    return _magnetometerData.isNotEmpty ? _magnetometerData.last : null;
  }

  Future<void> _startSensorListening() async {
    try {
      await _accelerometerManager.startListening();
      await _gyroscopeManager.startListening();
      await _magnetometerManager.startListening();

      _accelerometerManager.accelerometerStream.listen((data) {
        setState(() {
          _accelerometerData.add(data);
          if (_accelerometerData.length > 50) {
            _accelerometerData.removeAt(0);
          }
        });
      });

      _gyroscopeManager.gyroscopeStream.listen((data) {
        setState(() {
          _gyroscopeData.add(data);
          if (_gyroscopeData.length > 50) {
            _gyroscopeData.removeAt(0);
          }
        });
      });

      _magnetometerManager.magnetometerStream.listen((data) {
        setState(() {
          _magnetometerData.add(data);
          if (_magnetometerData.length > 50) {
            _magnetometerData.removeAt(0);
          }
        });
      });
    } catch (e) {
      _showErrorDialog('传感器启动失败', e.toString());
    }
  }

  void _stopSensorListening() {
    _accelerometerManager.stopListening();
    _gyroscopeManager.stopListening();
    _magnetometerManager.stopListening();
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('确定'),
          ),
        ],
      ),
    );
  }
}

class CompassPainter extends CustomPainter {
  final AccelerometerData? accelerometer;
  final MagnetometerData? magnetometer;

  CompassPainter({this.accelerometer, this.magnetometer});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 20;

    // 绘制外圆
    final paint = Paint()
      ..color = Colors.grey[300]!
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawCircle(center, radius, paint);

    // 绘制方向标记
    _drawDirectionMarks(canvas, center, radius);

    // 绘制指针
    if (magnetometer != null) {
      _drawCompassNeedle(canvas, center, radius, magnetometer!.heading);
    }
  }

  void _drawDirectionMarks(Canvas canvas, Offset center, double radius) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 2;

    // 绘制主要方向
    final directions = [
      {'text': 'N', 'angle': 0},
      {'text': 'E', 'angle': 90},
      {'text': 'S', 'angle': 180},
      {'text': 'W', 'angle': 270},
    ];

    for (final direction in directions) {
      final angle = direction['angle']! * math.pi / 180;
      final x = center.dx + radius * 0.8 * math.sin(angle);
      final y = center.dy - radius * 0.8 * math.cos(angle);

      canvas.drawCircle(Offset(x, y), 4, paint);

      final textPainter = TextPainter(
        text: TextSpan(
          text: direction['text'] as String,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        textDirection: TextDirection.ltr,
      );

      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(
          x - textPainter.width / 2,
          y - textPainter.height / 2,
        ),
      );
    }
  }

  void _drawCompassNeedle(Canvas canvas, Offset center, double radius, double heading) {
    final paint = Paint()
      ..color = Colors.red
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    final angle = heading * math.pi / 180;
    final needleLength = radius * 0.7;

    final endX = center.dx + needleLength * math.sin(angle);
    final endY = center.dy - needleLength * math.cos(angle);

    canvas.drawLine(center, Offset(endX, endY), paint);

    // 绘制中心点
    final centerPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;

    canvas.drawCircle(center, 8, centerPaint);
  }

  @override
  bool shouldRepaint(covariant CompassPainter oldDelegate) {
    return accelerometer != oldDelegate.accelerometer ||
           magnetometer != oldDelegate.magnetometer;
  }
}
```

## 故事结局：小陈的成功

经过几个月的开发，小陈的健身追踪应用终于完成了！应用能够准确监测用户的运动状态、步数、方向等信息，并提供直观的数据可视化。

"传感器技术为健身应用提供了丰富的数据源，通过合理的传感器融合和数据处理，我们打造出了专业的运动追踪体验。"小陈在项目总结中写道，"特别是功耗优化和数据滤波，确保了应用的实用性和稳定性。"

小陈的应用获得了用户的好评，特别是准确的运动检测和直观的数据展示。他的成功证明了：**掌握传感器桥接技术，是开发健康健身类应用的关键技能。**

## 总结

通过小陈的健身追踪应用开发故事，我们全面学习了 Flutter 传感器桥接技术：

### 核心技术

- **运动传感器**：加速度计、陀螺仪、磁力计
- **环境传感器**：光线传感器、距离传感器
- **传感器融合**：多传感器数据融合算法
- **姿态检测**：方向计算和运动识别

### 高级特性

- **步数检测**：基于加速度计的步数算法
- **数据滤波**：噪声过滤和数据平滑
- **功耗优化**：采样频率控制和传感器管理
- **数据可视化**：实时图表和 3D 可视化

### 最佳实践

- **权限管理**：传感器权限的申请和处理
- **性能优化**：数据缓存和内存管理
- **错误处理**：传感器异常和设备兼容性
- **用户体验**：直观的数据展示和反馈

传感器桥接技术为 Flutter 应用打开了物理世界感知的大门，让开发者能够构建出智能的感知应用。掌握这些技术，将帮助你在移动应用开发中创造更多可能！
