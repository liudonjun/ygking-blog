---
description: 本文详细介绍Flutter与第三方SDK桥接的最佳实践，包括SDK集成策略、API封装、错误处理、性能优化和跨平台兼容性等内容。
tag:
  - Flutter
  - 第三方SDK
  - 桥接
  - 最佳实践
  - 跨平台
sticky: 1
sidebar: true
---

# Flutter 与第三方 SDK 桥接最佳实践

## 概述

在 Flutter 应用中集成第三方 SDK 是常见需求，但不同平台的 SDK 实现差异和 API 复杂性给集成带来了挑战。本文将介绍 Flutter 与第三方 SDK 桥接的最佳实践，帮助开发者构建稳定、高效的跨平台解决方案。

## SDK 集成策略

### 1. 统一接口设计

```dart
// SDK统一接口抽象
abstract class ThirdPartySDKInterface {
  // 初始化SDK
  Future<void> initialize(Map<String, dynamic> config);

  // 检查SDK是否已初始化
  bool get isInitialized;

  // 获取SDK版本
  Future<String> getVersion();

  // 设置用户信息
  Future<void> setUserInfo(Map<String, dynamic> userInfo);

  // 清理资源
  Future<void> dispose();
}

// SDK工厂
class ThirdPartySDKFactory {
  static final Map<String, ThirdPartySDKInterface> _instances = {};

  // 获取SDK实例
  static T getSDK<T extends ThirdPartySDKInterface>(String sdkName) {
    final instance = _instances[sdkName];
    if (instance is T) {
      return instance;
    }
    throw StateError('SDK $sdkName not found or not of type $T');
  }

  // 注册SDK实例
  static void registerSDK(String sdkName, ThirdPartySDKInterface sdk) {
    _instances[sdkName] = sdk;
  }

  // 注销SDK实例
  static void unregisterSDK(String sdkName) {
    final sdk = _instances.remove(sdkName);
    sdk?.dispose();
  }

  // 获取所有已注册的SDK
  static List<String> getRegisteredSDKs() {
    return _instances.keys.toList();
  }

  // 清理所有SDK
  static Future<void> disposeAll() async {
    for (final sdk in _instances.values) {
      await sdk.dispose();
    }
    _instances.clear();
  }
}
```

### 2. 平台特定实现

