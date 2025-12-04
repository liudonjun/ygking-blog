---
description: 本文详细介绍Flutter集成穿山甲SDK的桥接技术，包括广告展示、收益统计、用户数据分析和跨平台适配等内容。
tag:
  - Flutter
  - 穿山甲SDK
  - 广告集成
  - 桥接技术
  - 收益优化
sticky: 1
sidebar: true
---

# Flutter 集成穿山甲 SDK 桥接

## 概述

穿山甲 SDK 是字节跳动旗下的移动广告平台，为开发者提供丰富的广告变现解决方案。本文将详细介绍如何在 Flutter 应用中集成穿山甲 SDK，包括广告展示、收益统计、用户数据分析和跨平台适配等核心技术。

## 环境配置

### 1. 项目配置

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
 穿山甲SDK相关依赖
  pangle_flutter: ^2.0.0  # 穿山甲Flutter插件
  shared_preferences: ^2.2.0  # 用于存储配置
  device_info_plus: ^9.0.0  # 获取设备信息
  package_info_plus: ^4.0.0  # 获取应用信息
```

### 2. Android 配置

```groovy
// android/app/build.gradle
android {
    defaultConfig {
        // 穿山甲SDK配置
        manifestPlaceholders = [
            PANGLE_APP_ID: "你的穿山甲AppID",
            PANGLE_DEBUG: "false"  // 发布时设为false
        ]
    }
}

dependencies {
    implementation 'com.bytedance.sdk:pangle-sdk:5.5.0.8'  // 穿山甲SDK
}
```

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <application>
        <!-- 穿山甲SDK配置 -->
        <meta-data
            android:name="PANGLE_APP_ID"
            android:value="${PANGLE_APP_ID}" />
        <meta-data
            android:name="PANGLE_DEBUG"
            android:value="${PANGLE_DEBUG}" />

        <!-- 必要权限 -->
        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
        <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
        <uses-permission android:name="android.permission.READ_PHONE_STATE" />
        <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
        <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

        <!-- 可选权限，提高广告收益 -->
        <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
        <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    </application>
</manifest>
```

### 3. iOS 配置

```ruby
# ios/Podfile
platform :ios, '10.0'

target 'Runner' do
  use_frameworks!

  # 穿山甲SDK
  pod 'BUAdSDK', '5.5.0.8'

  # 其他依赖
end
```

```xml
<!-- ios/Runner/Info.plist -->
<dict>
    <!-- 穿山甲SDK配置 -->
    <key>PANGLEAppID</key>
    <string>你的穿山甲AppID</string>

    <!-- 必要配置 -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>

    <!-- 位置权限（可选） -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>此应用需要访问位置信息以提供更精准的广告</string>
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>此应用需要访问位置信息以提供更精准的广告</string>

    <!-- IDFA权限（可选） -->
    <key>NSUserTrackingUsageDescription</key>
    <string>此应用将使用您的广告标识符来提供个性化广告</string>
</dict>
```

## SDK 初始化

### 1. 基础初始化

```dart
// 穿山甲SDK管理器
class PangleSDKManager {
  static const MethodChannel _channel = MethodChannel('pangle_sdk');
  static bool _isInitialized = false;
  static final List<PangleInitListener> _initListeners = [];

  // 初始化SDK
  static Future<bool> initialize({
    required String appId,
    bool debug = false,
    Map<String, dynamic>? customConfig,
  }) async {
    if (_isInitialized) {
      return true;
    }

    try {
      final result = await _channel.invokeMethod('initialize', {
        'appId': appId,
        'debug': debug,
        'customConfig': customConfig ?? {},
      });

      _isInitialized = result as bool;

      if (_isInitialized) {
        _notifyInitSuccess();
      } else {
        _notifyInitError('SDK initialization failed');
      }

      return _isInitialized;
    } on PlatformException catch (e) {
      _notifyInitError(e.message ?? 'Unknown error');
      return false;
    }
  }

  // 检查初始化状态
  static bool get isInitialized => _isInitialized;

  // 添加初始化监听器
  static void addInitListener(PangleInitListener listener) {
    _initListeners.add(listener);
  }

  // 移除初始化监听器
  static void removeInitListener(PangleInitListener listener) {
    _initListeners.remove(listener);
  }

  // 通知初始化成功
  static void _notifyInitSuccess() {
    for (final listener in _initListeners) {
      listener.onInitSuccess();
    }
  }

  // 通知初始化失败
  static void _notifyInitError(String error) {
    for (final listener in _initListeners) {
      listener.onInitError(error);
    }
  }
}

// 初始化监听器
abstract class PangleInitListener {
  void onInitSuccess();
  void onInitError(String error);
}
```

### 2. 高级初始化配置

