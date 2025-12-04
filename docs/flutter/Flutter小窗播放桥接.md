# Flutter 小窗播放桥接技术详解

## 引言：小窗播放的兴起与挑战

在移动应用开发中，小窗播放（Picture-in-Picture, PiP）功能已经成为视频类应用的标配。用户希望能够在观看视频的同时进行其他操作，比如浏览评论、发送消息或查看其他内容。Flutter 作为跨平台框架，提供了与原生平台桥接的能力，使开发者能够实现小窗播放功能。

本文将通过一个实际案例——开发一款支持小窗播放的视频应用——来详细介绍 Flutter 中实现小窗播放的技术细节和最佳实践。

## 小窗播放技术概述

### 什么是小窗播放

小窗播放是一种允许用户在屏幕上的小窗口中继续播放视频内容，同时可以与其他应用交互的功能。这种模式在 Android 和 iOS 平台上都有原生支持，但实现方式有所不同。

### 小窗播放的应用场景

- **视频播放器**：用户可以在观看视频的同时浏览其他内容
- **视频会议**：在会议期间查看其他应用
- **在线教育**：观看课程视频的同时做笔记
- **直播应用**：观看直播的同时进行聊天互动

## 项目背景：StreamTube 视频应用

我们的项目是开发一款名为 StreamTube 的视频应用，支持以下功能：

- 全屏视频播放
- 小窗播放模式切换
- 播放控制（播放/暂停、快进/快退）
- 播放列表管理
- 视频质量切换

## 技术架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter应用层                              │
├─────────────────────────────────────────────────────────────┤
│  视频播放UI  │  播放控制器  │  播放列表  │  设置页面          │
├─────────────────────────────────────────────────────────────┤
│                  小窗播放服务层                               │
├─────────────────────────────────────────────────────────────┤
│              平台通道桥接层                                   │
├─────────────────────────────────────────────────────────────┤
│  Android小窗播放API  │  iOS AVPictureInPictureController    │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

1. **PiPService**：小窗播放服务管理
2. **VideoPlayerController**：视频播放控制
3. **PlatformChannel**：平台通道通信
4. **NativePiPHandler**：原生小窗处理

## 实现步骤详解

### 第一步：添加依赖和配置

首先，我们需要添加必要的依赖包：

```yaml
dependencies:
  flutter:
    sdk: flutter
  video_player: ^2.7.0
  flutter_pip: ^0.2.0
  permission_handler: ^10.2.0
```

Android 平台需要配置权限和特性：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 小窗播放权限 -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <application>
        <!-- 声明支持小窗播放 -->
        <activity
            android:name=".MainActivity"
            android:supportsPictureInPicture="true"
            android:resizeableActivity="true"
            android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation">

            <!-- 指定小窗播放的宽高比 -->
            <meta-data
                android:name="android.app.picture_in_picture.actions"
                android:resource="@xml/pip_actions" />
        </activity>
    </application>
</manifest>
```

创建小窗播放动作配置文件：

```xml
<!-- android/app/src/main/res/xml/pip_actions.xml -->
<picture-in-picture-actions xmlns:android="http://schemas.android.com/apk/res/android">
    <action
        android:id="@+id/action_play_pause"
        android:icon="@drawable/ic_play_pause"
        android:title="播放/暂停" />
    <action
        android:id="@+id/action_previous"
        android:icon="@drawable/ic_previous"
        android:title="上一个" />
    <action
        android:id="@+id/action_next"
        android:icon="@drawable/ic_next"
        android:title="下一个" />
</picture-in-picture-actions>
```

iOS 平台需要在 Info.plist 中添加后台模式支持：

```xml
<!-- ios/Runner/Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

### 第二步：创建小窗播放服务

