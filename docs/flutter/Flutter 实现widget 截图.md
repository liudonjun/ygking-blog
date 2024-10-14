---
title: Flutter 实现widget 截图
description: 在 Flutter 中，将 Widget 转换为图片进行保存或分享是一个非常常见的需求。比如，你可能想要为用户提供保存当前屏幕或某个部件的截图功能。本文将详细介绍如何在 Flutter 中实现 Widget 截图并保存图片到本地。
tag:
 - Flutter
# top: 1
sidebar: true
---

# Flutter 实现widget 截图

Flutter 提供了 `RepaintBoundary` 小部件，它允许你将某个 `Widget `限制在一个单独的绘制区域，这样就可以轻松地将该区域渲染为图片。

[https://api.flutter.dev/flutter/widgets/RepaintBoundary-class.html](https://api.flutter.dev/flutter/widgets/RepaintBoundary-class.html)

核心步骤：

1. 包裹需要截图的 Widget，并使用 `GlobalKey` 来获取该 `RepaintBoundary` 的上下文。
2. 调用 `RepaintBoundary` 的 `toImage` 方法，将 Widget 渲染为图片。
3. 将渲染的图片转换为 Uint8List 以便于保存或分享。

# 具体实现
`RepaintBoundary` 是一个重要的 Flutter 组件，它将其子树包裹起来，并在绘制过程中创建一个独立的绘制层（`Layer`）。你可以将需要截图的部分用 `RepaintBoundary` 包裹起来，并使用 `GlobalKey` 访问它。

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

通过 GlobalKey，你可以获取 RepaintBoundary 的 `RenderObject`，然后调用 转换成`Uint8List`对象。

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

保存图片到本地 
Flutter 提供了 `path_provider` 插件来访问设备的文件系统。使用 `getExternalStorageDirectory()` 获取外部存储目录路径，然后将图片保存到设备中。

在 pubspec.yaml 文件中添加依赖

```dart
///writeAsBytes(pngBytes)
final directory = (await getExternalStorageDirectory())!;
File imgFile = File('${directory.path}/screenshot.png');
await imgFile.writeAsBytes(pngBytes);

```
或者使用 ImageGallerySaver 保存到图库,同时需要注意存储图片时权限问题

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

```


具体实现

```dart
  /// 保存图片
  Future<dynamic> saveImage(Uint8List imageBytes) async {
    final result = await ImageGallerySaver.saveImage(imageBytes);
    return result;
  }
```




