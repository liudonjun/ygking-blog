---
description: 本文详细介绍Flutter应用如何实现NFC近场通信功能，包括NDEF数据读写、标签检测、点对点通信等核心功能，以及Android和iOS平台的具体实现细节。
tag:
  - Flutter
  - NFC
  - 近场通信
  - 平台桥接
  - 移动支付
  - 智能标签
sticky: 1
sidebar: true
---

# Flutter 与 NFC 近场通信桥接

## 故事开始：小李的智能门禁系统

小李是一位智能家居开发者，他正在开发一个基于 NFC 的门禁系统。用户只需要用手机轻触 NFC 标签，就能自动开门并记录进出时间。

"NFC 技术虽然成熟，但在 Flutter 中实现需要考虑很多细节，比如不同类型的 NFC 标签、数据格式、平台差异等。"小李在开发日志中写道。

## 第一章：NFC 技术基础

### 1.1 NFC 技术概述

NFC（Near Field Communication，近场通信）是一种短距离高频无线通信技术，工作距离通常在 4 厘米以内。

**NFC 的三种工作模式：**

1. **读卡器模式（Reader/Writer Mode）**

   - 手机作为读卡器，读取 NFC 标签
   - 最常见的应用场景

2. **点对点模式（Peer-to-Peer Mode）**

   - 两台 NFC 设备直接通信
   - Android Beam（已废弃）就是这种模式

3. **卡模拟模式（Card Emulation Mode）**
   - 手机模拟成 NFC 卡片
   - 用于移动支付、公交卡等

### 1.2 NFC 数据格式

**NDEF（NFC Data Exchange Format）**

- 标准化的数据交换格式
- 支持多种记录类型：文本、URI、MIME 类型等

**常见的 NFC 标签类型：**

- **NFC Forum Type 1**：如 Topaz，可读写，容量较小
- **NFC Forum Type 2**：如 MIFARE Ultralight，可读写，容量适中
- **NFC Forum Type 3**：如 FeliCa，主要在日本使用
- **NFC Forum Type 4**：如 MIFARE DESFire，支持更复杂的操作
- **MIFARE Classic**：非标准，但广泛使用

### 1.3 Flutter NFC 开发生态

Flutter 中 NFC 开发主要有以下几种方案：

1. **flutter_nfc_kit** - 功能全面的 NFC 插件
2. **nfc_manager** - 轻量级 NFC 管理插件
3. **自定义平台通道** - 完全自定义实现

## 第二章：环境搭建与基础配置

### 2.1 添加依赖

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_nfc_kit: ^3.5.2
  permission_handler: ^11.0.1
```

### 2.2 权限配置

**Android 权限配置（android/app/src/main/AndroidManifest.xml）**

```xml
<!-- NFC基本权限 -->
<uses-permission android:name="android.permission.NFC" />

<!-- Android 12+ 需要这个权限 -->
<uses-permission android:name="android.permission.NFC_PREFERRED_PAYMENT_INFO" />

<!-- 硬件特性声明 -->
<uses-feature android:name="android.hardware.nfc" android:required="true" />

<!-- Android 13+ 需要这个权限用于NFC支付 -->
<uses-permission android:name="android.permission.NFC_TRANSACTION_EVENT" />
```

**iOS 权限配置（ios/Runner/Info.plist）**

```xml
<key>NFCReaderUsageDescription</key>
<string>此应用需要NFC权限来读取智能标签</string>

<!-- 如果需要后台NFC读取 -->
<key>com.apple.developer.nfc.readersession.formats</key>
<array>
    <string>NDEF</string>
    <string>TAG</string>
</array>
```

### 2.3 权限管理实现

```dart
import 'package:permission_handler/permission_handler.dart';

class NFCPermissionManager {
  static Future<bool> requestPermissions() async {
    if (Platform.isAndroid) {
      // Android需要NFC权限
      final nfcPermission = await Permission.nfc.request();
      return nfcPermission.isGranted;
    } else {
      // iOS不需要特殊权限，但需要检查NFC可用性
      return await NFCAvailability.isAvailable();
    }
  }

  static Future<bool> checkPermissions() async {
    if (Platform.isAndroid) {
      return await Permission.nfc.isGranted;
    } else {
      return await NFCAvailability.isAvailable();
    }
  }

  static Future<void> openSettings() async {
    await openAppSettings();
  }
}