```dart
// 穿山甲SDK高级配置
class PangleSDKConfig {
  final String appId;
  final bool debug;
  final bool? enablePersonalizedAd;
  final bool? allowModifyAudioSession;
  final bool? supportDeepLink;
  final Map<String, dynamic>? customConfig;

  PangleSDKConfig({
    required this.appId,
    this.debug = false,
    this.enablePersonalizedAd,
    this.allowModifyAudioSession,
    this.supportDeepLink,
    this.customConfig,
  });

  Map<String, dynamic> toMap() {
    return {
      'appId': appId,
      'debug': debug,
      'enablePersonalizedAd': enablePersonalizedAd,
      'allowModifyAudioSession': allowModifyAudioSession,
      'supportDeepLink': supportDeepLink,
      'customConfig': customConfig ?? {},
    };
  }
}

// 穿山甲SDK高级管理器
class AdvancedPangleSDKManager extends PangleSDKManager {
  // 高级初始化
  static Future<bool> initializeWithConfig(PangleSDKConfig config) async {
    if (_isInitialized) {
      return true;
    }

    try {
      // 设置用户隐私配置
      await _setPrivacyConfig(config);

      // 设置广告配置
      await _setAdConfig(config);

      // 初始化SDK
      final result = await _channel.invokeMethod('initializeWithConfig', config.toMap());

      _isInitialized = result as bool;

      if (_isInitialized) {
        await _postInitSetup(config);
        _notifyInitSuccess();
      } else {
        _notifyInitError('SDK initialization failed');
      }

      return _isInitialized;
    } on PlatformException catch (e) {
      _notifyInitError(e.message ?? 'Unknown error');
      return false;
    }
  }

  // 设置隐私配置
  static Future<void> _setPrivacyConfig(PangleSDKConfig config) async {
    await _channel.invokeMethod('setPrivacyConfig', {
      'enablePersonalizedAd': config.enablePersonalizedAd ?? true,
    });
  }

  // 设置广告配置
  static Future<void> _setAdConfig(PangleSDKConfig config) async {
    await _channel.invokeMethod('setAdConfig', {
      'allowModifyAudioSession': config.allowModifyAudioSession ?? true,
      'supportDeepLink': config.supportDeepLink ?? true,
    });
  }

  // 初始化后设置
  static Future<void> _postInitSetup(PangleSDKConfig config) async {
    // 设置用户信息
    await _setUserInfo();

    // 设置应用信息
    await _setAppInfo();
  }

  // 设置用户信息
  static Future<void> _setUserInfo() async {
    try {
      final deviceInfo = await DeviceInfoPlugin().androidInfo;
      final packageInfo = await PackageInfo.fromPlatform();

      await _channel.invokeMethod('setUserInfo', {
        'userId': await _getUserId(),
        'deviceBrand': deviceInfo.brand,
        'deviceModel': deviceInfo.model,
        'osVersion': deviceInfo.version.release,
        'appVersion': packageInfo.version,
        'appName': packageInfo.appName,
      });
    } catch (e) {
      print('Error setting user info: $e');
    }
  }

  // 获取用户ID
  static Future<String> _getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    String? userId = prefs.getString('pangle_user_id');

    if (userId == null) {
      userId = 'user_${DateTime.now().millisecondsSinceEpoch}';
      await prefs.setString('pangle_user_id', userId);
    }

    return userId;
  }

  // 设置应用信息
  static Future<void> _setAppInfo() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();

      await _channel.invokeMethod('setAppInfo', {
        'appName': packageInfo.appName,
        'packageName': packageInfo.packageName,
        'version': packageInfo.version,
        'buildNumber': packageInfo.buildNumber,
      });
    } catch (e) {
      print('Error setting app info: $e');
    }
  }
}
```

## 广告类型集成

### 1. 开屏广告

```dart
// 开屏广告管理器
class PangleSplashAd {
  static const MethodChannel _channel = MethodChannel('pangle_splash_ad');
  static PangleSplashAdListener? _listener;

  // 广告配置
  final String adUnitId;
  final int timeout;
  final bool? isExpress;

  PangleSplashAd({
    required this.adUnitId,
    this.timeout = 3500,
    this.isExpress,
  });

  // 加载并展示开屏广告
  static Future<bool> loadAndShowSplashAd({
    required String adUnitId,
    int timeout = 3500,
    bool? isExpress,
    PangleSplashAdListener? listener,
  }) async {
    _listener = listener;

    try {
      final result = await _channel.invokeMethod('loadAndShowSplashAd', {
        'adUnitId': adUnitId,
        'timeout': timeout,
        'isExpress': isExpress ?? false,
      });

      return result as bool;
    } on PlatformException catch (e) {
      _listener?.onAdError(e.code, e.message ?? 'Unknown error');
      return false;
    }
  }

  // 设置方法调用处理器
  static void setMethodCallHandler() {
    _channel.setMethodCallHandler(_handleMethodCall);
  }

  // 处理方法调用
  static Future<dynamic> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onAdLoaded':
        _listener?.onAdLoaded();
        break;
      case 'onAdShow':
        _listener?.onAdShow();
        break;
      case 'onAdClick':
        _listener?.onAdClick();
        break;
      case 'onAdDismiss':
        _listener?.onAdDismiss();
        break;
      case 'onAdError':
        final arguments = call.arguments as Map<String, dynamic>;
        _listener?.onAdError(
          arguments['code'] as String,
          arguments['message'] as String,
        );
        break;
    }
  }
}

// 开屏广告监听器
abstract class PangleSplashAdListener {
  void onAdLoaded();
  void onAdShow();
  void onAdClick();
  void onAdDismiss();
  void onAdError(String code, String message);
}
```

