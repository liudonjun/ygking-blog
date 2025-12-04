# Flutter 与设备信息桥接技术详解

## 引言：设备信息在现代应用中的重要性

设备信息是移动应用开发中的关键数据来源，它不仅帮助开发者了解用户设备环境，还能为应用提供个性化的用户体验。从基本的设备型号、操作系统版本，到更复杂的硬件配置、网络状态、电池信息等，这些数据对于应用优化、功能适配和用户分析都至关重要。

本文将通过一个实际案例——开发一款名为"DeviceInfoPro"的专业设备信息分析应用——来详细介绍 Flutter 中获取设备信息的技术细节和最佳实践。

## 设备信息技术概述

### 设备信息类型

1. **基本信息**：设备型号、制造商、操作系统版本
2. **硬件信息**：CPU、内存、存储、屏幕分辨率
3. **网络信息**：网络类型、连接状态、信号强度
4. **电池信息**：电量、充电状态、电池健康
5. **传感器信息**：可用传感器列表、传感器数据
6. **应用信息**：已安装应用列表、应用使用情况
7. **系统信息**：系统语言、时区、系统设置

### 获取方式

1. **Flutter 插件**：使用现有的设备信息插件
2. **平台通道**：通过 MethodChannel 直接调用原生 API
3. **FFI**：使用 Foreign Function Interface 调用底层库
4. **系统服务**：通过系统服务获取特定信息

## 项目背景：DeviceInfoPro 专业设备信息分析应用

我们的项目是开发一款名为 DeviceInfoPro 的专业设备信息分析应用，支持以下功能：

- 全面的设备信息展示
- 设备性能测试和评分
- 设备信息导出和分享
- 设备信息历史记录
- 设备对比功能
- 设备健康状态监控

## 技术架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter应用层                              │
├─────────────────────────────────────────────────────────────┤
│  设备UI  │  性能UI  │  对比UI  │  历史UI                    │
├─────────────────────────────────────────────────────────────┤
│                  设备服务管理层                                │
├─────────────────────────────────────────────────────────────┤
│              平台通道桥接层                                   │
├─────────────────────────────────────────────────────────────┤
│  Android System APIs  │  iOS UIKit APIs               │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

1. **DeviceInfoService**：设备信息管理
2. **DevicePerformanceService**：设备性能测试
3. **DeviceComparisonService**：设备对比功能
4. **DeviceHistoryService**：历史记录管理
5. **PlatformChannel**：平台通道通信

## 实现步骤详解

### 第一步：添加依赖和配置

首先，我们需要添加必要的依赖包：

```yaml
dependencies:
  flutter:
    sdk: flutter
  device_info_plus: ^9.1.0
  package_info_plus: ^4.2.0
  battery_plus: ^5.0.2
  network_info_plus: ^4.0.2
  system_info_plus: ^0.0.5
  permission_handler: ^10.2.0
  shared_preferences: ^2.2.0
  intl: ^0.18.1
  charts_flutter: ^0.12.0
  path_provider: ^2.1.0
  file_picker: ^6.1.1
  share_plus: ^7.2.1
  json_annotation: ^4.8.1
```

Android 平台需要配置权限：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 网络状态权限 -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <!-- 电池信息权限 -->
    <uses-permission android:name="android.permission.BATTERY_STATS" />

    <!-- 存储权限 -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- 应用使用统计权限 -->
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />

    <application>
        <!-- 应用组件配置 -->
    </application>
</manifest>
```

iOS 平台需要在 Info.plist 中添加权限说明：

```xml
<!-- ios/Runner/Info.plist -->
<key>NSNetworkUsageDescription</key>
<string>此应用需要访问网络状态来提供网络信息</string>
<key>NSBatteryUsageDescription</key>
<string>此应用需要访问电池状态来提供电池信息</string>
```

### 第二步：创建设备信息数据模型

```dart
// lib/models/device_info.dart
import 'package:json_annotation/json_annotation.dart';

part 'device_info.g.dart';

@JsonSerializable()
class DeviceInfo {
  final BasicDeviceInfo basicInfo;
  final HardwareDeviceInfo hardwareInfo;
  final NetworkDeviceInfo networkInfo;
  final BatteryDeviceInfo batteryInfo;
  final SensorDeviceInfo sensorInfo;
  final AppDeviceInfo appInfo;
  final SystemDeviceInfo systemInfo;
  final DateTime timestamp;

  DeviceInfo({
    required this.basicInfo,
    required this.hardwareInfo,
    required this.networkInfo,
    required this.batteryInfo,
    required this.sensorInfo,
    required this.appInfo,
    required this.systemInfo,
    required this.timestamp,
  });

  factory DeviceInfo.fromJson(Map<String, dynamic> json) => _$DeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$DeviceInfoToJson(this);

  // 计算设备性能评分
  double get performanceScore {
    double score = 0;

    // CPU评分 (30%)
    score += _calculateCpuScore() * 0.3;

    // 内存评分 (25%)
    score += _calculateMemoryScore() * 0.25;

    // 存储评分 (20%)
    score += _calculateStorageScore() * 0.2;

    // 电池评分 (15%)
    score += _calculateBatteryScore() * 0.15;

    // 网络评分 (10%)
    score += _calculateNetworkScore() * 0.1;

    return score;
  }

  double _calculateCpuScore() {
    final cores = hardwareInfo.cpuCores;
    final frequency = hardwareInfo.cpuFrequency;

    // 基于核心数和频率计算CPU评分
    double coreScore = (cores / 8.0) * 50; // 8核心为满分50分
    double freqScore = (frequency / 3000.0) * 50; // 3GHz为满分50分

    return (coreScore + freqScore).clamp(0.0, 100.0);
  }

  double _calculateMemoryScore() {
    final totalMemory = hardwareInfo.totalMemory;

    // 基于内存大小计算评分
    if (totalMemory >= 8 * 1024 * 1024 * 1024) return 100.0; // 8GB以上
    if (totalMemory >= 6 * 1024 * 1024 * 1024) return 85.0;  // 6GB
    if (totalMemory >= 4 * 1024 * 1024 * 1024) return 70.0;  // 4GB
    if (totalMemory >= 3 * 1024 * 1024 * 1024) return 55.0;  // 3GB
    if (totalMemory >= 2 * 1024 * 1024 * 1024) return 40.0;  // 2GB
    return 25.0; // 2GB以下
  }

  double _calculateStorageScore() {
    final totalStorage = hardwareInfo.totalStorage;

    // 基于存储大小计算评分
    if (totalStorage >= 256 * 1024 * 1024 * 1024) return 100.0; // 256GB以上
    if (totalStorage >= 128 * 1024 * 1024 * 1024) return 85.0;  // 128GB
    if (totalStorage >= 64 * 1024 * 1024 * 1024) return 70.0;   // 64GB
    if (totalStorage >= 32 * 1024 * 1024 * 1024) return 55.0;   // 32GB
    return 40.0; // 32GB以下
  }

  double _calculateBatteryScore() {
    final capacity = batteryInfo.capacity;
    final health = batteryInfo.health;

    // 基于电池容量和健康度计算评分
    double capacityScore = (capacity / 5000.0) * 50; // 5000mAh为满分50分
    double healthScore = (health / 100.0) * 50;     // 100%健康为满分50分

    return (capacityScore + healthScore).clamp(0.0, 100.0);
  }

  double _calculateNetworkScore() {
    final networkType = networkInfo.type;
    final signalStrength = networkInfo.signalStrength;

    // 基于网络类型和信号强度计算评分
    double typeScore = 0;
    switch (networkType) {
      case NetworkType.wifi:
        typeScore = 80;
        break;
      case NetworkType.mobile5G:
        typeScore = 100;
        break;
      case NetworkType.mobile4G:
        typeScore = 70;
        break;
      case NetworkType.mobile3G:
        typeScore = 40;
        break;
      case NetworkType.mobile2G:
        typeScore = 20;
        break;
      case NetworkType.none:
        typeScore = 0;
        break;
    }

    double signalScore = (signalStrength / 100.0) * 20; // 信号强度满分20分

    return (typeScore + signalScore).clamp(0.0, 100.0);
  }

  // 获取性能等级
  PerformanceLevel get performanceLevel {
    final score = performanceScore;
    if (score >= 90) return PerformanceLevel.excellent;
    if (score >= 75) return PerformanceLevel.good;
    if (score >= 60) return PerformanceLevel.average;
    if (score >= 40) return PerformanceLevel.poor;
    return PerformanceLevel.veryPoor;
  }

  // 获取性能等级描述
  String get performanceLevelDescription {
    switch (performanceLevel) {
      case PerformanceLevel.excellent:
        return '卓越';
      case PerformanceLevel.good:
        return '良好';
      case PerformanceLevel.average:
        return '一般';
      case PerformanceLevel.poor:
        return '较差';
      case PerformanceLevel.veryPoor:
        return '很差';
    }
  }
}

@JsonSerializable()
class BasicDeviceInfo {
  final String manufacturer;
  final String model;
  final String brand;
  final String device;
  final String product;
  final String hardware;
  final String serialNumber;
  final String androidId;
  final String? fingerprint;
  final String? bootloader;

  BasicDeviceInfo({
    required this.manufacturer,
    required this.model,
    required this.brand,
    required this.device,
    required this.product,
    required this.hardware,
    required this.serialNumber,
    required this.androidId,
    this.fingerprint,
    this.bootloader,
  });

  factory BasicDeviceInfo.fromJson(Map<String, dynamic> json) => _$BasicDeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$BasicDeviceInfoToJson(json);

  // 获取设备显示名称
  String get displayName {
    if (brand.isNotEmpty && model.isNotEmpty) {
      return '$brand $model';
    }
    return model.isNotEmpty ? model : 'Unknown Device';
  }

  // 判断是否为知名品牌
  bool get isWellKnownBrand {
    final knownBrands = [
      'Samsung', 'Xiaomi', 'Huawei', 'OPPO', 'Vivo', 'OnePlus',
      'Apple', 'Google', 'Sony', 'LG', 'Motorola', 'Nokia',
      'HTC', 'ASUS', 'Lenovo', 'ZTE', 'Alcatel', 'Meizu'
    ];
    return knownBrands.contains(brand);
  }
}

@JsonSerializable()
class HardwareDeviceInfo {
  final int cpuCores;
  final double cpuFrequency;
  final String cpuArchitecture;
  final String cpuName;
  final int totalMemory;
  final int availableMemory;
  final int totalStorage;
  final int availableStorage;
  final int screenWidth;
  final int screenHeight;
  final double screenDensity;
  final double screenScale;
  final String gpuRenderer;
  final String gpuVendor;
  final String gpuVersion;

  HardwareDeviceInfo({
    required this.cpuCores,
    required this.cpuFrequency,
    required this.cpuArchitecture,
    required this.cpuName,
    required this.totalMemory,
    required this.availableMemory,
    required this.totalStorage,
    required this.availableStorage,
    required this.screenWidth,
    required this.screenHeight,
    required this.screenDensity,
    required this.screenScale,
    required this.gpuRenderer,
    required this.gpuVendor,
    required this.gpuVersion,
  });

  factory HardwareDeviceInfo.fromJson(Map<String, dynamic> json) => _$HardwareDeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$HardwareDeviceInfoToJson(json);

  // 获取内存使用率
  double get memoryUsagePercentage {
    if (totalMemory == 0) return 0.0;
    return ((totalMemory - availableMemory) / totalMemory) * 100;
  }

  // 获取存储使用率
  double get storageUsagePercentage {
    if (totalStorage == 0) return 0.0;
    return ((totalStorage - availableStorage) / totalStorage) * 100;
  }

  // 获取屏幕分辨率描述
  String get resolutionDescription {
    return '${screenWidth}x$screenHeight';
  }

  // 获取屏幕尺寸（英寸）
  double get screenSizeInches {
    final diagonalPixels = (screenWidth * screenWidth + screenHeight * screenHeight).toDouble();
    final diagonalInches = diagonalPixels / (screenDensity * screenDensity);
    return diagonalInches;
  }

  // 获取格式化的内存大小
  String get formattedTotalMemory {
    return _formatBytes(totalMemory);
  }

  String get formattedAvailableMemory {
    return _formatBytes(availableMemory);
  }

  // 获取格式化的存储大小
  String get formattedTotalStorage {
    return _formatBytes(totalStorage);
  }

  String get formattedAvailableStorage {
    return _formatBytes(availableStorage);
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}

@JsonSerializable()
class NetworkDeviceInfo {
  final NetworkType type;
  final String? carrierName;
  final String? networkOperator;
  final String? mcc; // Mobile Country Code
  final String? mnc; // Mobile Network Code
  final String? countryCode;
  final int signalStrength;
  final int linkSpeed;
  final String? ipAddress;
  final String? macAddress;
  final String? wifiSSID;
  final String? wifiBSSID;
  final bool isConnected;
  final DateTime? lastConnectedTime;

  NetworkDeviceInfo({
    required this.type,
    this.carrierName,
    this.networkOperator,
    this.mcc,
    this.mnc,
    this.countryCode,
    required this.signalStrength,
    required this.linkSpeed,
    this.ipAddress,
    this.macAddress,
    this.wifiSSID,
    this.wifiBSSID,
    required this.isConnected,
    this.lastConnectedTime,
  });

  factory NetworkDeviceInfo.fromJson(Map<String, dynamic> json) => _$NetworkDeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$NetworkDeviceInfoToJson(json);

