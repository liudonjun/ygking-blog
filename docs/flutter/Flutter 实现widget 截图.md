---
title: Flutter 实现 Widget 截图并保存到本地
description: 在 Flutter 中，将 Widget 转换为图片并保存或分享是一项常见需求。无论是为了保存当前屏幕，还是分享某个特定 UI 部分的截图，这些功能都可以通过 RepaintBoundary 实现。本文将详细介绍如何在 Flutter 中实现 Widget 截图并将图片保存到本地。
tag:
 - Flutter
# top: 1
sidebar: true
---

# 实现原理

RepaintBoundary 是 Flutter 提供的一个组件，它可以将某个 Widget 包裹在一个独立的绘制区域内，并允许你将该区域渲染为图片。核心步骤如下：

1. 用 RepaintBoundary 包裹需要截图的 Widget。
2. 使用 GlobalKey 获取 RepaintBoundary 的上下文。
3. 调用 toImage() 方法将 Widget 转换为图片。
4. 将图片转换为 Uint8List 格式，并保存到本地或分享。

# 具体实现步骤

## 包裹 Widget 并使用 GlobalKey
首先，将需要截图的部分用 RepaintBoundary 包裹，并通过 GlobalKey 获取对应的上下文。

```dart
RepaintBoundary(
  key: _globalKey,
  child: Container(
    color: Colors.blueAccent,
    padding: const EdgeInsets.all(16.0),
    child: const Text(
      '这是一个可以截图的 Widget',
      style: TextStyle(color: Colors.white, fontSize: 24.0),
    ),
  ),
)

```
## 将 Widget 转换为图片
使用 GlobalKey 获取 RepaintBoundary 的 RenderObject，然后将其渲染为图片，并转换为 Uint8List，以便后续的保存或分享操作。

```dart
/// 创建图片
  Future<Uint8List?> capturePng() async {
    try {
      RenderRepaintBoundary boundary =
          globalKey.currentContext?.findRenderObject() as RenderRepaintBoundary;
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData =
          await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (e) {
      return null;
    }
  }

```

## 保存图片到本地

使用 path_provider 插件访问设备的文件系统，并将图片保存到本地。首先在 pubspec.yaml 中添加依赖：

```yaml
dependencies:
  path_provider: ^2.0.9
  image_gallery_saver: ^1.7.1
  permission_handler: ^10.2.0

```

接着，通过 path_provider 获取外部存储路径，并保存图片到该路径。

```dart
Future<void> saveImageToLocal(Uint8List imageBytes) async {
  final directory = await getExternalStorageDirectory();
  final imagePath = '${directory!.path}/screenshot.png';
  File imgFile = File(imagePath);
  await imgFile.writeAsBytes(imageBytes);
  print('图片已保存至: $imagePath');
}

```
或者使用 ImageGallerySaver 保存到图库,同时需要注意存储图片时权限问题

Android： 在 AndroidManifest.xml 中添加存储权限：

```dart
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>

```

iOS： 在 Info.plist 中添加图库权限描述：

```dart
<key>NSPhotoLibraryAddUsageDescription</key>
<string>需要访问您的相册以保存图片。</string>
```


```dart
class ImageGallerySaver {
  ...
  static FutureOr<dynamic> saveImage(Uint8List imageBytes,
      {int quality = 80,
      String? name,
      bool isReturnImagePathOfIOS = false}) async {
    final result =
        await _channel.invokeMethod('saveImageToGallery', <String, dynamic>{
      'imageBytes': imageBytes,
      'quality': quality,
      'name': name,
      'isReturnImagePathOfIOS': isReturnImagePathOfIOS
    });
    return result;
  }
  ...
}

/// 保存图片
  Future<dynamic> saveImage(Uint8List imageBytes) async {
    final result = await ImageGallerySaver.saveImage(imageBytes);
    return result;
  }

```