### 2. 激励视频广告

```dart
// 激励视频广告管理器
class PangleRewardVideoAd {
  static const MethodChannel _channel = MethodChannel('pangle_reward_video_ad');
  static PangleRewardVideoAdListener? _listener;

  // 加载激励视频广告
  static Future<bool> loadRewardVideoAd({
    required String adUnitId,
    String? userId,
    String? extraData,
    PangleRewardVideoAdListener? listener,
  }) async {
    _listener = listener;

    try {
      final result = await _channel.invokeMethod('loadRewardVideoAd', {
        'adUnitId': adUnitId,
        'userId': userId,
        'extraData': extraData,
      });

      return result as bool;
    } on PlatformException catch (e) {
      _listener?.onAdError(e.code, e.message ?? 'Unknown error');
      return false;
    }
  }

  // 展示激励视频广告
  static Future<bool> showRewardVideoAd() async {
    try {
      final result = await _channel.invokeMethod('showRewardVideoAd');
      return result as bool;
    } on PlatformException catch (e) {
      _listener?.onAdError(e.code, e.message ?? 'Unknown error');
      return false;
    }
  }

  // 设置方法调用处理器
  static void setMethodCallHandler() {
    _channel.setMethodCallHandler(_handleMethodCall);
  }

  // 处理方法调用
  static Future<dynamic> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onAdLoaded':
        _listener?.onAdLoaded();
        break;
      case 'onAdShow':
        _listener?.onAdShow();
        break;
      case 'onAdClick':
        _listener?.onAdClick();
        break;
      case 'onAdClose':
        _listener?.onAdClose();
        break;
      case 'onAdComplete':
        _listener?.onAdComplete();
        break;
      case 'onAdReward':
        final arguments = call.arguments as Map<String, dynamic>;
        _listener?.onAdReward(
          arguments['rewardName'] as String,
          arguments['rewardAmount'] as int,
        );
        break;
      case 'onAdError':
        final arguments = call.arguments as Map<String, dynamic>;
        _listener?.onAdError(
          arguments['code'] as String,
          arguments['message'] as String,
        );
        break;
    }
  }
}

// 激励视频广告监听器
abstract class PangleRewardVideoAdListener {
  void onAdLoaded();
  void onAdShow();
  void onAdClick();
  void onAdClose();
  void onAdComplete();
  void onAdReward(String rewardName, int rewardAmount);
  void onAdError(String code, String message);
}
```

### 3. Banner 广告

```dart
// Banner广告管理器
class PangleBannerAd {
  static const MethodChannel _channel = MethodChannel('pangle_banner_ad');
  static final Map<String, PangleBannerAdListener> _listeners = {};

  // 创建Banner广告视图
  static Widget createBannerAd({
    required String adUnitId,
    required int width,
    required int height,
    PangleBannerAdListener? listener,
    bool? isExpress,
    Map<String, dynamic>? expressSize,
  }) {
    final adId = 'banner_${DateTime.now().millisecondsSinceEpoch}';

    if (listener != null) {
      _listeners[adId] = listener;
    }

    return PlatformViewLink(
      viewType: 'pangle_banner_ad',
      creationParams: {
        'adUnitId': adUnitId,
        'width': width,
        'height': height,
        'adId': adId,
        'isExpress': isExpress ?? false,
        'expressSize': expressSize,
      },
      creationParamsCodec: const StandardMessageCodec(),
    );
  }

  // 销毁Banner广告
  static Future<void> disposeBannerAd(String adId) async {
    _listeners.remove(adId);

    try {
      await _channel.invokeMethod('disposeBannerAd', {'adId': adId});
    } on PlatformException catch (e) {
      print('Error disposing banner ad: $e');
    }
  }

  // 设置方法调用处理器
  static void setMethodCallHandler() {
    _channel.setMethodCallHandler(_handleMethodCall);
  }

  // 处理方法调用
  static Future<dynamic> _handleMethodCall(MethodCall call) async {
    final arguments = call.arguments as Map<String, dynamic>;
    final adId = arguments['adId'] as String;
    final listener = _listeners[adId];

    if (listener == null) return;

    switch (call.method) {
      case 'onAdLoaded':
        listener.onAdLoaded();
        break;
      case 'onAdShow':
        listener.onAdShow();
        break;
      case 'onAdClick':
        listener.onAdClick();
        break;
      case 'onAdError':
        listener.onAdError(
          arguments['code'] as String,
          arguments['message'] as String,
        );
        break;
    }
  }
}

// Banner广告监听器
abstract class PangleBannerAdListener {
  void onAdLoaded();
  void onAdShow();
  void onAdClick();
  void onAdError(String code, String message);
}
```