```dart
// Android平台SDK实现
class AndroidSDKImplementation extends ThirdPartySDKInterface {
  static const MethodChannel _channel = MethodChannel('third_party_sdk_android');
  bool _isInitialized = false;

  @override
  Future<void> initialize(Map<String, dynamic> config) async {
    try {
      await _channel.invokeMethod('initialize', config);
      _isInitialized = true;
    } on PlatformException catch (e) {
      throw SDKException(
        code: e.code,
        message: e.message ?? 'Unknown error',
        platform: 'Android',
      );
    }
  }

  @override
  bool get isInitialized => _isInitialized;

  @override
  Future<String> getVersion() async {
    try {
      final version = await _channel.invokeMethod<String>('getVersion');
      return version ?? 'Unknown';
    } on PlatformException catch (e) {
      throw SDKException(
        code: e.code,
        message: e.message ?? 'Failed to get version',
        platform: 'Android',
      );
    }
  }

  @override
  Future<void> setUserInfo(Map<String, dynamic> userInfo) async {
    try {
      await _channel.invokeMethod('setUserInfo', userInfo);
    } on PlatformException catch (e) {
      throw SDKException(
        code: e.code,
        message: e.message ?? 'Failed to set user info',
        platform: 'Android',
      );
    }
  }

  @override
  Future<void> dispose() async {
    if (_isInitialized) {
      try {
        await _channel.invokeMethod('dispose');
        _isInitialized = false;
      } on PlatformException catch (e) {
        // 记录错误但不抛出异常
        print('Error disposing Android SDK: ${e.message}');
      }
    }
  }
}

// iOS平台SDK实现
class iOSSDKImplementation extends ThirdPartySDKInterface {
  static const MethodChannel _channel = MethodChannel('third_party_sdk_ios');
  bool _isInitialized = false;

  @override
  Future<void> initialize(Map<String, dynamic> config) async {
    try {
      await _channel.invokeMethod('initialize', config);
      _isInitialized = true;
    } on PlatformException catch (e) {
      throw SDKException(
        code: e.code,
        message: e.message ?? 'Unknown error',
        platform: 'iOS',
      );
    }
  }

  @override
  bool get isInitialized => _isInitialized;

  @override
  Future<String> getVersion() async {
    try {
      final version = await _channel.invokeMethod<String>('getVersion');
      return version ?? 'Unknown';
    } on PlatformException catch (e) {
      throw SDKException(
        code: e.code,
        message: e.message ?? 'Failed to get version',
        platform: 'iOS',
      );
    }
  }

  @override
  Future<void> setUserInfo(Map<String, dynamic> userInfo) async {
    try {
      await _channel.invokeMethod('setUserInfo', userInfo);
    } on PlatformException catch (e) {
      throw SDKException(
        code: e.code,
        message: e.message ?? 'Failed to set user info',
        platform: 'iOS',
      );
    }
  }

  @override
  Future<void> dispose() async {
    if (_isInitialized) {
      try {
        await _channel.invokeMethod('dispose');
        _isInitialized = false;
      } on PlatformException catch (e) {
        // 记录错误但不抛出异常
        print('Error disposing iOS SDK: ${e.message}');
      }
    }
  }
}

// Web平台SDK实现
class WebSDKImplementation extends ThirdPartySDKInterface {
  bool _isInitialized = false;

  @override
  Future<void> initialize(Map<String, dynamic> config) async {
    try {
      // 使用JavaScript互操作初始化Web SDK
      await _initializeWebSDK(config);
      _isInitialized = true;
    } catch (e) {
      throw SDKException(
        code: 'WEB_INIT_ERROR',
        message: e.toString(),
        platform: 'Web',
      );
    }
  }

  @override
  bool get isInitialized => _isInitialized;

  @override
  Future<String> getVersion() async {
    try {
      final version = await _getWebSDKVersion();
      return version;
    } catch (e) {
      throw SDKException(
        code: 'WEB_VERSION_ERROR',
        message: e.toString(),
        platform: 'Web',
      );
    }
  }

  @override
  Future<void> setUserInfo(Map<String, dynamic> userInfo) async {
    try {
      await _setWebSDKUserInfo(userInfo);
    } catch (e) {
      throw SDKException(
        code: 'WEB_USER_INFO_ERROR',
        message: e.toString(),
        platform: 'Web',
      );
    }
  }

  @override
  Future<void> dispose() async {
    if (_isInitialized) {
      try {
        await _disposeWebSDK();
        _isInitialized = false;
      } catch (e) {
        // 记录错误但不抛出异常
        print('Error disposing Web SDK: $e');
      }
    }
  }

  // Web SDK特定方法
  Future<void> _initializeWebSDK(Map<String, dynamic> config) async {
    // 实现Web SDK初始化逻辑
  }

  Future<String> _getWebSDKVersion() async {
    // 实现获取Web SDK版本逻辑
    return '1.0.0';
  }

  Future<void> _setWebSDKUserInfo(Map<String, dynamic> userInfo) async {
    // 实现设置Web SDK用户信息逻辑
  }

  Future<void> _disposeWebSDK() async {
    // 实现Web SDK清理逻辑
  }
}
```

## API 封装设计

### 1. 功能模块封装