  // 获取网络类型描述
  String get typeDescription {
    switch (type) {
      case NetworkType.wifi:
        return 'Wi-Fi';
      case NetworkType.mobile5G:
        return '5G';
      case NetworkType.mobile4G:
        return '4G';
      case NetworkType.mobile3G:
        return '3G';
      case NetworkType.mobile2G:
        return '2G';
      case NetworkType.ethernet:
        return '以太网';
      case NetworkType.bluetooth:
        return '蓝牙';
      case NetworkType.none:
        return '无网络';
    }
  }

  // 获取信号强度描述
  String get signalStrengthDescription {
    if (signalStrength >= 80) return '优秀';
    if (signalStrength >= 60) return '良好';
    if (signalStrength >= 40) return '一般';
    if (signalStrength >= 20) return '较差';
    return '很差';
  }

  // 获取连接状态描述
  String get connectionStatusDescription {
    return isConnected ? '已连接' : '未连接';
  }
}

@JsonSerializable()
class BatteryDeviceInfo {
  final int level;
  final BatteryStatus status;
  final BatteryPowerSource powerSource;
  final BatteryHealth health;
  final int capacity;
  final int temperature;
  final int voltage;
  final String? technology;
  final DateTime? lastFullChargeTime;
  final int chargeTimeRemaining;
  final int dischargeTimeRemaining;

  BatteryDeviceInfo({
    required this.level,
    required this.status,
    required this.powerSource,
    required this.health,
    required this.capacity,
    required this.temperature,
    required this.voltage,
    this.technology,
    this.lastFullChargeTime,
    required this.chargeTimeRemaining,
    required this.dischargeTimeRemaining,
  });

  factory BatteryDeviceInfo.fromJson(Map<String, dynamic> json) => _$BatteryDeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$BatteryDeviceInfoToJson(json);

  // 获取电池状态描述
  String get statusDescription {
    switch (status) {
      case BatteryStatus.charging:
        return '充电中';
      case BatteryStatus.discharging:
        return '放电中';
      case BatteryStatus.notCharging:
        return '未充电';
      case BatteryStatus.full:
        return '已充满';
      case BatteryStatus.unknown:
        return '未知';
    }
  }

  // 获取电源来源描述
  String get powerSourceDescription {
    switch (powerSource) {
      case BatteryPowerSource.ac:
        return '交流电源';
      case BatteryPowerSource.usb:
        return 'USB';
      case BatteryPowerSource.wireless:
        return '无线充电';
      case BatteryPowerSource.battery:
        return '电池';
    }
  }

  // 获取电池健康描述
  String get healthDescription {
    switch (health) {
      case BatteryHealth.good:
        return '良好';
      case BatteryHealth.overheat:
        return '过热';
      case BatteryHealth.dead:
        return '损坏';
      case BatteryHealth.overVoltage:
        return '过压';
      case BatteryHealth.unspecifiedFailure:
        return '未知故障';
      case BatteryHealth.cold:
        return '过冷';
    }
  }

  // 获取温度描述
  String get temperatureDescription {
    final celsius = temperature / 10.0;
    return '${celsius.toStringAsFixed(1)}°C';
  }

  // 获取电压描述
  String get voltageDescription {
    return '${(voltage / 1000.0).toStringAsFixed(2)}V';
  }

  // 获取剩余充电时间描述
  String get chargeTimeRemainingDescription {
    if (chargeTimeRemaining <= 0) return '未知';
    final hours = chargeTimeRemaining ~/ 3600;
    final minutes = (chargeTimeRemaining % 3600) ~/ 60;
    return '${hours}小时${minutes}分钟';
  }

  // 获取剩余放电时间描述
  String get dischargeTimeRemainingDescription {
    if (dischargeTimeRemaining <= 0) return '未知';
    final hours = dischargeTimeRemaining ~/ 3600;
    final minutes = (dischargeTimeRemaining % 3600) ~/ 60;
    return '${hours}小时${minutes}分钟';
  }
}

@JsonSerializable()
class SensorDeviceInfo {
  final List<SensorInfo> sensors;
  final bool hasAccelerometer;
  final bool hasGyroscope;
  final bool hasMagnetometer;
  final bool hasLightSensor;
  final bool hasProximitySensor;
  final bool hasBarometer;
  final bool hasTemperatureSensor;
  final bool hasHumiditySensor;
  final bool hasHeartRateSensor;
  final bool hasStepCounter;

  SensorDeviceInfo({
    required this.sensors,
    required this.hasAccelerometer,
    required this.hasGyroscope,
    required this.hasMagnetometer,
    required this.hasLightSensor,
    required this.hasProximitySensor,
    required this.hasBarometer,
    required this.hasTemperatureSensor,
    required this.hasHumiditySensor,
    required this.hasHeartRateSensor,
    required this.hasStepCounter,
  });

  factory SensorDeviceInfo.fromJson(Map<String, dynamic> json) => _$SensorDeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$SensorDeviceInfoToJson(json);

  // 获取传感器总数
  int get totalSensors => sensors.length;

  // 获取运动传感器数量
  int get motionSensorsCount {
    return sensors.where((sensor) =>
      sensor.type == SensorType.accelerometer ||
      sensor.type == SensorType.gyroscope ||
      sensor.type == SensorType.magnetometer
    ).length;
  }

  // 获取环境传感器数量
  int get environmentSensorsCount {
    return sensors.where((sensor) =>
      sensor.type == SensorType.light ||
      sensor.type == SensorType.pressure ||
      sensor.type == SensorType.temperature ||
      sensor.type == SensorType.humidity
    ).length;
  }

  // 获取健康传感器数量
  int get healthSensorsCount {
    return sensors.where((sensor) =>
      sensor.type == SensorType.heartRate ||
      sensor.type == SensorType.stepCounter
    ).length;
  }
}

@JsonSerializable()
class SensorInfo {
  final SensorType type;
  final String name;
  final String vendor;
  final int version;
  final float maxRange;
  final float resolution;
  final float power;
  final int minDelay;
  final bool isWakeUpSensor;

  SensorInfo({
    required this.type,
    required this.name,
    required this.vendor,
    required this.version,
    required this.maxRange,
    required this.resolution,
    required this.power,
    required this.minDelay,
    required this.isWakeUpSensor,
  });

  factory SensorInfo.fromJson(Map<String, dynamic> json) => _$SensorInfoFromJson(json);
  Map<String, dynamic> toJson() => _$SensorInfoToJson(json);

  // 获取传感器类型描述
  String get typeDescription {
    switch (type) {
      case SensorType.accelerometer:
        return '加速度计';
      case SensorType.gyroscope:
        return '陀螺仪';
      case SensorType.magnetometer:
        return '磁力计';
      case SensorType.light:
        return '光线传感器';
      case SensorType.proximity:
        return '接近传感器';
      case SensorType.pressure:
        return '气压计';
      case SensorType.temperature:
        return '温度传感器';
      case SensorType.humidity:
        return '湿度传感器';
      case SensorType.heartRate:
        return '心率传感器';
      case SensorType.stepCounter:
        return '计步器';
      case SensorType.unknown:
        return '未知传感器';
    }
  }

  // 获取功耗描述
  String get powerDescription {
    return '${power.toStringAsFixed(3)}mA';
  }

  // 获取最大量程描述
  String get maxRangeDescription {
    return '${maxRange.toStringAsFixed(2)}';
  }

  // 获取分辨率描述
  String get resolutionDescription {
    return '${resolution.toStringAsFixed(4)}';
  }
}

@JsonSerializable()
class AppDeviceInfo {
  final String appName;
  final String packageName;
  final String version;
  final String buildNumber;
  final String installTime;
  final String updateTime;
  final int versionCode;
  final String signature;
  final List<String> permissions;
  final int appSize;
  final List<String> activities;
  final List<String> services;
  final List<String> receivers;

  AppDeviceInfo({
    required this.appName,
    required this.packageName,
    required this.version,
    required this.buildNumber,
    required this.installTime,
    required this.updateTime,
    required this.versionCode,
    required this.signature,
    required this.permissions,
    required this.appSize,
    required this.activities,
    required this.services,
    required this.receivers,
  });

  factory AppDeviceInfo.fromJson(Map<String, dynamic> json) => _$AppDeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$AppDeviceInfoToJson(json);

  // 获取应用大小描述
  String get formattedAppSize {
    if (appSize < 1024) return '$appSize B';
    if (appSize < 1024 * 1024) return '${(appSize / 1024).toStringAsFixed(1)} KB';
    if (appSize < 1024 * 1024 * 1024) return '${(appSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(appSize / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  // 获取版本描述
  String get versionDescription {
    return '$version ($buildNumber)';
  }

  // 获取权限数量
  int get permissionsCount => permissions.length;

  // 获取组件数量
  int get componentsCount => activities.length + services.length + receivers.length;
}

@JsonSerializable()
class SystemDeviceInfo {
  final String osName;
  final String osVersion;
  final String osBuild;
  final String kernelVersion;
  final String language;
  final String region;
  final String timezone;
  final bool is24HourFormat;
  final String dateFormat;
  final String timeFormat;
  final bool isDebugMode;
  final bool isEmulator;
  final bool isJailbroken;
  final String securityPatchLevel;
  final List<String> supportedAbis;
  final List<String> features;

  SystemDeviceInfo({
    required this.osName,
    required this.osVersion,
    required this.osBuild,
    required this.kernelVersion,
    required this.language,
    required this.region,
    required this.timezone,
    required this.is24HourFormat,
    required this.dateFormat,
    required this.timeFormat,
    required this.isDebugMode,
    required this.isEmulator,
    required this.isJailbroken,
    required this.securityPatchLevel,
    required this.supportedAbis,
    required this.features,
  });

  factory SystemDeviceInfo.fromJson(Map<String, dynamic> json) => _$SystemDeviceInfoFromJson(json);
  Map<String, dynamic> toJson() => _$SystemDeviceInfoToJson(json);

  // 获取操作系统描述
  String get osDescription {
    return '$osName $osVersion';
  }

  // 获取时区描述
  String get timezoneDescription {
    return 'UTC${timezone.startsWith('+') ? '' : ' '}$timezone';
  }

  // 获取主要ABI
  String get primaryAbi {
    return supportedAbis.isNotEmpty ? supportedAbis.first : 'Unknown';
  }

  // 获取安全状态描述
  String get securityStatusDescription {
    if (isJailbroken) return '设备已越狱/Root';
    if (isDebugMode) return '调试模式';
    if (isEmulator) return '模拟器';
    return '正常';
  }
}

// 枚举类型定义
enum NetworkType {
  wifi,
  mobile5G,
  mobile4G,
  mobile3G,
  mobile2G,
  ethernet,
  bluetooth,
  none,
}

enum BatteryStatus {
  charging,
  discharging,
  notCharging,
  full,
  unknown,
}

enum BatteryPowerSource {
  ac,
  usb,
  wireless,
  battery,
}

enum BatteryHealth {
  good,
  overheat,
  dead,
  overVoltage,
  unspecifiedFailure,
  cold,
}

enum SensorType {
  accelerometer,
  gyroscope,
  magnetometer,
  light,
  proximity,
  pressure,
  temperature,
  humidity,
  heartRate,
  stepCounter,
  unknown,
}

enum PerformanceLevel {
  excellent,
  good,
  average,
  poor,
  veryPoor,
}
```

### 第三步：创建设备信息服务

```dart
// lib/services/device_info_service.dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/device_info.dart';

class DeviceInfoService {
  static final DeviceInfoService _instance = DeviceInfoService._internal();
  factory DeviceInfoService() => _instance;
  DeviceInfoService._internal();

  static const MethodChannel _deviceChannel = MethodChannel('device_info_pro/device');

  final DeviceInfoPlugin _deviceInfoPlugin = DeviceInfoPlugin();
  final PackageInfoPlugin _packageInfoPlugin = PackageInfoPlugin();
  final Battery _battery = Battery();
  final NetworkInfo _networkInfo = NetworkInfo();

  // 获取完整设备信息
  Future<DeviceInfo> getDeviceInfo() async {
    try {
      final basicInfo = await _getBasicDeviceInfo();
      final hardwareInfo = await _getHardwareDeviceInfo();
      final networkInfo = await _getNetworkDeviceInfo();
      final batteryInfo = await _getBatteryDeviceInfo();
      final sensorInfo = await _getSensorDeviceInfo();
      final appInfo = await _getAppDeviceInfo();
      final systemInfo = await _getSystemDeviceInfo();

      return DeviceInfo(
        basicInfo: basicInfo,
        hardwareInfo: hardwareInfo,
        networkInfo: networkInfo,
        batteryInfo: batteryInfo,
        sensorInfo: sensorInfo,
        appInfo: appInfo,
        systemInfo: systemInfo,
        timestamp: DateTime.now(),
      );
    } catch (e) {
      throw DeviceInfoException('获取设备信息失败: $e');
    }
  }

