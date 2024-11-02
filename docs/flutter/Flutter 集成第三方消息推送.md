---
title: Flutter 集成友盟消息推送
description: 在 Flutter 项目中集成友盟消息推送服务，可以通过友盟推送 SDK 结合原生代码和 Flutter 插件实现。友盟推送支持 Android 和 iOS 平台的推送服务
tag:
 - Flutter
 - 消息推送
sidebar: true
---

# Flutter 集成友盟消息推送

在 Flutter 项目中集成友盟消息推送服务，可以通过友盟推送 SDK 结合原生代码和 Flutter 插件实现。友盟推送支持 Android 和 iOS 平台的推送服务

# 实现原理


```dart

WidgetsFlutterBinding.ensureInitialized();
await initialConfiguration();

await initPlatformState();

manifestPlaceholders = [
    JPUSH_PKGNAME : applicationId,
    JPUSH_APPKEY : "", // NOTE: JPush 上注册的包名对应的 Appkey.
    JPUSH_CHANNEL : "developer-default", //暂时填写默认值即可.
    MEIZU_APPKEY : "",
    MEIZU_APPID : "",
    HONOR_APPID : "",
    XIAOMI_APPID : "",
    XIAOMI_APPKEY : "",
    OPPO_APPKEY : "",
    OPPO_APPID : "",
    OPPO_APPSECRET : "",
    VIVO_APPKEY : "",
    VIVO_APPID : "",
]
```


```dart
// Platform messages are asynchronous, so we initialize in an async method.
Future<void> initPlatformState() async {
  String? platformVersion;

  final JPush jpush = JPush();

  try {
    jpush.addEventHandler(
        onReceiveNotification: (Map<String, dynamic> message) async {
      print("flutter onReceiveNotification: $message");
    }, onOpenNotification: (Map<String, dynamic> message) async {
      print("flutter onOpenNotification: $message");
    }, onReceiveMessage: (Map<String, dynamic> message) async {
      print("flutter onReceiveMessage: $message");
    }, onReceiveNotificationAuthorization:
            (Map<String, dynamic> message) async {
      print("flutter onReceiveNotificationAuthorization: $message");
    }, onNotifyMessageUnShow: (Map<String, dynamic> message) async {
      print("flutter onNotifyMessageUnShow: $message");
    }, onInAppMessageShow: (Map<String, dynamic> message) async {
      print("flutter onInAppMessageShow: $message");
    }, onCommandResult: (Map<String, dynamic> message) async {
      print("flutter onCommandResult: $message");
    }, onInAppMessageClick: (Map<String, dynamic> message) async {
      print("flutter onInAppMessageClick: $message");
    }, onConnected: (Map<String, dynamic> message) async {
      print("flutter onConnected: $message");
    });
  } on PlatformException {
    platformVersion = 'Failed to get platform version.';
  }

  jpush.setAuth(enable: true);
  jpush.setup(
    appKey: "a61caf6e54047b4931fe0772", //你自己应用的 AppKey
    channel: "theChannel",
    production: false,
    debug: true,
  );
  jpush.applyPushAuthority(
      new NotificationSettingsIOS(sound: true, alert: true, badge: true));

  // Platform messages may fail, so we use a try/catch PlatformException.
  jpush.getRegistrationID().then((rid) {
    print("flutter get registration id : $rid");
  });

  // iOS要是使用应用内消息，请在页面进入离开的时候配置pageEnterTo 和  pageLeave 函数，参数为页面名。
  jpush.pageEnterTo("HomePage"); // 在离开页面的时候请调用 jpush.pageLeave("HomePage");
}

```