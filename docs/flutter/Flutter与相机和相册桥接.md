---
description: 本文详细介绍Flutter应用如何与相机和相册进行桥接交互，包括拍照、录像、图片选择、视频选择、图片编辑等核心功能，以及Android和iOS平台的具体实现细节。
tag:
  - Flutter
  - 相机
  - 相册
  - 图片处理
  - 视频处理
  - 媒体管理
sticky: 1
sidebar: true
---

# Flutter 与相机和相册桥接

## 故事开始：小张的社交分享应用

小张正在开发一个社交分享应用，需要实现拍照、录像、图片选择等功能。他发现 Flutter 中的相机和相册功能比想象中要复杂。

"相机功能涉及权限管理、设备兼容性、图片处理、内存管理等多个方面，而且 Android 和 iOS 的实现差异很大。"小张在开发笔记中写道。

## 第一章：相机和相册技术基础

### 1.1 相机技术概述

现代移动设备的相机功能非常丰富：

**相机类型：**

- **后置主摄像头**：通常分辨率最高，功能最全
- **前置摄像头**：用于自拍和视频通话
- **广角摄像头**：提供更宽广的视野
- **长焦摄像头**：用于光学变焦
- **深度摄像头**：用于景深检测和人像模式

**相机功能：**

- 拍照（静态图片）
- 录像（动态视频）
- 闪光灯控制
- 对焦模式
- 曝光控制
- 白平衡调整
- 滤镜效果

### 1.2 相册技术概述

相册是存储和管理媒体文件的系统组件：

**媒体类型：**

- **图片**：JPEG、PNG、HEIC、WebP 等格式
- **视频**：MP4、MOV、AVI 等格式
- **GIF 动图**：支持播放的动态图片
- **Live Photos**：iOS 特有的动态照片

**相册功能：**

- 媒体文件浏览
- 多选操作
- 文件管理（创建、删除、移动）
- 元数据读取（拍摄时间、地理位置等）
- 缩略图生成

### 1.3 Flutter 相机相册开发生态

Flutter 中相机相册开发主要有以下几种方案：

1. **image_picker** - 官方推荐的媒体选择插件
2. **camera** - 专门的相机控制插件
3. **photo_manager** - 功能强大的相册管理插件
4. **自定义平台通道** - 完全自定义实现

## 第二章：环境搭建与基础配置

### 2.1 添加依赖

```yaml
dependencies:
  flutter:
    sdk: flutter
  image_picker: ^1.0.4
  camera: ^0.10.5+5
  photo_manager: ^3.0.0
  permission_handler: ^11.0.1
  video_player: ^2.8.1
  photo_view: ^0.14.0
```

### 2.2 权限配置

**Android 权限配置（android/app/src/main/AndroidManifest.xml）**

```xml
<!-- 相机权限 -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- 存储权限 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
                 android:maxSdkVersion="28" />

<!-- Android 13+ 需要这些权限 -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

<!-- 硬件特性声明 -->
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
<uses-feature android:name="android.hardware.camera.flash" android:required="false" />
```

**iOS 权限配置（ios/Runner/Info.plist）**

```xml
<!-- 相机权限 -->
<key>NSCameraUsageDescription</key>
<string>此应用需要相机权限来拍照和录像</string>

<!-- 麦克风权限 -->
<key>NSMicrophoneUsageDescription</key>
<string>此应用需要麦克风权限来录制视频</string>

<!-- 相册权限 -->
<key>NSPhotoLibraryUsageDescription</key>
<string>此应用需要相册权限来选择和保存图片视频</string>

<!-- iOS 14+ 需要这个权限 -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>此应用需要相册权限来保存图片和视频</string>
```

### 2.3 权限管理实现

```dart
import 'package:permission_handler/permission_handler.dart';

class CameraPermissionManager {
  static Future<bool> requestCameraPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        // Android 13+
        final camera = await Permission.camera.request();
        final microphone = await Permission.microphone.request();
        return camera.isGranted && microphone.isGranted;
      } else {
        // Android 12及以下
        final camera = await Permission.camera.request();
        final microphone = await Permission.microphone.request();
        final storage = await Permission.storage.request();
        return camera.isGranted && microphone.isGranted && storage.isGranted;
      }
    } else {
      // iOS
      final camera = await Permission.camera.request();
      final microphone = await Permission.microphone.request();
      final photos = await Permission.photos.request();
      return camera.isGranted && microphone.isGranted && photos.isGranted;
    }
  }

  static Future<bool> requestPhotoPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        // Android 13+
        final images = await Permission.photos.request();
        final videos = await Permission.videos.request();
        return images.isGranted || videos.isGranted;
      } else {
        // Android 12及以下
        final storage = await Permission.storage.request();
        return storage.isGranted;
      }
    } else {
      // iOS
      final photos = await Permission.photos.request();
      return photos.isGranted;
    }
  }

  static Future<bool> checkCameraPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        return await Permission.camera.isGranted &&
               await Permission.microphone.isGranted;
      } else {
        return await Permission.camera.isGranted &&
               await Permission.microphone.isGranted &&
               await Permission.storage.isGranted;
      }
    } else {
      return await Permission.camera.isGranted &&
             await Permission.microphone.isGranted &&
             await Permission.photos.isGranted;
    }
  }

  static Future<bool> checkPhotoPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        return await Permission.photos.isGranted ||
               await Permission.videos.isGranted;
      } else {
        return await Permission.storage.isGranted;
      }
    } else {
      return await Permission.photos.isGranted;
    }
  }

  static Future<void> openSettings() async {
    await openAppSettings();
  }
}
```