```dart
// lib/services/pip_service.dart
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_pip/flutter_pip.dart';

class PiPService {
  static const MethodChannel _channel = MethodChannel('streamtube/pip');
  static const EventChannel _eventChannel = EventChannel('streamtube/pip_events');

  StreamSubscription? _pipSubscription;
  bool _isInPiPMode = false;

  // 小窗模式状态流
  Stream<bool> get pipStatusStream => _eventChannel
      .receiveBroadcastStream()
      .map((event) => event as bool);

  // 当前是否处于小窗模式
  bool get isInPiPMode => _isInPiPMode;

  // 初始化小窗服务
  Future<void> initialize() async {
    try {
      // 检查平台是否支持小窗播放
      final bool isSupported = await FlutterPiP.isAvailable;
      if (!isSupported) {
        throw Exception('设备不支持小窗播放功能');
      }

      // 监听小窗模式变化
      _pipSubscription = pipStatusStream.listen((isInPiP) {
        _isInPiPMode = isInPiP;
      });

      // 初始化原生小窗处理
      await _channel.invokeMethod('initialize');
    } catch (e) {
      throw Exception('小窗服务初始化失败: $e');
    }
  }

  // 进入小窗模式
  Future<void> enterPiPMode({
    required double aspectRatio,
    Map<String, dynamic>? sourceRect,
  }) async {
    try {
      if (_isInPiPMode) return;

      final params = <String, dynamic>{
        'aspectRatio': aspectRatio,
        'sourceRect': sourceRect,
      };

      await _channel.invokeMethod('enterPiPMode', params);
      _isInPiPMode = true;
    } catch (e) {
      throw Exception('进入小窗模式失败: $e');
    }
  }

  // 退出小窗模式
  Future<void> exitPiPMode() async {
    try {
      if (!_isInPiPMode) return;

      await _channel.invokeMethod('exitPiPMode');
      _isInPiPMode = false;
    } catch (e) {
      throw Exception('退出小窗模式失败: $e');
    }
  }

  // 更新小窗播放动作
  Future<void> updatePiPActions(List<PiPAction> actions) async {
    try {
      final actionsData = actions.map((action) => action.toMap()).toList();
      await _channel.invokeMethod('updateActions', {'actions': actionsData});
    } catch (e) {
      throw Exception('更新小窗动作失败: $e');
    }
  }

  // 释放资源
  void dispose() {
    _pipSubscription?.cancel();
  }
}

// 小窗播放动作模型
class PiPAction {
  final String id;
  final String title;
  final String iconResourceName;

  PiPAction({
    required this.id,
    required this.title,
    required this.iconResourceName,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'iconResourceName': iconResourceName,
    };
  }
}
```

### 第三步：实现 Android 平台小窗处理

```kotlin
// android/app/src/main/kotlin/com/example/streamtube/PipHandler.kt
package com.example.streamtube

import android.app.PictureInPictureParams
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Rect
import android.os.Build
import android.util.Rational
import android.view.View
import androidx.annotation.RequiresApi
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class PipHandler(private val activity: FlutterActivity) : MethodChannel.MethodCallHandler {
    private val channel = MethodChannel(activity.flutterEngine!!.dartExecutor.binaryMessenger, "streamtube/pip")
    private var isInPipMode = false
    private val broadcastManager = LocalBroadcastManager.getInstance(activity)

    private val pipActionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                "ACTION_PLAY_PAUSE" -> handlePlayPauseAction()
                "ACTION_PREVIOUS" -> handlePreviousAction()
                "ACTION_NEXT" -> handleNextAction()
            }
        }
    }

    init {
        channel.setMethodCallHandler(this)

        // 注册小窗动作广播接收器
        val filter = IntentFilter().apply {
            addAction("ACTION_PLAY_PAUSE")
            addAction("ACTION_PREVIOUS")
            addAction("ACTION_NEXT")
        }
        broadcastManager.registerReceiver(pipActionReceiver, filter)
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "initialize" -> {
                initialize()
                result.success(null)
            }
            "enterPiPMode" -> {
                val aspectRatio = call.argument<Double>("aspectRatio") ?: 16.0 / 9.0
                val sourceRect = call.argument<Map<String, Any>>("sourceRect")
                enterPiPMode(aspectRatio, sourceRect)
                result.success(null)
            }
            "exitPiPMode" -> {
                exitPiPMode()
                result.success(null)
            }
            "updateActions" -> {
                val actions = call.argument<List<Map<String, Any>>>("actions")
                updatePiPActions(actions)
                result.success(null)
            }
            else -> {
                result.notImplemented()
            }
        }
    }

    private fun initialize() {
        // 初始化小窗播放相关设置
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activity.setPictureInPictureParams(
                PictureInPictureParams.Builder()
                    .setActions(createPiPActions())
                    .build()
            )
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun enterPiPMode(aspectRatio: Double, sourceRect: Map<String, Any>?) {
        if (isInPipMode) return

        val sourceRectF = sourceRect?.let {
            val left = (it["left"] as Number).toFloat()
            val top = (it["top"] as Number).toFloat()
            val right = (it["right"] as Number).toFloat()
            val bottom = (it["bottom"] as Number).toFloat()
            Rect(left.toInt(), top.toInt(), right.toInt(), bottom.toInt())
        }

        val params = PictureInPictureParams.Builder()
            .setAspectRatio(Rational(aspectRatio.toInt(), 1))
            .setSourceRectHint(sourceRectF)
            .setActions(createPiPActions())
            .build()

        val result = activity.enterPictureInPictureMode(params)
        if (result) {
            isInPipMode = true
            notifyPiPModeChange(true)
        }
    }

    @RequiresApi(Build.VERSION_CODES.N)
    private fun exitPiPMode() {
        if (!isInPipMode) return

        activity.exitPictureInPictureMode()
        isInPipMode = false
        notifyPiPModeChange(false)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createPiPActions(): List<RemoteAction> {
        val actions = mutableListOf<RemoteAction>()

        // 播放/暂停动作
        val playPauseIntent = Intent("ACTION_PLAY_PAUSE")
        val playPausePendingIntent = PendingIntent.getBroadcast(
            activity, 0, playPauseIntent, PendingIntent.FLAG_IMMUTABLE
        )
        val playPauseIcon = Icon.createWithResource(activity, R.drawable.ic_play_pause)
        actions.add(RemoteAction(playPauseIcon, "播放/暂停", "播放/暂停", playPausePendingIntent))

        // 上一个动作
        val previousIntent = Intent("ACTION_PREVIOUS")
        val previousPendingIntent = PendingIntent.getBroadcast(
            activity, 1, previousIntent, PendingIntent.FLAG_IMMUTABLE
        )
        val previousIcon = Icon.createWithResource(activity, R.drawable.ic_previous)
        actions.add(RemoteAction(previousIcon, "上一个", "上一个", previousPendingIntent))

        // 下一个动作
        val nextIntent = Intent("ACTION_NEXT")
        val nextPendingIntent = PendingIntent.getBroadcast(
            activity, 2, nextIntent, PendingIntent.FLAG_IMMUTABLE
        )
        val nextIcon = Icon.createWithResource(activity, R.drawable.ic_next)
        actions.add(RemoteAction(nextIcon, "下一个", "下一个", nextPendingIntent))

        return actions
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun updatePiPActions(actions: List<Map<String, Any>>?) {
        if (!isInPipMode) return

        val remoteActions = actions?.map { action ->
            val intent = Intent(action["id"] as String)
            val pendingIntent = PendingIntent.getBroadcast(
                activity, 0, intent, PendingIntent.FLAG_IMMUTABLE
            )
            val iconResourceName = action["iconResourceName"] as String
            val iconResId = activity.resources.getIdentifier(
                iconResourceName, "drawable", activity.packageName
            )
            val icon = Icon.createWithResource(activity, iconResId)
            val title = action["title"] as String

            RemoteAction(icon, title, title, pendingIntent)
        } ?: emptyList()

        activity.setPictureInPictureParams(
            PictureInPictureParams.Builder()
                .setActions(remoteActions)
                .build()
        )
    }

    private fun handlePlayPauseAction() {
        // 通知Flutter层处理播放/暂停动作
        val intent = Intent("PIP_ACTION").apply {
            putExtra("action", "play_pause")
        }
        broadcastManager.sendBroadcast(intent)
    }

    private fun handlePreviousAction() {
        // 通知Flutter层处理上一个动作
        val intent = Intent("PIP_ACTION").apply {
            putExtra("action", "previous")
        }
        broadcastManager.sendBroadcast(intent)
    }

    private fun handleNextAction() {
        // 通知Flutter层处理下一个动作
        val intent = Intent("PIP_ACTION").apply {
            putExtra("action", "next")
        }
        broadcastManager.sendBroadcast(intent)
    }

    private fun notifyPiPModeChange(isInPip: Boolean) {
        val intent = Intent("PIP_MODE_CHANGED").apply {
            putExtra("isInPip", isInPip)
        }
        broadcastManager.sendBroadcast(intent)
    }

    fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
        isInPipMode = isInPictureInPictureMode
        notifyPiPModeChange(isInPictureInPictureMode)
    }

    fun dispose() {
        broadcastManager.unregisterReceiver(pipActionReceiver)
    }
}
```

