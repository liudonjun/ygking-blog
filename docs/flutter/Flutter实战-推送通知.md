---
title: Flutter 推送通知实现详解
description: 详细介绍 Flutter 中实现推送通知的方法和最佳实践。
tag:
 - Flutter
 - 实战
sidebar: true
---

# Flutter 推送通知实现详解

## 简介

推送通知是移动应用的重要功能,可以让用户及时获取重要信息。本文介绍如何在 Flutter 中实现推送通知功能。

## 基本配置

### 添加依赖
```yaml
dependencies:
  firebase_core: ^2.15.1
  firebase_messaging: ^14.6.7
  flutter_local_notifications: ^15.1.1
```

### 初始化 Firebase
```dart
Future<void> initFirebase() async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // 获取 FCM Token
  final fcmToken = await FirebaseMessaging.instance.getToken();
  print('FCM Token: $fcmToken');
}
```

### 配置通知权限
```dart
Future<void> requestNotificationPermission() async {
  final messaging = FirebaseMessaging.instance;
  
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
  
  print('Notification permission status: ${settings.authorizationStatus}');
}
```

## 本地通知

### 初始化本地通知
```dart
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  
  final FlutterLocalNotificationsPlugin _notifications = 
      FlutterLocalNotificationsPlugin();
      
  NotificationService._internal();
  
  Future<void> init() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _notifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }
  
  void _onNotificationTapped(NotificationResponse response) {
    // 处理通知点击事件
  }
  
  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'default_channel',
      'Default Channel',
      importance: Importance.high,
      priority: Priority.high,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _notifications.show(
      0,
      title,
      body,
      details,
      payload: payload,
    );
  }
}
```

## 远程推送

### 处理后台消息
```dart
Future<void> _firebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  await Firebase.initializeApp();
  print('Handling background message: ${message.messageId}');
  
  // 显示本地通知
  await NotificationService().showNotification(
    title: message.notification?.title ?? '',
    body: message.notification?.body ?? '',
    payload: message.data.toString(),
  );
}
```

### 处理前台消息
```dart
void _handleForegroundMessage() {
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');

    if (message.notification != null) {
      print('Message also contained a notification:');
      print('Title: ${message.notification?.title}');
      print('Body: ${message.notification?.body}');
      
      NotificationService().showNotification(
        title: message.notification?.title ?? '',
        body: message.notification?.body ?? '',
        payload: message.data.toString(),
      );
    }
  });
}
```

## 完整示例

```dart
class PushNotificationDemo extends StatefulWidget {
  @override
  _PushNotificationDemoState createState() => _PushNotificationDemoState();
}

class _PushNotificationDemoState extends State<PushNotificationDemo> {
  final notificationService = NotificationService();
  String? _fcmToken;
  List<String> _notifications = [];
  
  @override
  void initState() {
    super.initState();
    _initPushNotifications();
  }
  
  Future<void> _initPushNotifications() async {
    // 初始化 Firebase
    await Firebase.initializeApp();
    
    // 初始化本地通知
    await notificationService.init();
    
    // 请求通知权限
    await requestNotificationPermission();
    
    // 获取 FCM Token
    final token = await FirebaseMessaging.instance.getToken();
    setState(() {
      _fcmToken = token;
    });
    
    // 监听 Token 刷新
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      setState(() {
        _fcmToken = token;
      });
    });
    
    // 处理后台消息
    FirebaseMessaging.onBackgroundMessage(
      _firebaseMessagingBackgroundHandler,
    );
    
    // 处理前台消息
    FirebaseMessaging.onMessage.listen((message) {
      setState(() {
        _notifications.add(
          '${message.notification?.title}: ${message.notification?.body}',
        );
      });
      
      notificationService.showNotification(
        title: message.notification?.title ?? '',
        body: message.notification?.body ?? '',
      );
    });
    
    // 处理通知点击
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      print('Message clicked!');
      // 处理通知点击事件
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Push Notifications'),
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'FCM Token:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(_fcmToken ?? 'Loading...'),
                ],
              ),
            ),
          ),
          SizedBox(height: 16),
          Text(
            'Notifications:',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8),
          ..._notifications.map((notification) => Card(
            child: ListTile(
              title: Text(notification),
            ),
          )).toList(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          notificationService.showNotification(
            title: 'Test Notification',
            body: 'This is a test local notification',
          );
        },
        child: Icon(Icons.notifications),
      ),
    );
  }
}
```

## 最佳实践

1. 合理处理通知权限
2. 实现通知分类
3. 处理通知点击事件
4. 管理通知角标
5. 实现通知持久化

## 注意事项

1. 平台差异处理
2. Token 管理
3. 通知限制
4. 后台消息处理
5. 电池优化影响

## 总结

推送通知是提升用户活跃度的重要功能。通过合理使用 Firebase Cloud Messaging 和本地通知,可以实现完整的推送通知功能。注意在实现过程中要考虑平台差异和性能优化。 