```dart
// 分析SDK功能模块封装
class AnalyticsSDKModule {
  final ThirdPartySDKInterface _sdk;

  AnalyticsSDKModule(this._sdk);

  // 跟踪事件
  Future<void> trackEvent(String eventName, {Map<String, dynamic>? parameters}) async {
    if (!_sdk.isInitialized) {
      throw SDKException(
        code: 'SDK_NOT_INITIALIZED',
        message: 'SDK must be initialized before tracking events',
        platform: Platform.operatingSystem,
      );
    }

    try {
      await _trackEventOnPlatform(eventName, parameters);
    } catch (e) {
      throw SDKException(
        code: 'EVENT_TRACKING_ERROR',
        message: 'Failed to track event: $e',
        platform: Platform.operatingSystem,
      );
    }
  }

  // 跟踪屏幕视图
  Future<void> trackScreenView(String screenName, {Map<String, dynamic>? parameters}) async {
    if (!_sdk.isInitialized) {
      throw SDKException(
        code: 'SDK_NOT_INITIALIZED',
        message: 'SDK must be initialized before tracking screen views',
        platform: Platform.operatingSystem,
      );
    }

    try {
      await _trackScreenViewOnPlatform(screenName, parameters);
    } catch (e) {
      throw SDKException(
        code: 'SCREEN_TRACKING_ERROR',
        message: 'Failed to track screen view: $e',
        platform: Platform.operatingSystem,
      );
    }
  }

  // 设置用户属性
  Future<void> setUserProperty(String name, dynamic value) async {
    if (!_sdk.isInitialized) {
      throw SDKException(
        code: 'SDK_NOT_INITIALIZED',
        message: 'SDK must be initialized before setting user properties',
        platform: Platform.operatingSystem,
      );
    }

    try {
      await _setUserPropertyOnPlatform(name, value);
    } catch (e) {
      throw SDKException(
        code: 'USER_PROPERTY_ERROR',
        message: 'Failed to set user property: $e',
        platform: Platform.operatingSystem,
      );
    }
  }

  // 平台特定实现
  Future<void> _trackEventOnPlatform(String eventName, Map<String, dynamic>? parameters) async {
    if (Platform.isAndroid) {
      final androidSDK = _sdk as AndroidSDKImplementation;
      await androidSDK._channel.invokeMethod('trackEvent', {
        'eventName': eventName,
        'parameters': parameters ?? {},
      });
    } else if (Platform.isIOS) {
      final iosSDK = _sdk as iOSSDKImplementation;
      await iosSDK._channel.invokeMethod('trackEvent', {
        'eventName': eventName,
        'parameters': parameters ?? {},
      });
    } else if (Platform.isWindows || Platform.isMacOS || Platform.isLinux) {
      // 桌面平台实现
      await _trackEventOnDesktop(eventName, parameters);
    } else if (kIsWeb) {
      final webSDK = _sdk as WebSDKImplementation;
      await webSDK._trackWebEvent(eventName, parameters);
    }
  }

  Future<void> _trackScreenViewOnPlatform(String screenName, Map<String, dynamic>? parameters) async {
    // 类似的事件跟踪实现
  }

  Future<void> _setUserPropertyOnPlatform(String name, dynamic value) async {
    // 类似的用户属性设置实现
  }

  Future<void> _trackEventOnDesktop(String eventName, Map<String, dynamic>? parameters) async {
    // 桌面平台特定实现
  }
}

// 推送SDK功能模块封装
class PushSDKModule {
  final ThirdPartySDKInterface _sdk;
  final StreamController<PushMessage> _messageController = StreamController.broadcast();

  PushSDKModule(this._sdk) {
    _initializePushListener();
  }

  // 获取推送消息流
  Stream<PushMessage> get messageStream => _messageController.stream;

  // 请求推送权限
  Future<bool> requestPermission() async {
    if (!_sdk.isInitialized) {
      throw SDKException(
        code: 'SDK_NOT_INITIALIZED',
        message: 'SDK must be initialized before requesting push permission',
        platform: Platform.operatingSystem,
      );
    }

    try {
      return await _requestPermissionOnPlatform();
    } catch (e) {
      throw SDKException(
        code: 'PERMISSION_REQUEST_ERROR',
        message: 'Failed to request push permission: $e',
        platform: Platform.operatingSystem,
      );
    }
  }

  // 获取设备令牌
  Future<String?> getDeviceToken() async {
    if (!_sdk.isInitialized) {
      throw SDKException(
        code: 'SDK_NOT_INITIALIZED',
        message: 'SDK must be initialized before getting device token',
        platform: Platform.operatingSystem,
      );
    }

    try {
      return await _getDeviceTokenOnPlatform();
    } catch (e) {
      throw SDKException(
        code: 'DEVICE_TOKEN_ERROR',
        message: 'Failed to get device token: $e',
        platform: Platform.operatingSystem,
      );
    }
  }

  // 订阅主题
  Future<void> subscribeToTopic(String topic) async {
    if (!_sdk.isInitialized) {
      throw SDKException(
        code: 'SDK_NOT_INITIALIZED',
        message: 'SDK must be initialized before subscribing to topic',
        platform: Platform.operatingSystem,
      );
    }

    try {
      await _subscribeToTopicOnPlatform(topic);
    } catch (e) {
      throw SDKException(
        code: 'TOPIC_SUBSCRIPTION_ERROR',
        message: 'Failed to subscribe to topic: $e',
        platform: Platform.operatingSystem,
      );
    }
  }

  // 初始化推送监听器
  void _initializePushListener() {
    if (Platform.isAndroid) {
      final androidSDK = _sdk as AndroidSDKImplementation;
      final eventChannel = EventChannel('third_party_sdk_android_push');
      eventChannel.receiveBroadcastStream().listen((event) {
        final message = PushMessage.fromMap(event);
        _messageController.add(message);
      });
    } else if (Platform.isIOS) {
      final iosSDK = _sdk as iOSSDKImplementation;
      final eventChannel = EventChannel('third_party_sdk_ios_push');
      eventChannel.receiveBroadcastStream().listen((event) {
        final message = PushMessage.fromMap(event);
        _messageController.add(message);
      });
    }
  }

  // 平台特定实现
  Future<bool> _requestPermissionOnPlatform() async {
    // 实现平台特定的权限请求逻辑
    return true;
  }

  Future<String?> _getDeviceTokenOnPlatform() async {
    // 实现平台特定的设备令牌获取逻辑
    return null;
  }

  Future<void> _subscribeToTopicOnPlatform(String topic) async {
    // 实现平台特定的主题订阅逻辑
  }

  // 清理资源
  void dispose() {
    _messageController.close();
  }
}

// 推送消息模型
class PushMessage {
  final String? title;
  final String? body;
  final Map<String, dynamic>? data;
  final String? messageId;

  PushMessage({
    this.title,
    this.body,
    this.data,
    this.messageId,
  });

  factory PushMessage.fromMap(Map<String, dynamic> map) {
    return PushMessage(
      title: map['title'],
      body: map['body'],
      data: map['data'],
      messageId: map['messageId'],
    );
  }
}
```

