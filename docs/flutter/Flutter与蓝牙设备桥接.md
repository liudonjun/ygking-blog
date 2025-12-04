---
description: 本文详细介绍Flutter应用如何与蓝牙设备进行桥接通信，包括设备扫描、连接、数据传输等核心功能，以及Android和iOS平台的具体实现细节。
tag:
  - Flutter
  - 蓝牙
  - 设备通信
  - 平台桥接
  - IoT
  - 硬件集成
sticky: 1
sidebar: true
---

# Flutter 与蓝牙设备桥接

## 故事开始：小王的智能家居项目

小王是一位 IoT 爱好者，他正在开发一个智能家居控制应用，需要通过蓝牙连接各种智能设备。在 Flutter 中实现蓝牙功能时，他发现这比想象中要复杂。

"蓝牙连接涉及设备扫描、配对、连接管理、数据传输等多个环节，而且 Android 和 iOS 的实现差异很大。"小王在技术日记中写道。

## 第一章：蓝牙技术基础

### 1.1 蓝牙技术概述

蓝牙是一种短距离无线通信技术，主要分为两种类型：

**经典蓝牙（Classic Bluetooth）**

- 适用于大数据传输
- 功耗较高
- 常用于音频设备、键盘鼠标等

**低功耗蓝牙（Bluetooth Low Energy, BLE）**

- 功耗极低
- 适用于 IoT 设备
- 连接快速，数据传输量小

### 1.2 Flutter 蓝牙开发生态

Flutter 中蓝牙开发主要有以下几种方案：

1. **flutter_blue_plus** - 最流行的蓝牙插件
2. **flutter_reactive_ble** - 专注于 BLE 的插件
3. **自定义平台通道** - 完全自定义实现

## 第二章：环境搭建与基础配置

### 2.1 添加依赖

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_blue_plus: ^1.31.5
  permission_handler: ^11.0.1
```

### 2.2 权限配置

**Android 权限配置（android/app/src/main/AndroidManifest.xml）**

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Android 12+ 需要这些权限 -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                 android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
```

**iOS 权限配置（ios/Runner/Info.plist）**

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>此应用需要蓝牙权限来连接智能设备</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>此应用需要蓝牙权限来连接智能设备</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>此应用需要位置权限来扫描蓝牙设备</string>
```

### 2.3 权限管理实现

```dart
import 'package:permission_handler/permission_handler.dart';