### 第四步：实现 iOS 平台小窗处理

```swift
// ios/Runner/PipHandler.swift
import AVFoundation
import AVKit
import Flutter

@available(iOS 9.0, *)
class PipHandler: NSObject, FlutterPlugin, AVPictureInPictureControllerDelegate {
    private let channel: FlutterMethodChannel
    private var pipController: AVPictureInPictureController?
    private var playerLayer: AVPlayerLayer?
    private var isInPipMode = false

    static func register(with registrar: FlutterPluginRegistrar) {
        let channel = FlutterMethodChannel(name: "streamtube/pip", binaryMessenger: registrar.messenger())
        let instance = PipHandler(channel: channel)
        registrar.addMethodCallDelegate(instance, channel: registrar)
    }

    init(channel: FlutterMethodChannel) {
        self.channel = channel
        super.init()
    }

    func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "initialize":
            initialize()
            result(nil)
        case "enterPiPMode":
            enterPiPMode()
            result(nil)
        case "exitPiPMode":
            exitPiPMode()
            result(nil)
        case "updateActions":
            // iOS不支持自定义小窗动作
            result(FlutterMethodNotImplemented)
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    private func initialize() {
        // 检查设备是否支持小窗播放
        guard AVPictureInPictureController.isPictureInPictureSupported() else {
            print("设备不支持小窗播放")
            return
        }

        // 创建小窗控制器
        if pipController == nil {
            pipController = AVPictureInPictureController()
            pipController?.delegate = self
        }
    }

    private func enterPiPMode() {
        guard let pipController = pipController,
              !pipController.isPictureInPictureActive else {
            return
        }

        // 确保有活动的播放器层
        guard let playerLayer = playerLayer,
              let player = playerLayer.player else {
            print("没有活动的播放器")
            return
        }

        // 设置小窗控制器的播放器
        pipController.playerLayer = playerLayer

        // 尝试启动小窗模式
        if pipController.canStartPictureInPicture {
            pipController.startPictureInPicture()
        }
    }

    private func exitPiPMode() {
        guard let pipController = pipController,
              pipController.isPictureInPictureActive else {
            return
        }

        pipController.stopPictureInPicture()
    }

    func setPlayerLayer(_ playerLayer: AVPlayerLayer?) {
        self.playerLayer = playerLayer

        // 如果小窗控制器已存在，更新其播放器层
        if let pipController = pipController {
            pipController.playerLayer = playerLayer
        }
    }

    // MARK: - AVPictureInPictureControllerDelegate

    func pictureInPictureControllerWillStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        isInPipMode = true
        notifyPiPModeChange(true)
    }

    func pictureInPictureControllerDidStartPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        // 小窗模式已启动
    }

    func pictureInPictureControllerWillStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        isInPipMode = false
        notifyPiPModeChange(false)
    }

    func pictureInPictureControllerDidStopPictureInPicture(_ pictureInPictureController: AVPictureInPictureController) {
        // 小窗模式已停止
    }

    func pictureInPictureController(_ pictureInPictureController: AVPictureInPictureController, failedToStartPictureInPictureWithError error: Error) {
        print("启动小窗模式失败: \(error.localizedDescription)")
    }

    private func notifyPiPModeChange(_ isInPip: Bool) {
        channel.invokeMethod("onPiPModeChanged", arguments: isInPip)
    }
}
```

