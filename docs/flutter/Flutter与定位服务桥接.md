# Flutter 与定位服务桥接技术详解

## 引言：定位服务在现代应用中的重要性

在移动应用开发中，定位服务已经成为许多应用的核心功能之一。无论是地图导航、外卖配送、社交签到，还是基于位置的推荐系统，都离不开精准的定位功能。Flutter 作为跨平台框架，提供了与原生定位服务桥接的能力，使开发者能够在 Android 和 iOS 平台上实现高效的定位功能。

本文将通过一个实际案例——开发一款名为"GeoTracker"的位置追踪应用——来详细介绍 Flutter 中实现定位服务的技术细节和最佳实践。

## 定位服务技术概述

### 定位技术类型

1. **GPS 定位**：通过卫星信号提供高精度定位
2. **网络定位**：通过 WiFi 和基站信号提供定位
3. **蓝牙定位**：通过蓝牙信标进行室内定位
4. **混合定位**：结合多种定位技术提高精度

### 定位精度与功耗权衡

- **高精度模式**：GPS+网络，精度高但功耗大
- **平衡模式**：平衡精度和功耗
- **低功耗模式**：主要使用网络定位，功耗低但精度有限

## 项目背景：GeoTracker 位置追踪应用

我们的项目是开发一款名为 GeoTracker 的位置追踪应用，支持以下功能：

- 实时位置追踪
- 历史轨迹记录
- 地理围栏监控
- 位置数据可视化
- 离线位置缓存

## 技术架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter应用层                              │
├─────────────────────────────────────────────────────────────┤
│  地图UI  │  轨迹UI  │  设置页面  │  统计页面                  │
├─────────────────────────────────────────────────────────────┤
│                  定位服务管理层                                │
├─────────────────────────────────────────────────────────────┤
│              平台通道桥接层                                   │
├─────────────────────────────────────────────────────────────┤
│  Android LocationManager  │  iOS CoreLocation               │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

1. **LocationService**：定位服务管理
2. **GeofenceManager**：地理围栏管理
3. **LocationDatabase**：位置数据存储
4. **LocationAnalytics**：位置数据分析
5. **PlatformChannel**：平台通道通信

## 实现步骤详解

### 第一步：添加依赖和配置

首先，我们需要添加必要的依赖包：

```yaml
dependencies:
  flutter:
    sdk: flutter
  geolocator: ^10.1.0
  permission_handler: ^10.2.0
  google_maps_flutter: ^2.5.0
  polyline_points: ^2.0.0
  shared_preferences: ^2.2.0
  sqflite: ^2.3.0
  path_provider: ^2.1.0
```

Android 平台需要配置权限和特性：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 定位权限 -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

    <!-- 后台定位权限（Android 10+） -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application>
        <!-- 位置服务配置 -->
        <service
            android:name=".LocationService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="location" />
    </application>
</manifest>
```

iOS 平台需要在 Info.plist 中添加定位权限说明：

```xml
<!-- ios/Runner/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>此应用需要访问您的位置来提供位置追踪服务</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>此应用需要后台访问您的位置来提供持续的位置追踪服务</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>此应用需要后台访问您的位置来提供持续的位置追踪服务</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>background-fetch</string>
</array>
```

### 第二步：创建定位服务管理器

```dart
// lib/services/location_service.dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  final StreamController<Position> _positionStreamController = StreamController<Position>.broadcast();
  final StreamController<LocationStatus> _statusStreamController = StreamController<LocationStatus>.broadcast();

  StreamSubscription<Position>? _positionSubscription;
  LocationSettings? _locationSettings;
  bool _isTracking = false;
  LocationAccuracy _desiredAccuracy = LocationAccuracy.high;
  int _interval = 5000; // 5秒
  double _distanceFilter = 10.0; // 10米

  // 位置更新流
  Stream<Position> get positionStream => _positionStreamController.stream;

  // 定位状态流
  Stream<LocationStatus> get statusStream => _statusStreamController.stream;

  // 当前是否正在追踪
  bool get isTracking => _isTracking;

  // 当前定位设置
  LocationSettings? get locationSettings => _locationSettings;

  // 初始化定位服务
  Future<void> initialize() async {
    try {
      // 检查定位服务是否可用
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw LocationServiceException('定位服务未启用');
      }

      // 检查权限
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw LocationServiceException('定位权限被拒绝');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw LocationServiceException('定位权限被永久拒绝，请在设置中开启');
      }

      // 加载保存的设置
      await _loadSettings();

      // 配置定位设置
      _configureLocationSettings();

    } catch (e) {
      throw LocationServiceException('定位服务初始化失败: $e');
    }
  }

  // 配置定位设置
  void _configureLocationSettings() {
    if (Platform.isAndroid) {
      _locationSettings = AndroidSettings(
        accuracy: _desiredAccuracy,
        distanceFilter: _distanceFilter,
        intervalDuration: Duration(milliseconds: _interval),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationText: "GeoTracker正在后台追踪您的位置",
          notificationTitle: "位置追踪服务",
          enableWakeLock: true,
        ),
      );
    } else if (Platform.isIOS) {
      _locationSettings = AppleSettings(
        accuracy: _desiredAccuracy,
        activityType: ActivityType.automotiveNavigation,
        distanceFilter: _distanceFilter,
        pauseLocationUpdatesAutomatically: true,
        showBackgroundLocationIndicator: true,
        allowBackgroundLocationUpdates: true,
      );
    }
  }

  // 加载保存的设置
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _desiredAccuracy = LocationAccuracy.values[prefs.getInt('accuracy') ?? 2];
    _interval = prefs.getInt('interval') ?? 5000;
    _distanceFilter = prefs.getDouble('distanceFilter') ?? 10.0;
  }

  // 保存设置
  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('accuracy', _desiredAccuracy.index);
    await prefs.setInt('interval', _interval);
    await prefs.setDouble('distanceFilter', _distanceFilter);
  }

  // 开始位置追踪
  Future<void> startTracking() async {
    if (_isTracking) return;

    try {
      // 确保已初始化
      if (_locationSettings == null) {
        await initialize();
      }

      // 获取当前位置
      final Position initialPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: _desiredAccuracy,
        timeLimit: const Duration(seconds: 10),
      );

      // 发送初始位置
      _positionStreamController.add(initialPosition);

      // 开始位置更新
      _positionSubscription = Geolocator.getPositionStream(
        locationSettings: _locationSettings!,
      ).listen(
        (Position position) {
          _positionStreamController.add(position);
          _statusStreamController.add(LocationStatus.tracking);
        },
        onError: (error) {
          _statusStreamController.add(LocationStatus.error);
          debugPrint('位置追踪错误: $error');
        },
      );

      _isTracking = true;
      _statusStreamController.add(LocationStatus.tracking);

    } catch (e) {
      _statusStreamController.add(LocationStatus.error);
      throw LocationServiceException('开始位置追踪失败: $e');
    }
  }

  // 停止位置追踪
  Future<void> stopTracking() async {
    if (!_isTracking) return;

    try {
      await _positionSubscription?.cancel();
      _positionSubscription = null;
      _isTracking = false;
      _statusStreamController.add(LocationStatus.stopped);
    } catch (e) {
      throw LocationServiceException('停止位置追踪失败: $e');
    }
  }

  // 获取当前位置
  Future<Position> getCurrentPosition({
    LocationAccuracy? desiredAccuracy,
    Duration? timeLimit,
  }) async {
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: desiredAccuracy ?? _desiredAccuracy,
        timeLimit: timeLimit ?? const Duration(seconds: 10),
      );
    } catch (e) {
      throw LocationServiceException('获取当前位置失败: $e');
    }
  }

  // 计算两点间距离
  double calculateDistance(
    double startLatitude,
    double startLongitude,
    double endLatitude,
    double endLongitude,
  ) {
    return Geolocator.distanceBetween(
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    );
  }

  // 更新定位设置
  Future<void> updateSettings({
    LocationAccuracy? accuracy,
    int? interval,
    double? distanceFilter,
  }) async {
    // 停止当前追踪
    if (_isTracking) {
      await stopTracking();
    }

    // 更新设置
    if (accuracy != null) _desiredAccuracy = accuracy;
    if (interval != null) _interval = interval;
    if (distanceFilter != null) _distanceFilter = distanceFilter;

    // 保存设置
    await _saveSettings();

    // 重新配置定位设置
    _configureLocationSettings();

    // 如果之前在追踪，重新开始
    if (_isTracking) {
      await startTracking();
    }
  }

  // 检查定位服务状态
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  // 打开定位设置
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }

  // 打开应用设置
  Future<bool> openAppSettings() async {
    return await Geolocator.openAppSettings();
  }

  // 释放资源
  Future<void> dispose() async {
    await stopTracking();
    await _positionStreamController.close();
    await _statusStreamController.close();
  }
}