## 第三章：相机功能实现

### 3.1 相机控制器

```dart
import 'package:camera/camera.dart';

class CameraManager {
  static List<CameraDescription> _cameras = [];
  static CameraController? _controller;
  static int _currentCameraIndex = 0;
  static FlashMode _flashMode = FlashMode.auto;
  static bool _isInitialized = false;

  static List<CameraDescription> get cameras => _cameras;
  static CameraController? get controller => _controller;
  static bool get isInitialized => _isInitialized;
  static FlashMode get flashMode => _flashMode;

  static Future<void> initialize() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        await _switchCamera(_currentCameraIndex);
      }
    } catch (e) {
      throw CameraException('相机初始化失败：${e.toString()}');
    }
  }

  static Future<void> _switchCamera(int cameraIndex) async {
    if (cameraIndex >= _cameras.length) {
      throw CameraException('相机索引超出范围');
    }

    await _controller?.dispose();

    _controller = CameraController(
      _cameras[cameraIndex],
      ResolutionPreset.high,
      enableAudio: true,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    await _controller!.initialize();
    _currentCameraIndex = cameraIndex;
    _isInitialized = true;
  }

  static Future<void> switchCamera() async {
    if (_cameras.length < 2) {
      throw CameraException('设备只有一个相机');
    }

    final nextIndex = (_currentCameraIndex + 1) % _cameras.length;
    await _switchCamera(nextIndex);
  }

  static Future<void> setFlashMode(FlashMode mode) async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw CameraException('相机未初始化');
    }

    try {
      await _controller!.setFlashMode(mode);
      _flashMode = mode;
    } catch (e) {
      throw CameraException('设置闪光灯失败：${e.toString()}');
    }
  }

  static Future<void> toggleFlash() async {
    FlashMode nextMode;
    switch (_flashMode) {
      case FlashMode.auto:
        nextMode = FlashMode.on;
        break;
      case FlashMode.on:
        nextMode = FlashMode.off;
        break;
      case FlashMode.off:
        nextMode = FlashMode.auto;
        break;
    }

    await setFlashMode(nextMode);
  }

  static Future<XFile?> takePicture() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw CameraException('相机未初始化');
    }

    if (_controller!.value.isTakingPicture) {
      throw CameraException('正在拍照中');
    }

    try {
      final XFile picture = await _controller!.takePicture();
      return picture;
    } catch (e) {
      throw CameraException('拍照失败：${e.toString()}');
    }
  }

  static Future<void> startVideoRecording() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw CameraException('相机未初始化');
    }

    if (_controller!.value.isRecordingVideo) {
      throw CameraException('正在录像中');
    }

    try {
      await _controller!.startVideoRecording();
    } catch (e) {
      throw CameraException('开始录像失败：${e.toString()}');
    }
  }

  static Future<XFile?> stopVideoRecording() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw CameraException('相机未初始化');
    }

    if (!_controller!.value.isRecordingVideo) {
      throw CameraException('未在录像中');
    }

    try {
      final XFile video = await _controller!.stopVideoRecording();
      return video;
    } catch (e) {
      throw CameraException('停止录像失败：${e.toString()}');
    }
  }

  static Future<void> setFocusPoint(Offset point) async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw CameraException('相机未初始化');
    }

    try {
      await _controller!.setFocusPoint(point);
    } catch (e) {
      throw CameraException('设置对焦点失败：${e.toString()}');
    }
  }

  static Future<void> setExposurePoint(Offset point) async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw CameraException('相机未初始化');
    }

    try {
      await _controller!.setExposurePoint(point);
    } catch (e) {
      throw CameraException('设置曝光点失败：${e.toString()}');
    }
  }

  static Future<void> setZoomLevel(double zoom) async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw CameraException('相机未初始化');
    }

    try {
      final maxZoom = await _controller!.getMaxZoomLevel();
      final minZoom = await _controller!.getMinZoomLevel();
      final clampedZoom = zoom.clamp(minZoom, maxZoom);
      await _controller!.setZoomLevel(clampedZoom);
    } catch (e) {
      throw CameraException('设置缩放失败：${e.toString()}');
    }
  }

  static Future<void> dispose() async {
    await _controller?.dispose();
    _controller = null;
    _isInitialized = false;
  }

  static CameraDescription? get currentCamera {
    if (_currentCameraIndex < _cameras.length) {
      return _cameras[_currentCameraIndex];
    }
    return null;
  }

  static bool get isRearCamera {
    final camera = currentCamera;
    return camera?.lensDirection == CameraLensDirection.back;
  }

  static bool get isFrontCamera {
    final camera = currentCamera;
    return camera?.lensDirection == CameraLensDirection.front;
  }
}

class CameraException implements Exception {
  final String message;
  final String? code;

  CameraException(this.message, {this.code});

  @override
  String toString() {
    return 'CameraException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}
```

### 3.2 相机 UI 组件

