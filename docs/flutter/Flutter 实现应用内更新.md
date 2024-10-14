---
title: Flutter 实现应用内更新
description: 在移动应用开发中，定期为用户提供更新以修复 bug 或添加新功能是非常重要的。而在用户体验上，应用内更新无疑能让用户在不离开应用的情况下完成更新操作，从而提升用户的留存率。本文将详细介绍如何在 Flutter 中实现应用内更新的功能。
tag:
 - Flutter
# top: 1
sidebar: true
---

# Flutter 实现应用内更新

在移动应用开发中，定期为用户提供更新以修复 bug 或添加新功能是非常重要的。而在用户体验上，应用内更新无疑能让用户在不离开应用的情况下完成更新操作，从而提升用户的留存率。本文将详细介绍如何在 Flutter 中实现应用内更新的功能。

## 更新时机

一般都会在首屏加载时去做一个版本的检查以及关于页面检查版本,
然后会发起一个网络请求拉取配置信息，版本号、下载链接、是否强制更新等信息，然后进行比对

```dart 
 /// 检查更新
  static Future<void> checkUpdate({bool showMsg = false}) {
        var currentVersion = await _getCurrentAppVersion();

    if (basicConfiguration!.currentVersion! ==
            basicConfiguration!.auditVersion! &&
        _compareVersion(currentVersion, basicConfiguration!.currentVersion!)) {
      // 显示更新对话框
      ...
    } else {
      if (showMsg) {
        Fluttertoast.showToast(
            msg: '当前版本已是最新版本，无需更新', gravity: ToastGravity.CENTER);
      }
    }
  }

```
获取当前应用版本号
```dart
  // 获取当前应用版本号
  static Future<String> _getCurrentAppVersion() async {
    PackageInfo packageInfo = await PackageInfo.fromPlatform();
    return packageInfo.version;
  }

```
比较版本号
```dart
  // 比较版本号
  static bool _compareVersion(String localVersion, String serverVersion) {
    List<String> localVersionSplit = localVersion.split('.');
    List<String> serverVersionSplit = serverVersion.split('.');

    for (int i = 0; i < localVersionSplit.length; i++) {
      int localPart = int.parse(localVersionSplit[i]);
      int serverPart = int.parse(serverVersionSplit[i]);

      if (localPart < serverPart) {
        return true; // 需要更新
      } else if (localPart > serverPart) {
        return false; // 不需要更新
      }
    }

    return false; // 版本相同，不需要更新
  }

```

## 版本更新

跟新的话还是离不开一个存储权限的问题,更新流程一般是，到目标位置，检查权限，然后做个app下载,打开文件进行更新，当然`ios`的话就只能跳转`apptore`了

### 请求存储权限
```dart
  // 请求存储权限
  Future<bool> _requestStoragePermission() async {
    var status = await Permission.storage.status;
    if (!status.isGranted) {
      status = await Permission.storage.request();
    }
    return status.isGranted;
  }
```

### 下载文件
开始下载文件之前我们需要去对这个设备进行一个区分，然后编写下载进度条动画

```dart
  /// 开始下载
  void _startDownloadAndInstall(String apkUrl) async {
    if (Platform.isAndroid) {
      // 安卓设备：下载并安装 APK
      _startAndroidDownloadAndInstall(apkUrl);
    } else if (Platform.isIOS) {
      // iOS设备：跳转到 App Store
      _openAppStore();
    }
  }

  // 下载 APK 文件
  Future<String?> _downloadApk(String url) async {
    Dio dio = Dio();
    Directory? appDocDir = await getTemporaryDirectory();
    String savePath = "${appDocDir.path}/update.apk";

    try {
      await dio.download(url, savePath, onReceiveProgress: (received, total) {
        setState(() {
          _downloadProgress = received / total;
        });
      });
      _installApk(savePath);
      return savePath;
    } catch (e) {
      print("Download failed: $e");
      return null;
    }
  }
```

### apk安装

安装应用的话主要就是针对android系统,这边推荐使用的是这个OpenFile 去对这个apk文件进行打开并安装

[https://pub.dev/packages/open_file](https://pub.dev/packages/open_file)

实现就比较简单直接将filePath 传递进入就可以了，需要注意AndroidManifest 有没有配置所需权限，可能据返回的OpenResult 进行调整

```dart
  /// OpenFile.open 构造函数
  Future<OpenResult> open(
    String? filePath, {
    String? type,
    bool isIOSAppOpen = false,
    String linuxDesktopName = "xdg",
    bool linuxUseGio = false,
    bool linuxByProcess = true,
  })

```

### ios 更新

主要就是跳转到AppStore的应用详情页

```dart
  /// 常量
  class Constants {
    ...
  static const appStoreUrl = "https://apps.apple.com/app/id${此处放置应用的id}";
    ...
  }

  ///打开AppStore
  void _openAppStore() async {
    if (await canLaunch(Constants.appStoreUrl)) {
      await launch(Constants.appStoreUrl);
    } else {
      print("无法打开 App Store 链接");
    }
  }
```