// 定位状态枚举
enum LocationStatus {
  initialized,
  tracking,
  stopped,
  error,
  permissionDenied,
  serviceDisabled,
}

// 定位服务异常
class LocationServiceException implements Exception {
  final String message;
  LocationServiceException(this.message);

  @override
  String toString() => message;
}
```

### 第三步：实现地理围栏管理

```dart
// lib/services/geofence_manager.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:collection/collection.dart';

class GeofenceManager {
  static final GeofenceManager _instance = GeofenceManager._internal();
  factory GeofenceManager() => _instance;
  GeofenceManager._internal();

  final List<GeofenceRegion> _geofences = [];
  final StreamController<GeofenceEvent> _eventStreamController = StreamController<GeofenceEvent>.broadcast();
  StreamSubscription<Position>? _positionSubscription;

  // 地理围栏事件流
  Stream<GeofenceEvent> get eventStream => _eventStreamController.stream;

  // 当前地理围栏列表
  List<GeofenceRegion> get geofences => List.unmodifiable(_geofences);

  // 初始化地理围栏管理器
  Future<void> initialize() async {
    // 加载保存的地理围栏
    await _loadGeofences();

    // 开始监听位置变化
    _startLocationMonitoring();
  }

  // 添加地理围栏
  Future<void> addGeofence(GeofenceRegion geofence) async {
    if (_geofences.any((g) => g.id == geofence.id)) {
      throw GeofenceException('地理围栏ID已存在: ${geofence.id}');
    }

    _geofences.add(geofence);
    await _saveGeofences();
  }

  // 移除地理围栏
  Future<void> removeGeofence(String geofenceId) async {
    _geofences.removeWhere((g) => g.id == geofenceId);
    await _saveGeofences();
  }

  // 更新地理围栏
  Future<void> updateGeofence(GeofenceRegion geofence) async {
    final index = _geofences.indexWhere((g) => g.id == geofence.id);
    if (index == -1) {
      throw GeofenceException('地理围栏不存在: ${geofence.id}');
    }

    _geofences[index] = geofence;
    await _saveGeofences();
  }

  // 获取地理围栏
  GeofenceRegion? getGeofence(String geofenceId) {
    try {
      return _geofences.firstWhere((g) => g.id == geofenceId);
    } catch (e) {
      return null;
    }
  }

  // 开始位置监控
  void _startLocationMonitoring() {
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // 10米
      ),
    ).listen(_onPositionChanged);
  }

  // 处理位置变化
  void _onPositionChanged(Position position) {
    for (final geofence in _geofences) {
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        geofence.latitude,
        geofence.longitude,
      );

      final isInside = distance <= geofence.radius;
      final wasInside = geofence.isInside;

      // 状态变化时触发事件
      if (isInside != wasInside) {
        geofence.isInside = isInside;

        final event = GeofenceEvent(
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          eventType: isInside ? GeofenceEventType.enter : GeofenceEventType.exit,
          position: position,
          timestamp: DateTime.now(),
        );

        _eventStreamController.add(event);

        // 执行回调
        if (isInside && geofence.onEnter != null) {
          geofence.onEnter!(event);
        } else if (!isInside && geofence.onExit != null) {
          geofence.onExit!(event);
        }
      }
    }
  }

  // 检查位置是否在地理围栏内
  List<GeofenceRegion> getGeofencesAtPosition(Position position) {
    return _geofences.where((geofence) {
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        geofence.latitude,
        geofence.longitude,
      );
      return distance <= geofence.radius;
    }).toList();
  }

  // 加载地理围栏
  Future<void> _loadGeofences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final geofencesJson = prefs.getStringList('geofences') ?? [];

      _geofences.clear();
      for (final json in geofencesJson) {
        final Map<String, dynamic> data = jsonDecode(json);
        _geofences.add(GeofenceRegion.fromJson(data));
      }
    } catch (e) {
      debugPrint('加载地理围栏失败: $e');
    }
  }

  // 保存地理围栏
  Future<void> _saveGeofences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final geofencesJson = _geofences.map((g) => jsonEncode(g.toJson())).toList();
      await prefs.setStringList('geofences', geofencesJson);
    } catch (e) {
      debugPrint('保存地理围栏失败: $e');
    }
  }

  // 清除所有地理围栏
  Future<void> clearAllGeofences() async {
    _geofences.clear();
    await _saveGeofences();
  }

  // 释放资源
  Future<void> dispose() async {
    await _positionSubscription?.cancel();
    await _eventStreamController.close();
  }
}

// 地理围栏区域
class GeofenceRegion {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double radius;
  final GeofenceTransitionType transitionType;
  final Function(GeofenceEvent)? onEnter;
  final Function(GeofenceEvent)? onExit;
  bool isInside;

  GeofenceRegion({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.radius,
    this.transitionType = GeofenceTransitionType.both,
    this.onEnter,
    this.onExit,
    this.isInside = false,
  });