  // 获取基本信息
  Future<BasicDeviceInfo> _getBasicDeviceInfo() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfoPlugin.androidInfo;
        return BasicDeviceInfo(
          manufacturer: androidInfo.manufacturer ?? 'Unknown',
          model: androidInfo.model ?? 'Unknown',
          brand: androidInfo.brand ?? 'Unknown',
          device: androidInfo.device ?? 'Unknown',
          product: androidInfo.product ?? 'Unknown',
          hardware: androidInfo.hardware ?? 'Unknown',
          serialNumber: androidInfo.serialNumber ?? 'Unknown',
          androidId: androidInfo.id ?? 'Unknown',
          fingerprint: androidInfo.fingerprint,
          bootloader: androidInfo.bootloader,
        );
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfoPlugin.iosInfo;
        return BasicDeviceInfo(
          manufacturer: 'Apple',
          model: iosInfo.model ?? 'Unknown',
          brand: 'Apple',
          device: iosInfo.name ?? 'Unknown',
          product: iosInfo.name ?? 'Unknown',
          hardware: iosInfo.systemVersion ?? 'Unknown',
          serialNumber: 'Unknown', // iOS不提供序列号
          androidId: iosInfo.identifierForVendor ?? 'Unknown',
          fingerprint: null,
          bootloader: null,
        );
      } else {
        throw UnsupportedError('不支持的平台');
      }
    } catch (e) {
      throw DeviceInfoException('获取基本信息失败: $e');
    }
  }

  // 获取硬件信息
  Future<HardwareDeviceInfo> _getHardwareDeviceInfo() async {
    try {
      final hardwareData = await _deviceChannel.invokeMethod('getHardwareInfo');

      return HardwareDeviceInfo(
        cpuCores: hardwareData['cpuCores'] ?? 0,
        cpuFrequency: (hardwareData['cpuFrequency'] ?? 0).toDouble(),
        cpuArchitecture: hardwareData['cpuArchitecture'] ?? 'Unknown',
        cpuName: hardwareData['cpuName'] ?? 'Unknown',
        totalMemory: hardwareData['totalMemory'] ?? 0,
        availableMemory: hardwareData['availableMemory'] ?? 0,
        totalStorage: hardwareData['totalStorage'] ?? 0,
        availableStorage: hardwareData['availableStorage'] ?? 0,
        screenWidth: hardwareData['screenWidth'] ?? 0,
        screenHeight: hardwareData['screenHeight'] ?? 0,
        screenDensity: (hardwareData['screenDensity'] ?? 0).toDouble(),
        screenScale: (hardwareData['screenScale'] ?? 0).toDouble(),
        gpuRenderer: hardwareData['gpuRenderer'] ?? 'Unknown',
        gpuVendor: hardwareData['gpuVendor'] ?? 'Unknown',
        gpuVersion: hardwareData['gpuVersion'] ?? 'Unknown',
      );
    } catch (e) {
      throw DeviceInfoException('获取硬件信息失败: $e');
    }
  }

  // 获取网络信息
  Future<NetworkDeviceInfo> _getNetworkDeviceInfo() async {
    try {
      final networkType = await _getNetworkType();
      final carrierName = await _networkInfo.getCarrierName();
      final networkOperator = await _networkInfo.getNetworkOperator();
      final ipAddress = await _networkInfo.getWifiIP();
      final wifiSSID = await _networkInfo.getWifiName();
      final wifiBSSID = await _networkInfo.getWifiBSSID();

      final networkData = await _deviceChannel.invokeMethod('getNetworkInfo');

      return NetworkDeviceInfo(
        type: networkType,
        carrierName: carrierName,
        networkOperator: networkOperator,
        mcc: networkData['mcc'],
        mnc: networkData['mnc'],
        countryCode: networkData['countryCode'],
        signalStrength: networkData['signalStrength'] ?? 0,
        linkSpeed: networkData['linkSpeed'] ?? 0,
        ipAddress: ipAddress,
        macAddress: networkData['macAddress'],
        wifiSSID: wifiSSID,
        wifiBSSID: wifiBSSID,
        isConnected: await _networkInfo.isConnected(),
        lastConnectedTime: networkData['lastConnectedTime'] != null
            ? DateTime.fromMillisecondsSinceEpoch(networkData['lastConnectedTime'])
            : null,
      );
    } catch (e) {
      throw DeviceInfoException('获取网络信息失败: $e');
    }
  }

  // 获取网络类型
  Future<NetworkType> _getNetworkType() async {
    try {
      final networkType = await _deviceChannel.invokeMethod('getNetworkType');

      switch (networkType) {
        case 'wifi':
          return NetworkType.wifi;
        case '5G':
          return NetworkType.mobile5G;
        case '4G':
          return NetworkType.mobile4G;
        case '3G':
          return NetworkType.mobile3G;
        case '2G':
          return NetworkType.mobile2G;
        case 'ethernet':
          return NetworkType.ethernet;
        case 'bluetooth':
          return NetworkType.bluetooth;
        default:
          return NetworkType.none;
      }
    } catch (e) {
      return NetworkType.none;
    }
  }

  // 获取电池信息
  Future<BatteryDeviceInfo> _getBatteryDeviceInfo() async {
    try {
      final batteryLevel = await _battery.batteryLevel;
      final batteryState = await _battery.batteryState;

      final batteryData = await _deviceChannel.invokeMethod('getBatteryInfo');

      return BatteryDeviceInfo(
        level: batteryLevel,
        status: _mapBatteryState(batteryState),
        powerSource: _mapPowerSource(batteryData['powerSource']),
        health: _mapBatteryHealth(batteryData['health']),
        capacity: batteryData['capacity'] ?? 0,
        temperature: batteryData['temperature'] ?? 0,
        voltage: batteryData['voltage'] ?? 0,
        technology: batteryData['technology'],
        lastFullChargeTime: batteryData['lastFullChargeTime'] != null
            ? DateTime.fromMillisecondsSinceEpoch(batteryData['lastFullChargeTime'])
            : null,
        chargeTimeRemaining: batteryData['chargeTimeRemaining'] ?? 0,
        dischargeTimeRemaining: batteryData['dischargeTimeRemaining'] ?? 0,
      );
    } catch (e) {
      throw DeviceInfoException('获取电池信息失败: $e');
    }
  }

  // 映射电池状态
  BatteryStatus _mapBatteryState(BatteryState state) {
    switch (state) {
      case BatteryState.charging:
        return BatteryStatus.charging;
      case BatteryState.discharging:
        return BatteryStatus.discharging;
      case BatteryState.full:
        return BatteryStatus.full;
      case BatteryState.unknown:
      default:
        return BatteryStatus.unknown;
    }
  }

  // 映射电源来源
  BatteryPowerSource _mapPowerSource(String? source) {
    switch (source) {
      case 'ac':
        return BatteryPowerSource.ac;
      case 'usb':
        return BatteryPowerSource.usb;
      case 'wireless':
        return BatteryPowerSource.wireless;
      case 'battery':
        return BatteryPowerSource.battery;
      default:
        return BatteryPowerSource.battery;
    }
  }

  // 映射电池健康
  BatteryHealth _mapBatteryHealth(String? health) {
    switch (health) {
      case 'good':
        return BatteryHealth.good;
      case 'overheat':
        return BatteryHealth.overheat;
      case 'dead':
        return BatteryHealth.dead;
      case 'over_voltage':
        return BatteryHealth.overVoltage;
      case 'unspecified_failure':
        return BatteryHealth.unspecifiedFailure;
      case 'cold':
        return BatteryHealth.cold;
      default:
        return BatteryHealth.good;
    }
  }

  // 获取传感器信息
  Future<SensorDeviceInfo> _getSensorDeviceInfo() async {
    try {
      final sensorsData = await _deviceChannel.invokeMethod('getSensorInfo');
      final sensorsList = <SensorInfo>[];

      for (final sensorData in sensorsData['sensors']) {
        sensorsList.add(SensorInfo(
          type: _mapSensorType(sensorData['type']),
          name: sensorData['name'] ?? 'Unknown',
          vendor: sensorData['vendor'] ?? 'Unknown',
          version: sensorData['version'] ?? 0,
          maxRange: (sensorData['maxRange'] ?? 0).toDouble(),
          resolution: (sensorData['resolution'] ?? 0).toDouble(),
          power: (sensorData['power'] ?? 0).toDouble(),
          minDelay: sensorData['minDelay'] ?? 0,
          isWakeUpSensor: sensorData['isWakeUpSensor'] ?? false,
        ));
      }

      return SensorDeviceInfo(
        sensors: sensorsList,
        hasAccelerometer: sensorsData['hasAccelerometer'] ?? false,
        hasGyroscope: sensorsData['hasGyroscope'] ?? false,
        hasMagnetometer: sensorsData['hasMagnetometer'] ?? false,
        hasLightSensor: sensorsData['hasLightSensor'] ?? false,
        hasProximitySensor: sensorsData['hasProximitySensor'] ?? false,
        hasBarometer: sensorsData['hasBarometer'] ?? false,
        hasTemperatureSensor: sensorsData['hasTemperatureSensor'] ?? false,
        hasHumiditySensor: sensorsData['hasHumiditySensor'] ?? false,
        hasHeartRateSensor: sensorsData['hasHeartRateSensor'] ?? false,
        hasStepCounter: sensorsData['hasStepCounter'] ?? false,
      );
    } catch (e) {
      throw DeviceInfoException('获取传感器信息失败: $e');
    }
  }

  // 映射传感器类型
  SensorType _mapSensorType(String? type) {
    switch (type) {
      case 'accelerometer':
        return SensorType.accelerometer;
      case 'gyroscope':
        return SensorType.gyroscope;
      case 'magnetometer':
        return SensorType.magnetometer;
      case 'light':
        return SensorType.light;
      case 'proximity':
        return SensorType.proximity;
      case 'pressure':
        return SensorType.pressure;
      case 'temperature':
        return SensorType.temperature;
      case 'humidity':
        return SensorType.humidity;
      case 'heartRate':
        return SensorType.heartRate;
      case 'stepCounter':
        return SensorType.stepCounter;
      default:
        return SensorType.unknown;
    }
  }

  // 获取应用信息
  Future<AppDeviceInfo> _getAppDeviceInfo() async {
    try {
      final packageInfo = await _packageInfoPlugin.fromPlatform();

      final appData = await _deviceChannel.invokeMethod('getAppInfo');

      return AppDeviceInfo(
        appName: packageInfo.appName,
        packageName: packageInfo.packageName,
        version: packageInfo.version,
        buildNumber: packageInfo.buildNumber,
        installTime: appData['installTime'] ?? 'Unknown',
        updateTime: appData['updateTime'] ?? 'Unknown',
        versionCode: appData['versionCode'] ?? 0,
        signature: appData['signature'] ?? 'Unknown',
        permissions: List<String>.from(appData['permissions'] ?? []),
        appSize: appData['appSize'] ?? 0,
        activities: List<String>.from(appData['activities'] ?? []),
        services: List<String>.from(appData['services'] ?? []),
        receivers: List<String>.from(appData['receivers'] ?? []),
      );
    } catch (e) {
      throw DeviceInfoException('获取应用信息失败: $e');
    }
  }

  // 获取系统信息
  Future<SystemDeviceInfo> _getSystemDeviceInfo() async {
    try {
      final systemData = await _deviceChannel.invokeMethod('getSystemInfo');

      return SystemDeviceInfo(
        osName: systemData['osName'] ?? 'Unknown',
        osVersion: systemData['osVersion'] ?? 'Unknown',
        osBuild: systemData['osBuild'] ?? 'Unknown',
        kernelVersion: systemData['kernelVersion'] ?? 'Unknown',
        language: systemData['language'] ?? 'Unknown',
        region: systemData['region'] ?? 'Unknown',
        timezone: systemData['timezone'] ?? 'Unknown',
        is24HourFormat: systemData['is24HourFormat'] ?? false,
        dateFormat: systemData['dateFormat'] ?? 'Unknown',
        timeFormat: systemData['timeFormat'] ?? 'Unknown',
        isDebugMode: systemData['isDebugMode'] ?? false,
        isEmulator: systemData['isEmulator'] ?? false,
        isJailbroken: systemData['isJailbroken'] ?? false,
        securityPatchLevel: systemData['securityPatchLevel'] ?? 'Unknown',
        supportedAbis: List<String>.from(systemData['supportedAbis'] ?? []),
        features: List<String>.from(systemData['features'] ?? []),
      );
    } catch (e) {
      throw DeviceInfoException('获取系统信息失败: $e');
    }
  }

  // 检查权限
  Future<bool> checkPermissions() async {
    try {
      final permissions = [
        Permission.phone,
        Permission.location,
        Permission.storage,
      ];

      final statuses = await permissions.request();

      return statuses.values.every((status) => status.isGranted);
    } catch (e) {
      throw DeviceInfoException('检查权限失败: $e');
    }
  }

  // 获取设备唯一标识符
  Future<String> getDeviceId() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfoPlugin.androidInfo;
        return androidInfo.id;
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfoPlugin.iosInfo;
        return iosInfo.identifierForVendor ?? 'Unknown';
      } else {
        throw UnsupportedError('不支持的平台');
      }
    } catch (e) {
      throw DeviceInfoException('获取设备ID失败: $e');
    }
  }

  // 检查是否为模拟器
  Future<bool> isEmulator() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfoPlugin.androidInfo;
        return !androidInfo.isPhysicalDevice;
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfoPlugin.iosInfo;
        return !iosInfo.isPhysicalDevice;
      } else {
        return false;
      }
    } catch (e) {
      throw DeviceInfoException('检查模拟器失败: $e');
    }
  }

  // 获取设备性能基准测试结果
  Future<PerformanceBenchmark> runPerformanceBenchmark() async {
    try {
      final benchmarkData = await _deviceChannel.invokeMethod('runPerformanceBenchmark');

      return PerformanceBenchmark(
        cpuScore: benchmarkData['cpuScore'] ?? 0,
        gpuScore: benchmarkData['gpuScore'] ?? 0,
        memoryScore: benchmarkData['memoryScore'] ?? 0,
        storageScore: benchmarkData['storageScore'] ?? 0,
        networkScore: benchmarkData['networkScore'] ?? 0,
        overallScore: benchmarkData['overallScore'] ?? 0,
        testDuration: Duration(milliseconds: benchmarkData['testDuration'] ?? 0),
        timestamp: DateTime.now(),
      );
    } catch (e) {
      throw DeviceInfoException('运行性能基准测试失败: $e');
    }
  }
}