### 2. 配置管理

```dart
// SDK配置管理器
class SDKConfigManager {
  static final Map<String, Map<String, dynamic>> _configs = {};
  static final Map<String, ConfigValidator> _validators = {};

  // 注册配置验证器
  static void registerValidator(String sdkName, ConfigValidator validator) {
    _validators[sdkName] = validator;
  }

  // 设置SDK配置
  static void setConfig(String sdkName, Map<String, dynamic> config) {
    final validator = _validators[sdkName];
    if (validator != null) {
      final validationResult = validator.validate(config);
      if (!validationResult.isValid) {
        throw ConfigException(
          sdkName: sdkName,
          errors: validationResult.errors,
        );
      }
    }

    _configs[sdkName] = config;
  }

  // 获取SDK配置
  static Map<String, dynamic>? getConfig(String sdkName) {
    return _configs[sdkName];
  }

  // 获取配置项
  static T? getConfigItem<T>(String sdkName, String key) {
    final config = _configs[sdkName];
    return config?[key] as T?;
  }

  // 合并配置
  static Map<String, dynamic> mergeConfig(
    String sdkName,
    Map<String, dynamic> defaultConfig,
    Map<String, dynamic> userConfig,
  ) {
    final merged = Map<String, dynamic>.from(defaultConfig);
    merged.addAll(userConfig);

    final validator = _validators[sdkName];
    if (validator != null) {
      final validationResult = validator.validate(merged);
      if (!validationResult.isValid) {
        throw ConfigException(
          sdkName: sdkName,
          errors: validationResult.errors,
        );
      }
    }

    _configs[sdkName] = merged;
    return merged;
  }

  // 清理配置
  static void clearConfig(String sdkName) {
    _configs.remove(sdkName);
  }

  // 清理所有配置
  static void clearAllConfigs() {
    _configs.clear();
  }
}

// 配置验证器
abstract class ConfigValidator {
  ValidationResult validate(Map<String, dynamic> config);
}

// 验证结果
class ValidationResult {
  final bool isValid;
  final List<String> errors;

  ValidationResult(this.isValid, this.errors);

  factory ValidationResult.success() => ValidationResult(true, []);

  factory ValidationResult.failure(List<String> errors) => ValidationResult(false, errors);
}

// 配置异常
class ConfigException implements Exception {
  final String sdkName;
  final List<String> errors;

  ConfigException({
    required this.sdkName,
    required this.errors,
  });

  @override
  String toString() => 'ConfigException for $sdkName: ${errors.join(', ')}';
}

// 分析SDK配置验证器示例
class AnalyticsConfigValidator implements ConfigValidator {
  @override
  ValidationResult validate(Map<String, dynamic> config) {
    final errors = <String>[];

    // 验证必需字段
    if (!config.containsKey('apiKey') || config['apiKey'] == null) {
      errors.add('API key is required');
    }

    if (!config.containsKey('trackingId') || config['trackingId'] == null) {
      errors.add('Tracking ID is required');
    }

    // 验证字段格式
    if (config.containsKey('apiKey') && config['apiKey'] is! String) {
      errors.add('API key must be a string');
    }

    if (config.containsKey('enableDebug') && config['enableDebug'] is! bool) {
      errors.add('Enable debug must be a boolean');
    }

    return ValidationResult.success();
  }
}

// 推送SDK配置验证器示例
class PushConfigValidator implements ConfigValidator {
  @override
  ValidationResult validate(Map<String, dynamic> config) {
    final errors = <String>[];

    // 验证必需字段
    if (!config.containsKey('senderId') || config['senderId'] == null) {
      errors.add('Sender ID is required');
    }

    if (!config.containsKey('appId') || config['appId'] == null) {
      errors.add('App ID is required');
    }

    // 验证字段格式
    if (config.containsKey('senderId') && config['senderId'] is! String) {
      errors.add('Sender ID must be a string');
    }

    if (config.containsKey('appId') && config['appId'] is! String) {
      errors.add('App ID must be a string');
    }

    return ValidationResult.success();
  }
}
```