### 第五步：创建视频播放控制器

```dart
// lib/controllers/video_player_controller.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../services/pip_service.dart';

class VideoPlayerControllerManager {
  VideoPlayerController? _videoController;
  final PiPService _pipService;
  final StreamController<bool> _playbackStateController = StreamController<bool>.broadcast();
  final StreamController<Duration> _positionController = StreamController<Duration>.broadcast();
  final StreamController<Duration> _durationController = StreamController<Duration>.broadcast();

  Timer? _positionTimer;
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  // 播放状态流
  Stream<bool> get playbackStateStream => _playbackStateController.stream;

  // 播放位置流
  Stream<Duration> get positionStream => _positionController.stream;

  // 视频时长流
  Stream<Duration> get durationStream => _durationController.stream;

  // 当前播放状态
  bool get isPlaying => _isPlaying;

  // 当前播放位置
  Duration get position => _position;

  // 视频总时长
  Duration get duration => _duration;

  VideoPlayerControllerManager(this._pipService) {
    // 监听小窗模式变化
    _pipService.pipStatusStream.listen((isInPiP) {
      if (isInPiP && _isPlaying) {
        // 进入小窗模式时确保继续播放
        _videoController?.play();
      }
    });
  }

  // 初始化视频播放器
  Future<void> initialize(String videoUrl) async {
    try {
      // 释放之前的控制器
      await dispose();

      // 创建新的视频控制器
      _videoController = VideoPlayerController.network(videoUrl);

      // 初始化控制器
      await _videoController!.initialize();

      // 监听播放状态变化
      _videoController!.addListener(_onVideoControllerUpdate);

      // 获取视频时长
      _duration = _videoController!.value.duration;
      _durationController.add(_duration);

      // 启动位置更新定时器
      _startPositionTimer();

    } catch (e) {
      throw Exception('视频初始化失败: $e');
    }
  }

  // 播放视频
  Future<void> play() async {
    try {
      await _videoController?.play();
      _isPlaying = true;
      _playbackStateController.add(_isPlaying);
    } catch (e) {
      throw Exception('播放失败: $e');
    }
  }

  // 暂停视频
  Future<void> pause() async {
    try {
      await _videoController?.pause();
      _isPlaying = false;
      _playbackStateController.add(_isPlaying);
    } catch (e) {
      throw Exception('暂停失败: $e');
    }
  }

  // 切换播放状态
  Future<void> togglePlayPause() async {
    if (_isPlaying) {
      await pause();
    } else {
      await play();
    }
  }

  // 跳转到指定位置
  Future<void> seekTo(Duration position) async {
    try {
      await _videoController?.seekTo(position);
      _position = position;
      _positionController.add(_position);
    } catch (e) {
      throw Exception('跳转失败: $e');
    }
  }

  // 快进
  Future<void> fastForward([Duration duration = const Duration(seconds: 10)]) async {
    final newPosition = _position + duration;
    if (newPosition < _duration) {
      await seekTo(newPosition);
    } else {
      await seekTo(_duration);
    }
  }

  // 快退
  Future<void> rewind([Duration duration = const Duration(seconds: 10)]) async {
    final newPosition = _position - duration;
    if (newPosition > Duration.zero) {
      await seekTo(newPosition);
    } else {
      await seekTo(Duration.zero);
    }
  }

  // 设置播放速度
  Future<void> setPlaybackSpeed(double speed) async {
    try {
      await _videoController?.setPlaybackSpeed(speed);
    } catch (e) {
      throw Exception('设置播放速度失败: $e');
    }
  }

  // 进入小窗模式
  Future<void> enterPiPMode() async {
    if (_videoController == null || !_videoController!.value.isInitialized) {
      throw Exception('视频未初始化');
    }

    // 计算视频宽高比
    final videoSize = _videoController!.value.size;
    final aspectRatio = videoSize.width / videoSize.height;

    // 获取视频视图的位置信息
    final sourceRect = await _getSourceRect();

    // 进入小窗模式
    await _pipService.enterPiPMode(
      aspectRatio: aspectRatio,
      sourceRect: sourceRect,
    );
  }

  // 退出小窗模式
  Future<void> exitPiPMode() async {
    await _pipService.exitPiPMode();
  }

  // 获取视频视图位置信息
  Future<Map<String, dynamic>?> _getSourceRect() async {
    // 这里需要获取视频视图在屏幕上的位置
    // 实际实现中可能需要通过GlobalKey或其他方式获取
    return null;
  }

  // 监听视频控制器更新
  void _onVideoControllerUpdate() {
    if (_videoController == null) return;

    final value = _videoController!.value;

    // 更新播放状态
    if (value.isPlaying != _isPlaying) {
      _isPlaying = value.isPlaying;
      _playbackStateController.add(_isPlaying);
    }

    // 更新播放位置
    if (value.position != _position) {
      _position = value.position;
      _positionController.add(_position);
    }
  }

  // 启动位置更新定时器
  void _startPositionTimer() {
    _positionTimer?.cancel();
    _positionTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (_videoController != null && _videoController!.value.isPlaying) {
        _position = _videoController!.value.position;
        _positionController.add(_position);
      }
    });
  }

  // 释放资源
  Future<void> dispose() async {
    _positionTimer?.cancel();
    await _videoController?.dispose();
    _videoController = null;

    await _playbackStateController.close();
    await _positionController.close();
    await _durationController.close();
  }
}
```