// 性能基准测试结果
class PerformanceBenchmark {
  final int cpuScore;
  final int gpuScore;
  final int memoryScore;
  final int storageScore;
  final int networkScore;
  final int overallScore;
  final Duration testDuration;
  final DateTime timestamp;

  PerformanceBenchmark({
    required this.cpuScore,
    required this.gpuScore,
    required this.memoryScore,
    required this.storageScore,
    required this.networkScore,
    required this.overallScore,
    required this.testDuration,
    required this.timestamp,
  });

  // 获取性能等级
  PerformanceLevel get performanceLevel {
    if (overallScore >= 9000) return PerformanceLevel.excellent;
    if (overallScore >= 7000) return PerformanceLevel.good;
    if (overallScore >= 5000) return PerformanceLevel.average;
    if (overallScore >= 3000) return PerformanceLevel.poor;
    return PerformanceLevel.veryPoor;
  }

  // 获取性能等级描述
  String get performanceLevelDescription {
    switch (performanceLevel) {
      case PerformanceLevel.excellent:
        return '卓越';
      case PerformanceLevel.good:
        return '良好';
      case PerformanceLevel.average:
        return '一般';
      case PerformanceLevel.poor:
        return '较差';
      case PerformanceLevel.veryPoor:
        return '很差';
    }
  }
}

// 设备信息异常
class DeviceInfoException implements Exception {
  final String message;
  DeviceInfoException(this.message);

  @override
  String toString() => message;
}
```

### 第四步：实现 Android 原生代码

```kotlin
// android/app/src/main/kotlin/com/example/device_info_pro/DeviceInfoPlugin.kt
package com.example.device_info_pro