### 4. 插屏广告

```dart
// 插屏广告管理器
class PangleInterstitialAd {
  static const MethodChannel _channel = MethodChannel('pangle_interstitial_ad');
  static PangleInterstitialAdListener? _listener;

  // 加载插屏广告
  static Future<bool> loadInterstitialAd({
    required String adUnitId,
    PangleInterstitialAdListener? listener,
  }) async {
    _listener = listener;

    try {
      final result = await _channel.invokeMethod('loadInterstitialAd', {
        'adUnitId': adUnitId,
      });

      return result as bool;
    } on PlatformException catch (e) {
      _listener?.onAdError(e.code, e.message ?? 'Unknown error');
      return false;
    }
  }

  // 展示插屏广告
  static Future<bool> showInterstitialAd() async {
    try {
      final result = await _channel.invokeMethod('showInterstitialAd');
      return result as bool;
    } on PlatformException catch (e) {
      _listener?.onAdError(e.code, e.message ?? 'Unknown error');
      return false;
    }
  }

  // 检查插屏广告是否已加载
  static Future<bool> isInterstitialAdLoaded() async {
    try {
      final result = await _channel.invokeMethod('isInterstitialAdLoaded');
      return result as bool;
    } on PlatformException catch (e) {
      print('Error checking interstitial ad status: $e');
      return false;
    }
  }

  // 设置方法调用处理器
  static void setMethodCallHandler() {
    _channel.setMethodCallHandler(_handleMethodCall);
  }

  // 处理方法调用
  static Future<dynamic> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onAdLoaded':
        _listener?.onAdLoaded();
        break;
      case 'onAdShow':
        _listener?.onAdShow();
        break;
      case 'onAdClick':
        _listener?.onAdClick();
        break;
      case 'onAdClose':
        _listener?.onAdClose();
        break;
      case 'onAdError':
        final arguments = call.arguments as Map<String, dynamic>;
        _listener?.onAdError(
          arguments['code'] as String,
          arguments['message'] as String,
        );
        break;
    }
  }
}

// 插屏广告监听器
abstract class PangleInterstitialAdListener {
  void onAdLoaded();
  void onAdShow();
  void onAdClick();
  void onAdClose();
  void onAdError(String code, String message);
}
```

## 收益统计

### 1. 广告收益管理

```dart
// 广告收益管理器
class PangleRevenueManager {
  static const MethodChannel _channel = MethodChannel('pangle_revenue');
  static final List<RevenueRecord> _revenueRecords = [];
  static final List<RevenueListener> _listeners = [];

  // 收益记录
  static class RevenueRecord {
    final String adUnitId;
    final String adType;
    final double revenue;
    final String currency;
    final DateTime timestamp;
    final Map<String, dynamic>? metadata;

    RevenueRecord({
      required this.adUnitId,
      required this.adType,
      required this.revenue,
      required this.currency,
      required this.timestamp,
      this.metadata,
    });

    Map<String, dynamic> toMap() {
      return {
        'adUnitId': adUnitId,
        'adType': adType,
        'revenue': revenue,
        'currency': currency,
        'timestamp': timestamp.millisecondsSinceEpoch,
        'metadata': metadata ?? {},
      };
    }

    factory RevenueRecord.fromMap(Map<String, dynamic> map) {
      return RevenueRecord(
        adUnitId: map['adUnitId'] as String,
        adType: map['adType'] as String,
        revenue: map['revenue'] as double,
        currency: map['currency'] as String,
        timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] as int),
        metadata: map['metadata'] as Map<String, dynamic>?,
      );
    }
  }

  // 记录广告收益
  static Future<void> recordRevenue(RevenueRecord record) async {
    try {
      await _channel.invokeMethod('recordRevenue', record.toMap());

      _revenueRecords.add(record);
      _notifyRevenueRecorded(record);

      // 保存到本地存储
      await _saveRevenueRecord(record);
    } on PlatformException catch (e) {
      print('Error recording revenue: $e');
    }
  }

  // 获取今日收益
  static Future<double> getTodayRevenue() async {
    try {
      final result = await _channel.invokeMethod('getTodayRevenue');
      return result as double;
    } on PlatformException catch (e) {
      print('Error getting today revenue: $e');
      return 0.0;
    }
  }

  // 获取总收益
  static Future<double> getTotalRevenue() async {
    try {
      final result = await _channel.invokeMethod('getTotalRevenue');
      return result as double;
    } on PlatformException catch (e) {
      print('Error getting total revenue: $e');
      return 0.0;
    }
  }

  // 获取收益历史
  static Future<List<RevenueRecord>> getRevenueHistory({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final result = await _channel.invokeMethod('getRevenueHistory', {
        'startDate': startDate?.millisecondsSinceEpoch,
        'endDate': endDate?.millisecondsSinceEpoch,
      });

      final list = result as List<dynamic>;
      return list.map((item) => RevenueRecord.fromMap(item as Map<String, dynamic>)).toList();
    } on PlatformException catch (e) {
      print('Error getting revenue history: $e');
      return [];
    }
  }

  // 获取收益统计
  static Future<Map<String, dynamic>> getRevenueStats() async {
    try {
      final result = await _channel.invokeMethod('getRevenueStats');
      return Map<String, dynamic>.from(result as Map);
    } on PlatformException catch (e) {
      print('Error getting revenue stats: $e');
      return {};
    }
  }

  // 保存收益记录到本地
  static Future<void> _saveRevenueRecord(RevenueRecord record) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recordsJson = prefs.getStringList('pangle_revenue_records') ?? [];
      recordsJson.add(json.encode(record.toMap()));
      await prefs.setStringList('pangle_revenue_records', recordsJson);
    } catch (e) {
      print('Error saving revenue record: $e');
    }
  }

  // 添加收益监听器
  static void addRevenueListener(RevenueListener listener) {
    _listeners.add(listener);
  }

  // 移除收益监听器
  static void removeRevenueListener(RevenueListener listener) {
    _listeners.remove(listener);
  }

  // 通知收益记录
  static void _notifyRevenueRecorded(RevenueRecord record) {
    for (final listener in _listeners) {
      listener.onRevenueRecorded(record);
    }
  }
}

// 收益监听器
abstract class RevenueListener {
  void onRevenueRecorded(PangleRevenueManager.RevenueRecord record);
  void onRevenueUpdated(double todayRevenue, double totalRevenue);
}
```