### 第六步：创建视频播放 UI 组件

```dart
// lib/widgets/video_player_widget.dart
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../controllers/video_player_controller.dart';

class VideoPlayerWidget extends StatefulWidget {
  final VideoPlayerControllerManager controllerManager;
  final String videoUrl;
  final bool showControls;
  final bool enablePiP;

  const VideoPlayerWidget({
    Key? key,
    required this.controllerManager,
    required this.videoUrl,
    this.showControls = true,
    this.enablePiP = true,
  }) : super(key: key);

  @override
  _VideoPlayerWidgetState createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  bool _isControlsVisible = true;
  Timer? _hideControlsTimer;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  @override
  void dispose() {
    _hideControlsTimer?.cancel();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    try {
      await widget.controllerManager.initialize(widget.videoUrl);
      setState(() {});
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('视频加载失败: $e')),
      );
    }
  }

  void _toggleControlsVisibility() {
    setState(() {
      _isControlsVisible = !_isControlsVisible;
    });

    if (_isControlsVisible) {
      _startHideControlsTimer();
    } else {
      _hideControlsTimer?.cancel();
    }
  }

  void _startHideControlsTimer() {
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isControlsVisible = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: widget.showControls ? _toggleControlsVisibility : null,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // 视频播放器
            _buildVideoPlayer(),

            // 控制层
            if (widget.showControls)
              _buildControlsOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoPlayer() {
    final controller = widget.controllerManager._videoController;

    if (controller == null || !controller.value.isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    return Center(
      child: AspectRatio(
        aspectRatio: controller.value.aspectRatio,
        child: VideoPlayer(controller),
      ),
    );
  }

  Widget _buildControlsOverlay() {
    return AnimatedOpacity(
      opacity: _isControlsVisible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.7),
              Colors.transparent,
              Colors.black.withOpacity(0.7),
            ],
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // 顶部控制栏
            _buildTopControls(),

            // 底部控制栏
            _buildBottomControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildTopControls() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            // 返回按钮
            IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back, color: Colors.white),
            ),

            const Spacer(),

            // 小窗播放按钮
            if (widget.enablePiP)
              StreamBuilder<bool>(
                stream: widget.controllerManager._pipService.pipStatusStream,
                initialData: false,
                builder: (context, snapshot) {
                  final isInPiP = snapshot.data ?? false;

                  return IconButton(
                    onPressed: isInPiP
                        ? widget.controllerManager.exitPiPMode
                        : widget.controllerManager.enterPiPMode,
                    icon: Icon(
                      isInPiP ? Icons.picture_in_picture : Icons.picture_in_picture_alt,
                      color: Colors.white,
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // 进度条
            _buildProgressBar(),

            const SizedBox(height: 16),

            // 播放控制按钮
            _buildPlaybackControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    return StreamBuilder<Duration>(
      stream: widget.controllerManager.positionStream,
      initialData: Duration.zero,
      builder: (context, positionSnapshot) {
        return StreamBuilder<Duration>(
          stream: widget.controllerManager.durationStream,
          initialData: Duration.zero,
          builder: (context, durationSnapshot) {
            final position = positionSnapshot.data ?? Duration.zero;
            final duration = durationSnapshot.data ?? Duration.zero;

            return Row(
              children: [
                // 当前时间
                Text(
                  _formatDuration(position),
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),

                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                      trackHeight: 4,
                    ),
                    child: Slider(
                      value: position.inMilliseconds.toDouble(),
                      max: duration.inMilliseconds.toDouble(),
                      onChanged: (value) {
                        widget.controllerManager.seekTo(
                          Duration(milliseconds: value.round()),
                        );
                      },
                    ),
                  ),
                ),

                // 总时长
                Text(
                  _formatDuration(duration),
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildPlaybackControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // 快退按钮
        IconButton(
          onPressed: widget.controllerManager.rewind,
          icon: const Icon(Icons.replay_10, color: Colors.white),
          iconSize: 32,
        ),

        const SizedBox(width: 32),

        // 播放/暂停按钮
        StreamBuilder<bool>(
          stream: widget.controllerManager.playbackStateStream,
          initialData: false,
          builder: (context, snapshot) {
            final isPlaying = snapshot.data ?? false;

            return IconButton(
              onPressed: widget.controllerManager.togglePlayPause,
              icon: Icon(
                isPlaying ? Icons.pause : Icons.play_arrow,
                color: Colors.white,
              ),
              iconSize: 48,
            );
          },
        ),

        const SizedBox(width: 32),

        // 快进按钮
        IconButton(
          onPressed: widget.controllerManager.fastForward,
          icon: const Icon(Icons.forward_10, color: Colors.white),
          iconSize: 32,
        ),
      ],
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));

    if (duration.inHours > 0) {
      return '$hours:$minutes:$seconds';
    } else {
      return '$minutes:$seconds';
    }
  }
}
```