## 错误处理与恢复

### 1. 统一错误处理

```dart
// SDK异常基类
class SDKException implements Exception {
  final String code;
  final String message;
  final String platform;
  final dynamic details;
  final DateTime timestamp;

  SDKException({
    required this.code,
    required this.message,
    required this.platform,
    this.details,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  @override
  String toString() {
    final buffer = StringBuffer('SDKException($code) on $platform: $message');
    if (details != null) {
      buffer.write(' - Details: $details');
    }
    return buffer.toString();
  }

  Map<String, dynamic> toMap() {
    return {
      'code': code,
      'message': message,
      'platform': platform,
      'details': details,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

// 错误处理器
class SDKErrorHandler {
  static final List<ErrorListener> _listeners = [];
  static final List<SDKException> _errorHistory = [];
  static const int _maxHistorySize = 100;

  // 注册错误监听器
  static void addListener(ErrorListener listener) {
    _listeners.add(listener);
  }

  // 移除错误监听器
  static void removeListener(ErrorListener listener) {
    _listeners.remove(listener);
  }

  // 处理错误
  static void handleError(SDKException error) {
    // 添加到历史记录
    _errorHistory.add(error);
    if (_errorHistory.length > _maxHistorySize) {
      _errorHistory.removeAt(0);
    }

    // 通知监听器
    for (final listener in _listeners) {
      listener.onError(error);
    }

    // 记录错误日志
    _logError(error);
  }

  // 记录错误日志
  static void _logError(SDKException error) {
    print('[${error.timestamp}] ${error.toString()}');

    // 可以集成到日志系统
    // Logger.error(error.toString(), error: error);
  }

  // 获取错误历史
  static List<SDKException> getErrorHistory({String? platform}) {
    if (platform == null) {
      return List.from(_errorHistory);
    }

    return _errorHistory.where((error) => error.platform == platform).toList();
  }

  // 清理错误历史
  static void clearErrorHistory() {
    _errorHistory.clear();
  }

  // 获取错误统计
  static Map<String, dynamic> getErrorStats() {
    final platformCounts = <String, int>{};
    final codeCounts = <String, int>{};

    for (final error in _errorHistory) {
      platformCounts[error.platform] = (platformCounts[error.platform] ?? 0) + 1;
      codeCounts[error.code] = (codeCounts[error.code] ?? 0) + 1;
    }

    return {
      'totalErrors': _errorHistory.length,
      'errorsByPlatform': platformCounts,
      'errorsByCode': codeCounts,
    };
  }
}

// 错误监听器接口
abstract class ErrorListener {
  void onError(SDKException error);
}

// 错误恢复策略
abstract class ErrorRecoveryStrategy {
  Future<bool> canRecover(SDKException error);
  Future<bool> recover(SDKException error);
}

// 错误恢复管理器
class ErrorRecoveryManager {
  static final Map<String, ErrorRecoveryStrategy> _strategies = {};

  // 注册恢复策略
  static void registerStrategy(String errorCode, ErrorRecoveryStrategy strategy) {
    _strategies[errorCode] = strategy;
  }

  // 尝试恢复
  static Future<bool> attemptRecovery(SDKException error) async {
    final strategy = _strategies[error.code];
    if (strategy == null) {
      return false;
    }

    try {
      final canRecover = await strategy.canRecover(error);
      if (canRecover) {
        return await strategy.recover(error);
      }
    } catch (e) {
      print('Error during recovery: $e');
    }

    return false;
  }

  // 清理所有策略
  static void clearStrategies() {
    _strategies.clear();
  }
}

// 网络错误恢复策略示例
class NetworkErrorRecoveryStrategy implements ErrorRecoveryStrategy {
  final int maxRetries;
  final Duration retryDelay;

  NetworkErrorRecoveryStrategy({
    this.maxRetries = 3,
    this.retryDelay = const Duration(seconds: 1),
  });

  @override
  Future<bool> canRecover(SDKException error) async {
    return error.code.startsWith('NETWORK_');
  }

  @override
  Future<bool> recover(SDKException error) async {
    for (int i = 0; i < maxRetries; i++) {
      try {
        // 等待重试延迟
        await Future.delayed(retryDelay * (i + 1));

        // 尝试重新初始化SDK
        // await _reinitializeSDK();

        return true;
      } catch (e) {
        print('Recovery attempt ${i + 1} failed: $e');
      }
    }

    return false;
  }
}

// 权限错误恢复策略示例
class PermissionErrorRecoveryStrategy implements ErrorRecoveryStrategy {
  @override
  Future<bool> canRecover(SDKException error) async {
    return error.code.startsWith('PERMISSION_');
  }

  @override
  Future<bool> recover(SDKException error) async {
    try {
      // 重新请求权限
      // await _requestPermission();

      return true;
    } catch (e) {
      print('Permission recovery failed: $e');
      return false;
    }
  }
}
```