### 2. 收益分析

```dart
// 收益分析器
class PangleRevenueAnalyzer {
  // 分析收益趋势
  static Future<RevenueTrend> analyzeRevenueTrend({
    required int days,
  }) async {
    final endDate = DateTime.now();
    final startDate = endDate.subtract(Duration(days: days));

    final records = await PangleRevenueManager.getRevenueHistory(
      startDate: startDate,
      endDate: endDate,
    );

    return _calculateTrend(records);
  }

  // 计算收益趋势
  static RevenueTrend _calculateTrend(List<PangleRevenueManager.RevenueRecord> records) {
    if (records.isEmpty) {
      return RevenueTrend(
        trend: TrendType.stable,
        changePercentage: 0.0,
        averageDailyRevenue: 0.0,
      );
    }

    // 按日期分组
    final dailyRevenue = <DateTime, double>{};
    for (final record in records) {
      final date = DateTime(
        record.timestamp.year,
        record.timestamp.month,
        record.timestamp.day,
      );
      dailyRevenue[date] = (dailyRevenue[date] ?? 0.0) + record.revenue;
    }

    // 计算趋势
    final sortedDates = dailyRevenue.keys.toList()..sort();
    if (sortedDates.length < 2) {
      return RevenueTrend(
        trend: TrendType.stable,
        changePercentage: 0.0,
        averageDailyRevenue: dailyRevenue.values.reduce((a, b) => a + b) / dailyRevenue.length,
      );
    }

    final firstHalf = sortedDates.take(sortedDates.length ~/ 2);
    final secondHalf = sortedDates.skip(sortedDates.length ~/ 2);

    final firstHalfAvg = firstHalf.map((date) => dailyRevenue[date]!).reduce((a, b) => a + b) / firstHalf.length;
    final secondHalfAvg = secondHalf.map((date) => dailyRevenue[date]!).reduce((a, b) => a + b) / secondHalf.length;

    final changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    final trend = _determineTrendType(changePercentage);
    final averageDailyRevenue = dailyRevenue.values.reduce((a, b) => a + b) / dailyRevenue.length;

    return RevenueTrend(
      trend: trend,
      changePercentage: changePercentage,
      averageDailyRevenue: averageDailyRevenue,
    );
  }

  // 确定趋势类型
  static TrendType _determineTrendType(double changePercentage) {
    if (changePercentage > 5.0) {
      return TrendType.increasing;
    } else if (changePercentage < -5.0) {
      return TrendType.decreasing;
    } else {
      return TrendType.stable;
    }
  }

  // 分析广告类型收益
  static Future<Map<String, double>> analyzeAdTypeRevenue() async {
    final records = await PangleRevenueManager.getRevenueHistory();
    final adTypeRevenue = <String, double>{};

    for (final record in records) {
      adTypeRevenue[record.adType] = (adTypeRevenue[record.adType] ?? 0.0) + record.revenue;
    }

    return adTypeRevenue;
  }

  // 分析最佳广告位
  static Future<List<AdUnitPerformance>> analyzeAdUnitPerformance() async {
    final records = await PangleRevenueManager.getRevenueHistory();
    final adUnitStats = <String, AdUnitPerformance>{};

    for (final record in records) {
      final stats = adUnitStats.putIfAbsent(
        record.adUnitId,
        () => AdUnitPerformance(
          adUnitId: record.adUnitId,
          adType: record.adType,
          totalRevenue: 0.0,
          impressionCount: 0,
          averageRevenue: 0.0,
        ),
      );

      stats.totalRevenue += record.revenue;
      stats.impressionCount++;
    }

    // 计算平均收益
    for (final stats in adUnitStats.values) {
      stats.averageRevenue = stats.totalRevenue / stats.impressionCount;
    }

    // 按总收益排序
    final sortedStats = adUnitStats.values.toList()
      ..sort((a, b) => b.totalRevenue.compareTo(a.totalRevenue));

    return sortedStats;
  }
}

// 收益趋势
class RevenueTrend {
  final TrendType trend;
  final double changePercentage;
  final double averageDailyRevenue;

  RevenueTrend({
    required this.trend,
    required this.changePercentage,
    required this.averageDailyRevenue,
  });
}

// 趋势类型
enum TrendType {
  increasing,
  decreasing,
  stable,
}

// 广告位性能
class AdUnitPerformance {
  final String adUnitId;
  final String adType;
  double totalRevenue;
  int impressionCount;
  double averageRevenue;

  AdUnitPerformance({
    required this.adUnitId,
    required this.adType,
    required this.totalRevenue,
    required this.impressionCount,
    required this.averageRevenue,
  });
}
```