```dart
class CameraPreviewWidget extends StatefulWidget {
  final Function(XFile) onPictureTaken;
  final Function(XFile) onVideoRecorded;
  final bool enableVideo;
  final bool enableFlash;
  final bool enableSwitchCamera;

  const CameraPreviewWidget({
    required this.onPictureTaken,
    required this.onVideoRecorded,
    this.enableVideo = true,
    this.enableFlash = true,
    this.enableSwitchCamera = true,
  });

  @override
  _CameraPreviewWidgetState createState() => _CameraPreviewWidgetState();
}

class _CameraPreviewWidgetState extends State<CameraPreviewWidget> {
  bool _isRecording = false;
  bool _isProcessing = false;
  double _zoomLevel = 1.0;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    CameraManager.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      await CameraManager.initialize();
      setState(() {});
    } catch (e) {
      _showErrorDialog('相机初始化失败', e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!CameraManager.isInitialized) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.white),
              SizedBox(height: 16),
              Text(
                '正在初始化相机...',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 相机预览
          Positioned.fill(
            child: CameraPreview(CameraManager.controller!),
          ),

          // 控制按钮
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildControls(),
          ),

          // 缩放控制
          if (CameraManager.currentCamera != null &&
              CameraManager.currentCamera!.lensDirection == CameraLensDirection.back)
            Positioned(
              right: 16,
              top: MediaQuery.of(context).size.height * 0.3,
              bottom: MediaQuery.of(context).size.height * 0.3,
              child: _buildZoomControls(),
            ),

          // 顶部工具栏
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _buildTopBar(),
          ),
        ],
      ),
    );
  }

  Widget _buildControls() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 32, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // 相册按钮
          IconButton(
            icon: Icon(Icons.photo_library, color: Colors.white, size: 32),
            onPressed: _openGallery,
          ),

          // 拍照/录像按钮
          GestureDetector(
            onTap: _isProcessing ? null : _captureMedia,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
                color: _isRecording ? Colors.red : Colors.transparent,
              ),
              child: _isRecording
                  ? Icon(Icons.stop, color: Colors.white, size: 40)
                  : Container(
                      margin: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),

          // 切换相机按钮
          if (widget.enableSwitchCamera && CameraManager.cameras.length > 1)
            IconButton(
              icon: Icon(Icons.flip_camera_ios, color: Colors.white, size: 32),
              onPressed: _switchCamera,
            ),
        ],
      ),
    );
  }

  Widget _buildZoomControls() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: Icon(Icons.zoom_in, color: Colors.white),
          onPressed: () => _changeZoom(0.1),
        ),
        Expanded(
          child: RotatedBox(
            quarterTurns: 3,
            child: Slider(
              value: _zoomLevel,
              min: 1.0,
              max: 5.0,
              activeColor: Colors.white,
              inactiveColor: Colors.white.withOpacity(0.5),
              onChanged: _onZoomChanged,
            ),
          ),
        ),
        IconButton(
          icon: Icon(Icons.zoom_out, color: Colors.white),
          onPressed: () => _changeZoom(-0.1),
        ),
      ],
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // 返回按钮
          IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),

          // 闪光灯按钮
          if (widget.enableFlash)
            IconButton(
              icon: Icon(_getFlashIcon(), color: Colors.white),
              onPressed: _toggleFlash,
            ),
        ],
      ),
    );
  }

  IconData _getFlashIcon() {
    switch (CameraManager.flashMode) {
      case FlashMode.auto:
        return Icons.flash_auto;
      case FlashMode.on:
        return Icons.flash_on;
      case FlashMode.off:
        return Icons.flash_off;
    }
  }

  Future<void> _captureMedia() async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      if (_isRecording) {
        // 停止录像
        final video = await CameraManager.stopVideoRecording();
        setState(() {
          _isRecording = false;
        });
        widget.onVideoRecorded(video);
      } else {
        // 拍照
        final picture = await CameraManager.takePicture();
        widget.onPictureTaken(picture);
      }
    } catch (e) {
      _showErrorDialog('操作失败', e.toString());
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<void> _switchCamera() async {
    try {
      await CameraManager.switchCamera();
      setState(() {});
    } catch (e) {
      _showErrorDialog('切换相机失败', e.toString());
    }
  }

  Future<void> _toggleFlash() async {
    try {
      await CameraManager.toggleFlash();
      setState(() {});
    } catch (e) {
      _showErrorDialog('设置闪光灯失败', e.toString());
    }
  }

  void _onZoomChanged(double value) {
    setState(() {
      _zoomLevel = value;
    });
    CameraManager.setZoomLevel(value);
  }

  void _changeZoom(double delta) {
    final newZoom = (_zoomLevel + delta).clamp(1.0, 5.0);
    _onZoomChanged(newZoom);
  }

  Future<void> _openGallery() async {
    final hasPermission = await CameraPermissionManager.checkPhotoPermissions();
    if (!hasPermission) {
      final granted = await CameraPermissionManager.requestPhotoPermissions();
      if (!granted) {
        _showPermissionDialog();
        return;
      }
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => GalleryPage(
          onMediaSelected: (media) {
            Navigator.pop(context);
            if (media.type == MediaType.image) {
              widget.onPictureTaken(media.file);
            } else {
              widget.onVideoRecorded(media.file);
            }
          },
        ),
      ),
    );
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('确定'),
          ),
        ],
      ),
    );
  }

  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('需要权限'),
        content: Text('应用需要相册权限来选择图片和视频'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              CameraPermissionManager.openSettings();
            },
            child: Text('去设置'),
          ),
        ],
      ),
    );
  }
}
```