### 2. 重试机制

```dart
// 重试管理器
class RetryManager {
  static final Map<String, RetryPolicy> _policies = {};

  // 注册重试策略
  static void registerPolicy(String operation, RetryPolicy policy) {
    _policies[operation] = policy;
  }

  // 执行带重试的操作
  static Future<T> executeWithRetry<T>(
    String operation,
    Future<T> Function() operationFunc,
  ) async {
    final policy = _policies[operation];
    if (policy == null) {
      return await operationFunc();
    }

    int attempt = 0;
    SDKException? lastError;

    while (attempt < policy.maxAttempts) {
      try {
        return await operationFunc();
      } on SDKException catch (e) {
        lastError = e;
        attempt++;

        if (attempt >= policy.maxAttempts) {
          break;
        }

        // 检查是否应该重试
        if (!policy.shouldRetry(e, attempt)) {
          break;
        }

        // 等待重试延迟
        await policy.getDelay(attempt);
      }
    }

    throw lastError ?? SDKException(
      code: 'RETRY_EXHAUSTED',
      message: 'All retry attempts exhausted',
      platform: Platform.operatingSystem,
    );
  }

  // 清理所有策略
  static void clearPolicies() {
    _policies.clear();
  }
}

// 重试策略
abstract class RetryPolicy {
  int get maxAttempts;
  bool shouldRetry(SDKException error, int attempt);
  Future<void> getDelay(int attempt);
}

// 指数退避重试策略
class ExponentialBackoffRetryPolicy implements RetryPolicy {
  final int _maxAttempts;
  final Duration _initialDelay;
  final double _multiplier;
  final Duration _maxDelay;

  ExponentialBackoffRetryPolicy({
    int maxAttempts = 3,
    Duration initialDelay = const Duration(seconds: 1),
    double multiplier = 2.0,
    Duration maxDelay = const Duration(seconds: 30),
  }) : _maxAttempts = maxAttempts,
       _initialDelay = initialDelay,
       _multiplier = multiplier,
       _maxDelay = maxDelay;

  @override
  int get maxAttempts => _maxAttempts;

  @override
  bool shouldRetry(SDKException error, int attempt) {
    // 网络错误和临时错误可以重试
    return error.code.startsWith('NETWORK_') ||
           error.code.startsWith('TEMPORARY_') ||
           error.code.startsWith('TIMEOUT_');
  }

  @override
  Future<void> getDelay(int attempt) async {
    final delay = Duration(
      milliseconds: (_initialDelay.inMilliseconds * math.pow(_multiplier, attempt - 1))
          .round()
          .clamp(0, _maxDelay.inMilliseconds),
    );

    await Future.delayed(delay);
  }
}

// 固定延迟重试策略
class FixedDelayRetryPolicy implements RetryPolicy {
  final int _maxAttempts;
  final Duration _delay;
  final Set<String> _retryableCodes;

  FixedDelayRetryPolicy({
    int maxAttempts = 3,
    Duration delay = const Duration(seconds: 1),
    Set<String>? retryableCodes,
  }) : _maxAttempts = maxAttempts,
       _delay = delay,
       _retryableCodes = retryableCodes ?? {
         'NETWORK_ERROR',
         'TIMEOUT_ERROR',
         'TEMPORARY_ERROR',
       };

  @override
  int get maxAttempts => _maxAttempts;

  @override
  bool shouldRetry(SDKException error, int attempt) {
    return _retryableCodes.contains(error.code);
  }

  @override
  Future<void> getDelay(int attempt) async {
    await Future.delayed(_delay);
  }
}
```

## 性能优化