## 用户数据分析

### 1. 用户行为分析

```dart
// 用户行为分析器
class PangleUserAnalyzer {
  static const MethodChannel _channel = MethodChannel('pangle_user_analyzer');
  static final List<UserBehaviorRecord> _behaviorRecords = [];

  // 用户行为记录
  static class UserBehaviorRecord {
    final String userId;
    final String eventType;
    final Map<String, dynamic> eventData;
    final DateTime timestamp;

    UserBehaviorRecord({
      required this.userId,
      required this.eventType,
      required this.eventData,
      required this.timestamp,
    });

    Map<String, dynamic> toMap() {
      return {
        'userId': userId,
        'eventType': eventType,
        'eventData': eventData,
        'timestamp': timestamp.millisecondsSinceEpoch,
      };
    }
  }

  // 记录用户行为
  static Future<void> recordUserBehavior(UserBehaviorRecord record) async {
    try {
      await _channel.invokeMethod('recordUserBehavior', record.toMap());

      _behaviorRecords.add(record);

      // 保存到本地存储
      await _saveBehaviorRecord(record);
    } on PlatformException catch (e) {
      print('Error recording user behavior: $e');
    }
  }

  // 记录广告展示
  static Future<void> recordAdImpression({
    required String userId,
    required String adUnitId,
    required String adType,
    Map<String, dynamic>? metadata,
  }) async {
    final record = UserBehaviorRecord(
      userId: userId,
      eventType: 'ad_impression',
      eventData: {
        'adUnitId': adUnitId,
        'adType': adType,
        'metadata': metadata ?? {},
      },
      timestamp: DateTime.now(),
    );

    await recordUserBehavior(record);
  }

  // 记录广告点击
  static Future<void> recordAdClick({
    required String userId,
    required String adUnitId,
    required String adType,
    Map<String, dynamic>? metadata,
  }) async {
    final record = UserBehaviorRecord(
      userId: userId,
      eventType: 'ad_click',
      eventData: {
        'adUnitId': adUnitId,
        'adType': adType,
        'metadata': metadata ?? {},
      },
      timestamp: DateTime.now(),
    );

    await recordUserBehavior(record);
  }

  // 记录应用启动
  static Future<void> recordAppStart({
    required String userId,
    Map<String, dynamic>? metadata,
  }) async {
    final record = UserBehaviorRecord(
      userId: userId,
      eventType: 'app_start',
      eventData: {
        'metadata': metadata ?? {},
      },
      timestamp: DateTime.now(),
    );

    await recordUserBehavior(record);
  }

  // 记录页面访问
  static Future<void> recordPageView({
    required String userId,
    required String pageName,
    Map<String, dynamic>? metadata,
  }) async {
    final record = UserBehaviorRecord(
      userId: userId,
      eventType: 'page_view',
      eventData: {
        'pageName': pageName,
        'metadata': metadata ?? {},
      },
      timestamp: DateTime.now(),
    );

    await recordUserBehavior(record);
  }

  // 获取用户行为历史
  static Future<List<UserBehaviorRecord>> getUserBehaviorHistory({
    required String userId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final result = await _channel.invokeMethod('getUserBehaviorHistory', {
        'userId': userId,
        'startDate': startDate?.millisecondsSinceEpoch,
        'endDate': endDate?.millisecondsSinceEpoch,
      });

      final list = result as List<dynamic>;
      return list.map((item) => _behaviorRecordFromMap(item as Map<String, dynamic>)).toList();
    } on PlatformException catch (e) {
      print('Error getting user behavior history: $e');
      return [];
    }
  }

  // 分析用户活跃度
  static Future<UserActivityAnalysis> analyzeUserActivity({
    required String userId,
    required int days,
  }) async {
    final endDate = DateTime.now();
    final startDate = endDate.subtract(Duration(days: days));

    final records = await getUserBehaviorHistory(
      userId: userId,
      startDate: startDate,
      endDate: endDate,
    );

    return _calculateActivityAnalysis(records);
  }

  // 计算活跃度分析
  static UserActivityAnalysis _calculateActivityAnalysis(List<UserBehaviorRecord> records) {
    if (records.isEmpty) {
      return UserActivityAnalysis(
        totalSessions: 0,
        averageSessionDuration: 0.0,
        mostActiveHour: 0,
        adImpressions: 0,
        adClicks: 0,
        ctr: 0.0,
      );
    }

    // 统计各项指标
    int totalSessions = 0;
    int totalDuration = 0;
    final hourCounts = List<int>.filled(24, 0);
    int adImpressions = 0;
    int adClicks = 0;

    for (final record in records) {
      final hour = record.timestamp.hour;
      hourCounts[hour]++;

      switch (record.eventType) {
        case 'app_start':
          totalSessions++;
          break;
        case 'app_end':
          // 计算会话时长
          break;
        case 'ad_impression':
          adImpressions++;
          break;
        case 'ad_click':
          adClicks++;
          break;
      }
    }

    // 找出最活跃小时
    int mostActiveHour = 0;
    int maxCount = hourCounts[0];
    for (int i = 1; i < 24; i++) {
      if (hourCounts[i] > maxCount) {
        maxCount = hourCounts[i];
        mostActiveHour = i;
      }
    }

    // 计算平均会话时长和CTR
    final averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0.0;
    final ctr = adImpressions > 0 ? (adClicks / adImpressions) * 100 : 0.0;

    return UserActivityAnalysis(
      totalSessions: totalSessions,
      averageSessionDuration: averageSessionDuration,
      mostActiveHour: mostActiveHour,
      adImpressions: adImpressions,
      adClicks: adClicks,
      ctr: ctr,
    );
  }

  // 从Map创建行为记录
  static UserBehaviorRecord _behaviorRecordFromMap(Map<String, dynamic> map) {
    return UserBehaviorRecord(
      userId: map['userId'] as String,
      eventType: map['eventType'] as String,
      eventData: Map<String, dynamic>.from(map['eventData'] as Map),
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] as int),
    );
  }

  // 保存行为记录到本地
  static Future<void> _saveBehaviorRecord(UserBehaviorRecord record) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recordsJson = prefs.getStringList('pangle_behavior_records') ?? [];
      recordsJson.add(json.encode(record.toMap()));
      await prefs.setStringList('pangle_behavior_records', recordsJson);
    } catch (e) {
      print('Error saving behavior record: $e');
    }
  }
}

// 用户活跃度分析
class UserActivityAnalysis {
  final int totalSessions;
  final double averageSessionDuration;
  final int mostActiveHour;
  final int adImpressions;
  final int adClicks;
  final double ctr;

  UserActivityAnalysis({
    required this.totalSessions,
    required this.averageSessionDuration,
    required this.mostActiveHour,
    required this.adImpressions,
    required this.adClicks,
    required this.ctr,
  });
}
```