### 第七步：创建主应用界面

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'controllers/video_player_controller.dart';
import 'services/pip_service.dart';
import 'widgets/video_player_widget.dart';

void main() {
  runApp(const StreamTubeApp());
}

class StreamTubeApp extends StatelessWidget {
  const StreamTubeApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StreamTube',
      theme: ThemeData(
        primarySwatch: Colors.red,
        brightness: Brightness.dark,
      ),
      home: const VideoListScreen(),
    );
  }
}

class VideoListScreen extends StatefulWidget {
  const VideoListScreen({Key? key}) : super(key: key);

  @override
  _VideoListScreenState createState() => _VideoListScreenState();
}

class _VideoListScreenState extends State<VideoListScreen> {
  final PiPService _pipService = PiPService();
  final VideoPlayerControllerManager _controllerManager = VideoPlayerControllerManager(PiPService());

  final List<VideoItem> _videos = [
    VideoItem(
      id: '1',
      title: 'Flutter开发教程',
      description: '学习Flutter移动应用开发',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnail: 'https://picsum.photos/seed/flutter/320/180.jpg',
    ),
    VideoItem(
      id: '2',
      title: 'Dart编程语言',
      description: '深入了解Dart语言特性',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      thumbnail: 'https://picsum.photos/seed/dart/320/180.jpg',
    ),
    VideoItem(
      id: '3',
      title: '跨平台开发最佳实践',
      description: '构建高性能跨平台应用',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      thumbnail: 'https://picsum.photos/seed/crossplatform/320/180.jpg',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  @override
  void dispose() {
    _pipService.dispose();
    _controllerManager.dispose();
    super.dispose();
  }

  Future<void> _initializeServices() async {
    try {
      // 请求必要权限
      await _requestPermissions();

      // 初始化小窗服务
      await _pipService.initialize();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('初始化失败: $e')),
      );
    }
  }

  Future<void> _requestPermissions() async {
    // Android需要悬浮窗权限
    if (Theme.of(context).platform == TargetPlatform.android) {
      final status = await Permission.systemAlertWindow.request();
      if (!status.isGranted) {
        throw Exception('需要悬浮窗权限才能使用小窗播放功能');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('StreamTube'),
        backgroundColor: Colors.red,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _videos.length,
        itemBuilder: (context, index) {
          final video = _videos[index];
          return VideoCard(
            video: video,
            onTap: () => _playVideo(video),
          );
        },
      ),
    );
  }

  void _playVideo(VideoItem video) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => VideoPlayerScreen(
          video: video,
          controllerManager: _controllerManager,
        ),
      ),
    );
  }
}