class NFCAvailability {
  static Future<bool> isAvailable() async {
    try {
      if (Platform.isAndroid) {
        // 检查Android设备是否支持NFC
        final availability = await FlutterNfcKit.nfcAvailability;
        return availability != NFCAvailability.not_supported;
      } else {
        // iOS设备检查
        return await FlutterNfcKit.nfcAvailability != NFCAvailability.not_supported;
      }
    } catch (e) {
      return false;
    }
  }

  static Future<NFCStatus> checkStatus() async {
    try {
      return await FlutterNfcKit.nfcAvailability;
    } catch (e) {
      return NFCStatus.not_supported;
    }
  }
}

enum NFCStatus {
  available,
  enabled,
  disabled,
  not_supported,
}
```

## 第三章：NFC 标签读取

### 3.1 NFC 读取管理器

```dart
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';

class NFCReader {
  bool _isReading = false;
  StreamController<NFCData>? _dataController;

  bool get isReading => _isReading;

  Future<NFCData> readNFC({
    Duration timeout = const Duration(seconds: 30),
    bool poll = true,
    bool iOSAlertMessage = true,
  }) async {
    if (_isReading) {
      throw NFCException('正在读取中，请稍后再试');
    }

    _isReading = true;

    try {
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.disabled) {
        throw NFCException('NFC功能已禁用，请在设置中开启');
      }

      if (availability == NFCAvailability.not_supported) {
        throw NFCException('设备不支持NFC功能');
      }

      // 开始读取
      final result = await FlutterNfcKit.poll(
        timeout: timeout,
        iosAlertMessage: iOSAlertMessage ? "请将手机靠近NFC标签" : null,
        readIso15693: true,
        readIso14443A: true,
        readIso14443B: true,
      );

      return NFCData.fromPollResult(result);
    } catch (e) {
      throw NFCException('读取失败：${e.toString()}');
    } finally {
      _isReading = false;
    }
  }

  Stream<NFCData> startContinuousReading() async* {
    if (_isReading) {
      throw NFCException('正在读取中，请稍后再试');
    }

    _isReading = true;
    _dataController = StreamController<NFCData>.broadcast();

    try {
      while (_isReading) {
        try {
          final result = await FlutterNfcKit.poll(
            timeout: Duration(seconds: 10),
            iosAlertMessage: false,
          );

          final nfcData = NFCData.fromPollResult(result);
          _dataController?.add(nfcData);

          // 等待标签离开
          await Future.delayed(Duration(seconds: 1));
        } catch (e) {
          // 超时或其他错误，继续尝试
          continue;
        }
      }
    } finally {
      _isReading = false;
      _dataController?.close();
      _dataController = null;
    }
  }

  void stopReading() {
    _isReading = false;
    _dataController?.close();
    _dataController = null;
  }

  Future<void> finishSession() async {
    try {
      await FlutterNfcKit.finish();
    } catch (e) {
      // 忽略结束会话的错误
    }
  }
}

class NFCData {
  final String type;
  final String id;
  final Map<String, dynamic>? additionalData;
  final List<NDEFRecord>? ndefRecords;

  NFCData({
    required this.type,
    required this.id,
    this.additionalData,
    this.ndefRecords,
  });

  factory NFCData.fromPollResult(NFCTag result) {
    final ndefRecords = <NDEFRecord>[];

    // 解析NDEF记录
    if (result.ndefRecords != null) {
      for (final record in result.ndefRecords!) {
        ndefRecords.add(NDEFRecord.fromNFCRecord(record));
      }
    }

    return NFCData(
      type: result.type.toString(),
      id: result.id,
      additionalData: {
        'standard': result.standard,
        'mifareInfo': result.mifareInfo,
        'feliCaInfo': result.feliCaInfo,
        'iso7816Info': result.iso7816Info,
      },
      ndefRecords: ndefRecords.isNotEmpty ? ndefRecords : null,
    );
  }

  bool get hasNDEF => ndefRecords != null && ndefRecords!.isNotEmpty;

  NDEFRecord? getFirstNDEFRecord() {
    if (hasNDEF) {
      return ndefRecords!.first;
    }
    return null;
  }

  List<NDEFRecord> getNDEFRecordsByType(String type) {
    if (!hasNDEF) return [];

    return ndefRecords!.where((record) => record.type == type).toList();
  }

  String? getTextContent() {
    final textRecords = getNDEFRecordsByType('text');
    if (textRecords.isNotEmpty) {
      return textRecords.first.content;
    }
    return null;
  }

  String? getURIContent() {
    final uriRecords = getNDEFRecordsByType('uri');
    if (uriRecords.isNotEmpty) {
      return uriRecords.first.content;
    }
    return null;
  }
}