### 1. 缓存策略

```dart
// SDK缓存管理器
class SDKCacheManager {
  static final Map<String, CacheEntry> _cache = {};
  static const int _maxCacheSize = 1000;
  static const Duration _defaultTtl = Duration(minutes: 5);

  // 缓存条目
  static class CacheEntry {
    final dynamic data;
    final DateTime timestamp;
    final Duration ttl;

    CacheEntry(this.data, this.ttl) : timestamp = DateTime.now();

    bool get isExpired => DateTime.now().difference(timestamp) > ttl;
  }

  // 生成缓存键
  static String generateCacheKey(String sdkName, String operation, Map<String, dynamic>? params) {
    final paramsHash = _hashParams(params);
    return '${sdkName}_${operation}_$paramsHash';
  }

  // 获取缓存数据
  static T? getCachedData<T>(String key) {
    final entry = _cache[key];
    if (entry != null && !entry.isExpired) {
      return entry.data as T?;
    } else {
      _cache.remove(key);
      return null;
    }
  }

  // 设置缓存数据
  static void setCachedData<T>(String key, T data, {Duration? ttl}) {
    _cache[key] = CacheEntry(data, ttl ?? _defaultTtl);

    // 检查缓存大小
    if (_cache.length > _maxCacheSize) {
      _evictOldestEntries();
    }
  }

  // 清理过期条目
  static void cleanupExpiredEntries() {
    final expiredKeys = <String>[];
    _cache.forEach((key, entry) {
      if (entry.isExpired) {
        expiredKeys.add(key);
      }
    });

    for (final key in expiredKeys) {
      _cache.remove(key);
    }
  }

  // 驱逐最旧的条目
  static void _evictOldestEntries() {
    final sortedEntries = _cache.entries.toList()
      ..sort((a, b) => a.value.timestamp.compareTo(b.value.timestamp));

    final entriesToRemove = sortedEntries.take(_cache.length - _maxCacheSize);
    for (final entry in entriesToRemove) {
      _cache.remove(entry.key);
    }
  }

  // 计算参数哈希
  static String _hashParams(Map<String, dynamic>? params) {
    if (params == null || params.isEmpty) return 'empty';

    final sortedParams = Map.fromEntries(
      params.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );

    final paramsString = sortedParams.toString();
    final bytes = utf8.encode(paramsString);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  // 清空缓存
  static void clearCache() {
    _cache.clear();
  }

  // 获取缓存统计
  static Map<String, dynamic> getCacheStats() {
    return {
      'cacheSize': _cache.length,
      'maxCacheSize': _maxCacheSize,
      'expiredEntries': _cache.values.where((entry) => entry.isExpired).length,
    };
  }
}

// 带缓存的SDK操作包装器
class CachedSDKOperation<T> {
  final String sdkName;
  final String operation;
  final Future<T> Function() operationFunc;
  final Duration? ttl;
  final Map<String, dynamic>? params;

  CachedSDKOperation({
    required this.sdkName,
    required this.operation,
    required this.operationFunc,
    this.ttl,
    this.params,
  });

  // 执行操作
  Future<T> execute() async {
    final cacheKey = SDKCacheManager.generateCacheKey(sdkName, operation, params);

    // 尝试从缓存获取
    final cachedData = SDKCacheManager.getCachedData<T>(cacheKey);
    if (cachedData != null) {
      return cachedData;
    }

    // 执行操作
    final result = await operationFunc();

    // 缓存结果
    SDKCacheManager.setCachedData<T>(cacheKey, result, ttl: ttl);

    return result;
  }
}
```

### 2. 批量操作优化

