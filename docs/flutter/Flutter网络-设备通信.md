---
title: Flutter 设备通信详解
description: 详细介绍 Flutter 中的 WiFi、蓝牙等设备通信方法和最佳实践。
tag:
 - Flutter
 - 网络
 - 设备通信
sidebar: true
---

# Flutter 设备通信详解

## WiFi 通信

### 1. WiFi 连接管理
```dart
// 添加依赖
// pubspec.yaml
dependencies:
  wifi_iot: ^0.3.18

// 使用示例
import 'package:wifi_iot/wifi_iot.dart';

class WiFiManager {
  // 获取 WiFi 状态
  Future<bool> isWiFiEnabled() async {
    return await WiFiForIoTPlugin.isEnabled();
  }
  
  // 开启/关闭 WiFi
  Future<bool> setWiFiEnabled(bool enabled) async {
    return await WiFiForIoTPlugin.setEnabled(enabled);
  }
  
  // 连接 WiFi
  Future<bool> connectToWiFi(String ssid, String password) async {
    return await WiFiForIoTPlugin.connect(
      ssid,
      password: password,
      security: NetworkSecurity.WPA,
    );
  }
  
  // 扫描 WiFi
  Future<List<WifiNetwork>> scanWiFiNetworks() async {
    return await WiFiForIoTPlugin.loadWifiList();
  }
}
```

### 2. Socket 通信
```dart
class SocketClient {
  Socket? _socket;
  
  Future<void> connect(String host, int port) async {
    try {
      _socket = await Socket.connect(host, port);
      print('Connected to: ${_socket?.remoteAddress.address}:${_socket?.remotePort}');
      
      // 监听数据
      _socket?.listen(
        (List<int> data) {
          print('Received: ${String.fromCharCodes(data)}');
        },
        onError: (error) {
          print('Error: $error');
          _socket?.destroy();
        },
        onDone: () {
          print('Connection closed');
          _socket?.destroy();
        },
      );
    } catch (e) {
      print('Failed to connect: $e');
    }
  }
  
  void sendData(String data) {
    _socket?.write(data);
  }
  
  void disconnect() {
    _socket?.destroy();
  }
}
```

## 蓝牙通信

### 1. 蓝牙管理
```dart
// 添加依赖
// pubspec.yaml
dependencies:
  flutter_blue_plus: ^1.5.2

// 使用示例
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class BluetoothManager {
  FlutterBluePlus flutterBlue = FlutterBluePlus.instance;
  
  // 检查蓝牙状态
  Future<bool> isBluetoothEnabled() async {
    return await flutterBlue.isOn;
  }
  
  // 扫描设备
  Stream<List<ScanResult>> scanDevices() {
    // 开始扫描
    flutterBlue.startScan(timeout: Duration(seconds: 4));
    // 返回扫描结果流
    return flutterBlue.scanResults;
  }
  
  // 连接设备
  Future<void> connectToDevice(BluetoothDevice device) async {
    try {
      await device.connect();
      print('Connected to ${device.name}');
    } catch (e) {
      print('Failed to connect: $e');
    }
  }
  
  // 发送数据
  Future<void> sendData(
    BluetoothDevice device,
    List<int> data,
    Guid serviceUuid,
    Guid characteristicUuid,
  ) async {
    List<BluetoothService> services = await device.discoverServices();
    for (BluetoothService service in services) {
      if (service.uuid == serviceUuid) {
        for (BluetoothCharacteristic characteristic in service.characteristics) {
          if (characteristic.uuid == characteristicUuid) {
            await characteristic.write(data);
            break;
          }
        }
      }
    }
  }
}
```

### 2. BLE 通信示例
```dart
class BLEExample extends StatefulWidget {
  @override
  _BLEExampleState createState() => _BLEExampleState();
}

class _BLEExampleState extends State<BLEExample> {
  final BluetoothManager _bluetoothManager = BluetoothManager();
  List<ScanResult> _scanResults = [];
  bool _isScanning = false;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('BLE Example'),
      ),
      body: Column(
        children: [
          // 扫描按钮
          ElevatedButton(
            onPressed: () {
              setState(() {
                _isScanning = true;
              });
              _bluetoothManager.scanDevices().listen((results) {
                setState(() {
                  _scanResults = results;
                });
              });
            },
            child: Text(_isScanning ? 'Scanning...' : 'Start Scan'),
          ),
          // 设备列表
          Expanded(
            child: ListView.builder(
              itemCount: _scanResults.length,
              itemBuilder: (context, index) {
                final result = _scanResults[index];
                return ListTile(
                  title: Text(result.device.name ?? 'Unknown'),
                  subtitle: Text(result.device.id.toString()),
                  trailing: Text('${result.rssi} dBm'),
                  onTap: () => _connectToDevice(result.device),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  
  void _connectToDevice(BluetoothDevice device) async {
    try {
      await _bluetoothManager.connectToDevice(device);
      // 连接成功后的操作
    } catch (e) {
      print('Connection failed: $e');
    }
  }
}
```