### 2. 广告效果分析

```dart
// 广告效果分析器
class PangleAdEffectAnalyzer {
  static const MethodChannel _channel = MethodChannel('pangle_ad_effect_analyzer');

  // 分析广告效果
  static Future<AdEffectAnalysis> analyzeAdEffect({
    required String adUnitId,
    required int days,
  }) async {
    try {
      final result = await _channel.invokeMethod('analyzeAdEffect', {
        'adUnitId': adUnitId,
        'days': days,
      });

      final data = Map<String, dynamic>.from(result as Map);
      return AdEffectAnalysis.fromMap(data);
    } on PlatformException catch (e) {
      print('Error analyzing ad effect: $e');
      return AdEffectAnalysis.empty();
    }
  }

  // 分析用户群体
  static Future<UserGroupAnalysis> analyzeUserGroup({
    required String adUnitId,
    required int days,
  }) async {
    try {
      final result = await _channel.invokeMethod('analyzeUserGroup', {
        'adUnitId': adUnitId,
        'days': days,
      });

      final data = Map<String, dynamic>.from(result as Map);
      return UserGroupAnalysis.fromMap(data);
    } on PlatformException catch (e) {
      print('Error analyzing user group: $e');
      return UserGroupAnalysis.empty();
    }
  }

  // 获取广告优化建议
  static Future<List<OptimizationSuggestion>> getOptimizationSuggestions({
    required String adUnitId,
  }) async {
    try {
      final result = await _channel.invokeMethod('getOptimizationSuggestions', {
        'adUnitId': adUnitId,
      });

      final list = result as List<dynamic>;
      return list.map((item) => OptimizationSuggestion.fromMap(item as Map<String, dynamic>)).toList();
    } on PlatformException catch (e) {
      print('Error getting optimization suggestions: $e');
      return [];
    }
  }
}

// 广告效果分析
class AdEffectAnalysis {
  final String adUnitId;
  final int impressions;
  final int clicks;
  final double ctr;
  final double revenue;
  final double ecpm;
  final Map<String, dynamic> demographics;
  final Map<String, double> hourlyPerformance;

  AdEffectAnalysis({
    required this.adUnitId,
    required this.impressions,
    required this.clicks,
    required this.ctr,
    required this.revenue,
    required this.ecpm,
    required this.demographics,
    required this.hourlyPerformance,
  });

  factory AdEffectAnalysis.fromMap(Map<String, dynamic> map) {
    return AdEffectAnalysis(
      adUnitId: map['adUnitId'] as String,
      impressions: map['impressions'] as int,
      clicks: map['clicks'] as int,
      ctr: map['ctr'] as double,
      revenue: map['revenue'] as double,
      ecpm: map['ecpm'] as double,
      demographics: Map<String, dynamic>.from(map['demographics'] as Map),
      hourlyPerformance: Map<String, double>.from(map['hourlyPerformance'] as Map),
    );
  }

  factory AdEffectAnalysis.empty() {
    return AdEffectAnalysis(
      adUnitId: '',
      impressions: 0,
      clicks: 0,
      ctr: 0.0,
      revenue: 0.0,
      ecpm: 0.0,
      demographics: {},
      hourlyPerformance: {},
    );
  }
}

// 用户群体分析
class UserGroupAnalysis {
  final Map<String, int> ageGroups;
  final Map<String, int> genderGroups;
  final Map<String, int> regionGroups;
  final Map<String, int> interestGroups;

  UserGroupAnalysis({
    required this.ageGroups,
    required this.genderGroups,
    required this.regionGroups,
    required this.interestGroups,
  });

  factory UserGroupAnalysis.fromMap(Map<String, dynamic> map) {
    return UserGroupAnalysis(
      ageGroups: Map<String, int>.from(map['ageGroups'] as Map),
      genderGroups: Map<String, int>.from(map['genderGroups'] as Map),
      regionGroups: Map<String, int>.from(map['regionGroups'] as Map),
      interestGroups: Map<String, int>.from(map['interestGroups'] as Map),
    );
  }

  factory UserGroupAnalysis.empty() {
    return UserGroupAnalysis(
      ageGroups: {},
      genderGroups: {},
      regionGroups: {},
      interestGroups: {},
    );
  }
}

// 优化建议
class OptimizationSuggestion {
  final String type;
  final String title;
  final String description;
  final double potentialImprovement;
  final Map<String, dynamic> actionItems;

  OptimizationSuggestion({
    required this.type,
    required this.title,
    required this.description,
    required this.potentialImprovement,
    required this.actionItems,
  });

  factory OptimizationSuggestion.fromMap(Map<String, dynamic> map) {
    return OptimizationSuggestion(
      type: map['type'] as String,
      title: map['title'] as String,
      description: map['description'] as String,
      potentialImprovement: map['potentialImprovement'] as double,
      actionItems: Map<String, dynamic>.from(map['actionItems'] as Map),
    );
  }
}
```