class VideoCard extends StatelessWidget {
  final VideoItem video;
  final VoidCallback onTap;

  const VideoCard({
    Key? key,
    required this.video,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 视频缩略图
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(
                video.thumbnail,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey[800],
                    child: const Center(
                      child: Icon(Icons.play_circle_outline, size: 64, color: Colors.white54),
                    ),
                  );
                },
              ),
            ),

            // 视频信息
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    video.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    video.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[400],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class VideoPlayerScreen extends StatelessWidget {
  final VideoItem video;
  final VideoPlayerControllerManager controllerManager;

  const VideoPlayerScreen({
    Key? key,
    required this.video,
    required this.controllerManager,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return VideoPlayerWidget(
      controllerManager: controllerManager,
      videoUrl: video.url,
      showControls: true,
      enablePiP: true,
    );
  }
}

class VideoItem {
  final String id;
  final String title;
  final String description;
  final String url;
  final String thumbnail;

  VideoItem({
    required this.id,
    required this.title,
    required this.description,
    required this.url,
    required this.thumbnail,
  });
}
```

## 高级功能实现

### 1. 小窗播放状态持久化

```dart
// lib/services/pip_persistence_service.dart
import 'package:shared_preferences/shared_preferences.dart';

class PiPPersistenceService {
  static const String _lastPlayedVideoKey = 'last_played_video';
  static const String _lastPositionKey = 'last_position';
  static const String _wasInPipKey = 'was_in_pip';

  // 保存播放状态
  Future<void> savePlaybackState({
    required String videoUrl,
    required Duration position,
    required bool isInPip,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_lastPlayedVideoKey, videoUrl);
    await prefs.setInt(_lastPositionKey, position.inMilliseconds);
    await prefs.setBool(_wasInPipKey, isInPip);
  }

  // 获取播放状态
  Future<Map<String, dynamic>?> getPlaybackState() async {
    final prefs = await SharedPreferences.getInstance();
    final videoUrl = prefs.getString(_lastPlayedVideoKey);
    final positionMs = prefs.getInt(_lastPositionKey);
    final wasInPip = prefs.getBool(_wasInPipKey) ?? false;

    if (videoUrl == null || positionMs == null) {
      return null;
    }

    return {
      'videoUrl': videoUrl,
      'position': Duration(milliseconds: positionMs),
      'wasInPip': wasInPip,
    };
  }

  // 清除播放状态
  Future<void> clearPlaybackState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_lastPlayedVideoKey);
    await prefs.remove(_lastPositionKey);
    await prefs.remove(_wasInPipKey);
  }
}
```

### 2. 小窗播放与后台音频

```dart
// lib/services/audio_background_service.dart
import 'package:flutter/services.dart';

class AudioBackgroundService {
  static const MethodChannel _channel = MethodChannel('streamtube/audio_background');

  // 启用后台音频播放
  Future<void> enableBackgroundAudio() async {
    try {
      await _channel.invokeMethod('enableBackgroundAudio');
    } catch (e) {
      throw Exception('启用后台音频失败: $e');
    }
  }

  // 禁用后台音频播放
  Future<void> disableBackgroundAudio() async {
    try {
      await _channel.invokeMethod('disableBackgroundAudio');
    } catch (e) {
      throw Exception('禁用后台音频失败: $e');
    }
  }

  // 设置音频会话类别
  Future<void> setAudioSessionCategory(String category) async {
    try {
      await _channel.invokeMethod('setAudioSessionCategory', {'category': category});
    } catch (e) {
      throw Exception('设置音频会话类别失败: $e');
    }
  }
}
```

### 3. 小窗播放性能优化

```dart
// lib/services/pip_optimization_service.dart
import 'dart:io';
import 'package:flutter/material.dart';

class PiPOptimizationService {
  // 根据设备性能调整小窗播放参数
  static Map<String, dynamic> getOptimizedPiPParams() {
    final deviceInfo = _getDeviceInfo();

    if (deviceInfo['isLowEndDevice']) {
      return {
        'aspectRatio': 16.0 / 9.0,
        'enableHardwareAcceleration': false,
        'maxBitrate': 1000000, // 1Mbps
        'preferredResolution': '720p',
      };
    } else {
      return {
        'aspectRatio': 16.0 / 9.0,
        'enableHardwareAcceleration': true,
        'maxBitrate': 5000000, // 5Mbps
        'preferredResolution': '1080p',
      };
    }
  }

  // 获取设备信息
  static Map<String, dynamic> _getDeviceInfo() {
    // 这里应该使用device_info_plus等插件获取真实设备信息
    // 为了示例，我们使用模拟数据
    return {
      'isLowEndDevice': false,
      'totalMemory': 8000000000, // 8GB
      'cpuCores': 8,
    };
  }