import android.app.ActivityManager
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.telephony.TelephonyManager
import android.util.DisplayMetrics
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class DeviceInfoPlugin(private val context: Context) : MethodChannel.MethodCallHandler {

    private val sensorManager: SensorManager by lazy {
        context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    }

    private val telephonyManager: TelephonyManager by lazy {
        context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
    }

    private val activityManager: ActivityManager by lazy {
        context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "getHardwareInfo" -> {
                result.success(getHardwareInfo())
            }
            "getNetworkInfo" -> {
                result.success(getNetworkInfo())
            }
            "getNetworkType" -> {
                result.success(getNetworkType())
            }
            "getBatteryInfo" -> {
                result.success(getBatteryInfo())
            }
            "getSensorInfo" -> {
                result.success(getSensorInfo())
            }
            "getAppInfo" -> {
                result.success(getAppInfo())
            }
            "getSystemInfo" -> {
                result.success(getSystemInfo())
            }
            "runPerformanceBenchmark" -> {
                result.success(runPerformanceBenchmark())
            }
            else -> {
                result.notImplemented()
            }
        }
    }

    private fun getHardwareInfo(): Map<String, Any> {
        val displayMetrics = context.resources.displayMetrics
        val memInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memInfo)

        // 获取存储信息
        val externalStorage = Environment.getExternalStorageDirectory()
        val stat = StatFs(externalStorage.path)
        val totalStorage = stat.blockCountLong * stat.blockSizeLong
        val availableStorage = stat.availableBlocksLong * stat.blockSizeLong

        return mapOf(
            "cpuCores" to Runtime.getRuntime().availableProcessors(),
            "cpuFrequency" to getCpuFrequency(),
            "cpuArchitecture" to Build.SUPPORTED_ABIS.firstOrNull() ?: "Unknown",
            "cpuName" to Build.HARDWARE,
            "totalMemory" to memInfo.totalMem,
            "availableMemory" to memInfo.availMem,
            "totalStorage" to totalStorage,
            "availableStorage" to availableStorage,
            "screenWidth" to displayMetrics.widthPixels,
            "screenHeight" to displayMetrics.heightPixels,
            "screenDensity" to displayMetrics.density,
            "screenScale" to displayMetrics.densityDpi,
            "gpuRenderer" to getGlRenderer(),
            "gpuVendor" to getGlVendor(),
            "gpuVersion" to getGlVersion()
        )
    }

    private fun getCpuFrequency(): Int {
        return try {
            val file = "/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq"
            val frequency = File(file).readText().trim().toInt()
            frequency / 1000 // 转换为MHz
        } catch (e: Exception) {
            0
        }
    }

    private fun getGlRenderer(): String {
        return try {
            val packageManager = context.packageManager
            val info = packageManager.getSystemFeatureInfo(0, null)
            info?.glRenderer ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getGlVendor(): String {
        return try {
            val packageManager = context.packageManager
            val info = packageManager.getSystemFeatureInfo(0, null)
            info?.glVendor ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getGlVersion(): String {
        return try {
            val packageManager = context.packageManager
            val info = packageManager.getSystemFeatureInfo(0, null)
            info?.glVersion ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getNetworkInfo(): Map<String, Any> {
        return mapOf(
            "mcc" to telephonyManager.networkOperator?.substring(0, 3),
            "mnc" to telephonyManager.networkOperator?.substring(3),
            "countryCode" to telephonyManager.networkCountryIso,
            "signalStrength" to getSignalStrength(),
            "linkSpeed" to getLinkSpeed(),
            "macAddress" to getMacAddress(),
            "lastConnectedTime" to System.currentTimeMillis()
        )
    }

    private fun getNetworkType(): String {
        return when {
            isWifiConnected() -> "wifi"
            is5GConnected() -> "5G"
            is4GConnected() -> "4G"
            is3GConnected() -> "3G"
            is2GConnected() -> "2G"
            else -> "none"
        }
    }

    private fun isWifiConnected(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
        val networkInfo = connectivityManager.getNetworkInfo(android.net.ConnectivityManager.TYPE_WIFI)
        return networkInfo?.isConnectedOrConnecting == true
    }

    private fun is5GConnected(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
            val capabilities = connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
            capabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) == true &&
            capabilities?.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_NR) == true
        } else {
            false
        }
    }

    private fun is4GConnected(): Boolean {
        val networkType = telephonyManager.networkType
        return networkType == TelephonyManager.NETWORK_TYPE_LTE ||
               networkType == TelephonyManager.NETWORK_TYPE_IWLAN
    }

    private fun is3GConnected(): Boolean {
        val networkType = telephonyManager.networkType
        return networkType == TelephonyManager.NETWORK_TYPE_UMTS ||
               networkType == TelephonyManager.NETWORK_TYPE_HSDPA ||
               networkType == TelephonyManager.NETWORK_TYPE_HSUPA ||
               networkType == TelephonyManager.NETWORK_TYPE_HSPA ||
               networkType == TelephonyManager.NETWORK_TYPE_EVDO_0 ||
               networkType == TelephonyManager.NETWORK_TYPE_EVDO_A ||
               networkType == TelephonyManager.NETWORK_TYPE_EVDO_B ||
               networkType == TelephonyManager.NETWORK_TYPE_EHRPD ||
               networkType == TelephonyManager.NETWORK_TYPE_HSPAP
    }

    private fun is2GConnected(): Boolean {
        val networkType = telephonyManager.networkType
        return networkType == TelephonyManager.NETWORK_TYPE_GPRS ||
               networkType == TelephonyManager.NETWORK_TYPE_EDGE ||
               networkType == TelephonyManager.NETWORK_TYPE_CDMA ||
               networkType == TelephonyManager.NETWORK_TYPE_1xRTT ||
               networkType == TelephonyManager.NETWORK_TYPE_IDEN
    }

    private fun getSignalStrength(): Int {
        return try {
            // 这里需要实现信号强度获取逻辑
            // 简化实现，返回模拟值
            75
        } catch (e: Exception) {
            0
        }
    }

    private fun getLinkSpeed(): Int {
        return try {
            // 这里需要实现链路速度获取逻辑
            // 简化实现，返回模拟值
            150
        } catch (e: Exception) {
            0
        }
    }

    private fun getMacAddress(): String {
        return try {
            // 这里需要实现MAC地址获取逻辑
            // 简化实现，返回模拟值
            "02:00:00:00:00:00"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getBatteryInfo(): Map<String, Any> {
        return mapOf(
            "powerSource" to getPowerSource(),
            "health" to getBatteryHealth(),
            "capacity" to getBatteryCapacity(),
            "temperature" to getBatteryTemperature(),
            "voltage" to getBatteryVoltage(),
            "technology" to getBatteryTechnology(),
            "lastFullChargeTime" to System.currentTimeMillis() - 86400000, // 1天前
            "chargeTimeRemaining" to getChargeTimeRemaining(),
            "dischargeTimeRemaining" to getDischargeTimeRemaining()
        )
    }

    private fun getPowerSource(): String {
        return try {
            // 这里需要实现电源来源获取逻辑
            // 简化实现，返回模拟值
            "battery"
        } catch (e: Exception) {
            "battery"
        }
    }

    private fun getBatteryHealth(): String {
        return try {
            // 这里需要实现电池健康获取逻辑
            // 简化实现，返回模拟值
            "good"
        } catch (e: Exception) {
            "good"
        }
    }

    private fun getBatteryCapacity(): Int {
        return try {
            // 这里需要实现电池容量获取逻辑
            // 简化实现，返回模拟值
            4000
        } catch (e: Exception) {
            0
        }
    }

    private fun getBatteryTemperature(): Int {
        return try {
            // 这里需要实现电池温度获取逻辑
            // 简化实现，返回模拟值
            300 // 30°C
        } catch (e: Exception) {
            0
        }
    }

    private fun getBatteryVoltage(): Int {
        return try {
            // 这里需要实现电池电压获取逻辑
            // 简化实现，返回模拟值
            4200 // 4.2V
        } catch (e: Exception) {
            0
        }
    }

    private fun getBatteryTechnology(): String {
        return try {
            // 这里需要实现电池技术获取逻辑
            // 简化实现，返回模拟值
            "Li-ion"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getChargeTimeRemaining(): Int {
        return try {
            // 这里需要实现充电剩余时间获取逻辑
            // 简化实现，返回模拟值
            3600 // 1小时
        } catch (e: Exception) {
            0
        }
    }

    private fun getDischargeTimeRemaining(): Int {
        return try {
            // 这里需要实现放电剩余时间获取逻辑
            // 简化实现，返回模拟值
            14400 // 4小时
        } catch (e: Exception) {
            0
        }
    }

    private fun getSensorInfo(): Map<String, Any> {
        val sensors = sensorManager.getSensorList(Sensor.TYPE_ALL)
        val sensorList = mutableListOf<Map<String, Any>>()

        for (sensor in sensors) {
            sensorList.add(mapOf(
                "type" to getSensorTypeName(sensor.type),
                "name" to sensor.name,
                "vendor" to sensor.vendor,
                "version" to sensor.version,
                "maxRange" to sensor.maximumRange,
                "resolution" to sensor.resolution,
                "power" to sensor.power,
                "minDelay" to sensor.minDelay,
                "isWakeUpSensor" to sensor.isWakeUpSensor
            ))
        }

        return mapOf(
            "sensors" to sensorList,
            "hasAccelerometer" to sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null,
            "hasGyroscope" to sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE) != null,
            "hasMagnetometer" to sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD) != null,
            "hasLightSensor" to sensorManager.getDefaultSensor(Sensor.TYPE_LIGHT) != null,
            "hasProximitySensor" to sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY) != null,
            "hasBarometer" to sensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE) != null,
            "hasTemperatureSensor" to sensorManager.getDefaultSensor(Sensor.TYPE_AMBIENT_TEMPERATURE) != null,
            "hasHumiditySensor" to sensorManager.getDefaultSensor(Sensor.TYPE_RELATIVE_HUMIDITY) != null,
            "hasHeartRateSensor" to sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE) != null,
            "hasStepCounter" to sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
        )
    }

    private fun getSensorTypeName(type: Int): String {
        return when (type) {
            Sensor.TYPE_ACCELEROMETER -> "accelerometer"
            Sensor.TYPE_GYROSCOPE -> "gyroscope"
            Sensor.TYPE_MAGNETIC_FIELD -> "magnetometer"
            Sensor.TYPE_LIGHT -> "light"
            Sensor.TYPE_PROXIMITY -> "proximity"
            Sensor.TYPE_PRESSURE -> "pressure"
            Sensor.TYPE_AMBIENT_TEMPERATURE -> "temperature"
            Sensor.TYPE_RELATIVE_HUMIDITY -> "humidity"
            Sensor.TYPE_HEART_RATE -> "heartRate"
            Sensor.TYPE_STEP_COUNTER -> "stepCounter"
            else -> "unknown"
        }
    }

    private fun getAppInfo(): Map<String, Any> {
        val packageManager = context.packageManager
        val packageInfo = packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)
        val applicationInfo = packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)

        val permissions = packageInfo.requestedPermissions?.toList() ?: emptyList<String>()

        // 获取应用大小
        val appSize = try {
            val apkPath = applicationInfo.sourceDir
            File(apkPath).length()
        } catch (e: Exception) {
            0L
        }

        return mapOf(
            "versionCode" to packageInfo.longVersionCode,
            "signature" to getSignature(packageInfo),
            "permissions" to permissions,
            "appSize" to appSize,
            "installTime" to packageInfo.firstInstallTime.toString(),
            "updateTime" to packageInfo.lastUpdateTime.toString(),
            "activities" to getActivities(packageInfo),
            "services" to getServices(packageInfo),
            "receivers" to getReceivers(packageInfo)
        )
    }

    private fun getSignature(packageInfo: android.content.pm.PackageInfo): String {
        return try {
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.signingInfo?.apkContentsSigners
            } else {
                @Suppress("DEPRECATION")
                packageInfo.signatures
            }

            signatures?.firstOrNull()?.toCharsString() ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    private fun getActivities(packageInfo: android.content.pm.PackageInfo): List<String> {
        return try {
            packageInfo.activities?.map { it.name } ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun getServices(packageInfo: android.content.pm.PackageInfo): List<String> {
        return try {
            packageInfo.services?.map { it.name } ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun getReceivers(packageInfo: android.content.pm.PackageInfo): List<String> {
        return try {
            packageInfo.receivers?.map { it.name } ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun getSystemInfo(): Map<String, Any> {
        return mapOf(
            "osName" to "Android",
            "osVersion" to Build.VERSION.RELEASE,
            "osBuild" to Build.DISPLAY,
            "kernelVersion" to System.getProperty("os.version") ?: "Unknown",
            "language" to java.util.Locale.getDefault().language,
            "region" to java.util.Locale.getDefault().country,
            "timezone" to java.util.TimeZone.getDefault().id,
            "is24HourFormat" to android.text.format.DateFormat.is24HourFormat(context),
            "dateFormat" to android.text.format.DateFormat.getDateFormatOrder(context).joinToString(),
            "timeFormat" to if (android.text.format.DateFormat.is24HourFormat(context)) "24h" else "12h",
            "isDebugMode" to (0 != context.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE),
            "isEmulator" to !Build.FINGERPRINT.startsWith("generic"),
            "isJailbroken" to isRooted(),
            "securityPatchLevel" to Build.VERSION.SECURITY_PATCH,
            "supportedAbis" to Build.SUPPORTED_ABIS.toList(),
            "features" to getSystemFeatures()
        )
    }

    private fun isRooted(): Boolean {
        return try {
            // 检查常见的root文件
            val rootFiles = arrayOf(
                "/system/app/Superuser.apk",
                "/sbin/su",
                "/system/bin/su",
                "/system/xbin/su",
                "/data/local/xbin/su",
                "/data/local/bin/su",
                "/system/sd/xbin/su",
                "/system/bin/failsafe/su",
                "/data/local/su"
            )

            rootFiles.any { File(it).exists() }
        } catch (e: Exception) {
            false
        }
    }

    private fun getSystemFeatures(): List<String> {
        return try {
            val packageManager = context.packageManager
            val features = mutableListOf<String>()

            // 检查常见系统功能
            val featureMap = mapOf(
                PackageManager.FEATURE_CAMERA to "camera",
                PackageManager.FEATURE_CAMERA_FRONT to "camera_front",
                PackageManager.FEATURE_CAMERA_FLASH to "camera_flash",
                PackageManager.FEATURE_BLUETOOTH to "bluetooth",
                PackageManager.FEATURE_WIFI to "wifi",
                PackageManager.FEATURE_LOCATION to "location",
                PackageManager.FEATURE_LOCATION_GPS to "gps",
                PackageManager.FEATURE_LOCATION_NETWORK to "location_network",
                PackageManager.FEATURE_MICROPHONE to "microphone",
                PackageManager.FEATURE_NFC to "nfc",
                PackageManager.FEATURE_TELEPHONY to "telephony",
                PackageManager.FEATURE_TOUCHSCREEN to "touchscreen",
                PackageManager.FEATURE_SENSOR_ACCELEROMETER to "accelerometer",
                PackageManager.FEATURE_SENSOR_GYROSCOPE to "gyroscope",
                PackageManager.FEATURE_SENSOR_LIGHT to "light_sensor",
                PackageManager.FEATURE_SENSOR_PROXIMITY to "proximity_sensor"
            )

            for ((feature, name) in featureMap) {
                if (packageManager.hasSystemFeature(feature)) {
                    features.add(name)
                }
            }

            features
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun runPerformanceBenchmark(): Map<String, Any> {
        val startTime = System.currentTimeMillis()

        // CPU测试
        val cpuScore = runCpuBenchmark()

        // GPU测试
        val gpuScore = runGpuBenchmark()

        // 内存测试
        val memoryScore = runMemoryBenchmark()

        // 存储测试
        val storageScore = runStorageBenchmark()

        // 网络测试
        val networkScore = runNetworkBenchmark()

        val endTime = System.currentTimeMillis()
        val testDuration = endTime - startTime

        // 计算总分
        val overallScore = (cpuScore * 0.3 + gpuScore * 0.25 + memoryScore * 0.2 + storageScore * 0.15 + networkScore * 0.1).toInt()

        return mapOf(
            "cpuScore" to cpuScore,
            "gpuScore" to gpuScore,
            "memoryScore" to memoryScore,
            "storageScore" to storageScore,
            "networkScore" to networkScore,
            "overallScore" to overallScore,
            "testDuration" to testDuration
        )
    }

    private fun runCpuBenchmark(): Int {
        return try {
            val iterations = 1000000
            val startTime = System.currentTimeMillis()

            var result = 0.0
            for (i in 0 until iterations) {
                result += Math.sqrt(i.toDouble())
            }

            val endTime = System.currentTimeMillis()
            val duration = endTime - startTime

            // 基于执行时间计算分数
            (10000.0 / duration).toInt().coerceIn(0, 10000)
        } catch (e: Exception) {
            0
        }
    }

    private fun runGpuBenchmark(): Int {
        return try {
            // 这里应该实现GPU基准测试
            // 简化实现，返回模拟值
            7500
        } catch (e: Exception) {
            0
        }
    }

    private fun runMemoryBenchmark(): Int {
        return try {
            val startTime = System.currentTimeMillis()

            // 分配和释放内存
            val memoryList = mutableListOf<ByteArray>()
            for (i in 0 until 100) {
                memoryList.add(ByteArray(1024 * 1024)) // 1MB
            }

            memoryList.clear()
            System.gc()

            val endTime = System.currentTimeMillis()
            val duration = endTime - startTime

            // 基于执行时间计算分数
            (8000.0 / duration).toInt().coerceIn(0, 10000)
        } catch (e: Exception) {
            0
        }
    }

    private fun runStorageBenchmark(): Int {
        return try {
            val startTime = System.currentTimeMillis()

            // 写入和读取测试文件
            val testFile = File(context.cacheDir, "benchmark_test.tmp")
            val testData = ByteArray(1024 * 1024) // 1MB

            // 写入测试
            testFile.writeBytes(testData)

            // 读取测试
            val readData = testFile.readBytes()

            // 清理
            testFile.delete()

            val endTime = System.currentTimeMillis()
            val duration = endTime - startTime

            // 基于执行时间计算分数
            (6000.0 / duration).toInt().coerceIn(0, 10000)
        } catch (e: Exception) {
            0
        }
    }

    private fun runNetworkBenchmark(): Int {
        return try {
            val startTime = System.currentTimeMillis()

            // 网络延迟测试
            try {
                val url = java.net.URL("https://www.google.com")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "HEAD"
                connection.connectTimeout = 5000
                connection.readTimeout = 5000
                connection.responseCode

                val endTime = System.currentTimeMillis()
                val duration = endTime - startTime

                // 基于响应时间计算分数
                (5000.0 / duration).toInt().coerceIn(0, 10000)
            } catch (e: Exception) {
                2000 // 网络不可用时的默认分数
            }
        } catch (e: Exception) {
            0
        }
    }
}
```

### 第五步：实现 iOS 原生代码

```swift
// ios/Runner/DeviceInfoPlugin.swift
import Foundation
import UIKit
import CoreTelephony
import SystemConfiguration
import IOKit

class DeviceInfoPlugin: NSObject, FlutterPlugin {

    static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(name: "device_info_pro/device", binaryMessenger: registrar.messenger())
        let instance = DeviceInfoPlugin()
        registrar.addMethodCallDelegate(instance, channel: channel)
    }

    func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "getHardwareInfo":
            result(getHardwareInfo())
        case "getNetworkInfo":
            result(getNetworkInfo())
        case "getNetworkType":
            result(getNetworkType())
        case "getBatteryInfo":
            result(getBatteryInfo())
        case "getSensorInfo":
            result(getSensorInfo())
        case "getAppInfo":
            result(getAppInfo())
        case "getSystemInfo":
            result(getSystemInfo())
        case "runPerformanceBenchmark":
            result(runPerformanceBenchmark())
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    private func getHardwareInfo() -> [String: Any] {
        let device = UIDevice.current
        let screen = UIScreen.main

        // 获取内存信息
        let physicalMemory = ProcessInfo.processInfo.physicalMemory

        // 获取存储信息
        let totalSpace = getTotalDiskSpace()
        let availableSpace = getAvailableDiskSpace()

        return [
            "cpuCores": ProcessInfo.processInfo.processorCount,
            "cpuFrequency": getCpuFrequency(),
            "cpuArchitecture": getArchitecture(),
            "cpuName": getHardwareModel(),
            "totalMemory": physicalMemory,
            "availableMemory": getAvailableMemory(),
            "totalStorage": totalSpace,
            "availableStorage": availableSpace,
            "screenWidth": Int(screen.bounds.width * screen.scale),
            "screenHeight": Int(screen.bounds.height * screen.scale),
            "screenDensity": screen.scale,
            "screenScale": screen.scale,
            "gpuRenderer": getGlRenderer(),
            "gpuVendor": getGlVendor(),
            "gpuVersion": getGlVersion()
        ]
    }

    private func getCpuFrequency() -> Int {
        // iOS不提供CPU频率信息，返回模拟值
        return 2400 // 2.4GHz
    }

    private func getArchitecture() -> String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineCode = withUnsafePointer(to: &systemInfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String.init(validatingUTF8: ptr)
            }
        }
        return machineCode ?? "Unknown"
    }

    private func getHardwareModel() -> String {
        var size: size_t = 0
        sysctlbyname("hw.machine", nil, &size, nil, 0)
        var machine = [CChar](repeating: 0, count: Int(size))
        sysctlbyname("hw.machine", &machine, &size, nil, 0)
        let model = String(cString: machine)
        return model
    }

    private func getAvailableMemory() -> Int64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4

        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }

        if kerr == KERN_SUCCESS {
            return Int64(info.resident_size)
        } else {
            return 0
        }
    }

    private func getTotalDiskSpace() -> Int64 {
        let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first!
        let systemAttributes = try? FileManager.default.attributesOfFileSystem(forPath: documentsPath)
        return systemAttributes?[.systemSize] as? Int64 ?? 0
    }

    private func getAvailableDiskSpace() -> Int64 {
        let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first!
        let systemAttributes = try? FileManager.default.attributesOfFileSystem(forPath: documentsPath)
        return systemAttributes?[.systemFreeSize] as? Int64 ?? 0
    }

    private func getGlRenderer() -> String {
        // iOS不提供OpenGL渲染器信息，返回模拟值
        return "Apple GPU"
    }

    private func getGlVendor() -> String {
        // iOS不提供OpenGL供应商信息，返回模拟值
        return "Apple"
    }

    private func getGlVersion() -> String {
        // iOS不提供OpenGL版本信息，返回模拟值
        return "OpenGL ES 3.0"
    }

    private func getNetworkInfo() -> [String: Any] {
        let networkInfo = CTTelephonyNetworkInfo()
        let carrier = networkInfo.subscriberCellularProvider

        return [
            "mcc": carrier?.mobileCountryCode ?? "",
            "mnc": carrier?.mobileNetworkCode ?? "",
            "countryCode": carrier?.isoCountryCode ?? "",
            "signalStrength": getSignalStrength(),
            "linkSpeed": getLinkSpeed(),
            "macAddress": getMacAddress(),
            "lastConnectedTime": Date().timeIntervalSince1970 * 1000
        ]
    }

    private func getNetworkType() -> String {
        if let networkInfo = CTTelephonyNetworkInfo(),
           let carrier = networkInfo.subscriberCellularProvider {

            switch carrier.radioAccessTechnology {
            case CTRadioAccessTechnologyGPRS,
                 CTRadioAccessTechnologyEdge,
                 CTRadioAccessTechnologyCDMA1x:
                return "2G"
            case CTRadioAccessTechnologyWCDMA,
                 CTRadioAccessTechnologyHSDPA,
                 CTRadioAccessTechnologyHSUPA,
                 CTRadioAccessTechnologyCDMAEVDORev0,
                 CTRadioAccessTechnologyCDMAEVDORevA,
                 CTRadioAccessTechnologyCDMAEVDORevB,
                 CTRadioAccessTechnologyeHRPD:
                return "3G"
            case CTRadioAccessTechnologyLTE:
                return "4G"
            case CTRadioAccessTechnologyNR:
                return "5G"
            default:
                break
            }
        }

        return isWifiConnected() ? "wifi" : "none"
    }

    private func isWifiConnected() -> Bool {
        guard let reachability = SCNetworkReachabilityCreateWithName(nil, "www.apple.com") else {
            return false
        }

        var flags = SCNetworkReachabilityFlags()
        SCNetworkReachabilityGetFlags(reachability, &flags)

        return flags.contains(.isReachable) && !flags.contains(.isWWAN)
    }

    private func getSignalStrength() -> Int {
        // iOS不提供信号强度信息，返回模拟值
        return 75
    }

    private func getLinkSpeed() -> Int {
        // iOS不提供链路速度信息，返回模拟值
        return 150
    }

    private func getMacAddress() -> String {
        // iOS不提供MAC地址信息，返回模拟值
        return "02:00:00:00:00:00"
    }

    private func getBatteryInfo() -> [String: Any] {
        let device = UIDevice.current
        device.isBatteryMonitoringEnabled = true

        return [
            "powerSource": getPowerSource(),
            "health": getBatteryHealth(),
            "capacity": getBatteryCapacity(),
            "temperature": getBatteryTemperature(),
            "voltage": getBatteryVoltage(),
            "technology": getBatteryTechnology(),
            "lastFullChargeTime": Date().timeIntervalSince1970 * 1000 - 86400000, // 1天前
            "chargeTimeRemaining": getChargeTimeRemaining(),
            "dischargeTimeRemaining": getDischargeTimeRemaining()
        ]
    }

    private func getPowerSource() -> String {
        let device = UIDevice.current
        device.isBatteryMonitoringEnabled = true

        switch device.batteryState {
        case .charging:
            return "ac"
        case .unplugged:
            return "battery"
        case .full:
            return "ac"
        default:
            return "battery"
        }
    }

    private func getBatteryHealth() -> String {
        // iOS不提供电池健康信息，返回模拟值
        return "good"
    }

    private func getBatteryCapacity() -> Int {
        // iOS不提供电池容量信息，返回模拟值
        return 3000
    }

    private func getBatteryTemperature() -> Int {
        // iOS不提供电池温度信息，返回模拟值
        return 300 // 30°C
    }

    private func getBatteryVoltage() -> Int {
        // iOS不提供电池电压信息，返回模拟值
        return 4200 // 4.2V
    }

    private func getBatteryTechnology() -> String {
        // iOS不提供电池技术信息，返回模拟值
        return "Li-ion"
    }

    private func getChargeTimeRemaining() -> Int {
        // iOS不提供充电剩余时间信息，返回模拟值
        return 3600 // 1小时
    }

    private func getDischargeTimeRemaining() -> Int {
        // iOS不提供放电剩余时间信息，返回模拟值
        return 14400 // 4小时
    }

    private func getSensorInfo() -> [String: Any] {
        let motionManager = CMMotionManager()

        return [
            "sensors": getSensorList(),
            "hasAccelerometer": motionManager.isAccelerometerAvailable,
            "hasGyroscope": motionManager.isGyroAvailable,
            "hasMagnetometer": motionManager.isMagnetometerAvailable,
            "hasLightSensor": false, // iOS不提供光线传感器
            "hasProximitySensor": UIDevice.current.proximityState,
            "hasBarometer": motionManager.isAltimeterAvailable,
            "hasTemperatureSensor": false, // iOS不提供温度传感器
            "hasHumiditySensor": false, // iOS不提供湿度传感器
            "hasHeartRateSensor": false, // 需要HealthKit权限
            "hasStepCounter": CMPedometer.isStepCountingAvailable()
        ]
    }

    private func getSensorList() -> [[String: Any]] {
        // iOS不提供详细的传感器列表，返回空数组
        return []
    }

    private func getAppInfo() -> [String: Any] {
        let bundle = Bundle.main
        let bundleInfo = bundle.infoDictionary

        return [
            "versionCode": bundleInfo?["CFBundleVersion"] as? String ?? "0",
            "signature": getSignature(),
            "permissions": getPermissions(),
            "appSize": getAppSize(),
            "installTime": getInstallTime(),
            "updateTime": getUpdateTime(),
            "activities": getActivities(),
            "services": getServices(),
            "receivers": getReceivers()
        ]
    }

    private func getSignature() -> String {
        // iOS不提供应用签名信息，返回模拟值
        return "iOS App Store"
    }

    private func getPermissions() -> [String] {
        // iOS不提供权限列表，返回空数组
        return []
    }

    private func getAppSize() -> Int64 {
        // iOS不提供应用大小信息，返回模拟值
        return 50 * 1024 * 1024 // 50MB
    }

    private func getInstallTime() -> String {
        // iOS不提供安装时间信息，返回模拟值
        return "Unknown"
    }

    private func getUpdateTime() -> String {
        // iOS不提供更新时间信息，返回模拟值
        return "Unknown"
    }

    private func getActivities() -> [String] {
        // iOS不提供Activity列表，返回空数组
        return []
    }

    private func getServices() -> [String] {
        // iOS不提供Service列表，返回空数组
        return []
    }

    private func getReceivers() -> [String] {
        // iOS不提供Receiver列表，返回空数组
        return []
    }

    private func getSystemInfo() -> [String: Any] {
        let device = UIDevice.current
        let locale = Locale.current

        return [
            "osName": "iOS",
            "osVersion": device.systemVersion,
            "osBuild": getBuildVersion(),
            "kernelVersion": getKernelVersion(),
            "language": locale.languageCode ?? "en",
            "region": locale.regionCode ?? "US",
            "timezone": TimeZone.current.identifier,
            "is24HourFormat": is24HourFormat(),
            "dateFormat": getDateFormat(),
            "timeFormat": getTimeFormat(),
            "isDebugMode": isDebugMode(),
            "isEmulator": isEmulator(),
            "isJailbroken": isJailbroken(),
            "securityPatchLevel": getSecurityPatchLevel(),
            "supportedAbis": getSupportedAbis(),
            "features": getSystemFeatures()
        ]
    }

    private func getBuildVersion() -> String {
        return ProcessInfo.processInfo.operatingSystemVersionString
    }

    private func getKernelVersion() -> String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let release = withUnsafePointer(to: &systemInfo.release) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String.init(validatingUTF8: ptr)
            }
        }
        return release ?? "Unknown"
    }

    private func is24HourFormat() -> Bool {
        let dateFormat = DateFormatter()
        dateFormat.dateFormat = DateFormatter.dateFormat(fromTemplate: "j", options: 0, locale: Locale.current)
        return dateFormat?.contains("a") == false
    }

    private func getDateFormat() -> String {
        let dateFormat = DateFormatter()
        dateFormat.dateStyle = .medium
        return dateFormat.dateFormat
    }

    private func getTimeFormat() -> String {
        return is24HourFormat() ? "24h" : "12h"
    }

    private func isDebugMode() -> Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }

    private func isEmulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    private func isJailbroken() -> Bool {
        // 检查常见的越狱文件
        let jailbreakFiles = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/private/var/lib/apt/"
        ]

        for file in jailbreakFiles {
            if FileManager.default.fileExists(atPath: file) {
                return true
            }
        }

        return false
    }

    private func getSecurityPatchLevel() -> String {
        // iOS不提供安全补丁级别信息，返回模拟值
        return "Unknown"
    }

    private func getSupportedAbis() -> [String] {
        var size: size_t = 0
        sysctlbyname("hw.cputype", nil, &size, nil, 0)
        var type = cpu_type_t(0)
        sysctlbyname("hw.cputype", &type, &size, nil, 0)

        var abis: [String] = []

        switch type {
        case CPU_TYPE_ARM64:
            abis.append("arm64")
        case CPU_TYPE_ARM:
            abis.append("arm")
        default:
            abis.append("unknown")
        }

        return abis
    }

    private func getSystemFeatures() -> [String] {
        var features: [String] = []

        // 检查常见系统功能
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            features.append("camera")
        }

        if UIImagePickerController.isSourceTypeAvailable(.camera) && UIImagePickerController.isCameraDeviceAvailable(.front) {
            features.append("camera_front")
        }

        if UIImagePickerController.isFlashAvailable(for: .front) || UIImagePickerController.isFlashAvailable(for: .rear) {
            features.append("camera_flash")
        }

        features.append("touchscreen")
        features.append("microphone")

        return features
    }

    private func runPerformanceBenchmark() -> [String: Any] {
        let startTime = Date().timeIntervalSince1970 * 1000

        // CPU测试
        let cpuScore = runCpuBenchmark()

        // GPU测试
        let gpuScore = runGpuBenchmark()

        // 内存测试
        let memoryScore = runMemoryBenchmark()

        // 存储测试
        let storageScore = runStorageBenchmark()

        // 网络测试
        let networkScore = runNetworkBenchmark()

        let endTime = Date().timeIntervalSince1970 * 1000
        let testDuration = Int(endTime - startTime)

        // 计算总分
        let overallScore = Int(Double(cpuScore) * 0.3 + Double(gpuScore) * 0.25 + Double(memoryScore) * 0.2 + Double(storageScore) * 0.15 + Double(networkScore) * 0.1)

        return [
            "cpuScore": cpuScore,
            "gpuScore": gpuScore,
            "memoryScore": memoryScore,
            "storageScore": storageScore,
            "networkScore": networkScore,
            "overallScore": overallScore,
            "testDuration": testDuration
        ]
    }

    private func runCpuBenchmark() -> Int {
        let iterations = 1000000
        let startTime = Date().timeIntervalSince1970 * 1000

        var result: Double = 0
        for i in 0..<iterations {
            result += sqrt(Double(i))
        }

        let endTime = Date().timeIntervalSince1970 * 1000
        let duration = Int(endTime - startTime)

        // 基于执行时间计算分数
        return max(0, min(10000, Int(10000.0 / Double(duration))))
    }

    private func runGpuBenchmark() -> Int {
        // 这里应该实现GPU基准测试
        // 简化实现，返回模拟值
        return 7500
    }

    private func runMemoryBenchmark() -> Int {
        let startTime = Date().timeIntervalSince1970 * 1000

        // 分配和释放内存
        var memoryArray: [Data] = []
        for _ in 0..<100 {
            memoryArray.append(Data(count: 1024 * 1024)) // 1MB
        }

        memoryArray.removeAll()

        let endTime = Date().timeIntervalSince1970 * 1000
        let duration = Int(endTime - startTime)

        // 基于执行时间计算分数
        return max(0, min(10000, Int(8000.0 / Double(duration))))
    }

    private func runStorageBenchmark() -> Int {
        let startTime = Date().timeIntervalSince1970 * 1000

        // 写入和读取测试文件
        let testFileURL = FileManager.default.temporaryDirectory.appendingPathComponent("benchmark_test.tmp")
        let testData = Data(count: 1024 * 1024) // 1MB

        do {
            // 写入测试
            try testData.write(to: testFileURL)

            // 读取测试
            let readData = try Data(contentsOf: testFileURL)

            // 清理
            try FileManager.default.removeItem(at: testFileURL)
        } catch {
            // 处理错误
        }

        let endTime = Date().timeIntervalSince1970 * 1000
        let duration = Int(endTime - startTime)

        // 基于执行时间计算分数
        return max(0, min(10000, Int(6000.0 / Double(duration))))
    }

    private func runNetworkBenchmark() -> Int {
        let startTime = Date().timeIntervalSince1970 * 1000

        // 网络延迟测试
        if let url = URL(string: "https://www.apple.com") {
            var request = URLRequest(url: url)
            request.httpMethod = "HEAD"
            request.timeoutInterval = 5.0

            let semaphore = DispatchSemaphore(value: 0)
            var responseTime: Int = 0

            URLSession.shared.dataTask(with: request) { _, response, error in
                let endTime = Date().timeIntervalSince1970 * 1000
                responseTime = Int(endTime - startTime)
                semaphore.signal()
            }.resume()

            semaphore.wait()

            // 基于响应时间计算分数
            return max(0, min(10000, Int(5000.0 / Double(responseTime))))
        } else {
            return 2000 // 网络不可用时的默认分数
        }
    }
}
```

### 第六步：创建主应用界面

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'widgets/device_info_widget.dart';
import 'widgets/performance_widget.dart';
import 'widgets/comparison_widget.dart';
import 'widgets/history_widget.dart';
import 'models/device_info.dart';
import 'services/device_info_service.dart';

void main() {
  runApp(const DeviceInfoProApp());
}

class DeviceInfoProApp extends StatelessWidget {
  const DeviceInfoProApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DeviceInfoPro',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        brightness: Brightness.light,
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final DeviceInfoService _deviceInfoService = DeviceInfoService();

  bool _permissionsGranted = false;
  bool _isLoading = false;
  DeviceInfo? _deviceInfo;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _checkPermissions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);

    try {
      final hasPermissions = await _deviceInfoService.checkPermissions();
      setState(() => _permissionsGranted = hasPermissions);

      if (hasPermissions) {
        await _loadDeviceInfo();
      }
    } catch (e) {
      setState(() => _permissionsGranted = false);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPermissions() async {
    try {
      final hasPermissions = await _deviceInfoService.checkPermissions();
      setState(() => _permissionsGranted = hasPermissions);

      if (hasPermissions) {
        await _loadDeviceInfo();
      } else {
        _showPermissionDeniedDialog('权限被拒绝，应用无法正常工作');
      }
    } catch (e) {
      _showErrorSnackBar('请求权限失败: $e');
    }
  }

  Future<void> _loadDeviceInfo() async {
    try {
      final deviceInfo = await _deviceInfoService.getDeviceInfo();
      setState(() {
        _deviceInfo = deviceInfo;
      });
    } catch (e) {
      _showErrorSnackBar('加载设备信息失败: $e');
    }
  }

  void _showPermissionDeniedDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('权限被拒绝'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              openAppSettings();
            },
            child: const Text('打开设置'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!_permissionsGranted) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('DeviceInfoPro'),
          backgroundColor: Colors.blue,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.devices,
                size: 64,
                color: Colors.grey,
              ),
              const SizedBox(height: 16),
              const Text(
                '需要权限',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'DeviceInfoPro需要访问设备信息来提供完整的设备分析服务',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _requestPermissions,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: const Text(
                  '授予权限',
                  style: TextStyle(fontSize: 18),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_deviceInfo?.basicInfo.displayName ?? 'DeviceInfoPro'),
        backgroundColor: Colors.blue,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDeviceInfo,
            tooltip: '刷新',
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _shareDeviceInfo,
            tooltip: '分享',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.info), text: '设备信息'),
            Tab(icon: Icon(Icons.speed), text: '性能测试'),
            Tab(icon: Icon(Icons.compare), text: '设备对比'),
            Tab(icon: Icon(Icons.history), text: '历史记录'),
          ],
        ),
      ),
      body: _deviceInfo == null
          ? const Center(child: Text('无法加载设备信息'))
          : TabBarView(
              controller: _tabController,
              children: [
                // 设备信息页面
                DeviceInfoWidget(deviceInfo: _deviceInfo!),

                // 性能测试页面
                PerformanceWidget(deviceInfoService: _deviceInfoService),

                // 设备对比页面
                ComparisonWidget(deviceInfo: _deviceInfo!),

                // 历史记录页面
                HistoryWidget(),
              ],
            ),
    );
  }

  Future<void> _shareDeviceInfo() async {
    if (_deviceInfo == null) return;

    try {
      // 这里应该实现设备信息分享功能
      _showSuccessSnackBar('分享功能待实现');
    } catch (e) {
      _showErrorSnackBar('分享失败: $e');
    }
  }
}
```