## 第四章：相册功能实现

### 4.1 相册管理器

```dart
import 'package:photo_manager/photo_manager.dart';

class GalleryManager {
  static List<AssetEntity> _images = [];
  static List<AssetEntity> _videos = [];
  static List<AssetPathEntity> _albums = [];
  static bool _isInitialized = false;

  static List<AssetEntity> get images => _images;
  static List<AssetEntity> get videos => _videos;
  static List<AssetPathEntity> get albums => _albums;
  static bool get isInitialized => _isInitialized;

  static Future<void> initialize() async {
    try {
      final hasPermission = await CameraPermissionManager.checkPhotoPermissions();
      if (!hasPermission) {
        final granted = await CameraPermissionManager.requestPhotoPermissions();
        if (!granted) {
          throw GalleryException('需要相册权限');
        }
      }

      // 获取所有相册
      _albums = await PhotoManager.getAssetPathList(
        type: RequestType.common,
        hasAll: true,
      );

      // 获取最新图片和视频
      await _loadRecentMedia();

      _isInitialized = true;
    } catch (e) {
      throw GalleryException('相册初始化失败：${e.toString()}');
    }
  }

  static Future<void> _loadRecentMedia() async {
    try {
      // 获取最新图片
      final imageResult = await PhotoManager.getAssetListPaged(
        page: 0,
        size: 100,
        type: RequestType.image,
      );
      _images = imageResult;

      // 获取最新视频
      final videoResult = await PhotoManager.getAssetListPaged(
        page: 0,
        size: 100,
        type: RequestType.video,
      );
      _videos = videoResult;
    } catch (e) {
      throw GalleryException('加载媒体文件失败：${e.toString()}');
    }
  }

  static Future<List<AssetEntity>> getAlbumMedia(AssetPathEntity album) async {
    try {
      final mediaList = await album.getAssetListPaged(
        page: 0,
        size: 1000,
      );
      return mediaList;
    } catch (e) {
      throw GalleryException('获取相册媒体失败：${e.toString()}');
    }
  }

  static Future<File?> getThumbnail(AssetEntity asset, {int size = 200}) async {
    try {
      final thumbnail = await asset.thumbnailDataWithSize(
        ThumbnailSize(size, size),
        quality: 80,
      );

      if (thumbnail != null) {
        final tempDir = await getTemporaryDirectory();
        final tempFile = File('${tempDir.path}/thumbnail_${asset.id}.jpg');
        await tempFile.writeAsBytes(thumbnail);
        return tempFile;
      }

      return null;
    } catch (e) {
      throw GalleryException('生成缩略图失败：${e.toString()}');
    }
  }

  static Future<File?> getOriginalFile(AssetEntity asset) async {
    try {
      final file = await asset.file;
      return file;
    } catch (e) {
      throw GalleryException('获取原文件失败：${e.toString()}');
    }
  }

  static Future<void> saveImage(File imageFile, {String? title}) async {
    try {
      await PhotoManager.editor.saveImage(
        await imageFile.readAsBytes(),
        title: title ?? 'Image_${DateTime.now().millisecondsSinceEpoch}',
      );

      // 刷新媒体列表
      await _loadRecentMedia();
    } catch (e) {
      throw GalleryException('保存图片失败：${e.toString()}');
    }
  }

  static Future<void> saveVideo(File videoFile, {String? title}) async {
    try {
      await PhotoManager.editor.saveVideo(
        videoFile,
        title: title ?? 'Video_${DateTime.now().millisecondsSinceEpoch}',
      );

      // 刷新媒体列表
      await _loadRecentMedia();
    } catch (e) {
      throw GalleryException('保存视频失败：${e.toString()}');
    }
  }

  static Future<void> deleteMedia(AssetEntity asset) async {
    try {
      await PhotoManager.editor.deleteWithIds([asset.id]);

      // 从列表中移除
      _images.remove(asset);
      _videos.remove(asset);
    } catch (e) {
      throw GalleryException('删除媒体失败：${e.toString()}');
    }
  }

  static Future<void> createAlbum(String name) async {
    try {
      await PhotoManager.editor.createPath(name: name);

      // 刷新相册列表
      _albums = await PhotoManager.getAssetPathList(
        type: RequestType.common,
        hasAll: true,
      );
    } catch (e) {
      throw GalleryException('创建相册失败：${e.toString()}');
    }
  }

  static Future<void> addToAlbum(AssetEntity asset, AssetPathEntity album) async {
    try {
      await PhotoManager.editor.duplicateAsset(
        asset,
        path: album.id,
      );
    } catch (e) {
      throw GalleryException('添加到相册失败：${e.toString()}');
    }
  }

  static Future<MediaMetadata?> getMediaMetadata(AssetEntity asset) async {
    try {
      final title = asset.title;
      final createTime = asset.createDateTime;
      final modifyTime = asset.modifiedDateTime;
      final size = await asset.size;
      final mimeType = asset.mimeType;

      if (asset.type == AssetType.image) {
        final width = await asset.width;
        final height = await asset.height;
        final latitude = await asset.latitude;
        final longitude = await asset.longitude;

        return MediaMetadata(
          title: title,
          createTime: createTime,
          modifyTime: modifyTime,
          size: size,
          mimeType: mimeType,
          width: width,
          height: height,
          latitude: latitude,
          longitude: longitude,
        );
      } else if (asset.type == AssetType.video) {
        final width = await asset.width;
        final height = await asset.height;
        final duration = await asset.videoDuration;
        final latitude = await asset.latitude;
        final longitude = await asset.longitude;

        return MediaMetadata(
          title: title,
          createTime: createTime,
          modifyTime: modifyTime,
          size: size,
          mimeType: mimeType,
          width: width,
          height: height,
          duration: duration,
          latitude: latitude,
          longitude: longitude,
        );
      }

      return null;
    } catch (e) {
      throw GalleryException('获取媒体元数据失败：${e.toString()}');
    }
  }

  static Future<void> refresh() async {
    await _loadRecentMedia();
  }
}

class GalleryException implements Exception {
  final String message;
  final String? code;

  GalleryException(this.message, {this.code});

  @override
  String toString() {
    return 'GalleryException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}

class MediaMetadata {
  final String? title;
  final DateTime? createTime;
  final DateTime? modifyTime;
  final int? size;
  final String? mimeType;
  final int? width;
  final int? height;
  final Duration? duration;
  final double? latitude;
  final double? longitude;

  MediaMetadata({
    this.title,
    this.createTime,
    this.modifyTime,
    this.size,
    this.mimeType,
    this.width,
    this.height,
    this.duration,
    this.latitude,
    this.longitude,
  });

  String get formattedSize {
    if (size == null) return 'Unknown';

    if (size! < 1024) {
      return '${size!} B';
    } else if (size! < 1024 * 1024) {
      return '${(size! / 1024).toStringAsFixed(1)} KB';
    } else if (size! < 1024 * 1024 * 1024) {
      return '${(size! / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(size! / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }

  String get formattedDuration {
    if (duration == null) return 'Unknown';

    final minutes = duration!.inMinutes;
    final seconds = duration!.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  String get formattedResolution {
    if (width == null || height == null) return 'Unknown';
    return '${width}x$height';
  }
}

enum MediaType { image, video }

class MediaItem {
  final AssetEntity asset;
  final File? thumbnail;
  final MediaType type;
  final MediaMetadata? metadata;

  MediaItem({
    required this.asset,
    this.thumbnail,
    required this.type,
    this.metadata,
  });
}
```