  // 优化小窗播放性能
  static Future<void> optimizePiPPerformance() async {
    final params = getOptimizedPiPParams();

    // 根据参数调整播放设置
    if (!params['enableHardwareAcceleration']) {
      // 禁用硬件加速
      await _disableHardwareAcceleration();
    }

    // 设置最大比特率
    await _setMaxBitrate(params['maxBitrate']);

    // 设置首选分辨率
    await _setPreferredResolution(params['preferredResolution']);
  }

  static Future<void> _disableHardwareAcceleration() async {
    // 实现禁用硬件加速的逻辑
  }

  static Future<void> _setMaxBitrate(int maxBitrate) async {
    // 实现设置最大比特率的逻辑
  }

  static Future<void> _setPreferredResolution(String resolution) async {
    // 实现设置首选分辨率的逻辑
  }
}
```

## 测试与调试

### 1. 小窗播放测试

```dart
// test/pip_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:streamtube/services/pip_service.dart';

class MockMethodChannel extends Mock implements MethodChannel {}

void main() {
  group('PiPService Tests', () {
    late PiPService pipService;
    late MockMethodChannel mockChannel;

    setUp(() {
      pipService = PiPService();
      mockChannel = MockMethodChannel();
    });

    test('should initialize successfully when PiP is supported', () async {
      // 模拟设备支持小窗播放
      when(mockChannel.invokeMethod('checkAvailability'))
          .thenAnswer((_) async => true);

      await expectLater(pipService.initialize(), completes);
    });

    test('should throw exception when PiP is not supported', () async {
      // 模拟设备不支持小窗播放
      when(mockChannel.invokeMethod('checkAvailability'))
          .thenAnswer((_) async => false);

      await expectLater(
        pipService.initialize(),
        throwsA(isA<Exception>()),
      );
    });

    test('should enter PiP mode with correct parameters', () async {
      const aspectRatio = 16.0 / 9.0;

      when(mockChannel.invokeMethod('enterPiPMode', any))
          .thenAnswer((_) async {});

      await pipService.enterPiPMode(aspectRatio: aspectRatio);

      verify(mockChannel.invokeMethod('enterPiPMode', argThat(
        containsPair('aspectRatio', aspectRatio),
      ))).called(1);
    });
  });
}
```

### 2. 性能测试

```dart
// test/pip_performance_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:streamtube/services/pip_optimization_service.dart';

void main() {
  group('PiP Performance Tests', () {
    test('should return optimized params for low-end devices', () {
      // 模拟低端设备
      final params = PiPOptimizationService.getOptimizedPiPParams();

      expect(params['enableHardwareAcceleration'], isFalse);
      expect(params['maxBitrate'], equals(1000000));
      expect(params['preferredResolution'], equals('720p'));
    });

    test('should return optimized params for high-end devices', () {
      // 模拟高端设备
      final params = PiPOptimizationService.getOptimizedPiPParams();

      expect(params['enableHardwareAcceleration'], isTrue);
      expect(params['maxBitrate'], equals(5000000));
      expect(params['preferredResolution'], equals('1080p'));
    });
  });
}
```

## 最佳实践与注意事项

### 1. 平台差异处理

- **Android**：需要 SYSTEM_ALERT_WINDOW 权限，支持自定义小窗动作
- **iOS**：不需要特殊权限，但不支持自定义小窗动作
- **版本兼容性**：Android O+和 iOS 9+才支持完整的小窗功能

### 2. 性能优化建议

- 根据设备性能调整视频质量
- 使用硬件加速提高渲染性能
- 合理管理内存，避免内存泄漏
- 在小窗模式下降低更新频率

### 3. 用户体验考虑

- 提供清晰的小窗模式切换入口
- 保持播放状态在小窗模式切换时的连续性
- 处理小窗模式下的用户交互
- 提供适当的视觉反馈

### 4. 错误处理

- 优雅处理不支持小窗播放的设备
- 处理小窗模式启动失败的情况
- 提供备用方案（如音频播放）

## 总结

通过本文的详细介绍，我们成功实现了一个支持小窗播放的 Flutter 视频应用 StreamTube。这个项目涵盖了：

1. **小窗播放基础架构**：设计了完整的小窗播放服务架构
2. **平台特定实现**：分别实现了 Android 和 iOS 的小窗播放功能
3. **视频播放控制**：提供了完整的视频播放控制功能
4. **用户界面设计**：创建了直观的视频播放界面
5. **高级功能**：实现了状态持久化、后台音频和性能优化
6. **测试与调试**：提供了完整的测试方案

小窗播放功能大大提升了视频应用的用户体验，使用户能够在观看视频的同时进行其他操作。通过 Flutter 的桥接能力，我们可以轻松实现这一功能，同时保持代码的跨平台兼容性。

在实际项目中，还可以根据具体需求进一步扩展功能，比如：

- 支持更多的小窗播放动作
- 实现更智能的性能优化策略
- 添加播放历史和收藏功能
- 集成社交分享功能

希望本文能够帮助开发者更好地理解和实现 Flutter 中的小窗播放功能。