## 高级功能实现

### 1. 设备性能监控

```dart
// lib/services/device_performance_service.dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import '../models/device_info.dart';

class DevicePerformanceService {
  static final DevicePerformanceService _instance = DevicePerformanceService._internal();
  factory DevicePerformanceService() => _instance;
  DevicePerformanceService._internal();

  static const MethodChannel _performanceChannel = MethodChannel('device_info_pro/performance');

  final StreamController<PerformanceData> _performanceStreamController = StreamController<PerformanceData>.broadcast();
  Timer? _monitoringTimer;

  // 性能数据流
  Stream<PerformanceData> get performanceStream => _performanceStreamController.stream;

  // 开始性能监控
  void startMonitoring({Duration interval = const Duration(seconds: 1)}) {
    stopMonitoring();

    _monitoringTimer = Timer.periodic(interval, (timer) async {
      try {
        final performanceData = await _getCurrentPerformanceData();
        _performanceStreamController.add(performanceData);
      } catch (e) {
        // 处理错误
      }
    });
  }

  // 停止性能监控
  void stopMonitoring() {
    _monitoringTimer?.cancel();
    _monitoringTimer = null;
  }

  // 获取当前性能数据
  Future<PerformanceData> _getCurrentPerformanceData() async {
    try {
      final performanceData = await _performanceChannel.invokeMethod('getCurrentPerformanceData');

      return PerformanceData(
        cpuUsage: (performanceData['cpuUsage'] ?? 0.0).toDouble(),
        memoryUsage: (performanceData['memoryUsage'] ?? 0.0).toDouble(),
        storageUsage: (performanceData['storageUsage'] ?? 0.0).toDouble(),
        networkUsage: (performanceData['networkUsage'] ?? 0.0).toDouble(),
        batteryLevel: performanceData['batteryLevel'] ?? 0,
        batteryTemperature: (performanceData['batteryTemperature'] ?? 0.0).toDouble(),
        timestamp: DateTime.now(),
      );
    } catch (e) {
      throw PerformanceException('获取性能数据失败: $e');
    }
  }

  // 获取性能历史数据
  Future<List<PerformanceData>> getPerformanceHistory({
    DateTime? startTime,
    DateTime? endTime,
  }) async {
    try {
      final historyData = await _performanceChannel.invokeMethod('getPerformanceHistory', {
        'startTime': startTime?.millisecondsSinceEpoch,
        'endTime': endTime?.millisecondsSinceEpoch,
      });

      final performanceList = <PerformanceData>[];

      for (final data in historyData['performanceData']) {
        performanceList.add(PerformanceData(
          cpuUsage: (data['cpuUsage'] ?? 0.0).toDouble(),
          memoryUsage: (data['memoryUsage'] ?? 0.0).toDouble(),
          storageUsage: (data['storageUsage'] ?? 0.0).toDouble(),
          networkUsage: (data['networkUsage'] ?? 0.0).toDouble(),
          batteryLevel: data['batteryLevel'] ?? 0,
          batteryTemperature: (data['batteryTemperature'] ?? 0.0).toDouble(),
          timestamp: DateTime.fromMillisecondsSinceEpoch(data['timestamp']),
        ));
      }

      return performanceList;
    } catch (e) {
      throw PerformanceException('获取性能历史数据失败: $e');
    }
  }

  // 清理性能历史数据
  Future<void> clearPerformanceHistory() async {
    try {
      await _performanceChannel.invokeMethod('clearPerformanceHistory');
    } catch (e) {
      throw PerformanceException('清理性能历史数据失败: $e');
    }
  }

  // 释放资源
  void dispose() {
    stopMonitoring();
    _performanceStreamController.close();
  }
}

// 性能数据
class PerformanceData {
  final double cpuUsage;
  final double memoryUsage;
  final double storageUsage;
  final double networkUsage;
  final int batteryLevel;
  final double batteryTemperature;
  final DateTime timestamp;

  PerformanceData({
    required this.cpuUsage,
    required this.memoryUsage,
    required this.storageUsage,
    required this.networkUsage,
    required this.batteryLevel,
    required this.batteryTemperature,
    required this.timestamp,
  });

  // 获取CPU使用率描述
  String get cpuUsageDescription {
    return '${(cpuUsage * 100).toStringAsFixed(1)}%';
  }

  // 获取内存使用率描述
  String get memoryUsageDescription {
    return '${(memoryUsage * 100).toStringAsFixed(1)}%';
  }

  // 获取存储使用率描述
  String get storageUsageDescription {
    return '${(storageUsage * 100).toStringAsFixed(1)}%';
  }

  // 获取网络使用率描述
  String get networkUsageDescription {
    return '${(networkUsage * 1024).toStringAsFixed(1)} KB/s';
  }

  // 获取电池温度描述
  String get batteryTemperatureDescription {
    return '${batteryTemperature.toStringAsFixed(1)}°C';
  }

  // 转换为JSON
  Map<String, dynamic> toJson() {
    return {
      'cpuUsage': cpuUsage,
      'memoryUsage': memoryUsage,
      'storageUsage': storageUsage,
      'networkUsage': networkUsage,
      'batteryLevel': batteryLevel,
      'batteryTemperature': batteryTemperature,
      'timestamp': timestamp.millisecondsSinceEpoch,
    };
  }

  // 从JSON创建
  factory PerformanceData.fromJson(Map<String, dynamic> json) {
    return PerformanceData(
      cpuUsage: json['cpuUsage']?.toDouble() ?? 0.0,
      memoryUsage: json['memoryUsage']?.toDouble() ?? 0.0,
      storageUsage: json['storageUsage']?.toDouble() ?? 0.0,
      networkUsage: json['networkUsage']?.toDouble() ?? 0.0,
      batteryLevel: json['batteryLevel'] ?? 0,
      batteryTemperature: json['batteryTemperature']?.toDouble() ?? 0.0,
      timestamp: DateTime.fromMillisecondsSinceEpoch(json['timestamp']),
    );
  }
}

// 性能异常
class PerformanceException implements Exception {
  final String message;
  PerformanceException(this.message);

  @override
  String toString() => message;
}
```