### 4.2 相册 UI 组件

```dart
class GalleryPage extends StatefulWidget {
  final Function(MediaItem) onMediaSelected;
  final bool allowMultiple;
  final MediaType? mediaType;

  const GalleryPage({
    required this.onMediaSelected,
    this.allowMultiple = false,
    this.mediaType,
  });

  @override
  _GalleryPageState createState() => _GalleryPageState();
}

class _GalleryPageState extends State<GalleryPage>
    with SingleTickerProviderStateMixin {
  TabController? _tabController;
  List<MediaItem> _images = [];
  List<MediaItem> _videos = [];
  List<AssetPathEntity> _albums = [];
  Set<String> _selectedItems = {};
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeGallery();
  }

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('相册'),
        actions: [
          if (widget.allowMultiple && _selectedItems.isNotEmpty)
            TextButton(
              onPressed: _confirmSelection,
              child: Text(
                '确定(${_selectedItems.length})',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ],
        bottom: widget.mediaType == null
            ? TabBar(
                controller: _tabController,
                tabs: [
                  Tab(text: '图片'),
                  Tab(text: '视频'),
                  Tab(text: '相册'),
                ],
              )
            : null,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, size: 64, color: Colors.red),
            SizedBox(height: 16),
            Text(_errorMessage!),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _retry,
              child: Text('重试'),
            ),
          ],
        ),
      );
    }

    if (widget.mediaType == MediaType.image) {
      return _buildImageGrid();
    } else if (widget.mediaType == MediaType.video) {
      return _buildVideoGrid();
    } else {
      return TabBarView(
        controller: _tabController,
        children: [
          _buildImageGrid(),
          _buildVideoGrid(),
          _buildAlbumList(),
        ],
      );
    }
  }

  Widget _buildImageGrid() {
    if (_images.isEmpty) {
      return _buildEmptyWidget('没有图片');
    }

    return GridView.builder(
      padding: EdgeInsets.all(4),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: _images.length,
      itemBuilder: (context, index) {
        final mediaItem = _images[index];
        return _buildMediaItem(mediaItem, index);
      },
    );
  }

  Widget _buildVideoGrid() {
    if (_videos.isEmpty) {
      return _buildEmptyWidget('没有视频');
    }

    return GridView.builder(
      padding: EdgeInsets.all(4),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
        childAspectRatio: 16 / 9,
      ),
      itemCount: _videos.length,
      itemBuilder: (context, index) {
        final mediaItem = _videos[index];
        return _buildMediaItem(mediaItem, index);
      },
    );
  }

  Widget _buildAlbumList() {
    if (_albums.isEmpty) {
      return _buildEmptyWidget('没有相册');
    }

    return ListView.builder(
      itemCount: _albums.length,
      itemBuilder: (context, index) {
        final album = _albums[index];
        return _buildAlbumItem(album, index);
      },
    );
  }

  Widget _buildMediaItem(MediaItem mediaItem, int index) {
    final isSelected = _selectedItems.contains(mediaItem.asset.id);

    return GestureDetector(
      onTap: () => _onMediaTapped(mediaItem),
      onLongPress: () => _onMediaLongPressed(mediaItem),
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              border: isSelected
                  ? Border.all(color: Colors.blue, width: 3)
                  : null,
            ),
            child: mediaItem.thumbnail != null
                ? Image.file(
                    mediaItem.thumbnail!,
                    fit: BoxFit.cover,
                  )
                : Container(
                    color: Colors.grey[300],
                    child: Icon(
                      mediaItem.type == MediaType.image
                          ? Icons.image
                          : Icons.videocam,
                      color: Colors.grey[600],
                    ),
                  ),
          ),

          // 视频时长标签
          if (mediaItem.type == MediaType.video && mediaItem.metadata?.duration != null)
            Positioned(
              bottom: 4,
              right: 4,
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                color: Colors.black.withOpacity(0.7),
                child: Text(
                  mediaItem.metadata!.formattedDuration,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                  ),
                ),
              ),
            ),

          // 选择标记
          if (widget.allowMultiple && isSelected)
            Positioned(
              top: 4,
              right: 4,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAlbumItem(AssetPathEntity album, int index) {
    return ListTile(
      leading: FutureBuilder<File?>(
        future: _getAlbumThumbnail(album),
        builder: (context, snapshot) {
          if (snapshot.hasData && snapshot.data != null) {
            return CircleAvatar(
              backgroundImage: FileImage(snapshot.data!),
            );
          }
          return CircleAvatar(
            backgroundColor: Colors.grey[300],
            child: Icon(Icons.photo_album),
          );
        },
      ),
      title: Text(album.name),
      subtitle: Text('${album.assetCountAsync} 项'),
      trailing: Icon(Icons.chevron_right),
      onTap: () => _openAlbum(album),
    );
  }

  Widget _buildEmptyWidget(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.photo_library_outlined,
            size: 64,
            color: Colors.grey,
          ),
          SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _initializeGallery() async {
    try {
      await GalleryManager.initialize();

      // 加载缩略图
      final images = <MediaItem>[];
      for (final asset in GalleryManager.images) {
        final thumbnail = await GalleryManager.getThumbnail(asset);
        final metadata = await GalleryManager.getMediaMetadata(asset);
        images.add(MediaItem(
          asset: asset,
          thumbnail: thumbnail,
          type: MediaType.image,
          metadata: metadata,
        ));
      }

      final videos = <MediaItem>[];
      for (final asset in GalleryManager.videos) {
        final thumbnail = await GalleryManager.getThumbnail(asset);
        final metadata = await GalleryManager.getMediaMetadata(asset);
        videos.add(MediaItem(
          asset: asset,
          thumbnail: thumbnail,
          type: MediaType.video,
          metadata: metadata,
        ));
      }

      setState(() {
        _images = images;
        _videos = videos;
        _albums = GalleryManager.albums;
        _isLoading = false;
      });

      if (widget.mediaType == null) {
        _tabController = TabController(length: 3, vsync: this);
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<File?> _getAlbumThumbnail(AssetPathEntity album) async {
    try {
      final assets = await album.getAssetListRange(start: 0, end: 1);
      if (assets.isNotEmpty) {
        return await GalleryManager.getThumbnail(assets.first);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  void _onMediaTapped(MediaItem mediaItem) {
    if (widget.allowMultiple) {
      setState(() {
        if (_selectedItems.contains(mediaItem.asset.id)) {
          _selectedItems.remove(mediaItem.asset.id);
        } else {
          _selectedItems.add(mediaItem.asset.id);
        }
      });
    } else {
      widget.onMediaSelected(mediaItem);
      Navigator.pop(context);
    }
  }

  void _onMediaLongPressed(MediaItem mediaItem) {
    if (widget.allowMultiple) {
      _onMediaTapped(mediaItem);
    } else {
      _showMediaOptions(mediaItem);
    }
  }

  void _confirmSelection() {
    final selectedMedia = _images
        .where((item) => _selectedItems.contains(item.asset.id))
        .toList();

    for (final mediaItem in selectedMedia) {
      widget.onMediaSelected(mediaItem);
    }

    Navigator.pop(context);
  }

  void _openAlbum(AssetPathEntity album) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AlbumPage(
          album: album,
          onMediaSelected: widget.onMediaSelected,
          allowMultiple: widget.allowMultiple,
        ),
      ),
    );
  }

  void _showMediaOptions(MediaItem mediaItem) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: Icon(Icons.preview),
            title: Text('预览'),
            onTap: () {
              Navigator.pop(context);
              _previewMedia(mediaItem);
            },
          ),
          ListTile(
            leading: Icon(Icons.info),
            title: Text('详情'),
            onTap: () {
              Navigator.pop(context);
              _showMediaDetails(mediaItem);
            },
          ),
          ListTile(
            leading: Icon(Icons.delete),
            title: Text('删除'),
            onTap: () {
              Navigator.pop(context);
              _deleteMedia(mediaItem);
            },
          ),
        ],
      ),
    );
  }

  void _previewMedia(MediaItem mediaItem) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MediaPreviewPage(mediaItem: mediaItem),
      ),
    );
  }

  void _showMediaDetails(MediaItem mediaItem) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('媒体详情'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (mediaItem.metadata?.title != null)
                _buildDetailRow('标题', mediaItem.metadata!.title!),
              if (mediaItem.metadata?.formattedSize != null)
                _buildDetailRow('大小', mediaItem.metadata!.formattedSize),
              if (mediaItem.metadata?.formattedResolution != null)
                _buildDetailRow('分辨率', mediaItem.metadata!.formattedResolution),
              if (mediaItem.metadata?.formattedDuration != null)
                _buildDetailRow('时长', mediaItem.metadata!.formattedDuration),
              if (mediaItem.metadata?.createTime != null)
                _buildDetailRow('创建时间', mediaItem.metadata!.createTime.toString()),
              if (mediaItem.metadata?.mimeType != null)
                _buildDetailRow('类型', mediaItem.metadata!.mimeType!),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('确定'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
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
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Future<void> _deleteMedia(MediaItem mediaItem) async {
    try {
      await GalleryManager.deleteMedia(mediaItem.asset);
      setState(() {
        if (mediaItem.type == MediaType.image) {
          _images.remove(mediaItem);
        } else {
          _videos.remove(mediaItem);
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('删除失败：${e.toString()}')),
      );
    }
  }

  Future<void> _retry() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    await _initializeGallery();
  }
}
```