  factory GeofenceRegion.fromJson(Map<String, dynamic> json) {
    return GeofenceRegion(
      id: json['id'],
      name: json['name'],
      latitude: json['latitude'].toDouble(),
      longitude: json['longitude'].toDouble(),
      radius: json['radius'].toDouble(),
      transitionType: GeofenceTransitionType.values[json['transitionType']],
      isInside: json['isInside'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'latitude': latitude,
      'longitude': longitude,
      'radius': radius,
      'transitionType': transitionType.index,
      'isInside': isInside,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is GeofenceRegion && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

// 地理围栏事件
class GeofenceEvent {
  final String geofenceId;
  final String geofenceName;
  final GeofenceEventType eventType;
  final Position position;
  final DateTime timestamp;

  GeofenceEvent({
    required this.geofenceId,
    required this.geofenceName,
    required this.eventType,
    required this.position,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'geofenceId': geofenceId,
      'geofenceName': geofenceName,
      'eventType': eventType.index,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

// 地理围栏事件类型
enum GeofenceEventType {
  enter,
  exit,
}

// 地理围栏转换类型
enum GeofenceTransitionType {
  enter,
  exit,
  both,
}

// 地理围栏异常
class GeofenceException implements Exception {
  final String message;
  GeofenceException(this.message);

  @override
  String toString() => message;
}
```

### 第四步：实现位置数据存储

```dart
// lib/services/location_database.dart
import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:geolocator/geolocator.dart';

class LocationDatabase {
  static final LocationDatabase _instance = LocationDatabase._internal();
  factory LocationDatabase() => _instance;
  LocationDatabase._internal();

  Database? _database;

  // 获取数据库实例
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  // 初始化数据库
  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, 'location_tracker.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  // 创建数据库表
  Future<void> _onCreate(Database db, int version) async {
    // 位置记录表
    await db.execute('''
      CREATE TABLE locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL,
        accuracy REAL,
        speed REAL,
        heading REAL,
        timestamp INTEGER NOT NULL,
        is_mocked INTEGER DEFAULT 0
      )
    ''');

    // 轨迹表
    await db.execute('''
      CREATE TABLE tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        distance REAL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    ''');

    // 轨迹点关联表
    await db.execute('''
      CREATE TABLE track_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        FOREIGN KEY (track_id) REFERENCES tracks (id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
      )
    ''');

    // 地理围栏事件表
    await db.execute('''
      CREATE TABLE geofence_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        geofence_id TEXT NOT NULL,
        geofence_name TEXT NOT NULL,
        event_type INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp INTEGER NOT NULL
      )
    ''');

    // 创建索引
    await db.execute('CREATE INDEX idx_locations_timestamp ON locations(timestamp)');
    await db.execute('CREATE INDEX idx_tracks_start_time ON tracks(start_time)');
    await db.execute('CREATE INDEX idx_track_points_track_id ON track_points(track_id)');
    await db.execute('CREATE INDEX idx_geofence_events_timestamp ON geofence_events(timestamp)');
  }

  // 数据库升级
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // 根据版本进行升级
    if (oldVersion < 2) {
      // 添加新字段或表
    }
  }

  // 保存位置记录
  Future<int> saveLocation(Position position) async {
    final db = await database;

    return await db.insert('locations', {
      'latitude': position.latitude,
      'longitude': position.longitude,
      'altitude': position.altitude,
      'accuracy': position.accuracy,
      'speed': position.speed,
      'heading': position.heading,
      'timestamp': position.timestamp?.millisecondsSinceEpoch ?? DateTime.now().millisecondsSinceEpoch,
      'is_mocked': position.isMocked ? 1 : 0,
    });
  }

  // 获取位置记录
  Future<List<LocationRecord>> getLocations({
    DateTime? startTime,
    DateTime? endTime,
    int? limit,
    int? offset,
  }) async {
    final db = await database;

    String whereClause = '';
    List<dynamic> whereArgs = [];

    if (startTime != null) {
      whereClause += 'timestamp >= ?';
      whereArgs.add(startTime.millisecondsSinceEpoch);
    }

    if (endTime != null) {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += 'timestamp <= ?';
      whereArgs.add(endTime.millisecondsSinceEpoch);
    }

    final List<Map<String, dynamic>> maps = await db.query(
      'locations',
      where: whereClause.isNotEmpty ? whereClause : null,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
      orderBy: 'timestamp DESC',
      limit: limit,
      offset: offset,
    );

    return List.generate(maps.length, (i) {
      return LocationRecord.fromMap(maps[i]);
    });
  }

  // 创建轨迹
  Future<int> createTrack(String name, {String? description}) async {
    final db = await database;

    return await db.insert('tracks', {
      'name': name,
      'description': description,
      'start_time': DateTime.now().millisecondsSinceEpoch,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }

  // 添加轨迹点
  Future<void> addTrackPoint(int trackId, int locationId, int orderIndex) async {
    final db = await database;

    await db.insert('track_points', {
      'track_id': trackId,
      'location_id': locationId,
      'order_index': orderIndex,
    });
  }

  // 完成轨迹
  Future<void> completeTrack(int trackId, double distance) async {
    final db = await database;

    await db.update(
      'tracks',
      {
        'end_time': DateTime.now().millisecondsSinceEpoch,
        'distance': distance,
      },
      where: 'id = ?',
      whereArgs: [trackId],
    );
  }

  // 获取轨迹列表
  Future<List<Track>> getTracks() async {
    final db = await database;

    final List<Map<String, dynamic>> maps = await db.query(
      'tracks',
      orderBy: 'start_time DESC',
    );

    return List.generate(maps.length, (i) {
      return Track.fromMap(maps[i]);
    });
  }

  // 获取轨迹详情
  Future<TrackDetail?> getTrackDetail(int trackId) async {
    final db = await database;

    // 获取轨迹信息
    final List<Map<String, dynamic>> trackMaps = await db.query(
      'tracks',
      where: 'id = ?',
      whereArgs: [trackId],
    );

    if (trackMaps.isEmpty) return null;

    final track = Track.fromMap(trackMaps.first);

    // 获取轨迹点
    final List<Map<String, dynamic>> pointMaps = await db.rawQuery('''
      SELECT l.* FROM locations l
      INNER JOIN track_points tp ON l.id = tp.location_id
      WHERE tp.track_id = ?
      ORDER BY tp.order_index
    ''', [trackId]);

    final points = pointMaps.map((map) => LocationRecord.fromMap(map)).toList();

    return TrackDetail(track: track, points: points);
  }

  // 保存地理围栏事件
  Future<int> saveGeofenceEvent(GeofenceEventRecord event) async {
    final db = await database;

    return await db.insert('geofence_events', {
      'geofence_id': event.geofenceId,
      'geofence_name': event.geofenceName,
      'event_type': event.eventType.index,
      'latitude': event.latitude,
      'longitude': event.longitude,
      'timestamp': event.timestamp.millisecondsSinceEpoch,
    });
  }

  // 获取地理围栏事件
  Future<List<GeofenceEventRecord>> getGeofenceEvents({
    String? geofenceId,
    DateTime? startTime,
    DateTime? endTime,
    int? limit,
  }) async {
    final db = await database;

    String whereClause = '';
    List<dynamic> whereArgs = [];

    if (geofenceId != null) {
      whereClause += 'geofence_id = ?';
      whereArgs.add(geofenceId);
    }

    if (startTime != null) {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += 'timestamp >= ?';
      whereArgs.add(startTime.millisecondsSinceEpoch);
    }

    if (endTime != null) {
      if (whereClause.isNotEmpty) whereClause += ' AND ';
      whereClause += 'timestamp <= ?';
      whereArgs.add(endTime.millisecondsSinceEpoch);
    }

    final List<Map<String, dynamic>> maps = await db.query(
      'geofence_events',
      where: whereClause.isNotEmpty ? whereClause : null,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
      orderBy: 'timestamp DESC',
      limit: limit,
    );

    return List.generate(maps.length, (i) {
      return GeofenceEventRecord.fromMap(maps[i]);
    });
  }

  // 清理旧数据
  Future<void> cleanupOldData({int daysToKeep = 30}) async {
    final db = await database;
    final cutoffTime = DateTime.now().subtract(Duration(days: daysToKeep)).millisecondsSinceEpoch;

    // 删除旧的位置记录
    await db.delete('locations', where: 'timestamp < ?', whereArgs: [cutoffTime]);

    // 删除旧的地理围栏事件
    await db.delete('geofence_events', where: 'timestamp < ?', whereArgs: [cutoffTime]);
  }

  // 获取数据库统计信息
  Future<Map<String, int>> getDatabaseStats() async {
    final db = await database;

    final locationCount = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM locations')
    ) ?? 0;

    final trackCount = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tracks')
    ) ?? 0;

    final eventCount = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM geofence_events')
    ) ?? 0;

    return {
      'locations': locationCount,
      'tracks': trackCount,
      'events': eventCount,
    };
  }

  // 关闭数据库
  Future<void> close() async {
    final db = _database;
    if (db != null) {
      await db.close();
      _database = null;
    }
  }
}

// 位置记录模型
class LocationRecord {
  final int id;
  final double latitude;
  final double longitude;
  final double? altitude;
  final double? accuracy;
  final double? speed;
  final double? heading;
  final DateTime timestamp;
  final bool isMocked;

  LocationRecord({
    required this.id,
    required this.latitude,
    required this.longitude,
    this.altitude,
    this.accuracy,
    this.speed,
    this.heading,
    required this.timestamp,
    required this.isMocked,
  });

  factory LocationRecord.fromMap(Map<String, dynamic> map) {
    return LocationRecord(
      id: map['id'],
      latitude: map['latitude'].toDouble(),
      longitude: map['longitude'].toDouble(),
      altitude: map['altitude']?.toDouble(),
      accuracy: map['accuracy']?.toDouble(),
      speed: map['speed']?.toDouble(),
      heading: map['heading']?.toDouble(),
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp']),
      isMocked: map['is_mocked'] == 1,
    );
  }

  Position toPosition() {
    return Position(
      latitude: latitude,
      longitude: longitude,
      timestamp: timestamp,
      accuracy: accuracy ?? 0,
      altitude: altitude,
      heading: heading,
      speed: speed,
      isMocked: isMocked,
    );
  }
}

// 轨迹模型
class Track {
  final int id;
  final String name;
  final String? description;
  final DateTime startTime;
  final DateTime? endTime;
  final double distance;
  final DateTime createdAt;

  Track({
    required this.id,
    required this.name,
    this.description,
    required this.startTime,
    this.endTime,
    required this.distance,
    required this.createdAt,
  });

  factory Track.fromMap(Map<String, dynamic> map) {
    return Track(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      startTime: DateTime.fromMillisecondsSinceEpoch(map['start_time']),
      endTime: map['end_time'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['end_time'])
          : null,
      distance: map['distance'].toDouble(),
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at']),
    );
  }

  Duration? get duration {
    if (endTime == null) return null;
    return endTime!.difference(startTime);
  }
}

// 轨迹详情模型
class TrackDetail {
  final Track track;
  final List<LocationRecord> points;

  TrackDetail({
    required this.track,
    required this.points,
  });
}

// 地理围栏事件记录模型
class GeofenceEventRecord {
  final int id;
  final String geofenceId;
  final String geofenceName;
  final GeofenceEventType eventType;
  final double latitude;
  final double longitude;
  final DateTime timestamp;

  GeofenceEventRecord({
    required this.id,
    required this.geofenceId,
    required this.geofenceName,
    required this.eventType,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
  });

  factory GeofenceEventRecord.fromMap(Map<String, dynamic> map) {
    return GeofenceEventRecord(
      id: map['id'],
      geofenceId: map['geofence_id'],
      geofenceName: map['geofence_name'],
      eventType: GeofenceEventType.values[map['event_type']],
      latitude: map['latitude'].toDouble(),
      longitude: map['longitude'].toDouble(),
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp']),
    );
  }
}
```

### 第五步：创建位置追踪 UI 组件

```dart
// lib/widgets/location_tracker_widget.dart
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/location_service.dart';
import '../services/location_database.dart';
import '../services/geofence_manager.dart';

class LocationTrackerWidget extends StatefulWidget {
  const LocationTrackerWidget({Key? key}) : super(key: key);

  @override
  _LocationTrackerWidgetState createState() => _LocationTrackerWidgetState();
}

class _LocationTrackerWidgetState extends State<LocationTrackerWidget> {
  final LocationService _locationService = LocationService();
  final GeofenceManager _geofenceManager = GeofenceManager();
  final LocationDatabase _database = LocationDatabase();

  GoogleMapController? _mapController;
  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};
  Set<Circle> _circles = {};

  Position? _currentPosition;
  List<LocationRecord> _locationHistory = [];
  int? _currentTrackId;
  double _totalDistance = 0.0;

  bool _isTracking = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  @override
  void dispose() {
    _locationService.dispose();
    _geofenceManager.dispose();
    super.dispose();
  }

  Future<void> _initializeServices() async {
    setState(() => _isLoading = true);

    try {
      // 初始化服务
      await _locationService.initialize();
      await _geofenceManager.initialize();

      // 监听位置更新
      _locationService.positionStream.listen(_onLocationUpdate);

      // 监听地理围栏事件
      _geofenceManager.eventStream.listen(_onGeofenceEvent);

      // 加载最近的位置历史
      await _loadLocationHistory();

      // 获取当前位置
      _currentPosition = await _locationService.getCurrentPosition();
      _updateMap();

    } catch (e) {
      _showErrorSnackBar('初始化失败: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadLocationHistory() async {
    final locations = await _database.getLocations(limit: 100);
    setState(() {
      _locationHistory = locations;
      _updatePolylines();
    });
  }

  void _onLocationUpdate(Position position) async {
    _currentPosition = position;

    if (_isTracking) {
      // 保存位置记录
      final locationId = await _database.saveLocation(position);

      // 添加到轨迹
      if (_currentTrackId != null) {
        final orderIndex = _locationHistory.length;
        await _database.addTrackPoint(_currentTrackId!, locationId, orderIndex);

        // 计算距离
        if (_locationHistory.isNotEmpty) {
          final lastLocation = _locationHistory.last;
          final distance = _locationService.calculateDistance(
            lastLocation.latitude,
            lastLocation.longitude,
            position.latitude,
            position.longitude,
          );
          _totalDistance += distance;
        }
      }

      // 更新位置历史
      setState(() {
        _locationHistory.add(LocationRecord(
          id: locationId,
          latitude: position.latitude,
          longitude: position.longitude,
          altitude: position.altitude,
          accuracy: position.accuracy,
          speed: position.speed,
          heading: position.heading,
          timestamp: position.timestamp ?? DateTime.now(),
          isMocked: position.isMocked,
        ));
        _updateMap();
      });
    }
  }

  void _onGeofenceEvent(GeofenceEvent event) {
    // 保存地理围栏事件
    final eventRecord = GeofenceEventRecord(
      id: 0, // 数据库会自动生成
      geofenceId: event.geofenceId,
      geofenceName: event.geofenceName,
      eventType: event.eventType,
      latitude: event.position.latitude,
      longitude: event.position.longitude,
      timestamp: event.timestamp,
    );

    _database.saveGeofenceEvent(eventRecord);

    // 显示通知
    _showGeofenceNotification(event);
  }

  void _showGeofenceNotification(GeofenceEvent event) {
    final message = event.eventType == GeofenceEventType.enter
        ? '进入 ${event.geofenceName}'
        : '离开 ${event.geofenceName}';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _updateMap() {
    if (_currentPosition == null) return;

    // 更新当前位置标记
    _markers.removeWhere((marker) => marker.markerId.value == 'current');
    _markers.add(Marker(
      markerId: const MarkerId('current'),
      position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
      infoWindow: const InfoWindow(title: '当前位置'),
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
    ));

    // 更新地理围栏圆圈
    _updateGeofenceCircles();

    // 移动地图到当前位置
    _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(
        LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
        15.0,
      ),
    );

    setState(() {});
  }

  void _updatePolylines() {
    if (_locationHistory.length < 2) return;

    final points = _locationHistory.map((location) {
      return LatLng(location.latitude, location.longitude);
    }).toList();

    _polylines.clear();
    _polylines.add(Polyline(
      polylineId: const PolylineId('track'),
      points: points,
      color: Colors.blue,
      width: 4,
    ));
  }

  void _updateGeofenceCircles() {
    _circles.clear();

    for (final geofence in _geofenceManager.geofences) {
      _circles.add(Circle(
        circleId: CircleId(geofence.id),
        center: LatLng(geofence.latitude, geofence.longitude),
        radius: geofence.radius,
        fillColor: geofence.isInside
            ? Colors.green.withOpacity(0.3)
            : Colors.red.withOpacity(0.3),
        strokeColor: geofence.isInside ? Colors.green : Colors.red,
        strokeWidth: 2,
      ));
    }
  }

  Future<void> _toggleTracking() async {
    if (_isTracking) {
      await _stopTracking();
    } else {
      await _startTracking();
    }
  }

  Future<void> _startTracking() async {
    try {
      // 创建新轨迹
      _currentTrackId = await _database.createTrack(
        '轨迹 ${DateTime.now().toString().substring(0, 19)}',
      );

      // 开始位置追踪
      await _locationService.startTracking();

      setState(() {
        _isTracking = true;
        _totalDistance = 0.0;
      });

      _showSuccessSnackBar('开始位置追踪');
    } catch (e) {
      _showErrorSnackBar('开始追踪失败: $e');
    }
  }

  Future<void> _stopTracking() async {
    try {
      // 停止位置追踪
      await _locationService.stopTracking();

      // 完成轨迹
      if (_currentTrackId != null) {
        await _database.completeTrack(_currentTrackId!, _totalDistance);
        _currentTrackId = null;
      }

      setState(() {
        _isTracking = false;
      });

      _showSuccessSnackBar('停止位置追踪');
    } catch (e) {
      _showErrorSnackBar('停止追踪失败: $e');
    }
  }

  void _showGeofenceDialog() {
    showDialog(
      context: context,
      builder: (context) => GeofenceDialog(
        onGeofenceAdded: (geofence) async {
          try {
            await _geofenceManager.addGeofence(geofence);
            _updateGeofenceCircles();
            _showSuccessSnackBar('地理围栏添加成功');
          } catch (e) {
            _showErrorSnackBar('添加地理围栏失败: $e');
          }
        },
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('GeoTracker'),
        backgroundColor: Colors.blue,
        actions: [
          IconButton(
            icon: const Icon(Icons.fence),
            onPressed: _showGeofenceDialog,
            tooltip: '添加地理围栏',
          ),
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => _showTracksScreen(),
            tooltip: '查看轨迹',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                // 地图
                GoogleMap(
                  onMapCreated: (controller) => _mapController = controller,
                  initialCameraPosition: CameraPosition(
                    target: _currentPosition != null
                        ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
                        : const LatLng(39.9042, 116.4074), // 默认北京
                    zoom: 15.0,
                  ),
                  markers: _markers,
                  polylines: _polylines,
                  circles: _circles,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                ),

                // 信息面板
                Positioned(
                  top: 16,
                  left: 16,
                  right: 16,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '追踪状态: ${_isTracking ? '进行中' : '已停止'}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (_isTracking) ...[
                            Text('总距离: ${_totalDistance.toStringAsFixed(2)} 米'),
                            Text('位置点数: ${_locationHistory.length}'),
                          ],
                          if (_currentPosition != null) ...[
                            Text(
                              '当前位置: ${_currentPosition!.latitude.toStringAsFixed(6)}, ${_currentPosition!.longitude.toStringAsFixed(6)}',
                            ),
                            Text('精度: ${_currentPosition?.accuracy.toStringAsFixed(2)} 米'),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),

                // 控制按钮
                Positioned(
                  bottom: 16,
                  right: 16,
                  child: Column(
                    children: [
                      // 返回当前位置按钮
                      FloatingActionButton(
                        heroTag: "current_location",
                        onPressed: () {
                          if (_currentPosition != null) {
                            _mapController?.animateCamera(
                              CameraUpdate.newLatLngZoom(
                                LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                                15.0,
                              ),
                            );
                          }
                        },
                        child: const Icon(Icons.my_location),
                      ),
                      const SizedBox(height: 16),
                      // 开始/停止追踪按钮
                      FloatingActionButton.extended(
                        heroTag: "toggle_tracking",
                        onPressed: _toggleTracking,
                        icon: Icon(_isTracking ? Icons.stop : Icons.play_arrow),
                        label: Text(_isTracking ? '停止' : '开始'),
                        backgroundColor: _isTracking ? Colors.red : Colors.green,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  void _showTracksScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const TracksScreen(),
      ),
    );
  }
}

// 地理围栏对话框
class GeofenceDialog extends StatefulWidget {
  final Function(GeofenceRegion) onGeofenceAdded;

  const GeofenceDialog({
    Key? key,
    required this.onGeofenceAdded,
  }) : super(key: key);

  @override
  _GeofenceDialogState createState() => _GeofenceDialogState();
}

class _GeofenceDialogState extends State<GeofenceDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _latitudeController = TextEditingController();
  final _longitudeController = TextEditingController();
  final _radiusController = TextEditingController(text: '100');

  @override
  void dispose() {
    _nameController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    _radiusController.dispose();
    super.dispose();
  }

  void _addGeofence() {
    if (_formKey.currentState!.validate()) {
      final geofence = GeofenceRegion(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: _nameController.text,
        latitude: double.parse(_latitudeController.text),
        longitude: double.parse(_longitudeController.text),
        radius: double.parse(_radiusController.text),
      );

      widget.onGeofenceAdded(geofence);
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('添加地理围栏'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: '名称'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入名称';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _latitudeController,
              decoration: const InputDecoration(labelText: '纬度'),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入纬度';
                }
                final lat = double.tryParse(value);
                if (lat == null || lat < -90 || lat > 90) {
                  return '请输入有效的纬度值(-90到90)';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _longitudeController,
              decoration: const InputDecoration(labelText: '经度'),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入经度';
                }
                final lng = double.tryParse(value);
                if (lng == null || lng < -180 || lng > 180) {
                  return '请输入有效的经度值(-180到180)';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _radiusController,
              decoration: const InputDecoration(labelText: '半径(米)'),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入半径';
                }
                final radius = double.tryParse(value);
                if (radius == null || radius <= 0) {
                  return '请输入有效的半径值';
                }
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: _addGeofence,
          child: const Text('添加'),
        ),
      ],
    );
  }
}

// 轨迹列表页面
class TracksScreen extends StatefulWidget {
  const TracksScreen({Key? key}) : super(key: key);

  @override
  _TracksScreenState createState() => _TracksScreenState();
}

class _TracksScreenState extends State<TracksScreen> {
  final LocationDatabase _database = LocationDatabase();
  List<Track> _tracks = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadTracks();
  }

  Future<void> _loadTracks() async {
    setState(() => _isLoading = true);

    try {
      final tracks = await _database.getTracks();
      setState(() {
        _tracks = tracks;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('加载轨迹失败: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('轨迹历史'),
        backgroundColor: Colors.blue,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tracks.isEmpty
              ? const Center(
                  child: Text('暂无轨迹记录'),
                )
              : ListView.builder(
                  itemCount: _tracks.length,
                  itemBuilder: (context, index) {
                    final track = _tracks[index];
                    return TrackCard(
                      track: track,
                      onTap: () => _showTrackDetail(track),
                    );
                  },
                ),
    );
  }

  void _showTrackDetail(Track track) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TrackDetailScreen(trackId: track.id),
      ),
    );
  }
}

// 轨迹卡片组件
class TrackCard extends StatelessWidget {
  final Track track;
  final VoidCallback onTap;

  const TrackCard({
    Key? key,
    required this.track,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        title: Text(track.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('开始时间: ${_formatDateTime(track.startTime)}'),
            if (track.endTime != null)
              Text('结束时间: ${_formatDateTime(track.endTime!)}'),
            Text('距离: ${track.distance.toStringAsFixed(2)} 米'),
            if (track.duration != null)
              Text('时长: ${_formatDuration(track.duration!)}'),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: onTap,
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '${hours}小时${minutes}分钟${seconds}秒';
    } else if (minutes > 0) {
      return '${minutes}分钟${seconds}秒';
    } else {
      return '${seconds}秒';
    }
  }
}

// 轨迹详情页面
class TrackDetailScreen extends StatefulWidget {
  final int trackId;

  const TrackDetailScreen({
    Key? key,
    required this.trackId,
  }) : super(key: key);

  @override
  _TrackDetailScreenState createState() => _TrackDetailScreenState();
}

class _TrackDetailScreenState extends State<TrackDetailScreen> {
  final LocationDatabase _database = LocationDatabase();
  TrackDetail? _trackDetail;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadTrackDetail();
  }

  Future<void> _loadTrackDetail() async {
    setState(() => _isLoading = true);

    try {
      final trackDetail = await _database.getTrackDetail(widget.trackId);
      setState(() {
        _trackDetail = trackDetail;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('加载轨迹详情失败: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('轨迹详情'),
        backgroundColor: Colors.blue,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _trackDetail == null
              ? const Center(child: Text('轨迹详情不存在'))
              : Column(
                  children: [
                    // 轨迹信息
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      color: Colors.grey[200],
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _trackDetail!.track.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text('开始时间: ${_formatDateTime(_trackDetail!.track.startTime)}'),
                          if (_trackDetail!.track.endTime != null)
                            Text('结束时间: ${_formatDateTime(_trackDetail!.track.endTime!)}'),
                          Text('总距离: ${_trackDetail!.track.distance.toStringAsFixed(2)} 米'),
                          if (_trackDetail!.track.duration != null)
                            Text('总时长: ${_formatDuration(_trackDetail!.track.duration!)}'),
                          Text('位置点数: ${_trackDetail!.points.length}'),
                        ],
                      ),
                    ),

                    // 地图
                    Expanded(
                      child: GoogleMap(
                        initialCameraPosition: CameraPosition(
                          target: _trackDetail!.points.isNotEmpty
                              ? LatLng(
                                  _trackDetail!.points.first.latitude,
                                  _trackDetail!.points.first.longitude,
                                )
                              : const LatLng(39.9042, 116.4074),
                          zoom: 15.0,
                        ),
                        polylines: {
                          Polyline(
                            polylineId: const PolylineId('track'),
                            points: _trackDetail!.points.map((point) {
                              return LatLng(point.latitude, point.longitude);
                            }).toList(),
                            color: Colors.blue,
                            width: 4,
                          ),
                        },
                        markers: _trackDetail!.points.isNotEmpty
                            ? {
                                Marker(
                                  markerId: const MarkerId('start'),
                                  position: LatLng(
                                    _trackDetail!.points.first.latitude,
                                    _trackDetail!.points.first.longitude,
                                  ),
                                  infoWindow: const InfoWindow(title: '起点'),
                                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
                                ),
                                Marker(
                                  markerId: const MarkerId('end'),
                                  position: LatLng(
                                    _trackDetail!.points.last.latitude,
                                    _trackDetail!.points.last.longitude,
                                  ),
                                  infoWindow: const InfoWindow(title: '终点'),
                                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
                                ),
                              }
                            : {},
                      ),
                    ),
                  ],
                ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '${hours}小时${minutes}分钟${seconds}秒';
    } else if (minutes > 0) {
      return '${minutes}分钟${seconds}秒';
    } else {
      return '${seconds}秒';
    }
  }
}
```

### 第六步：创建主应用界面

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'widgets/location_tracker_widget.dart';

void main() {
  runApp(const GeoTrackerApp());
}

class GeoTrackerApp extends StatelessWidget {
  const GeoTrackerApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GeoTracker',
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

class _MainScreenState extends State<MainScreen> {
  bool _permissionsGranted = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);

    try {
      // 检查定位权限
      final locationPermission = await Permission.location.status;
      final backgroundLocationPermission = await Permission.locationAlways.status;

      if (locationPermission.isGranted && backgroundLocationPermission.isGranted) {
        setState(() => _permissionsGranted = true);
      } else {
        setState(() => _permissionsGranted = false);
      }
    } catch (e) {
      setState(() => _permissionsGranted = false);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPermissions() async {
    try {
      // 请求定位权限
      final locationPermission = await Permission.location.request();

      if (locationPermission.isGranted) {
        // 请求后台定位权限
        final backgroundLocationPermission = await Permission.locationAlways.request();

        if (backgroundLocationPermission.isGranted) {
          setState(() => _permissionsGranted = true);
        } else {
          _showPermissionDeniedDialog('后台定位权限被拒绝，应用无法在后台追踪位置');
        }
      } else {
        _showPermissionDeniedDialog('定位权限被拒绝，应用无法获取位置信息');
      }
    } catch (e) {
      _showErrorSnackBar('请求权限失败: $e');
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
          title: const Text('GeoTracker'),
          backgroundColor: Colors.blue,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.location_off,
                size: 64,
                color: Colors.grey,
              ),
              const SizedBox(height: 16),
              const Text(
                '需要定位权限',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'GeoTracker需要访问您的位置来提供位置追踪服务',
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

    return const LocationTrackerWidget();
  }
}
```

## 高级功能实现

### 1. 位置数据分析

```dart
// lib/services/location_analytics.dart
import 'dart:math';
import 'package:geolocator/geolocator.dart';
import 'location_database.dart';

class LocationAnalytics {
  final LocationDatabase _database = LocationDatabase();

  // 计算轨迹统计信息
  Future<TrackStatistics> calculateTrackStatistics(int trackId) async {
    final trackDetail = await _database.getTrackDetail(trackId);
    if (trackDetail == null || trackDetail.points.isEmpty) {
      return TrackStatistics.empty();
    }

    final points = trackDetail.points;

    // 总距离
    double totalDistance = 0.0;
    for (int i = 1; i < points.length; i++) {
      totalDistance += Geolocator.distanceBetween(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude,
      );
    }

    // 总时长
    final totalDuration = points.last.timestamp.difference(points.first.timestamp);

    // 平均速度
    final averageSpeed = totalDuration.inSeconds > 0
        ? (totalDistance / totalDuration.inSeconds) * 3.6 // km/h
        : 0.0;

    // 最高速度
    double maxSpeed = 0.0;
    for (int i = 1; i < points.length; i++) {
      final duration = points[i].timestamp.difference(points[i - 1].timestamp).inSeconds;
      if (duration > 0) {
        final distance = Geolocator.distanceBetween(
          points[i - 1].latitude,
          points[i - 1].longitude,
          points[i].latitude,
          points[i].longitude,
        );
        final speed = (distance / duration) * 3.6; // km/h
        maxSpeed = max(maxSpeed, speed);
      }
    }

    // 海拔变化
    double totalAscent = 0.0;
    double totalDescent = 0.0;
    for (int i = 1; i < points.length; i++) {
      final altitude1 = points[i - 1].altitude ?? 0;
      final altitude2 = points[i].altitude ?? 0;
      final elevationChange = altitude2 - altitude1;

      if (elevationChange > 0) {
        totalAscent += elevationChange;
      } else {
        totalDescent += elevationChange.abs();
      }
    }

    // 边界框
    final minLat = points.map((p) => p.latitude).reduce(min);
    final maxLat = points.map((p) => p.latitude).reduce(max);
    final minLng = points.map((p) => p.longitude).reduce(min);
    final maxLng = points.map((p) => p.longitude).reduce(max);

    return TrackStatistics(
      totalDistance: totalDistance,
      totalDuration: totalDuration,
      averageSpeed: averageSpeed,
      maxSpeed: maxSpeed,
      totalAscent: totalAscent,
      totalDescent: totalDescent,
      pointCount: points.length,
      bounds: LatLngBounds(
        southwest: LatLng(minLat, minLng),
        northeast: LatLng(maxLat, maxLng),
      ),
    );
  }

  // 分析停留点
  Future<List<StayPoint>> findStayPoints(int trackId, {int minStayTime = 300}) async {
    final trackDetail = await _database.getTrackDetail(trackId);
    if (trackDetail == null || trackDetail.points.isEmpty) {
      return [];
    }

    final points = trackDetail.points;
    final List<StayPoint> stayPoints = [];

    int startIndex = 0;

    while (startIndex < points.length - 1) {
      final stayPoint = _findStayPoint(points, startIndex, minStayTime);
      if (stayPoint != null) {
        stayPoints.add(stayPoint);
        startIndex = stayPoint.endIndex + 1;
      } else {
        startIndex++;
      }
    }

    return stayPoints;
  }

  StayPoint? _findStayPoint(List<LocationRecord> points, int startIndex, int minStayTime) {
    if (startIndex >= points.length - 1) return null;

    final startLocation = points[startIndex];
    int endIndex = startIndex + 1;

    // 寻找停留区域的边界
    while (endIndex < points.length) {
      final distance = Geolocator.distanceBetween(
        startLocation.latitude,
        startLocation.longitude,
        points[endIndex].latitude,
        points[endIndex].longitude,
      );

      if (distance > 50) { // 50米半径
        break;
      }
      endIndex++;
    }

    // 检查停留时间
    if (endIndex > startIndex + 1) {
      final duration = points[endIndex - 1].timestamp.difference(startLocation.timestamp);
      if (duration.inSeconds >= minStayTime) {
        return StayPoint(
          startIndex: startIndex,
          endIndex: endIndex - 1,
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          startTime: startLocation.timestamp,
          endTime: points[endIndex - 1].timestamp,
          duration: duration,
        );
      }
    }

    return null;
  }

  // 分析速度分布
  Future<SpeedDistribution> analyzeSpeedDistribution(int trackId) async {
    final trackDetail = await _database.getTrackDetail(trackId);
    if (trackDetail == null || trackDetail.points.isEmpty) {
      return SpeedDistribution.empty();
    }

    final points = trackDetail.points;
    final List<double> speeds = [];

    for (int i = 1; i < points.length; i++) {
      final duration = points[i].timestamp.difference(points[i - 1].timestamp).inSeconds;
      if (duration > 0) {
        final distance = Geolocator.distanceBetween(
          points[i - 1].latitude,
          points[i - 1].longitude,
          points[i].latitude,
          points[i].longitude,
        );
        final speed = (distance / duration) * 3.6; // km/h
        speeds.add(speed);
      }
    }

    if (speeds.isEmpty) {
      return SpeedDistribution.empty();
    }

    speeds.sort();

    final averageSpeed = speeds.reduce((a, b) => a + b) / speeds.length;
    final maxSpeed = speeds.last;
    final minSpeed = speeds.first;

    // 计算百分位数
    final p50 = _percentile(speeds, 0.5);
    final p75 = _percentile(speeds, 0.75);
    final p90 = _percentile(speeds, 0.9);
    final p95 = _percentile(speeds, 0.95);

    return SpeedDistribution(
      averageSpeed: averageSpeed,
      maxSpeed: maxSpeed,
      minSpeed: minSpeed,
      p50: p50,
      p75: p75,
      p90: p90,
      p95: p95,
      sampleCount: speeds.length,
    );
  }

  double _percentile(List<double> sortedList, double percentile) {
    if (sortedList.isEmpty) return 0.0;

    final index = (sortedList.length - 1) * percentile;
    final lower = index.floor();
    final upper = index.ceil();
    final weight = index % 1;

    if (upper >= sortedList.length) {
      return sortedList.last;
    }

    return sortedList[lower] * (1 - weight) + sortedList[upper] * weight;
  }
}

// 轨迹统计信息
class TrackStatistics {
  final double totalDistance; // 米
  final Duration totalDuration;
  final double averageSpeed; // km/h
  final double maxSpeed; // km/h
  final double totalAscent; // 米
  final double totalDescent; // 米
  final int pointCount;
  final LatLngBounds bounds;

  TrackStatistics({
    required this.totalDistance,
    required this.totalDuration,
    required this.averageSpeed,
    required this.maxSpeed,
    required this.totalAscent,
    required this.totalDescent,
    required this.pointCount,
    required this.bounds,
  });

  factory TrackStatistics.empty() {
    return TrackStatistics(
      totalDistance: 0.0,
      totalDuration: Duration.zero,
      averageSpeed: 0.0,
      maxSpeed: 0.0,
      totalAscent: 0.0,
      totalDescent: 0.0,
      pointCount: 0,
      bounds: LatLngBounds(
        southwest: const LatLng(0, 0),
        northeast: const LatLng(0, 0),
      ),
    );
  }
}

// 停留点
class StayPoint {
  final int startIndex;
  final int endIndex;
  final double latitude;
  final double longitude;
  final DateTime startTime;
  final DateTime endTime;
  final Duration duration;

  StayPoint({
    required this.startIndex,
    required this.endIndex,
    required this.latitude,
    required this.longitude,
    required this.startTime,
    required this.endTime,
    required this.duration,
  });
}

// 速度分布
class SpeedDistribution {
  final double averageSpeed;
  final double maxSpeed;
  final double minSpeed;
  final double p50; // 中位数
  final double p75; // 75百分位
  final double p90; // 90百分位
  final double p95; // 95百分位
  final int sampleCount;

  SpeedDistribution({
    required this.averageSpeed,
    required this.maxSpeed,
    required this.minSpeed,
    required this.p50,
    required this.p75,
    required this.p90,
    required this.p95,
    required this.sampleCount,
  });

  factory SpeedDistribution.empty() {
    return SpeedDistribution(
      averageSpeed: 0.0,
      maxSpeed: 0.0,
      minSpeed: 0.0,
      p50: 0.0,
      p75: 0.0,
      p90: 0.0,
      p95: 0.0,
      sampleCount: 0,
    );
  }
}

// 经纬度边界框
class LatLngBounds {
  final LatLng southwest;
  final LatLng northeast;

  LatLngBounds({
    required this.southwest,
    required this.northeast,
  });
}

// 经纬度点
class LatLng {
  final double latitude;
  final double longitude;

  const LatLng(this.latitude, this.longitude);
}
```

### 2. 位置数据导出

```dart
// lib/services/location_exporter.dart
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus';
import 'location_database.dart';

class LocationExporter {
  final LocationDatabase _database = LocationDatabase();

  // 导出轨迹为GPX格式
  Future<File> exportTrackToGPX(int trackId) async {
    final trackDetail = await _database.getTrackDetail(trackId);
    if (trackDetail == null) {
      throw ExportException('轨迹不存在');
    }

    final gpxContent = _generateGPXContent(trackDetail);
    final file = await _saveFile('track_${trackDetail.track.id}.gpx', gpxContent);

    return file;
  }

  // 导出轨迹为KML格式
  Future<File> exportTrackToKML(int trackId) async {
    final trackDetail = await _database.getTrackDetail(trackId);
    if (trackDetail == null) {
      throw ExportException('轨迹不存在');
    }

    final kmlContent = _generateKMLContent(trackDetail);
    final file = await _saveFile('track_${trackDetail.track.id}.kml', kmlContent);

    return file;
  }

  // 导出轨迹为JSON格式
  Future<File> exportTrackToJSON(int trackId) async {
    final trackDetail = await _database.getTrackDetail(trackId);
    if (trackDetail == null) {
      throw ExportException('轨迹不存在');
    }

    final jsonContent = _generateJSONContent(trackDetail);
    final file = await _saveFile('track_${trackDetail.track.id}.json', jsonContent);

    return file;
  }

  // 导出所有轨迹为CSV格式
  Future<File> exportAllTracksToCSV() async {
    final tracks = await _database.getTracks();
    final csvContent = _generateCSVContent(tracks);
    final file = await _saveFile('tracks.csv', csvContent);

    return file;
  }

  // 分享轨迹文件
  Future<void> shareTrack(int trackId, String format) async {
    File file;

    switch (format.toLowerCase()) {
      case 'gpx':
        file = await exportTrackToGPX(trackId);
        break;
      case 'kml':
        file = await exportTrackToKML(trackId);
        break;
      case 'json':
        file = await exportTrackToJSON(trackId);
        break;
      default:
        throw ExportException('不支持的格式: $format');
    }

    await Share.shareXFiles([XFile(file.path)], text: '分享轨迹文件');
  }

  // 生成GPX内容
  String _generateGPXContent(TrackDetail trackDetail) {
    final buffer = StringBuffer();

    buffer.writeln('<?xml version="1.0" encoding="UTF-8"?>');
    buffer.writeln('<gpx version="1.1" creator="GeoTracker" xmlns="http://www.topografix.com/GPX/1/1">');

    // 轨迹信息
    buffer.writeln('  <trk>');
    buffer.writeln('    <name>${_escapeXml(trackDetail.track.name)}</name>');
    if (trackDetail.track.description != null) {
      buffer.writeln('    <desc>${_escapeXml(trackDetail.track.description!)}</desc>');
    }
    buffer.writeln('    <trkseg>');

    // 轨迹点
    for (final point in trackDetail.points) {
      buffer.writeln('      <trkpt lat="${point.latitude}" lon="${point.longitude}">');
      if (point.altitude != null) {
        buffer.writeln('        <ele>${point.altitude}</ele>');
      }
      buffer.writeln('        <time>${_formatGPXTime(point.timestamp)}</time>');
      buffer.writeln('      </trkpt>');
    }

    buffer.writeln('    </trkseg>');
    buffer.writeln('  </trk>');
    buffer.writeln('</gpx>');

    return buffer.toString();
  }

  // 生成KML内容
  String _generateKMLContent(TrackDetail trackDetail) {
    final buffer = StringBuffer();

    buffer.writeln('<?xml version="1.0" encoding="UTF-8"?>');
    buffer.writeln('<kml xmlns="http://www.opengis.net/kml/2.2">');
    buffer.writeln('  <Document>');
    buffer.writeln('    <name>${_escapeXml(trackDetail.track.name)}</name>');

    // 轨迹线
    buffer.writeln('    <Placemark>');
    buffer.writeln('      <name>${_escapeXml(trackDetail.track.name)}</name>');
    buffer.writeln('      <LineString>');
    buffer.writeln('        <coordinates>');

    for (final point in trackDetail.points) {
      buffer.writeln('          ${point.longitude},${point.latitude}${point.altitude != null ? ',${point.altitude}' : ''}');
    }

    buffer.writeln('        </coordinates>');
    buffer.writeln('      </LineString>');
    buffer.writeln('    </Placemark>');

    // 轨迹点
    for (int i = 0; i < trackDetail.points.length; i++) {
      final point = trackDetail.points[i];
      buffer.writeln('    <Placemark>');
      buffer.writeln('      <name>Point ${i + 1}</name>');
      buffer.writeln('      <Point>');
      buffer.writeln('        <coordinates>${point.longitude},${point.latitude}${point.altitude != null ? ',${point.altitude}' : ''}</coordinates>');
      buffer.writeln('      </Point>');
      buffer.writeln('    </Placemark>');
    }

    buffer.writeln('  </Document>');
    buffer.writeln('</kml>');

    return buffer.toString();
  }

  // 生成JSON内容
  String _generateJSONContent(TrackDetail trackDetail) {
    final trackData = {
      'track': {
        'id': trackDetail.track.id,
        'name': trackDetail.track.name,
        'description': trackDetail.track.description,
        'startTime': trackDetail.track.startTime.toIso8601String(),
        'endTime': trackDetail.track.endTime?.toIso8601String(),
        'distance': trackDetail.track.distance,
        'createdAt': trackDetail.track.createdAt.toIso8601String(),
      },
      'points': trackDetail.points.map((point) => {
        'latitude': point.latitude,
        'longitude': point.longitude,
        'altitude': point.altitude,
        'accuracy': point.accuracy,
        'speed': point.speed,
        'heading': point.heading,
        'timestamp': point.timestamp.toIso8601String(),
        'isMocked': point.isMocked,
      }).toList(),
    };

    return const JsonEncoder.withIndent('  ').convert(trackData);
  }

  // 生成CSV内容
  String _generateCSVContent(List<Track> tracks) {
    final buffer = StringBuffer();

    // CSV头部
    buffer.writeln('ID,名称,描述,开始时间,结束时间,距离(米),创建时间');

    // 数据行
    for (final track in tracks) {
      buffer.writeln('${track.id},"${_escapeCsv(track.name)}","${_escapeCsv(track.description ?? '')}","${track.startTime.toIso8601String()}","${track.endTime?.toIso8601String() ?? ''}",${track.distance},"${track.createdAt.toIso8601String()}"');
    }

    return buffer.toString();
  }

  // 保存文件
  Future<File> _saveFile(String filename, String content) async {
    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/$filename');
    return await file.writeAsString(content);
  }

  // XML转义
  String _escapeXml(String text) {
    return text
        .replaceAll('&', '&')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", ''');
  }

  // CSV转义
  String _escapeCsv(String text) {
    if (text.contains(',') || text.contains('"') || text.contains('\n')) {
      return '"${text.replaceAll('"', '""')}"';
    }
    return text;
  }

  // 格式化GPX时间
  String _formatGPXTime(DateTime dateTime) {
    final utcTime = dateTime.toUtc();
    return '${utcTime.year.toString().padLeft(4, '0')}-${utcTime.month.toString().padLeft(2, '0')}-${utcTime.day.toString().padLeft(2, '0')}T${utcTime.hour.toString().padLeft(2, '0')}:${utcTime.minute.toString().padLeft(2, '0')}:${utcTime.second.toString().padLeft(2, '0')}Z';
  }
}

// 导出异常
class ExportException implements Exception {
  final String message;
  ExportException(this.message);

  @override
  String toString() => message;
}
```

## 测试与调试

### 1. 定位服务测试

```dart
// test/location_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geo_tracker/services/location_service.dart';

class MockGeolocator extends Mock implements Geolocator {}

void main() {
  group('LocationService Tests', () {
    late LocationService locationService;

    setUp(() {
      locationService = LocationService();
    });

    test('should initialize successfully with granted permissions', () async {
      // 模拟定位服务启用和权限授予
      when(Geolocator.isLocationServiceEnabled())
          .thenAnswer((_) async => true);
      when(Geolocator.checkPermission())
          .thenAnswer((_) async => LocationPermission.whileInUse);

      await expectLater(locationService.initialize(), completes);
    });

    test('should throw exception when location service is disabled', () async {
      // 模拟定位服务未启用
      when(Geolocator.isLocationServiceEnabled())
          .thenAnswer((_) async => false);

      await expectLater(
        locationService.initialize(),
        throwsA(isA<LocationServiceException>()),
      );
    });

    test('should start tracking successfully', () async {
      // 模拟权限和定位服务正常
      when(Geolocator.isLocationServiceEnabled())
          .thenAnswer((_) async => true);
      when(Geolocator.checkPermission())
          .thenAnswer((_) async => LocationPermission.whileInUse);
      when(Geolocator.getCurrentPosition())
          .thenAnswer((_) async => Position(
                latitude: 39.9042,
                longitude: 116.4074,
                timestamp: DateTime.now(),
                accuracy: 10,
                altitude: 0,
                heading: 0,
                speed: 0,
                isMocked: false,
              ));

      await locationService.initialize();
      await expectLater(locationService.startTracking(), completes);
    });
  });
}
```

### 2. 地理围栏测试

```dart
// test/geofence_manager_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:geo_tracker/services/geofence_manager.dart';

void main() {
  group('GeofenceManager Tests', () {
    late GeofenceManager geofenceManager;

    setUp(() {
      geofenceManager = GeofenceManager();
    });

    test('should add geofence successfully', () async {
      final geofence = GeofenceRegion(
        id: 'test1',
        name: 'Test Geofence',
        latitude: 39.9042,
        longitude: 116.4074,
        radius: 100,
      );

      await expectLater(geofenceManager.addGeofence(geofence), completes);
      expect(geofenceManager.geofences.length, equals(1));
      expect(geofenceManager.geofences.first.id, equals('test1'));
    });

    test('should throw exception when adding duplicate geofence', () async {
      final geofence1 = GeofenceRegion(
        id: 'test1',
        name: 'Test Geofence 1',
        latitude: 39.9042,
        longitude: 116.4074,
        radius: 100,
      );

      final geofence2 = GeofenceRegion(
        id: 'test1',
        name: 'Test Geofence 2',
        latitude: 39.9042,
        longitude: 116.4074,
        radius: 200,
      );

      await geofenceManager.addGeofence(geofence1);

      await expectLater(
        geofenceManager.addGeofence(geofence2),
        throwsA(isA<GeofenceException>()),
      );
    });

    test('should remove geofence successfully', () async {
      final geofence = GeofenceRegion(
        id: 'test1',
        name: 'Test Geofence',
        latitude: 39.9042,
        longitude: 116.4074,
        radius: 100,
      );

      await geofenceManager.addGeofence(geofence);
      await geofenceManager.removeGeofence('test1');

      expect(geofenceManager.geofences.length, equals(0));
    });
  });
}
```

## 最佳实践与注意事项

### 1. 权限管理

- **渐进式权限请求**：先请求基本定位权限，再请求后台定位权限
- **权限说明**：清晰地向用户解释为什么需要定位权限
- **优雅降级**：在权限被拒绝时提供替代功能

### 2. 电池优化

- **合理设置更新频率**：根据应用需求调整位置更新间隔
- **使用后台服务**：在 Android 上使用前台服务确保后台定位
- **智能暂停**：在用户不活动时暂停位置更新

### 3. 数据管理

- **本地缓存**：使用 SQLite 数据库存储位置数据
- **数据清理**：定期清理过期的位置数据
- **数据压缩**：对轨迹数据进行压缩以减少存储空间

### 4. 用户体验

- **可视化反馈**：在地图上清晰显示当前位置和轨迹
- **状态指示**：明确显示定位服务的状态
- **离线支持**：支持离线地图和轨迹查看

### 5. 隐私保护

- **数据加密**：对敏感位置数据进行加密存储
- **用户控制**：允许用户控制位置数据的收集和使用
- **数据最小化**：只收集必要的位置信息

## 总结

通过本文的详细介绍，我们成功实现了一个功能完整的位置追踪应用 GeoTracker。这个项目涵盖了：

1. **定位服务基础架构**：设计了完整的定位服务管理架构
2. **地理围栏功能**：实现了地理围栏的创建、监控和事件处理
3. **数据存储与分析**：提供了位置数据的存储、分析和导出功能
4. **用户界面设计**：创建了直观的位置追踪和轨迹查看界面
5. **高级功能**：实现了位置数据分析、停留点检测和数据导出
6. **测试与调试**：提供了完整的测试方案

定位服务是移动应用开发中的重要功能，通过 Flutter 的桥接能力，我们可以轻松实现跨平台的定位功能。在实际项目中，还可以根据具体需求进一步扩展功能，比如：

- 集成更多地图服务（如高德地图、百度地图）
- 添加实时位置共享功能
- 实现轨迹回放和动画效果
- 集成天气信息和 POI 搜索
- 添加运动类型识别和卡路里计算

希望本文能够帮助开发者更好地理解和实现 Flutter 中的定位服务功能。