class NDEFRecord {
  final String type;
  final String content;
  final String? language;
  final String? encoding;

  NDEFRecord({
    required this.type,
    required this.content,
    this.language,
    this.encoding,
  });

  factory NDEFRecord.fromNFCRecord(NDEFRecord record) {
    String type = 'unknown';
    String content = '';
    String? language;
    String? encoding;

    if (record.type == NDEFRecordType.text) {
      type = 'text';
      content = record.text ?? '';
      language = record.languageCode;
      encoding = record.encoding;
    } else if (record.type == NDEFRecordType.uri) {
      type = 'uri';
      content = record.uri ?? '';
    } else if (record.type == NDEFRecordType.mime) {
      type = 'mime';
      content = String.fromCharCodes(record.payload);
    } else if (record.type == NDEFRecordType.absoluteUri) {
      type = 'absolute_uri';
      content = record.uri ?? '';
    } else if (record.type == NDEFRecordType.external) {
      type = 'external';
      content = String.fromCharCodes(record.payload);
    }

    return NDEFRecord(
      type: type,
      content: content,
      language: language,
      encoding: encoding,
    );
  }
}
```

### 3.2 特定类型 NFC 标签处理

```dart
class MifareClassicHandler {
  static Future<Map<String, dynamic>> readMifareClassic(NFCTag tag) async {
    try {
      final mifareInfo = tag.mifareInfo;
      if (mifareInfo == null) {
        throw NFCException('不是MIFARE Classic标签');
      }

      final sectorCount = mifareInfo.sectorCount;
      final blockCount = mifareInfo.blockCount;

      // 读取所有扇区（需要认证）
      final sectors = <Map<String, dynamic>>[];

      for (int sector = 0; sector < sectorCount; sector++) {
        try {
          // 尝试使用默认密钥A认证
          final authResult = await FlutterNfcKit.transceive(
            data: [0x60, sector, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
          );

          if (authResult.isNotEmpty) {
            // 读取扇区数据
            final sectorData = await _readSector(sector);
            sectors.add({
              'sector': sector,
              'data': sectorData,
              'authenticated': true,
            });
          } else {
            sectors.add({
              'sector': sector,
              'data': [],
              'authenticated': false,
            });
          }
        } catch (e) {
          sectors.add({
            'sector': sector,
            'data': [],
            'authenticated': false,
            'error': e.toString(),
          });
        }
      }

      return {
        'type': 'MIFARE Classic',
        'sectorCount': sectorCount,
        'blockCount': blockCount,
        'sectors': sectors,
      };
    } catch (e) {
      throw NFCException('读取MIFARE Classic失败：${e.toString()}');
    }
  }

  static Future<List<int>> _readSector(int sector) async {
    final blocks = <List<int>>[];
    final startBlock = sector * 4;

    for (int block = 0; block < 4; block++) {
      final result = await FlutterNfcKit.transceive(
        data: [0x30, startBlock + block],
      );
      blocks.add(result);
    }

    return blocks.expand((block) => block).toList();
  }
}

class NTAGHandler {
  static Future<Map<String, dynamic>> readNTAG(NFCTag tag) async {
    try {
      final ndefRecords = tag.ndefRecords ?? [];

      // 读取配置信息
      final configData = await _readConfigPage();

      // 读取用户数据
      final userData = await _readUserData();

      return {
        'type': 'NTAG',
        'ndefRecords': ndefRecords.map((record) => NDEFRecord.fromNFCRecord(record)).toList(),
        'config': configData,
        'userData': userData,
      };
    } catch (e) {
      throw NFCException('读取NTAG失败：${e.toString()}');
    }
  }

  static Future<Map<String, dynamic>> _readConfigPage() async {
    try {
      final result = await FlutterNfcKit.transceive(
        data: [0x30, 0x00], // 读取配置页
      );

      return {
        'page': 0,
        'data': result,
        'capacity': _parseCapacity(result),
        'readonly': _isReadOnly(result),
      };
    } catch (e) {
      return {};
    }
  }

  static Future<List<List<int>>> _readUserData() async {
    final pages = <List<int>>[];

    try {
      for (int page = 4; page < 16; page++) { // NTAG213有45页，NTAG215有135页
        try {
          final result = await FlutterNfcKit.transceive(
            data: [0x30, page],
          );
          pages.add(result);
        } catch (e) {
          break; // 到达末尾
        }
      }
    } catch (e) {
      // 忽略错误
    }

    return pages;
  }