## 第五章：图片处理功能

### 5.1 图片编辑器

```dart
import 'package:image/image.dart' as img;

class ImageEditor {
  static Future<File> cropImage(
    File sourceFile, {
    required Rect cropRect,
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      final croppedImage = img.copyCrop(
        sourceImage,
        x: cropRect.left.toInt(),
        y: cropRect.top.toInt(),
        width: cropRect.width.toInt(),
        height: cropRect.height.toInt(),
      );

      final target = targetFile ?? await _createTempFile('cropped');
      await target.writeAsBytes(img.encodeJpg(croppedImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('裁剪图片失败：${e.toString()}');
    }
  }

  static Future<File> resizeImage(
    File sourceFile, {
    required int width,
    int? height,
    bool maintainAspectRatio = true,
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      img.Image resizedImage;

      if (maintainAspectRatio) {
        resizedImage = img.copyResize(
          sourceImage,
          width: width,
          maintainAspect: true,
        );
      } else {
        resizedImage = img.copyResize(
          sourceImage,
          width: width,
          height: height ?? width,
        );
      }

      final target = targetFile ?? await _createTempFile('resized');
      await target.writeAsBytes(img.encodeJpg(resizedImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('调整图片大小失败：${e.toString()}');
    }
  }

  static Future<File> rotateImage(
    File sourceFile, {
    required double angle,
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      final rotatedImage = img.copyRotate(sourceImage, angle: angle);

      final target = targetFile ?? await _createTempFile('rotated');
      await target.writeAsBytes(img.encodeJpg(rotatedImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('旋转图片失败：${e.toString()}');
    }
  }

  static Future<File> flipImage(
    File sourceFile, {
    required bool horizontal,
    required bool vertical,
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      img.Image flippedImage = sourceImage;

      if (horizontal) {
        flippedImage = img.flipHorizontal(flippedImage);
      }

      if (vertical) {
        flippedImage = img.flipVertical(flippedImage);
      }

      final target = targetFile ?? await _createTempFile('flipped');
      await target.writeAsBytes(img.encodeJpg(flippedImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('翻转图片失败：${e.toString()}');
    }
  }

  static Future<File> adjustBrightness(
    File sourceFile, {
    required double brightness, // -1.0 to 1.0
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      final adjustedImage = img.adjustColor(
        sourceImage,
        brightness: brightness,
      );

      final target = targetFile ?? await _createTempFile('brightness');
      await target.writeAsBytes(img.encodeJpg(adjustedImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('调整亮度失败：${e.toString()}');
    }
  }

  static Future<File> adjustContrast(
    File sourceFile, {
    required double contrast, // -1.0 to 1.0
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      final adjustedImage = img.adjustColor(
        sourceImage,
        contrast: contrast,
      );

      final target = targetFile ?? await _createTempFile('contrast');
      await target.writeAsBytes(img.encodeJpg(adjustedImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('调整对比度失败：${e.toString()}');
    }
  }

  static Future<File> applyFilter(
    File sourceFile, {
    required ImageFilter filter,
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      img.Image filteredImage;

      switch (filter) {
        case ImageFilter.grayscale:
          filteredImage = img.grayscale(sourceImage);
          break;
        case ImageFilter.sepia:
          filteredImage = img.sepia(sourceImage);
          break;
        case ImageFilter.vintage:
          filteredImage = img.vintage(sourceImage);
          break;
        case ImageFilter.invert:
          filteredImage = img.invert(sourceImage);
          break;
        default:
          filteredImage = sourceImage;
      }

      final target = targetFile ?? await _createTempFile('filtered');
      await target.writeAsBytes(img.encodeJpg(filteredImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('应用滤镜失败：${e.toString()}');
    }
  }

  static Future<File> addWatermark(
    File sourceFile, {
    required File watermarkFile,
    required WatermarkPosition position,
    double opacity = 0.5,
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      final watermarkBytes = await watermarkFile.readAsBytes();
      final watermarkImage = img.decodeImage(watermarkBytes);

      if (sourceImage == null || watermarkImage == null) {
        throw ImageEditException('无法解码图片');
      }

      // 调整水印大小
      final watermarkWidth = (sourceImage.width * 0.2).toInt();
      final watermarkHeight = (watermarkImage.height * watermarkWidth / watermarkImage.width).toInt();
      final resizedWatermark = img.copyResize(
        watermarkImage,
        width: watermarkWidth,
        height: watermarkHeight,
      );

      // 计算水印位置
      int x, y;
      switch (position) {
        case WatermarkPosition.topLeft:
          x = 10;
          y = 10;
          break;
        case WatermarkPosition.topRight:
          x = sourceImage.width - watermarkWidth - 10;
          y = 10;
          break;
        case WatermarkPosition.bottomLeft:
          x = 10;
          y = sourceImage.height - watermarkHeight - 10;
          break;
        case WatermarkPosition.bottomRight:
          x = sourceImage.width - watermarkWidth - 10;
          y = sourceImage.height - watermarkHeight - 10;
          break;
        case WatermarkPosition.center:
          x = (sourceImage.width - watermarkWidth) ~/ 2;
          y = (sourceImage.height - watermarkHeight) ~/ 2;
          break;
      }

      // 合并图片
      final resultImage = img.drawImage(
        sourceImage,
        resizedWatermark,
        dstX: x,
        dstY: y,
        alpha: (255 * opacity).toInt(),
      );

      final target = targetFile ?? await _createTempFile('watermarked');
      await target.writeAsBytes(img.encodeJpg(resultImage, quality: 90));

      return target;
    } catch (e) {
      throw ImageEditException('添加水印失败：${e.toString()}');
    }
  }

  static Future<File> compressImage(
    File sourceFile, {
    int quality = 80,
    int? maxSizeKB,
    File? targetFile,
  }) async {
    try {
      final sourceBytes = await sourceFile.readAsBytes();
      final sourceImage = img.decodeImage(sourceBytes);

      if (sourceImage == null) {
        throw ImageEditException('无法解码图片');
      }

      List<int> compressedBytes;
      int currentQuality = quality;

      do {
        compressedBytes = img.encodeJpg(sourceImage, quality: currentQuality);

        if (maxSizeKB == null ||
            compressedBytes.length <= maxSizeKB * 1024 ||
            currentQuality <= 10) {
          break;
        }

        currentQuality -= 10;
      } while (true);

      final target = targetFile ?? await _createTempFile('compressed');
      await target.writeAsBytes(compressedBytes);

      return target;
    } catch (e) {
      throw ImageEditException('压缩图片失败：${e.toString()}');
    }
  }

  static Future<File> _createTempFile(String prefix) async {
    final tempDir = await getTemporaryDirectory();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return File('${tempDir.path}/${prefix}_$timestamp.jpg');
  }
}

enum ImageFilter {
  grayscale,
  sepia,
  vintage,
  invert,
}

enum WatermarkPosition {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  center,
}

class ImageEditException implements Exception {
  final String message;
  final String? code;

  ImageEditException(this.message, {this.code});

  @override
  String toString() {
    return 'ImageEditException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}
```