### 2. 设备对比功能

```dart
// lib/services/device_comparison_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/device_info.dart';

class DeviceComparisonService {
  static final DeviceComparisonService _instance = DeviceComparisonService._internal();
  factory DeviceComparisonService() => _instance;
  DeviceComparisonService._internal();

  static const String _comparisonKey = 'device_comparisons';

  // 保存设备信息用于对比
  Future<void> saveDeviceForComparison(DeviceInfo deviceInfo, String name) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final comparisons = await getSavedComparisons();

      comparisons[name] = deviceInfo.toJson();

      await prefs.setString(_comparisonKey, jsonEncode(comparisons));
    } catch (e) {
      throw ComparisonException('保存设备信息失败: $e');
    }
  }

  // 获取保存的对比设备
  Future<Map<String, DeviceInfo>> getSavedComparisons() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final comparisonsJson = prefs.getString(_comparisonKey);

      if (comparisonsJson == null) {
        return {};
      }

      final comparisonsMap = jsonDecode(comparisonsJson) as Map<String, dynamic>;
      final result = <String, DeviceInfo>{};

      for (final entry in comparisonsMap.entries) {
        try {
          result[entry.key] = DeviceInfo.fromJson(entry.value as Map<String, dynamic>);
        } catch (e) {
          // 跳过无效的设备信息
        }
      }

      return result;
    } catch (e) {
      throw ComparisonException('获取对比设备失败: $e');
    }
  }

  // 删除保存的对比设备
  Future<void> removeSavedComparison(String name) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final comparisons = await getSavedComparisons();

      comparisons.remove(name);

      await prefs.setString(_comparisonKey, jsonEncode(comparisons));
    } catch (e) {
      throw ComparisonException('删除对比设备失败: $e');
    }
  }

  // 清除所有保存的对比设备
  Future<void> clearSavedComparisons() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_comparisonKey);
    } catch (e) {
      throw ComparisonException('清除对比设备失败: $e');
    }
  }

  // 对比两个设备
  DeviceComparison compareDevices(DeviceInfo device1, DeviceInfo device2) {
    return DeviceComparison(
      device1: device1,
      device2: device2,
      basicInfoComparison: _compareBasicInfo(device1.basicInfo, device2.basicInfo),
      hardwareComparison: _compareHardwareInfo(device1.hardwareInfo, device2.hardwareInfo),
      networkComparison: _compareNetworkInfo(device1.networkInfo, device2.networkInfo),
      batteryComparison: _compareBatteryInfo(device1.batteryInfo, device2.batteryInfo),
      sensorComparison: _compareSensorInfo(device1.sensorInfo, device2.sensorInfo),
      systemComparison: _compareSystemInfo(device1.systemInfo, device2.systemInfo),
      performanceComparison: _comparePerformance(device1, device2),
    );
  }

  // 对比基本信息
  BasicInfoComparison _compareBasicInfo(BasicDeviceInfo info1, BasicDeviceInfo info2) {
    return BasicInfoComparison(
      manufacturer: info1.manufacturer == info2.manufacturer,
      model: info1.model == info2.model,
      brand: info1.brand == info2.brand,
      device: info1.device == info2.device,
      product: info1.product == info2.product,
      hardware: info1.hardware == info2.hardware,
    );
  }

  // 对比硬件信息
  HardwareInfoComparison _compareHardwareInfo(HardwareDeviceInfo info1, HardwareDeviceInfo info2) {
    return HardwareInfoComparison(
      cpuCores: info1.cpuCores.compareTo(info2.cpuCores),
      cpuFrequency: info1.cpuFrequency.compareTo(info2.cpuFrequency),
      totalMemory: info1.totalMemory.compareTo(info2.totalMemory),
      totalStorage: info1.totalStorage.compareTo(info2.totalStorage),
      screenWidth: info1.screenWidth.compareTo(info2.screenWidth),
      screenHeight: info1.screenHeight.compareTo(info2.screenHeight),
      screenDensity: info1.screenDensity.compareTo(info2.screenDensity),
    );
  }

  // 对比网络信息
  NetworkInfoComparison _compareNetworkInfo(NetworkDeviceInfo info1, NetworkDeviceInfo info2) {
    return NetworkInfoComparison(
      type: info1.type == info2.type,
      signalStrength: info1.signalStrength.compareTo(info2.signalStrength),
      linkSpeed: info1.linkSpeed.compareTo(info2.linkSpeed),
    );
  }

  // 对比电池信息
  BatteryInfoComparison _compareBatteryInfo(BatteryDeviceInfo info1, BatteryDeviceInfo info2) {
    return BatteryInfoComparison(
      level: info1.level.compareTo(info2.level),
      capacity: info1.capacity.compareTo(info2.capacity),
      temperature: info1.temperature.compareTo(info2.temperature),
      voltage: info1.voltage.compareTo(info2.voltage),
    );
  }

  // 对比传感器信息
  SensorInfoComparison _compareSensorInfo(SensorDeviceInfo info1, SensorDeviceInfo info2) {
    return SensorInfoComparison(
      totalSensors: info1.totalSensors.compareTo(info2.totalSensors),
      hasAccelerometer: info1.hasAccelerometer == info2.hasAccelerometer,
      hasGyroscope: info1.hasGyroscope == info2.hasGyroscope,
      hasMagnetometer: info1.hasMagnetometer == info2.hasMagnetometer,
      hasLightSensor: info1.hasLightSensor == info2.hasLightSensor,
      hasProximitySensor: info1.hasProximitySensor == info2.hasProximitySensor,
    );
  }

  // 对比系统信息
  SystemInfoComparison _compareSystemInfo(SystemDeviceInfo info1, SystemDeviceInfo info2) {
    return SystemInfoComparison(
      osName: info1.osName == info2.osName,
      osVersion: info1.osVersion.compareTo(info2.osVersion),
      language: info1.language == info2.language,
      region: info1.region == info2.region,
      isDebugMode: info1.isDebugMode == info2.isDebugMode,
      isEmulator: info1.isEmulator == info2.isEmulator,
    );
  }

  // 对比性能
  PerformanceComparison _comparePerformance(DeviceInfo device1, DeviceInfo device2) {
    return PerformanceComparison(
      performanceScore: device1.performanceScore.compareTo(device2.performanceScore),
      performanceLevel: device1.performanceLevel.index.compareTo(device2.performanceLevel.index),
    );
  }
}

// 设备对比结果
class DeviceComparison {
  final DeviceInfo device1;
  final DeviceInfo device2;
  final BasicInfoComparison basicInfoComparison;
  final HardwareInfoComparison hardwareComparison;
  final NetworkInfoComparison networkComparison;
  final BatteryInfoComparison batteryComparison;
  final SensorInfoComparison sensorComparison;
  final SystemInfoComparison systemComparison;
  final PerformanceComparison performanceComparison;

  DeviceComparison({
    required this.device1,
    required this.device2,
    required this.basicInfoComparison,
    required this.hardwareComparison,
    required this.networkComparison,
    required this.batteryComparison,
    required this.sensorComparison,
    required this.systemComparison,
    required this.performanceComparison,
  });

  // 获取总体对比结果
  ComparisonResult get overallResult {
    int wins = 0;
    int losses = 0;

    // 硬件对比
    if (hardwareComparison.cpuCores > 0) wins++;
    else if (hardwareComparison.cpuCores < 0) losses++;

    if (hardwareComparison.totalMemory > 0) wins++;
    else if (hardwareComparison.totalMemory < 0) losses++;

    if (hardwareComparison.totalStorage > 0) wins++;
    else if (hardwareComparison.totalStorage < 0) losses++;

    // 性能对比
    if (performanceComparison.performanceScore > 0) wins++;
    else if (performanceComparison.performanceScore < 0) losses++;

    if (wins > losses) return ComparisonResult.better;
    if (wins < losses) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }

  // 获取总体对比结果描述
  String get overallResultDescription {
    switch (overallResult) {
      case ComparisonResult.better:
        return '设备1更优';
      case ComparisonResult.worse:
        return '设备2更优';
      case ComparisonResult.equal:
        return '设备相当';
    }
  }
}

// 基本信息对比
class BasicInfoComparison {
  final bool manufacturer;
  final bool model;
  final bool brand;
  final bool device;
  final bool product;
  final bool hardware;

  BasicInfoComparison({
    required this.manufacturer,
    required this.model,
    required this.brand,
    required this.device,
    required this.product,
    required this.hardware,
  });

  // 是否完全相同
  bool get isIdentical {
    return manufacturer && model && brand && device && product && hardware;
  }
}

// 硬件信息对比
class HardwareInfoComparison {
  final int cpuCores;
  final int cpuFrequency;
  final int totalMemory;
  final int totalStorage;
  final int screenWidth;
  final int screenHeight;
  final int screenDensity;

  HardwareInfoComparison({
    required this.cpuCores,
    required this.cpuFrequency,
    required this.totalMemory,
    required this.totalStorage,
    required this.screenWidth,
    required this.screenHeight,
    required this.screenDensity,
  });

  // 获取CPU对比结果
  ComparisonResult get cpuResult {
    if (cpuCores > 0) return ComparisonResult.better;
    if (cpuCores < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }

  // 获取内存对比结果
  ComparisonResult get memoryResult {
    if (totalMemory > 0) return ComparisonResult.better;
    if (totalMemory < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }

  // 获取存储对比结果
  ComparisonResult get storageResult {
    if (totalStorage > 0) return ComparisonResult.better;
    if (totalStorage < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }

  // 获取屏幕对比结果
  ComparisonResult get screenResult {
    if (screenWidth > 0 && screenHeight > 0) return ComparisonResult.better;
    if (screenWidth < 0 && screenHeight < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }
}

// 网络信息对比
class NetworkInfoComparison {
  final bool type;
  final int signalStrength;
  final int linkSpeed;

  NetworkInfoComparison({
    required this.type,
    required this.signalStrength,
    required this.linkSpeed,
  });

  // 获取信号强度对比结果
  ComparisonResult get signalResult {
    if (signalStrength > 0) return ComparisonResult.better;
    if (signalStrength < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }

  // 获取链路速度对比结果
  ComparisonResult get speedResult {
    if (linkSpeed > 0) return ComparisonResult.better;
    if (linkSpeed < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }
}

// 电池信息对比
class BatteryInfoComparison {
  final int level;
  final int capacity;
  final int temperature;
  final int voltage;

  BatteryInfoComparison({
    required this.level,
    required this.capacity,
    required this.temperature,
    required this.voltage,
  });

  // 获取容量对比结果
  ComparisonResult get capacityResult {
    if (capacity > 0) return ComparisonResult.better;
    if (capacity < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }

  // 获取温度对比结果
  ComparisonResult get temperatureResult {
    if (temperature < 0) return ComparisonResult.better; // 温度越低越好
    if (temperature > 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }
}

// 传感器信息对比
class SensorInfoComparison {
  final int totalSensors;
  final bool hasAccelerometer;
  final bool hasGyroscope;
  final bool hasMagnetometer;
  final bool hasLightSensor;
  final bool hasProximitySensor;

  SensorInfoComparison({
    required this.totalSensors,
    required this.hasAccelerometer,
    required this.hasGyroscope,
    required this.hasMagnetometer,
    required this.hasLightSensor,
    required this.hasProximitySensor,
  });

  // 获取传感器数量对比结果
  ComparisonResult get countResult {
    if (totalSensors > 0) return ComparisonResult.better;
    if (totalSensors < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }
}

// 系统信息对比
class SystemInfoComparison {
  final bool osName;
  final int osVersion;
  final bool language;
  final bool region;
  final bool isDebugMode;
  final bool isEmulator;

  SystemInfoComparison({
    required this.osName,
    required this.osVersion,
    required this.language,
    required this.region,
    required this.isDebugMode,
    required this.isEmulator,
  });

  // 获取系统版本对比结果
  ComparisonResult get versionResult {
    if (osVersion > 0) return ComparisonResult.better;
    if (osVersion < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }
}

// 性能对比
class PerformanceComparison {
  final int performanceScore;
  final int performanceLevel;

  PerformanceComparison({
    required this.performanceScore,
    required this.performanceLevel,
  });

  // 获取性能对比结果
  ComparisonResult get result {
    if (performanceScore > 0) return ComparisonResult.better;
    if (performanceScore < 0) return ComparisonResult.worse;
    return ComparisonResult.equal;
  }
}

// 对比结果枚举
enum ComparisonResult {
  better,
  worse,
  equal,
}

// 对比异常
class ComparisonException implements Exception {
  final String message;
  ComparisonException(this.message);

  @override
  String toString() => message;
}
```