  static int _parseCapacity(List<int> configData) {
    if (configData.length >= 2) {
      final capacityByte = configData[2];
      switch (capacityByte) {
        case 0x12: return 144; // NTAG213
        case 0x3E: return 504; // NTAG215
        case 0x6D: return 888; // NTAG216
        default: return 144;
      }
    }
    return 144;
  }

  static bool _isReadOnly(List<int> configData) {
    if (configData.length >= 3) {
      return (configData[3] & 0x10) != 0;
    }
    return false;
  }
}
```

## 第四章：NFC 标签写入

### 4.1 NDEF 数据写入

```dart
class NFCWriter {
  bool _isWriting = false;

  bool get isWriting => _isWriting;

  Future<void> writeText({
    required String text,
    String? language,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    if (_isWriting) {
      throw NFCException('正在写入中，请稍后再试');
    }

    _isWriting = true;

    try {
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.disabled) {
        throw NFCException('NFC功能已禁用，请在设置中开启');
      }

      // 等待标签
      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosAlertMessage: "请将手机靠近NFC标签进行写入",
      );

      // 创建NDEF记录
      final ndefRecord = NDEFRecord.text(
        text: text,
        language: language ?? 'zh',
      );

      // 写入NDEF数据
      await FlutterNfcKit.writeNDEFRecords([ndefRecord]);

      await FlutterNfcKit.finish();
    } catch (e) {
      throw NFCException('写入失败：${e.toString()}');
    } finally {
      _isWriting = false;
    }
  }

  Future<void> writeURI({
    required String uri,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    if (_isWriting) {
      throw NFCException('正在写入中，请稍后再试');
    }

    _isWriting = true;

    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.disabled) {
        throw NFCException('NFC功能已禁用，请在设置中开启');
      }

      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosAlertMessage: "请将手机靠近NFC标签进行写入",
      );

      final ndefRecord = NDEFRecord.uri(uri);
      await FlutterNfcKit.writeNDEFRecords([ndefRecord]);