class BluetoothPermissionManager {
  static Future<bool> requestPermissions() async {
    // Android 12+ 需要特殊处理
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 31) {
        // Android 12+
        final bluetoothScan = await Permission.bluetoothScan.request();
        final bluetoothConnect = await Permission.bluetoothConnect.request();
        final bluetoothAdvertise = await Permission.bluetoothAdvertise.request();

        return bluetoothScan.isGranted &&
               bluetoothConnect.isGranted &&
               bluetoothAdvertise.isGranted;
      } else {
        // Android 11及以下
        final bluetooth = await Permission.bluetooth.request();
        final bluetoothAdmin = await Permission.bluetoothAdmin.request();
        final location = await Permission.location.request();

        return bluetooth.isGranted &&
               bluetoothAdmin.isGranted &&
               location.isGranted;
      }
    } else {
      // iOS
      final bluetooth = await Permission.bluetooth.request();
      return bluetooth.isGranted;
    }
  }

  static Future<bool> checkPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 31) {
        return await Permission.bluetoothScan.isGranted &&
               await Permission.bluetoothConnect.isGranted &&
               await Permission.bluetoothAdvertise.isGranted;
      } else {
        return await Permission.bluetooth.isGranted &&
               await Permission.bluetoothAdmin.isGranted &&
               await Permission.location.isGranted;
      }
    } else {
      return await Permission.bluetooth.isGranted;
    }
  }

  static Future<void> openSettings() async {
    await openAppSettings();
  }
}
```

## 第三章：蓝牙设备扫描与发现

### 3.1 蓝牙状态管理

```dart
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class BluetoothManager {
  static final BluetoothManager _instance = BluetoothManager._internal();
  factory BluetoothManager() => _instance;
  BluetoothManager._internal();

  final StreamController<BluetoothState> _stateController =
      StreamController<BluetoothState>.broadcast();

  Stream<BluetoothState> get bluetoothState => _stateController.stream;

  Future<bool> isBluetoothAvailable() async {
    try {
      await FlutterBluePlus.startScan(timeout: Duration(seconds: 1));
      await FlutterBluePlus.stopScan();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> isBluetoothEnabled() async {
    final state = await FlutterBluePlus.adapterState.first;
    return state == BluetoothAdapterState.on;
  }

  void startListening() {
    FlutterBluePlus.adapterState.listen((state) {
      _stateController.add(state);
    });
  }

  Future<void> enableBluetooth() async {
    if (Platform.isAndroid) {
      // Android需要用户手动开启
      await FlutterBluePlus.openSettings();
    }
    // iOS会自动提示用户开启蓝牙
  }

  void dispose() {
    _stateController.close();
  }
}
```

### 3.2 设备扫描实现

```dart
class BluetoothScanner {
  final StreamController<List<BluetoothDevice>> _devicesController =
      StreamController<List<BluetoothDevice>>.broadcast();
  final Set<BluetoothDevice> _discoveredDevices = {};
  bool _isScanning = false;

  Stream<List<BluetoothDevice>> get discoveredDevices => _devicesController.stream;
  bool get isScanning => _isScanning;

  Future<void> startScan({Duration timeout = const Duration(seconds: 10)}) async {
    if (_isScanning) return;

    _isScanning = true;
    _discoveredDevices.clear();

    try {
      // 开始扫描
      await FlutterBluePlus.startScan(
        timeout: timeout,
        androidUsesFineLocation: true,
      );

      // 监听扫描结果
      FlutterBluePlus.scanResults.listen((results) {
        for (ScanResult result in results) {
          if (result.device.name.isNotEmpty ||
              result.device.advertisementData.localName.isNotEmpty) {
            _discoveredDevices.add(result.device);
          }
        }
        _devicesController.add(_discoveredDevices.toList());
      });

      // 扫描超时处理
      Timer(timeout, () {
        if (_isScanning) {
          stopScan();
        }
      });
    } catch (e) {
      _isScanning = false;
      throw BluetoothException('扫描失败：${e.toString()}');
    }
  }

  Future<void> stopScan() async {
    if (!_isScanning) return;

    _isScanning = false;
    await FlutterBluePlus.stopScan();
  }

  Future<void> scanForSpecificDevice({
    required String deviceName,
    Duration timeout = const Duration(seconds: 10),
  }) async {
    if (_isScanning) return;

    _isScanning = true;
    _discoveredDevices.clear();

    try {
      await FlutterBluePlus.startScan(
        timeout: timeout,
        androidUsesFineLocation: true,
      );

      FlutterBluePlus.scanResults.listen((results) {
        for (ScanResult result in results) {
          if (result.device.name == deviceName ||
              result.device.advertisementData.localName == deviceName) {
            _discoveredDevices.add(result.device);
            stopScan(); // 找到目标设备后停止扫描
          }
        }
        _devicesController.add(_discoveredDevices.toList());
      });
    } catch (e) {
      _isScanning = false;
      throw BluetoothException('扫描特定设备失败：${e.toString()}');
    }
  }

  void dispose() {
    _devicesController.close();
  }
}
```

### 3.3 设备信息获取

```dart
class BluetoothDeviceInfo {
  final BluetoothDevice device;
  final ScanResult? scanResult;

  BluetoothDeviceInfo(this.device, [this.scanResult]);

  String get name => device.name.isNotEmpty
      ? device.name
      : scanResult?.advertisementData.localName ?? '未知设备';

  String get id => device.remoteId.str;

  int get rssi => scanResult?.rssi ?? 0;

  int get signalStrength {
    if (rssi >= -50) return 4; // 信号强
    if (rssi >= -70) return 3; // 信号良好
    if (rssi >= -90) return 2; // 信号一般
    return 1; // 信号弱
  }

  List<String> get serviceUuids =>
      scanResult?.advertisementData.serviceUuids.map((uuid) => uuid.str).toList() ?? [];

  Map<String, dynamic> get manufacturerData =>
      scanResult?.advertisementData.manufacturerData ?? {};

  bool get isConnectable => scanResult?.advertisementData.connectable ?? true;

  String get signalStrengthText {
    switch (signalStrength) {
      case 4: return '信号强';
      case 3: return '信号良好';
      case 2: return '信号一般';
      case 1: return '信号弱';
      default: return '无信号';
    }
  }
}

class DeviceInfoProvider {
  static Future<BluetoothDeviceInfo> getDeviceInfo(BluetoothDevice device) async {
    try {
      // 连接设备获取更多信息
      await device.connect();

      // 获取设备服务
      List<BluetoothService> services = await device.discoverServices();

      // 获取设备名称
      String deviceName = device.name;
      if (deviceName.isEmpty) {
        // 尝试从设备信息服务获取名称
        for (BluetoothService service in services) {
          if (service.uuid.toString() == '0000180a-0000-1000-8000-00805f9b34fb') {
            for (BluetoothCharacteristic characteristic in service.characteristics) {
              if (characteristic.uuid.toString() == '00002a00-0000-1000-8000-00805f9b34fb') {
                var value = await characteristic.read();
                deviceName = String.fromCharCodes(value);
                break;
              }
            }
          }
        }
      }

      await device.disconnect();

      return BluetoothDeviceInfo(device);
    } catch (e) {
      return BluetoothDeviceInfo(device);
    }
  }
}
```

## 第四章：设备连接与通信

### 4.1 设备连接管理

```dart
class BluetoothConnectionManager {
  final Map<String, BluetoothConnection> _connections = {};
  final StreamController<BluetoothConnectionEvent> _eventController =
      StreamController<BluetoothConnectionEvent>.broadcast();

  Stream<BluetoothConnectionEvent> get connectionEvents => _eventController.stream;

  Future<BluetoothConnection> connectToDevice(BluetoothDevice device) async {
    final deviceId = device.remoteId.str;

    // 检查是否已连接
    if (_connections.containsKey(deviceId)) {
      return _connections[deviceId]!;
    }

    try {
      // 连接设备
      await device.connect(timeout: Duration(seconds: 15));

      // 发现服务
      List<BluetoothService> services = await device.discoverServices();

      // 创建连接对象
      final connection = BluetoothConnection(
        device: device,
        services: services,
      );

      _connections[deviceId] = connection;

      _eventController.add(BluetoothConnectionEvent(
        type: ConnectionEventType.connected,
        deviceId: deviceId,
        connection: connection,
      ));

      // 监听连接状态
      device.connectionState.listen((state) {
        if (state == BluetoothConnectionState.disconnected) {
          _connections.remove(deviceId);
          _eventController.add(BluetoothConnectionEvent(
            type: ConnectionEventType.disconnected,
            deviceId: deviceId,
          ));
        }
      });

      return connection;
    } catch (e) {
      throw BluetoothException('连接设备失败：${e.toString()}');
    }
  }

  Future<void> disconnectFromDevice(String deviceId) async {
    final connection = _connections[deviceId];
    if (connection != null) {
      await connection.device.disconnect();
      _connections.remove(deviceId);

      _eventController.add(BluetoothConnectionEvent(
        type: ConnectionEventType.disconnected,
        deviceId: deviceId,
      ));
    }
  }

  Future<void> disconnectAll() async {
    final connections = List.from(_connections.values);
    for (final connection in connections) {
      await connection.device.disconnect();
    }
    _connections.clear();
  }

  BluetoothConnection? getConnection(String deviceId) {
    return _connections[deviceId];
  }

  List<BluetoothConnection> getAllConnections() {
    return _connections.values.toList();
  }

  bool isConnected(String deviceId) {
    return _connections.containsKey(deviceId);
  }

  void dispose() {
    _eventController.close();
  }
}

class BluetoothConnection {
  final BluetoothDevice device;
  final List<BluetoothService> services;
  final Map<String, BluetoothCharacteristic> _characteristics = {};

  BluetoothConnection({
    required this.device,
    required this.services,
  }) {
    _cacheCharacteristics();
  }

  void _cacheCharacteristics() {
    for (final service in services) {
      for (final characteristic in service.characteristics) {
        _characteristics[characteristic.uuid.str] = characteristic;
      }
    }
  }

  BluetoothCharacteristic? getCharacteristic(String uuid) {
    return _characteristics[uuid];
  }

  List<BluetoothCharacteristic> getCharacteristicsByService(String serviceUuid) {
    final service = services.firstWhere(
      (s) => s.uuid.str == serviceUuid,
      orElse: () => throw Exception('服务未找到：$serviceUuid'),
    );
    return service.characteristics;
  }

  Future<List<int>> readCharacteristic(String uuid) async {
    final characteristic = getCharacteristic(uuid);
    if (characteristic == null) {
      throw BluetoothException('特征值未找到：$uuid');
    }

    if (!characteristic.properties.read) {
      throw BluetoothException('特征值不支持读取：$uuid');
    }

    return await characteristic.read();
  }

  Future<void> writeCharacteristic(String uuid, List<int> value) async {
    final characteristic = getCharacteristic(uuid);
    if (characteristic == null) {
      throw BluetoothException('特征值未找到：$uuid');
    }

    if (!characteristic.properties.write) {
      throw BluetoothException('特征值不支持写入：$uuid');
    }

    await characteristic.write(value);
  }

  Future<void> notifyCharacteristic(String uuid, bool enable) async {
    final characteristic = getCharacteristic(uuid);
    if (characteristic == null) {
      throw BluetoothException('特征值未找到：$uuid');
    }

    if (!characteristic.properties.notify && !characteristic.properties.indicate) {
      throw BluetoothException('特征值不支持通知：$uuid');
    }

    await characteristic.setNotifyValue(enable);
  }

  Stream<List<int>>? getCharacteristicNotifications(String uuid) {
    final characteristic = getCharacteristic(uuid);
    if (characteristic == null) {
      throw BluetoothException('特征值未找到：$uuid');
    }

    return characteristic.value;
  }
}

enum ConnectionEventType {
  connected,
  disconnected,
  connectionFailed,
}

class BluetoothConnectionEvent {
  final ConnectionEventType type;
  final String deviceId;
  final BluetoothConnection? connection;
  final String? error;

  BluetoothConnectionEvent({
    required this.type,
    required this.deviceId,
    this.connection,
    this.error,
  });
}
```

### 4.2 数据传输协议

```dart
abstract class BluetoothProtocol {
  Future<void> sendData(BluetoothConnection connection, dynamic data);
  Future<dynamic> receiveData(BluetoothConnection connection);
}

class SimpleTextProtocol implements BluetoothProtocol {
  final String serviceUuid;
  final String writeCharacteristicUuid;
  final String readCharacteristicUuid;

  SimpleTextProtocol({
    required this.serviceUuid,
    required this.writeCharacteristicUuid,
    required this.readCharacteristicUuid,
  });

  @override
  Future<void> sendData(BluetoothConnection connection, String data) async {
    final bytes = utf8.encode(data);
    await connection.writeCharacteristic(writeCharacteristicUuid, bytes);
  }

  @override
  Future<String> receiveData(BluetoothConnection connection) async {
    final bytes = await connection.readCharacteristic(readCharacteristicUuid);
    return utf8.decode(bytes);
  }

  Stream<String> receiveDataStream(BluetoothConnection connection) {
    return connection
        .getCharacteristicNotifications(readCharacteristicUuid)!
        .map((bytes) => utf8.decode(bytes));
  }
}

class BinaryProtocol implements BluetoothProtocol {
  final String serviceUuid;
  final String writeCharacteristicUuid;
  final String readCharacteristicUuid;

  BinaryProtocol({
    required this.serviceUuid,
    required this.writeCharacteristicUuid,
    required this.readCharacteristicUuid,
  });

  @override
  Future<void> sendData(BluetoothConnection connection, List<int> data) async {
    // 添加数据包头（长度信息）
    final packet = _createPacket(data);
    await connection.writeCharacteristic(writeCharacteristicUuid, packet);
  }

  @override
  Future<List<int>> receiveData(BluetoothConnection connection) async {
    final packet = await connection.readCharacteristic(readCharacteristicUuid);
    return _parsePacket(packet);
  }

  Stream<List<int>> receiveDataStream(BluetoothConnection connection) {
    return connection
        .getCharacteristicNotifications(readCharacteristicUuid)!
        .map(_parsePacket);
  }

  List<int> _createPacket(List<int> data) {
    // 简单的协议：[长度(2字节)][数据]
    final length = data.length;
    final packet = <int>[];
    packet.add((length >> 8) & 0xFF); // 高字节
    packet.add(length & 0xFF); // 低字节
    packet.addAll(data);
    return packet;
  }

  List<int> _parsePacket(List<int> packet) {
    if (packet.length < 2) {
      throw BluetoothException('数据包格式错误');
    }

    final length = (packet[0] << 8) | packet[1];
    if (packet.length < length + 2) {
      throw BluetoothException('数据包不完整');
    }

    return packet.sublist(2, 2 + length);
  }
}
```

## 第五章：实际应用案例

### 5.1 智能灯泡控制

```dart
class SmartLightController {
  final BluetoothConnectionManager _connectionManager;
  final SimpleTextProtocol _protocol;

  SmartLightController(this._connectionManager)
      : _protocol = SimpleTextProtocol(
          serviceUuid: '12345678-1234-1234-1234-123456789abc',
          writeCharacteristicUuid: '12345678-1234-1234-1234-123456789abd',
          readCharacteristicUuid: '12345678-1234-1234-1234-123456789abe',
        );

  Future<void> turnOn(String deviceId) async {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    await _protocol.sendData(connection, 'ON');
  }

  Future<void> turnOff(String deviceId) async {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    await _protocol.sendData(connection, 'OFF');
  }

  Future<void> setBrightness(String deviceId, int brightness) async {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    final command = 'BRIGHTNESS:$brightness';
    await _protocol.sendData(connection, command);
  }

  Future<void> setColor(String deviceId, Color color) async {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    final r = color.red;
    final g = color.green;
    final b = color.blue;
    final command = 'COLOR:$r,$g,$b';
    await _protocol.sendData(connection, command);
  }

  Future<String> getStatus(String deviceId) async {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    return await _protocol.receiveData(connection);
  }
}
```

### 5.2 健康监测设备

```dart
class HealthMonitorDevice {
  final BluetoothConnectionManager _connectionManager;
  final BinaryProtocol _protocol;

  HealthMonitorDevice(this._connectionManager)
      : _protocol = BinaryProtocol(
          serviceUuid: '87654321-4321-4321-4321-210987654321',
          writeCharacteristicUuid: '87654321-4321-4321-4321-210987654322',
          readCharacteristicUuid: '87654321-4321-4321-4321-210987654323',
        );

  Stream<HealthData> getHealthDataStream(String deviceId) {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    return _protocol
        .receiveDataStream(connection)
        .map(_parseHealthData);
  }

  HealthData _parseHealthData(List<int> data) {
    if (data.length < 8) {
      throw BluetoothException('健康数据格式错误');
    }

    // 解析心率数据
    final heartRate = data[0];

    // 解析血氧数据
    final bloodOxygen = data[1];

    // 解析步数数据（4字节）
    final steps = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];

    return HealthData(
      heartRate: heartRate,
      bloodOxygen: bloodOxygen,
      steps: steps,
      timestamp: DateTime.now(),
    );
  }

  Future<void> startMonitoring(String deviceId) async {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    // 发送开始监测命令
    await _protocol.sendData(connection, [0x01]);

    // 启用通知
    await connection.notifyCharacteristic(
      '87654321-4321-4321-4321-210987654323',
      true,
    );
  }

  Future<void> stopMonitoring(String deviceId) async {
    final connection = _connectionManager.getConnection(deviceId);
    if (connection == null) {
      throw BluetoothException('设备未连接');
    }

    // 发送停止监测命令
    await _protocol.sendData(connection, [0x00]);

    // 禁用通知
    await connection.notifyCharacteristic(
      '87654321-4321-4321-4321-210987654323',
      false,
    );
  }
}

class HealthData {
  final int heartRate;
  final int bloodOxygen;
  final int steps;
  final DateTime timestamp;

  HealthData({
    required this.heartRate,
    required this.bloodOxygen,
    required this.steps,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'heartRate': heartRate,
      'bloodOxygen': bloodOxygen,
      'steps': steps,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
```

## 第六章：UI 实现

### 6.1 设备扫描页面

```dart
class BluetoothScanPage extends StatefulWidget {
  @override
  _BluetoothScanPageState createState() => _BluetoothScanPageState();
}

class _BluetoothScanPageState extends State<BluetoothScanPage> {
  final BluetoothScanner _scanner = BluetoothScanner();
  final BluetoothManager _bluetoothManager = BluetoothManager();
  List<BluetoothDeviceInfo> _devices = [];
  bool _isScanning = false;

  @override
  void initState() {
    super.initState();
    _bluetoothManager.startListening();
    _scanner.discoveredDevices.listen((devices) {
      setState(() {
        _devices = devices.map((device) => BluetoothDeviceInfo(device)).toList();
      });
    });
  }

  @override
  void dispose() {
    _scanner.dispose();
    _bluetoothManager.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('蓝牙设备扫描'),
        actions: [
          IconButton(
            icon: Icon(_isScanning ? Icons.stop : Icons.search),
            onPressed: _toggleScanning,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildBluetoothStatus(),
          Expanded(child: _buildDeviceList()),
        ],
      ),
    );
  }

  Widget _buildBluetoothStatus() {
    return StreamBuilder<BluetoothState>(
      stream: _bluetoothManager.bluetoothState,
      builder: (context, snapshot) {
        final state = snapshot.data ?? BluetoothAdapterState.unknown;

        Color statusColor;
        String statusText;
        IconData statusIcon;

        switch (state) {
          case BluetoothAdapterState.on:
            statusColor = Colors.green;
            statusText = '蓝牙已开启';
            statusIcon = Icons.bluetooth;
            break;
          case BluetoothAdapterState.off:
            statusColor = Colors.red;
            statusText = '蓝牙已关闭';
            statusIcon = Icons.bluetooth_disabled;
            break;
          case BluetoothAdapterState.unavailable:
            statusColor = Colors.grey;
            statusText = '蓝牙不可用';
            statusIcon = Icons.bluetooth_disabled;
            break;
          default:
            statusColor = Colors.grey;
            statusText = '蓝牙状态未知';
            statusIcon = Icons.bluetooth_disabled;
        }

        return Container(
          padding: EdgeInsets.all(16),
          color: statusColor.withOpacity(0.1),
          child: Row(
            children: [
              Icon(statusIcon, color: statusColor),
              SizedBox(width: 12),
              Text(
                statusText,
                style: TextStyle(
                  color: statusColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Spacer(),
              if (state == BluetoothAdapterState.off)
                TextButton(
                  onPressed: _enableBluetooth,
                  child: Text('开启蓝牙'),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDeviceList() {
    if (_devices.isEmpty && !_isScanning) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bluetooth_searching, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              '未发现设备',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _startScan,
              child: Text('开始扫描'),
            ),
          ],
        ),
      );
    }

    if (_devices.isEmpty && _isScanning) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('正在扫描设备...'),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _devices.length,
      itemBuilder: (context, index) {
        final device = _devices[index];
        return DeviceCard(
          device: device,
          onTap: () => _connectToDevice(device),
        );
      },
    );
  }

  void _toggleScanning() async {
    if (_isScanning) {
      await _scanner.stopScan();
      setState(() {
        _isScanning = false;
      });
    } else {
      await _startScan();
    }
  }

  Future<void> _startScan() async {
    final hasPermission = await BluetoothPermissionManager.checkPermissions();
    if (!hasPermission) {
      final granted = await BluetoothPermissionManager.requestPermissions();
      if (!granted) {
        _showPermissionDialog();
        return;
      }
    }

    final isEnabled = await _bluetoothManager.isBluetoothEnabled();
    if (!isEnabled) {
      await _bluetoothManager.enableBluetooth();
      return;
    }

    await _scanner.startScan();
    setState(() {
      _isScanning = true;
    });
  }

  Future<void> _enableBluetooth() async {
    await _bluetoothManager.enableBluetooth();
  }

  void _connectToDevice(BluetoothDeviceInfo device) async {
    try {
      final connectionManager = Provider.of<BluetoothConnectionManager>(
        context,
        listen: false,
      );

      await connectionManager.connectToDevice(device.device);

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => DeviceControlPage(device: device),
        ),
      );
    } catch (e) {
      _showErrorDialog('连接失败', e.toString());
    }
  }

  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('需要权限'),
        content: Text('应用需要蓝牙权限才能扫描和连接设备'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              BluetoothPermissionManager.openSettings();
            },
            child: Text('去设置'),
          ),
        ],
      ),
    );
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

class DeviceCard extends StatelessWidget {
  final BluetoothDeviceInfo device;
  final VoidCallback onTap;

  const DeviceCard({
    required this.device,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getSignalColor(device.signalStrength),
          child: Icon(
            Icons.bluetooth,
            color: Colors.white,
          ),
        ),
        title: Text(
          device.name,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ID: ${device.id}'),
            Text('信号: ${device.signalStrengthText}'),
            if (device.serviceUuids.isNotEmpty)
              Text('服务: ${device.serviceUuids.length}个'),
          ],
        ),
        trailing: Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Color _getSignalColor(int strength) {
    switch (strength) {
      case 4: return Colors.green;
      case 3: return Colors.lightGreen;
      case 2: return Colors.orange;
      case 1: return Colors.red;
      default: return Colors.grey;
    }
  }
}
```

## 第七章：错误处理与调试

### 7.1 异常处理

```dart
class BluetoothException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  BluetoothException(this.message, {this.code, this.originalError});

  @override
  String toString() {
    return 'BluetoothException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}

class BluetoothErrorHandler {
  static BluetoothException handleError(dynamic error) {
    if (error is BluetoothException) {
      return error;
    }

    if (error.toString().contains('Bluetooth is not available')) {
      return BluetoothException(
        '蓝牙不可用',
        code: 'BLUETOOTH_UNAVAILABLE',
      );
    }

    if (error.toString().contains('Bluetooth is disabled')) {
      return BluetoothException(
        '蓝牙已关闭',
        code: 'BLUETOOTH_DISABLED',
      );
    }

    if (error.toString().contains('Location permission denied')) {
      return BluetoothException(
        '位置权限被拒绝',
        code: 'LOCATION_PERMISSION_DENIED',
      );
    }

    if (error.toString().contains('Connection timeout')) {
      return BluetoothException(
        '连接超时',
        code: 'CONNECTION_TIMEOUT',
      );
    }

    if (error.toString().contains('Device not found')) {
      return BluetoothException(
        '设备未找到',
        code: 'DEVICE_NOT_FOUND',
      );
    }

    return BluetoothException(
      '未知错误：${error.toString()}',
      code: 'UNKNOWN_ERROR',
      originalError: error,
    );
  }
}
```

### 7.2 调试工具

```dart
class BluetoothLogger {
  static const String _tag = 'Bluetooth';
  static bool _isDebugMode = kDebugMode;

  static void log(String message, {LogLevel level = LogLevel.info}) {
    if (!_isDebugMode) return;

    final timestamp = DateTime.now().toIso8601String();
    final logMessage = '[$timestamp] [$_tag] [${level.name.toUpperCase()}] $message';

    print(logMessage);

    // 可以添加日志文件记录
    _writeToLogFile(logMessage);
  }

  static void logDeviceScan(List<BluetoothDevice> devices) {
    log('扫描完成，发现 ${devices.length} 个设备');
    for (final device in devices) {
      log('设备: ${device.name} (${device.remoteId.str})');
    }
  }

  static void logConnection(String deviceId, bool connected) {
    log('设备 $deviceId ${connected ? '已连接' : '已断开'}');
  }

  static void logDataTransfer(String deviceId, List<int> data, bool isSend) {
    final direction = isSend ? '发送' : '接收';
    final dataHex = data.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ');
    log('$direction数据 [$deviceId]: $dataHex');
  }

  static void logError(String error, StackTrace? stackTrace) {
    log('错误: $error', level: LogLevel.error);
    if (stackTrace != null) {
      log('堆栈跟踪: $stackTrace', level: LogLevel.error);
    }
  }

  static void _writeToLogFile(String message) {
    // 实现日志文件写入
    // 可以使用path_provider获取应用文档目录
  }
}

enum LogLevel { debug, info, warning, error }
```

## 故事结局：小王的成功

经过几个月的开发，小王的智能家居应用终于完成了！他成功实现了与各种蓝牙设备的稳定连接和控制。

"蓝牙开发确实复杂，但通过合理的架构设计和错误处理，我们可以构建出稳定可靠的蓝牙应用。"小王在他的技术博客中总结道，"关键是要理解蓝牙协议、处理好平台差异，并提供良好的用户体验。"

小王的应用获得了用户的好评，特别是流畅的设备连接体验和稳定的通信性能。他的成功证明了：**掌握蓝牙桥接技术，是开发 IoT 应用的关键技能。**

## 总结

通过小王的智能家居应用开发故事，我们全面学习了 Flutter 蓝牙桥接技术：

### 核心技术

- **蓝牙基础**：经典蓝牙与 BLE 的区别
- **权限管理**：Android 和 iOS 的权限配置
- **设备扫描**：设备发现和过滤
- **连接管理**：连接建立和维护

### 高级特性

- **数据传输**：文本和二进制协议
- **实时通信**：通知和指示
- **错误处理**：异常捕获和用户提示
- **调试工具**：日志记录和问题排查

### 最佳实践

- **架构设计**：模块化和可扩展性
- **用户体验**：状态反馈和错误提示
- **性能优化**：连接复用和数据缓存
- **平台适配**：Android 和 iOS 的差异处理

蓝牙桥接技术为 Flutter 应用打开了 IoT 世界的大门，让开发者能够构建出与物理世界交互的创新应用。掌握这些技术，将帮助你在物联网时代占据先机！