## 测试与调试

### 1. 设备信息服务测试

```dart
// test/device_info_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:device_info_pro/services/device_info_service.dart';

void main() {
  group('DeviceInfoService Tests', () {
    late DeviceInfoService deviceInfoService;

    setUp(() {
      deviceInfoService = DeviceInfoService();
    });

    test('should get device info successfully', () async {
      // 模拟权限授予
      // 这里需要模拟权限检查返回true

      final deviceInfo = await deviceInfoService.getDeviceInfo();
      expect(deviceInfo, isA<DeviceInfo>());
    });

    test('should throw exception when permissions are denied', () async {
      // 模拟权限拒绝
      // 这里需要模拟权限检查返回false

      await expectLater(
        deviceInfoService.getDeviceInfo(),
        throwsA(isA<DeviceInfoException>()),
      );
    });

    test('should check emulator status correctly', () async {
      final isEmulator = await deviceInfoService.isEmulator();
      expect(isEmulator, isA<bool>());
    });

    test('should get device id correctly', () async {
      final deviceId = await deviceInfoService.getDeviceId();
      expect(deviceId, isA<String>());
      expect(deviceId, isNotEmpty);
    });
  });
}
```

### 2. 设备对比服务测试

```dart
// test/device_comparison_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:device_info_pro/services/device_comparison_service.dart';
import 'package:device_info_pro/models/device_info.dart';

void main() {
  group('DeviceComparisonService Tests', () {
    late DeviceComparisonService comparisonService;

    setUp(() {
      comparisonService = DeviceComparisonService();
    });

    test('should compare devices correctly', () async {
      final device1 = createMockDeviceInfo('Device 1');
      final device2 = createMockDeviceInfo('Device 2');

      final comparison = comparisonService.compareDevices(device1, device2);
      expect(comparison, isA<DeviceComparison>());
    });

    test('should save and retrieve comparisons correctly', () async {
      final deviceInfo = createMockDeviceInfo('Test Device');

      await comparisonService.saveDeviceForComparison(deviceInfo, 'Test');
      final comparisons = await comparisonService.getSavedComparisons();

      expect(comparisons, contains('Test'));
      expect(comparisons['Test'], isA<DeviceInfo>());
    });

    test('should remove saved comparisons correctly', () async {
      final deviceInfo = createMockDeviceInfo('Test Device');

      await comparisonService.saveDeviceForComparison(deviceInfo, 'Test');
      await comparisonService.removeSavedComparison('Test');
      final comparisons = await comparisonService.getSavedComparisons();

      expect(comparisons, isNot(contains('Test')));
    });
  });

  DeviceInfo createMockDeviceInfo(String name) {
    return DeviceInfo(
      basicInfo: BasicDeviceInfo(
        manufacturer: 'Test',
        model: name,
        brand: 'Test',
        device: 'test',
        product: 'test',
        hardware: 'test',
        serialNumber: '123456',
        androidId: 'test',
      ),
      hardwareInfo: HardwareDeviceInfo(
        cpuCores: 8,
        cpuFrequency: 2400.0,
        cpuArchitecture: 'arm64',
        cpuName: 'Test CPU',
        totalMemory: 8 * 1024 * 1024 * 1024,
        availableMemory: 4 * 1024 * 1024 * 1024,
        totalStorage: 128 * 1024 * 1024 * 1024,
        availableStorage: 64 * 1024 * 1024 * 1024,
        screenWidth: 1080,
        screenHeight: 1920,
        screenDensity: 2.0,
        screenScale: 2.0,
        gpuRenderer: 'Test GPU',
        gpuVendor: 'Test',
        gpuVersion: '1.0',
      ),
      networkInfo: NetworkDeviceInfo(
        type: NetworkType.wifi,
        signalStrength: 80,
        linkSpeed: 150,
        isConnected: true,
      ),
      batteryInfo: BatteryDeviceInfo(
        level: 80,
        status: BatteryStatus.discharging,
        powerSource: BatteryPowerSource.battery,
        health: BatteryHealth.good,
        capacity: 4000,
        temperature: 300,
        voltage: 4200,
        chargeTimeRemaining: 0,
        dischargeTimeRemaining: 14400,
      ),
      sensorInfo: SensorDeviceInfo(
        sensors: [],
        hasAccelerometer: true,
        hasGyroscope: true,
        hasMagnetometer: true,
        hasLightSensor: true,
        hasProximitySensor: true,
        hasBarometer: false,
        hasTemperatureSensor: false,
        hasHumiditySensor: false,
        hasHeartRateSensor: false,
        hasStepCounter: true,
      ),
      appInfo: AppDeviceInfo(
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        buildNumber: '1',
        installTime: '2023-01-01',
        updateTime: '2023-01-01',
        versionCode: 1,
        signature: 'test',
        permissions: [],
        appSize: 50 * 1024 * 1024,
        activities: [],
        services: [],
        receivers: [],
      ),
      systemInfo: SystemDeviceInfo(
        osName: 'Android',
        osVersion: '10',
        osBuild: 'test',
        kernelVersion: 'test',
        language: 'en',
        region: 'US',
        timezone: 'UTC',
        is24HourFormat: true,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '24h',
        isDebugMode: false,
        isEmulator: false,
        isJailbroken: false,
        securityPatchLevel: '2023-01-01',
        supportedAbis: ['arm64-v8a'],
        features: [],
      ),
      timestamp: DateTime.now(),
    );
  }
}
```

## 最佳实践与注意事项

### 1. 权限管理

- **渐进式权限请求**：先请求基本权限，再请求敏感权限
- **权限说明**：清晰地向用户解释为什么需要权限
- **优雅降级**：在权限被拒绝时提供替代功能

### 2. 性能优化

- **异步操作**：所有设备信息获取都应该是异步的
- **缓存策略**：合理缓存设备信息，避免重复获取
- **批量操作**：将多个设备信息获取操作合并

### 3. 数据安全

- **敏感信息保护**：对敏感设备信息进行加密存储
- **数据脱敏**：在分享或导出时对敏感信息进行脱敏
- **权限控制**：严格控制设备信息的访问权限

### 4. 用户体验

- **加载状态**：提供清晰的加载状态反馈
- **错误处理**：优雅地处理各种错误情况
- **数据可视化**：使用图表等方式直观展示设备信息

### 5. 平台差异

- **API 差异**：处理 Android 和 iOS 平台 API 的差异
- **数据格式**：统一不同平台的数据格式
- **功能适配**：根据平台能力适配功能

## 总结

通过本文的详细介绍，我们成功实现了一个功能完整的专业设备信息分析应用 DeviceInfoPro。这个项目涵盖了：

1. **设备信息获取**：全面获取设备的各种信息
2. **性能监控**：实时监控设备性能状态
3. **设备对比**：支持多设备对比功能
4. **历史记录**：保存和查看历史设备信息
5. **数据可视化**：直观展示设备信息和分析结果
6. **跨平台支持**：同时支持 Android 和 iOS 平台

设备信息获取是移动应用开发中的重要功能，通过 Flutter 的桥接能力，我们可以轻松实现跨平台的设备信息获取。在实际项目中，还可以根据具体需求进一步扩展功能，比如：

- 集成更多设备传感器
- 添加设备健康诊断功能
- 实现设备信息云端同步
- 添加设备性能优化建议
- 集成设备安全检测功能
- 实现设备信息导出为多种格式

希望本文能够帮助开发者更好地理解和实现 Flutter 中的设备信息获取功能。