      await FlutterNfcKit.finish();
    } catch (e) {
      throw NFCException('写入失败：${e.toString()}');
    } finally {
      _isWriting = false;
    }
  }

  Future<void> writeMIME({
    required String mimeType,
    required List<int> data,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    if (_isWriting) {
      throw NFCException('正在写入中，请稍后再试');
    }

    _isWriting = true;

    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.disabled) {
        throw NFCException('NFC功能已禁用，请在设置中开启');
      }

      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosAlertMessage: "请将手机靠近NFC标签进行写入",
      );

      final ndefRecord = NDEFRecord.mime(
        mimeType: mimeType,
        data: data,
      );
      await FlutterNfcKit.writeNDEFRecords([ndefRecord]);

      await FlutterNfcKit.finish();
    } catch (e) {
      throw NFCException('写入失败：${e.toString()}');
    } finally {
      _isWriting = false;
    }
  }

  Future<void> writeMultipleRecords({
    required List<NDEFRecord> records,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    if (_isWriting) {
      throw NFCException('正在写入中，请稍后再试');
    }

    _isWriting = true;

    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.disabled) {
        throw NFCException('NFC功能已禁用，请在设置中开启');
      }

      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosAlertMessage: "请将手机靠近NFC标签进行写入",
      );

      await FlutterNfcKit.writeNDEFRecords(records);
      await FlutterNfcKit.finish();
    } catch (e) {
      throw NFCException('写入失败：${e.toString()}');
    } finally {
      _isWriting = false;
    }
  }

  Future<void> formatTag({
    Duration timeout = const Duration(seconds: 30),
  }) async {
    if (_isWriting) {
      throw NFCException('正在写入中，请稍后再试');
    }

    _isWriting = true;

    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.disabled) {
        throw NFCException('NFC功能已禁用，请在设置中开启');
      }

      final tag = await FlutterNfcKit.poll(
        timeout: timeout,
        iosAlertMessage: "请将手机靠近NFC标签进行格式化",
      );

      // 格式化为空NDEF标签
      await FlutterNfcKit.writeNDEFRecords([]);
      await FlutterNfcKit.finish();
    } catch (e) {
      throw NFCException('格式化失败：${e.toString()}');
    } finally {
      _isWriting = false;
    }
  }
}
```

### 4.2 高级写入功能

```dart
class AdvancedNFCWriter {
  static Future<void> writeBusinessCard({
    required String name,
    required String phone,
    required String email,
    String? company,
    String? title,
    String? website,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final writer = NFCWriter();

    // 创建vCard格式的联系人信息
    final vCard = _createVCard(
      name: name,
      phone: phone,
      email: email,
      company: company,
      title: title,
      website: website,
    );

    await writer.writeMIME(
      mimeType: 'text/vcard',
      data: utf8.encode(vCard),
      timeout: timeout,
    );
  }

  static Future<void> writeWiFiConfig({
    required String ssid,
    required String password,
    String security = 'WPA', // WPA, WEP, or nopass
    bool hidden = false,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final writer = NFCWriter();

    // 创建WiFi配置字符串
    final wifiConfig = 'WIFI:T:$security;S:$ssid;P:$password;H:${hidden ? 'true' : 'false'};;';

    await writer.writeURI(
      uri: wifiConfig,
      timeout: timeout,
    );
  }

  static Future<void> writeLaunchApp({
    required String packageName, // Android包名或iOS URL Scheme
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final writer = NFCWriter();

    String uri;
    if (Platform.isAndroid) {
      uri = 'android-app://$packageName';
    } else {
      uri = packageName; // iOS URL Scheme
    }

    await writer.writeURI(
      uri: uri,
      timeout: timeout,
    );
  }

  static Future<void> writeGeoLocation({
    required double latitude,
    required double longitude,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final writer = NFCWriter();

    final geoUri = 'geo:$latitude,$longitude';

    await writer.writeURI(
      uri: geoUri,
      timeout: timeout,
    );
  }

  static Future<void> writeCustomData({
    required String domain,
    required String type,
    required Map<String, dynamic> data,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final writer = NFCWriter();

    // 创建外部类型记录
    final jsonData = jsonEncode(data);
    final externalType = 'urn:$domain:$type';

    final ndefRecord = NDEFRecord.external(
      domain: domain,
      type: type,
      data: utf8.encode(jsonData),
    );

    await writer.writeMultipleRecords(
      records: [ndefRecord],
      timeout: timeout,
    );
  }

  static String _createVCard({
    required String name,
    required String phone,
    required String email,
    String? company,
    String? title,
    String? website,
  }) {
    final buffer = StringBuffer();
    buffer.writeln('BEGIN:VCARD');
    buffer.writeln('VERSION:3.0');
    buffer.writeln('FN:$name');
    buffer.writeln('TEL:$phone');
    buffer.writeln('EMAIL:$email');

    if (company != null) {
      buffer.writeln('ORG:$company');
    }

    if (title != null) {
      buffer.writeln('TITLE:$title');
    }

    if (website != null) {
      buffer.writeln('URL:$website');
    }

    buffer.writeln('END:VCARD');

    return buffer.toString();
  }
}
```

## 第五章：实际应用案例

### 5.1 智能门禁系统

```dart
class SmartDoorSystem {
  final NFCReader _nfcReader = NFCReader();
  final NFCWriter _nfcWriter = NFCWriter();
  final DatabaseService _database = DatabaseService();

  Future<bool> authenticateUser() async {
    try {
      // 读取NFC标签
      final nfcData = await _nfcReader.readNFC();

      if (!nfcData.hasNDEF) {
        throw NFCException('无效的门禁卡');
      }

      // 获取用户ID
      final userId = _extractUserId(nfcData);
      if (userId == null) {
        throw NFCException('无法识别的门禁卡');
      }

      // 验证用户权限
      final user = await _database.getUserById(userId);
      if (user == null) {
        throw NFCException('用户不存在');
      }

      if (!user.hasAccess) {
        throw NFCException('用户无权限');
      }

      // 记录访问日志
      await _database.logAccess(
        userId: userId,
        timestamp: DateTime.now(),
        action: 'entry',
      );

      // 开门
      await _openDoor();

      return true;
    } catch (e) {
      throw NFCException('门禁认证失败：${e.toString()}');
    }
  }

  Future<void> registerAccessCard({
    required String userId,
    required String userName,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    try {
      // 创建用户数据
      final userData = {
        'userId': userId,
        'userName': userName,
        'timestamp': DateTime.now().toIso8601String(),
        'type': 'access_card',
      };

      // 写入NFC标签
      await AdvancedNFCWriter.writeCustomData(
        domain: 'smartdoor',
        type: 'user',
        data: userData,
        timeout: timeout,
      );

      // 在数据库中注册
      await _database.registerAccessCard(userId, userName);
    } catch (e) {
      throw NFCException('注册门禁卡失败：${e.toString()}');
    }
  }

  String? _extractUserId(NFCData nfcData) {
    // 查找自定义的用户数据记录
    final userRecords = nfcData.getNDEFRecordsByType('external');

    for (final record in userRecords) {
      if (record.content.contains('smartdoor') && record.content.contains('user')) {
        try {
          final data = jsonDecode(record.content);
          return data['userId'];
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  Future<void> _openDoor() async {
    // 控制门锁硬件
    // 这里可以通过蓝牙、WiFi或其他方式与门锁通信
    await Future.delayed(Duration(milliseconds: 500)); // 模拟开门延迟
  }
}

class DatabaseService {
  Future<User?> getUserById(String userId) async {
    // 模拟数据库查询
    await Future.delayed(Duration(milliseconds: 100));

    if (userId == 'user123') {
      return User(
        id: userId,
        name: '张三',
        hasAccess: true,
      );
    }

    return null;
  }

  Future<void> logAccess({
    required String userId,
    required DateTime timestamp,
    required String action,
  }) async {
    // 记录访问日志
    print('用户 $userId 在 $timestamp 执行了 $action 操作');
  }

  Future<void> registerAccessCard(String userId, String userName) async {
    // 注册门禁卡
    print('注册门禁卡：$userId ($userName)');
  }
}

class User {
  final String id;
  final String name;
  final bool hasAccess;

  User({
    required this.id,
    required this.name,
    required this.hasAccess,
  });
}
```

### 5.2 产品防伪系统

```dart
class ProductAuthSystem {
  final NFCReader _nfcReader = NFCReader();
  final NFCWriter _nfcWriter = NFCWriter();
  final APIService _apiService = APIService();

  Future<ProductInfo> verifyProduct() async {
    try {
      // 读取NFC标签
      final nfcData = await _nfcReader.readNFC();

      if (!nfcData.hasNDEF) {
        throw NFCException('无效的产品标签');
      }

      // 提取产品信息
      final productInfo = _extractProductInfo(nfcData);
      if (productInfo == null) {
        throw NFCException('无法识别的产品标签');
      }

      // 验证产品真伪
      final verificationResult = await _apiService.verifyProduct(
        productId: productInfo.productId,
        signature: productInfo.signature,
      );

      if (!verificationResult.isValid) {
        throw NFCException('产品验证失败，可能是假冒产品');
      }

      return productInfo;
    } catch (e) {
      throw NFCException('产品验证失败：${e.toString()}');
    }
  }

  Future<void> registerProduct({
    required String productId,
    required String productName,
    required String batchNumber,
    required DateTime productionDate,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    try {
      // 生成产品签名
      final signature = await _generateSignature(productId);

      // 创建产品数据
      final productData = {
        'productId': productId,
        'productName': productName,
        'batchNumber': batchNumber,
        'productionDate': productionDate.toIso8601String(),
        'signature': signature,
        'type': 'product_auth',
      };

      // 写入NFC标签
      await AdvancedNFCWriter.writeCustomData(
        domain: 'productauth',
        type: 'info',
        data: productData,
        timeout: timeout,
      );

      // 在服务器注册产品
      await _apiService.registerProduct(productData);
    } catch (e) {
      throw NFCException('注册产品失败：${e.toString()}');
    }
  }

  ProductInfo? _extractProductInfo(NFCData nfcData) {
    final productRecords = nfcData.getNDEFRecordsByType('external');

    for (final record in productRecords) {
      if (record.content.contains('productauth') && record.content.contains('info')) {
        try {
          final data = jsonDecode(record.content);
          return ProductInfo(
            productId: data['productId'],
            productName: data['productName'],
            batchNumber: data['batchNumber'],
            productionDate: DateTime.parse(data['productionDate']),
            signature: data['signature'],
          );
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  Future<String> _generateSignature(String productId) async {
    // 生成数字签名
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final data = '$productId:$timestamp';
    final signature = _hashData(data);
    return signature;
  }

  String _hashData(String data) {
    // 简单的哈希实现，实际应用中应使用安全的哈希算法
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
}

class ProductInfo {
  final String productId;
  final String productName;
  final String batchNumber;
  final DateTime productionDate;
  final String signature;

  ProductInfo({
    required this.productId,
    required this.productName,
    required this.batchNumber,
    required this.productionDate,
    required this.signature,
  });
}

class APIService {
  Future<VerificationResult> verifyProduct({
    required String productId,
    required String signature,
  }) async {
    // 模拟API调用
    await Future.delayed(Duration(milliseconds: 500));

    // 这里应该调用实际的验证API
    return VerificationResult(
      isValid: true,
      message: '产品验证通过',
    );
  }

  Future<void> registerProduct(Map<String, dynamic> productData) async {
    // 模拟API调用
    await Future.delayed(Duration(milliseconds: 500));

    print('注册产品：${productData['productId']}');
  }
}

class VerificationResult {
  final bool isValid;
  final String message;

  VerificationResult({
    required this.isValid,
    required this.message,
  });
}
```

## 第六章：UI 实现

### 6.1 NFC 读取页面

```dart
class NFCReadPage extends StatefulWidget {
  @override
  _NFCReadPageState createState() => _NFCReadPageState();
}

class _NFCReadPageState extends State<NFCReadPage> {
  final NFCReader _nfcReader = NFCReader();
  NFCData? _lastReadData;
  bool _isReading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nfcReader.stopReading();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('NFC读取'),
        actions: [
          IconButton(
            icon: Icon(Icons.clear),
            onPressed: _clearData,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildStatusCard(),
          Expanded(child: _buildContent()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _toggleReading,
        child: Icon(_isReading ? Icons.stop : Icons.nfc),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      margin: EdgeInsets.all(16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Icon(
                  _isReading ? Icons.nfc : Icons.nfc_outlined,
                  color: _isReading ? Colors.green : Colors.grey,
                ),
                SizedBox(width: 12),
                Text(
                  _isReading ? '正在读取...' : '准备读取',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: _isReading ? Colors.green : Colors.grey,
                  ),
                ),
              ],
            ),
            if (_errorMessage != null) ...[
              SizedBox(height: 8),
              Text(
                _errorMessage!,
                style: TextStyle(color: Colors.red),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_lastReadData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.nfc,
              size: 64,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              '请将手机靠近NFC标签',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _startReading,
              child: Text('开始读取'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDataCard('基本信息', [
            _buildInfoRow('标签类型', _lastReadData!.type),
            _buildInfoRow('标签ID', _lastReadData!.id),
          ]),
          if (_lastReadData!.hasNDEF) ...[
            SizedBox(height: 16),
            _buildNDEFRecordsCard(),
          ],
          if (_lastReadData!.additionalData != null) ...[
            SizedBox(height: 16),
            _buildAdditionalDataCard(),
          ],
        ],
      ),
    );
  }

  Widget _buildDataCard(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontFamily: 'monospace'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNDEFRecordsCard() {
    return _buildDataCard(
      'NDEF记录',
      _lastReadData!.ndefRecords!.map((record) {
        return ExpansionTile(
          title: Text('类型: ${record.type}'),
          subtitle: Text('内容: ${record.content.length > 50 ? record.content.substring(0, 50) + '...' : record.content}'),
          children: [
            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow('类型', record.type),
                  _buildInfoRow('内容', record.content),
                  if (record.language != null)
                    _buildInfoRow('语言', record.language!),
                  if (record.encoding != null)
                    _buildInfoRow('编码', record.encoding!),
                ],
              ),
            ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildAdditionalDataCard() {
    final additionalData = _lastReadData!.additionalData!;

    return _buildDataCard(
      '附加数据',
      additionalData.entries.map((entry) {
        return _buildInfoRow(entry.key, entry.value.toString());
      }).toList(),
    );
  }

  Future<void> _toggleReading() async {
    if (_isReading) {
      _stopReading();
    } else {
      await _startReading();
    }
  }

  Future<void> _startReading() async {
    final hasPermission = await NFCPermissionManager.checkPermissions();
    if (!hasPermission) {
      final granted = await NFCPermissionManager.requestPermissions();
      if (!granted) {
        _showPermissionDialog();
        return;
      }
    }

    setState(() {
      _isReading = true;
      _errorMessage = null;
    });

    try {
      final nfcData = await _nfcReader.readNFC();
      setState(() {
        _lastReadData = nfcData;
        _isReading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isReading = false;
      });
    }
  }

  void _stopReading() {
    _nfcReader.stopReading();
    setState(() {
      _isReading = false;
    });
  }

  void _clearData() {
    setState(() {
      _lastReadData = null;
      _errorMessage = null;
    });
  }

  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('需要权限'),
        content: Text('应用需要NFC权限才能读取标签'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              NFCPermissionManager.openSettings();
            },
            child: Text('去设置'),
          ),
        ],
      ),
    );
  }
}
```

## 第七章：错误处理与调试

### 7.1 异常处理

```dart
class NFCException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  NFCException(this.message, {this.code, this.originalError});

  @override
  String toString() {
    return 'NFCException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}

class NFCErrorHandler {
  static NFCException handleError(dynamic error) {
    if (error is NFCException) {
      return error;
    }

    if (error.toString().contains('NFC is not available')) {
      return NFCException(
        '设备不支持NFC功能',
        code: 'NFC_NOT_AVAILABLE',
      );
    }

    if (error.toString().contains('NFC is disabled')) {
      return NFCException(
        'NFC功能已禁用，请在设置中开启',
        code: 'NFC_DISABLED',
      );
    }

    if (error.toString().contains('Tag was lost')) {
      return NFCException(
        'NFC标签已移开，请重新放置',
        code: 'TAG_LOST',
      );
    }

    if (error.toString().contains('Timeout')) {
      return NFCException(
        '读取超时，请重试',
        code: 'TIMEOUT',
      );
    }

    if (error.toString().contains('Tag is read-only')) {
      return NFCException(
        'NFC标签为只读，无法写入',
        code: 'READ_ONLY',
      );
    }

    if (error.toString().contains('Not enough memory')) {
      return NFCException(
        'NFC标签容量不足',
        code: 'INSUFFICIENT_MEMORY',
      );
    }

    return NFCException(
      '未知错误：${error.toString()}',
      code: 'UNKNOWN_ERROR',
      originalError: error,
    );
  }
}
```

### 7.2 调试工具

```dart
class NFCLogger {
  static const String _tag = 'NFC';
  static bool _isDebugMode = kDebugMode;

  static void log(String message, {LogLevel level = LogLevel.info}) {
    if (!_isDebugMode) return;

    final timestamp = DateTime.now().toIso8601String();
    final logMessage = '[$timestamp] [$_tag] [${level.name.toUpperCase()}] $message';

    print(logMessage);
    _writeToLogFile(logMessage);
  }

  static void logRead(NFCData data) {
    log('读取NFC标签成功');
    log('标签类型: ${data.type}');
    log('标签ID: ${data.id}');
    if (data.hasNDEF) {
      log('NDEF记录数量: ${data.ndefRecords!.length}');
      for (int i = 0; i < data.ndefRecords!.length; i++) {
        final record = data.ndefRecords![i];
        log('记录 $i: 类型=${record.type}, 内容=${record.content}');
      }
    }
  }

  static void logWrite(String type, dynamic content) {
    log('写入NFC标签: 类型=$type, 内容=$content');
  }

  static void logError(String error, StackTrace? stackTrace) {
    log('错误: $error', level: LogLevel.error);
    if (stackTrace != null) {
      log('堆栈跟踪: $stackTrace', level: LogLevel.error);
    }
  }

  static void logTransaction(List<int> data, bool isSend) {
    final direction = isSend ? '发送' : '接收';
    final dataHex = data.map((b) => b.toRadixString(16).padLeft(2, '0')).join(' ');
    log('$direction数据: $dataHex');
  }

  static void _writeToLogFile(String message) {
    // 实现日志文件写入
  }
}

enum LogLevel { debug, info, warning, error }
```

## 故事结局：小李的成功

经过几个月的开发，小李的智能门禁系统终于完成了！用户只需要用手机轻触 NFC 标签，就能自动开门并记录进出时间。

"NFC 技术为我们的应用带来了极大的便利性，用户不再需要携带实体门禁卡。"小李在项目总结中写道，"通过合理的错误处理和用户体验设计，我们让 NFC 功能变得简单易用。"

小李的系统在多个小区和办公楼得到了应用，用户反馈非常好。他的成功证明了：**掌握 NFC 桥接技术，是开发智能硬件应用的重要技能。**

## 总结

通过小李的智能门禁系统开发故事，我们全面学习了 Flutter NFC 桥接技术：

### 核心技术

- **NFC 基础**：工作模式、标签类型、数据格式
- **权限管理**：Android 和 iOS 的权限配置
- **数据读取**：NDEF 解析和标签检测
- **数据写入**：各种格式的 NDEF 写入

### 高级特性

- **标签处理**：MIFARE、NTAG 等特定标签
- **数据格式**：文本、URI、MIME 类型等
- **错误处理**：异常捕获和用户提示
- **调试工具**：日志记录和问题排查

### 最佳实践

- **用户体验**：清晰的状态反馈和错误提示
- **安全性**：数据验证和防伪机制
- **性能优化**：快速响应和资源管理
- **平台适配**：Android 和 iOS 的差异处理

NFC 桥接技术为 Flutter 应用打开了物理世界交互的大门，让开发者能够构建出创新的智能应用。掌握这些技术，将帮助你在物联网时代创造更多可能！