```dart
// 批量操作管理器
class BatchOperationManager {
  static final Map<String, List<BatchRequest>> _pendingBatches = {};
  static final Map<String, Timer> _batchTimers = {};
  static const Duration _defaultBatchDelay = Duration(milliseconds: 100);

  // 批量请求
  static class BatchRequest {
    final String operation;
    final Map<String, dynamic> params;
    final Completer<dynamic> completer;
    final DateTime timestamp;

    BatchRequest(this.operation, this.params, this.completer)
        : timestamp = DateTime.now();
  }

  // 添加批量请求
  static Future<T> addBatchRequest<T>(
    String sdkName,
    String operation,
    Map<String, dynamic> params, {
    Duration? delay,
  }) async {
    final completer = Completer<T>();
    final request = BatchRequest(operation, params, completer);

    final pending = _pendingBatches.putIfAbsent(sdkName, () => []);
    pending.add(request);

    // 设置批处理定时器
    _scheduleBatchExecution(sdkName, delay ?? _defaultBatchDelay);

    return await completer.future;
  }

  // 调度批处理执行
  static void _scheduleBatchExecution(String sdkName, Duration delay) {
    final timer = _batchTimers[sdkName];
    if (timer?.isActive == true) {
      return; // 已有定时器在运行
    }

    _batchTimers[sdkName] = Timer(delay, () {
      _executeBatch(sdkName);
    });
  }

  // 执行批量操作
  static void _executeBatch(String sdkName) {
    final pending = _pendingBatches.remove(sdkName);
    _batchTimers.remove(sdkName);

    if (pending == null || pending.isEmpty) return;

    // 按操作类型分组
    final operationGroups = <String, List<BatchRequest>>{};
    for (final request in pending) {
      operationGroups.putIfAbsent(request.operation, () => []).add(request);
    }

    // 执行每个操作组
    for (final entry in operationGroups.entries) {
      _executeOperationGroup(sdkName, entry.key, entry.value);
    }
  }

  // 执行操作组
  static void _executeOperationGroup(
    String sdkName,
    String operation,
    List<BatchRequest> requests,
  ) {
    // 准备批量数据
    final batchData = requests.map((request) => {
      'params': request.params,
      'id': requests.indexOf(request),
    }).toList();

    // 执行批量调用
    _executeBatchCall(sdkName, operation, batchData).then((results) {
      // 处理结果
      for (int i = 0; i < requests.length; i++) {
        final request = requests[i];
        final result = results[i];

        if (result['success'] as bool) {
          request.completer.complete(result['data']);
        } else {
          request.completer.completeError(
            SDKException(
              code: result['error'] as String? ?? 'BATCH_ERROR',
              message: result['message'] as String? ?? 'Batch operation failed',
              platform: Platform.operatingSystem,
            ),
          );
        }
      }
    }).catchError((error) {
      // 处理批量调用失败
      for (final request in requests) {
        request.completer.completeError(error);
      }
    });
  }

  // 执行批量调用
  static Future<List<Map<String, dynamic>>> _executeBatchCall(
    String sdkName,
    String operation,
    List<Map<String, dynamic>> batchData,
  ) async {
    // 这里应该调用具体的SDK批量操作
    // 实现取决于具体的SDK

    // 模拟实现
    await Future.delayed(Duration(milliseconds: 50));

    return batchData.map((data) => {
      'success': true,
      'data': null,
    }).toList();
  }

  // 强制执行所有待处理的批量操作
  static void flushAllBatches() {
    for (final sdkName in _pendingBatches.keys.toList()) {
      _executeBatch(sdkName);
    }
  }

  // 获取批量统计信息
  static Map<String, dynamic> getBatchStats() {
    return {
      'pendingBatches': _pendingBatches.map((key, value) => MapEntry(key, value.length)),
      'activeTimers': _batchTimers.length,
    };
  }

  // 清理所有批量操作
  static void clearAllBatches() {
    for (final timer in _batchTimers.values) {
      timer.cancel();
    }

    _pendingBatches.clear();
    _batchTimers.clear();
  }
}
```

## 最佳实践

### 1. 架构设计

- **接口抽象**：定义统一的 SDK 接口，隐藏平台差异
- **模块化设计**：按功能模块组织 SDK 代码
- **依赖注入**：使用依赖注入管理 SDK 实例
- **配置管理**：建立统一的配置管理机制

### 2. 开发建议

- **错误处理**：建立完善的错误处理和恢复机制
- **性能优化**：使用缓存和批量操作提高性能
- **测试覆盖**：编写全面的单元测试和集成测试
- **文档完善**：提供详细的 API 文档和使用示例

### 3. 维护策略

- **版本管理**：建立清晰的版本管理策略
- **向后兼容**：确保新版本向后兼容
- **监控告警**：建立 SDK 运行状态监控
- **持续更新**：及时更新 SDK 以适应平台变化

## 总结

Flutter 与第三方 SDK 桥接的最佳实践为构建稳定、高效的跨平台应用提供了指导。通过掌握统一接口设计、API 封装、错误处理、性能优化等技术，开发者可以构建出高质量的 Flutter 应用。

关键成功因素：

1. 合理的架构设计
2. 完善的错误处理机制
3. 有效的性能优化策略
4. 全面的测试覆盖
5. 持续的维护和更新

通过本文的学习，开发者应该能够掌握 Flutter 与第三方 SDK 桥接的最佳实践，构建出功能强大、稳定可靠的跨平台应用。