## 最佳实践

### 1. 广告策略优化

- **广告位选择**：根据应用类型选择合适的广告位
- **展示频率控制**：避免过度展示影响用户体验
- **A/B 测试**：持续测试不同广告策略的效果
- **用户分层**：根据用户行为展示不同类型的广告

### 2. 收益优化

- **eCPM 监控**：实时监控千次展示收益
- **填充率优化**：提高广告填充率减少空白
- **用户价值分析**：识别高价值用户群体
- **时段优化**：根据用户活跃时间调整广告策略

### 3. 用户体验平衡

- **广告时机**：在合适的时机展示广告
- **内容相关**：展示与应用内容相关的广告
- **加载优化**：优化广告加载速度
- **错误处理**：完善广告加载失败的处理机制

## 总结

Flutter 集成穿山甲 SDK 桥接技术为开发者提供了完整的广告变现解决方案。通过掌握 SDK 初始化、广告类型集成、收益统计和用户数据分析等技术，开发者可以构建出收益最大化、用户体验良好的 Flutter 应用。

关键成功因素：

1. 合理的广告策略设计
2. 完善的错误处理机制
3. 持续的数据分析和优化
4. 良好的用户体验平衡
5. 遵循平台规范和政策

通过本文的学习，开发者应该能够充分利用穿山甲 SDK 的强大功能，构建出商业价值和技术质量兼备的 Flutter 应用。