## 故事结局：小张的成功

经过几个月的开发，小张的社交分享应用终于完成了！用户可以轻松地拍照、录像、选择相册中的媒体文件，并进行简单的编辑。

"相机和相册功能是社交应用的核心，通过合理的架构设计和用户体验优化，我们打造出了流畅的媒体处理体验。"小张在项目总结中写道，"特别是权限管理和错误处理，确保了应用的稳定性。"

小张的应用获得了用户的好评，特别是丰富的媒体功能和简洁的操作界面。他的成功证明了：**掌握相机和相册桥接技术，是开发媒体类应用的关键技能。**

## 总结

通过小张的社交分享应用开发故事，我们全面学习了 Flutter 相机和相册桥接技术：

### 核心技术

- **相机控制**：拍照、录像、闪光灯、对焦等
- **相册管理**：媒体浏览、选择、删除等
- **权限管理**：Android 和 iOS 的权限配置
- **媒体处理**：图片编辑、压缩、水印等

### 高级特性

- **多相机支持**：前后摄像头切换
- **实时预览**：相机预览和手势控制
- **批量操作**：多选和批量处理
- **元数据读取**：拍摄信息、地理位置等

### 最佳实践

- **用户体验**：流畅的界面和及时反馈
- **性能优化**：缩略图生成和内存管理
- **错误处理**：异常捕获和用户提示
- **平台适配**：Android 和 iOS 的差异处理

相机和相册桥接技术为 Flutter 应用打开了多媒体世界的大门，让开发者能够构建出丰富的媒体应用。掌握这些技术，将帮助你在移动应用开发中创造更多可能！