## 完整通信示例

```dart
class DeviceCommunicationDemo extends StatefulWidget {
  @override
  _DeviceCommunicationDemoState createState() => _DeviceCommunicationDemoState();
}

class _DeviceCommunicationDemoState extends State<DeviceCommunicationDemo> {
  final WiFiManager _wifiManager = WiFiManager();
  final BluetoothManager _bluetoothManager = BluetoothManager();
  final SocketClient _socketClient = SocketClient();
  
  List<WifiNetwork> _wifiNetworks = [];
  List<ScanResult> _bluetoothDevices = [];
  
  @override
  void initState() {
    super.initState();
    _initCommunication();
  }
  
  Future<void> _initCommunication() async {
    // 检查 WiFi 状态
    bool wifiEnabled = await _wifiManager.isWiFiEnabled();
    if (!wifiEnabled) {
      await _wifiManager.setWiFiEnabled(true);
    }
    
    // 检查蓝牙状态
    bool bluetoothEnabled = await _bluetoothManager.isBluetoothEnabled();
    if (!bluetoothEnabled) {
      // 提示用户开启蓝牙
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Device Communication'),
          bottom: TabBar(
            tabs: [
              Tab(text: 'WiFi'),
              Tab(text: 'Bluetooth'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // WiFi 页面
            _buildWiFiPage(),
            // 蓝牙页面
            _buildBluetoothPage(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildWiFiPage() {
    return Column(
      children: [
        ElevatedButton(
          onPressed: () async {
            final networks = await _wifiManager.scanWiFiNetworks();
            setState(() {
              _wifiNetworks = networks;
            });
          },
          child: Text('Scan WiFi Networks'),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _wifiNetworks.length,
            itemBuilder: (context, index) {
              final network = _wifiNetworks[index];
              return ListTile(
                title: Text(network.ssid ?? 'Unknown'),
                subtitle: Text('Signal: ${network.level} dBm'),
                onTap: () => _connectToWiFi(network),
              );
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildBluetoothPage() {
    return Column(
      children: [
        ElevatedButton(
          onPressed: () {
            _bluetoothManager.scanDevices().listen((results) {
              setState(() {
                _bluetoothDevices = results;
              });
            });
          },
          child: Text('Scan Bluetooth Devices'),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _bluetoothDevices.length,
            itemBuilder: (context, index) {
              final device = _bluetoothDevices[index];
              return ListTile(
                title: Text(device.device.name ?? 'Unknown'),
                subtitle: Text(device.device.id.toString()),
                trailing: Text('${device.rssi} dBm'),
                onTap: () => _connectToBluetoothDevice(device.device),
              );
            },
          ),
        ),
      ],
    );
  }
  
  void _connectToWiFi(WifiNetwork network) async {
    // 显示密码输入对话框
    final password = await _showPasswordDialog();
    if (password != null) {
      final connected = await _wifiManager.connectToWiFi(
        network.ssid!,
        password,
      );
      if (connected) {
        // 连接成功,可以进行 Socket 通信
        await _socketClient.connect('192.168.1.1', 8080);
      }
    }
  }
  
  void _connectToBluetoothDevice(BluetoothDevice device) async {
    try {
      await _bluetoothManager.connectToDevice(device);
      // 连接成功后的操作
    } catch (e) {
      print('Connection failed: $e');
    }
  }
  
  Future<String?> _showPasswordDialog() async {
    return showDialog<String>(
      context: context,
      builder: (context) {
        String? password;
        return AlertDialog(
          title: Text('Enter WiFi Password'),
          content: TextField(
            obscureText: true,
            onChanged: (value) => password = value,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, password),
              child: Text('Connect'),
            ),
          ],
        );
      },
    );
  }
}
```

## 最佳实践

1. 权限处理
- 在 Android 和 iOS 配置文件中添加必要的权限
- 运行时动态请求权限
- 处理权限被拒绝的情况

2. 错误处理
- 处理连接超时
- 处理断开连接
- 实现重连机制

3. 数据传输
- 使用适当的数据格式
- 实现数据校验
- 处理大数据传输

4. 性能优化
- 合理控制扫描频率
- 及时释放资源
- 优化数据传输效率

## 注意事项

1. 平台差异
- Android 和 iOS 的权限处理不同
- 蓝牙 API 在不同平台上的表现可能不同
- 需要适配不同的 WiFi 安全类型

2. 安全性
- 使用安全的通信协议
- 加密敏感数据
- 验证设备身份

3. 电池消耗
- 控制扫描频率
- 及时关闭不需要的连接
- 优化数据传输策略

4. 用户体验
- 提供清晰的连接状态反馈
- 实现自动重连
- 优化扫描和连接的响应时间

## 总结

设备通信是移动应用中常见的功能,通过合理使用 WiFi 和蓝牙通信,可以实现设备间的数据交换。在实现时需要注意权限处理、错误处理和性能优化等方面。 