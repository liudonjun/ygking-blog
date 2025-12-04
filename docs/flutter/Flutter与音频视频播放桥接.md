---
description: 本文详细介绍Flutter应用如何实现音频视频播放功能，包括本地和在线媒体播放、播放控制、播放列表管理、后台播放等核心功能，以及Android和iOS平台的具体实现细节。
tag:
  - Flutter
  - 音频播放
  - 视频播放
  - 媒体控制
  - 后台播放
  - 播放器
sticky: 1
sidebar: true
---

# Flutter 与音频视频播放桥接

## 故事开始：小刘的音乐视频应用

小刘正在开发一个音乐视频播放应用，需要支持本地和在线媒体的播放、播放列表管理、后台播放等功能。他发现 Flutter 中的媒体播放比想象中要复杂。

"音频视频播放涉及格式兼容性、播放控制、后台模式、音频焦点等多个方面，而且 Android 和 iOS 的实现差异很大。"小刘在开发笔记中写道。

## 第一章：媒体播放技术基础

### 1.1 音频播放技术概述

现代移动设备的音频播放功能非常丰富：

**音频格式支持：**

- **MP3**：最广泛使用的音频格式
- **AAC**：高质量压缩格式，iOS 首选
- **FLAC**：无损音频格式
- **OGG**：开源音频格式
- **WAV**：无损音频格式，文件较大
- **M4A**：Apple 音频容器格式

**音频功能：**

- 播放、暂停、停止
- 快进、快退
- 音量控制
- 播放速度调节
- 均衡器
- 后台播放
- 音频会话管理

### 1.2 视频播放技术概述

视频播放技术相对复杂：

**视频格式支持：**

- **MP4**：最广泛使用的视频格式
- **MOV**：Apple 视频格式
- **AVI**：传统视频格式
- **MKV**：开源视频容器
- **WebM**：Web 优化视频格式
- **HLS**：HTTP Live Streaming

**视频功能：**

- 播放、暂停、停止
- 快进、快退
- 全屏播放
- 播放速度调节
- 字幕支持
- 画质切换
- 画中画模式

### 1.3 Flutter 媒体播放开发生态

Flutter 中媒体播放开发主要有以下几种方案：

1. **video_player** - 官方推荐的视频播放插件
2. **just_audio** - 功能强大的音频播放插件
3. **audioplayers** - 简单易用的音频播放插件
4. **自定义平台通道** - 完全自定义实现

## 第二章：环境搭建与基础配置

### 2.1 添加依赖

```yaml
dependencies:
  flutter:
    sdk: flutter
  video_player: ^2.8.1
  just_audio: ^0.9.36
  audio_session: ^0.1.16
  rxdart: ^0.27.7
  permission_handler: ^11.0.1
```

### 2.2 权限配置

**Android 权限配置（android/app/src/main/AndroidManifest.xml）**

```xml
<!-- 网络权限 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- 存储权限 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
                 android:maxSdkVersion="28" />

<!-- Android 13+ 需要这些权限 -->
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

<!-- 后台播放权限 -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

<!-- 音频焦点 -->
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

**iOS 权限配置（ios/Runner/Info.plist）**

```xml
<!-- 后台播放权限 -->
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>

<!-- 网络权限 -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 2.3 权限管理实现

```dart
import 'package:permission_handler/permission_handler.dart';

class MediaPermissionManager {
  static Future<bool> requestAudioPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        // Android 13+
        final audio = await Permission.audio.request();
        return audio.isGranted;
      } else {
        // Android 12及以下
        final storage = await Permission.storage.request();
        return storage.isGranted;
      }
    } else {
      // iOS不需要特殊权限
      return true;
    }
  }

  static Future<bool> requestVideoPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        // Android 13+
        final video = await Permission.videos.request();
        return video.isGranted;
      } else {
        // Android 12及以下
        final storage = await Permission.storage.request();
        return storage.isGranted;
      }
    } else {
      // iOS不需要特殊权限
      return true;
    }
  }

  static Future<bool> checkAudioPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        return await Permission.audio.isGranted;
      } else {
        return await Permission.storage.isGranted;
      }
    } else {
      return true;
    }
  }

  static Future<bool> checkVideoPermissions() async {
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      final sdkInt = androidInfo.version.sdkInt;

      if (sdkInt >= 33) {
        return await Permission.videos.isGranted;
      } else {
        return await Permission.storage.isGranted;
      }
    } else {
      return true;
    }
  }

  static Future<void> openSettings() async {
    await openAppSettings();
  }
}
```

## 第三章：音频播放功能实现

### 3.1 音频播放管理器

```dart
import 'package:just_audio/just_audio.dart';
import 'package:audio_session/audio_session.dart';

class AudioPlayerManager {
  static final AudioPlayerManager _instance = AudioPlayerManager._internal();
  factory AudioPlayerManager() => _instance;
  AudioPlayerManager._internal();

  final AudioPlayer _player = AudioPlayer();
  final List<AudioSource> _playlist = [];
  int _currentIndex = 0;
  bool _isInitialized = false;

  AudioPlayer get player => _player;
  List<AudioSource> get playlist => List.unmodifiable(_playlist);
  int get currentIndex => _currentIndex;
  bool get isInitialized => _isInitialized;

  Stream<PlayerState> get playerStateStream => _player.playerStateStream;
  Stream<Duration?> get positionStream => _player.positionStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<SequenceState?> get sequenceStateStream => _player.sequenceStateStream;

  Future<void> initialize() async {
    try {
      // 配置音频会话
      final session = await AudioSession.instance;
      await session.configure(const AudioSessionConfiguration.speech());

      // 设置播放器属性
      await _player.setLoopMode(LoopMode.off);
      await _player.setShuffleModeEnabled(false);

      _isInitialized = true;
    } catch (e) {
      throw AudioException('音频播放器初始化失败：${e.toString()}');
    }
  }

  Future<void> loadPlaylist(List<AudioSource> sources) async {
    try {
      _playlist.clear();
      _playlist.addAll(sources);
      _currentIndex = 0;

      await _player.setAudioSource(
        ConcatenatingAudioSource(children: _playlist),
        initialIndex: _currentIndex,
      );
    } catch (e) {
      throw AudioException('加载播放列表失败：${e.toString()}');
    }
  }

  Future<void> loadSingleAudio(AudioSource source) async {
    try {
      _playlist.clear();
      _playlist.add(source);
      _currentIndex = 0;

      await _player.setAudioSource(source);
    } catch (e) {
      throw AudioException('加载音频失败：${e.toString()}');
    }
  }

  Future<void> play() async {
    try {
      await _player.play();
    } catch (e) {
      throw AudioException('播放失败：${e.toString()}');
    }
  }

  Future<void> pause() async {
    try {
      await _player.pause();
    } catch (e) {
      throw AudioException('暂停失败：${e.toString()}');
    }
  }

  Future<void> stop() async {
    try {
      await _player.stop();
    } catch (e) {
      throw AudioException('停止失败：${e.toString()}');
    }
  }

  Future<void> seek(Duration position) async {
    try {
      await _player.seek(position);
    } catch (e) {
      throw AudioException('跳转失败：${e.toString()}');
    }
  }

  Future<void> next() async {
    try {
      await _player.seekToNext();
      _currentIndex = (_currentIndex + 1) % _playlist.length;
    } catch (e) {
      throw AudioException('下一首失败：${e.toString()}');
    }
  }

  Future<void> previous() async {
    try {
      await _player.seekToPrevious();
      _currentIndex = (_currentIndex - 1 + _playlist.length) % _playlist.length;
    } catch (e) {
      throw AudioException('上一首失败：${e.toString()}');
    }
  }

  Future<void> setVolume(double volume) async {
    try {
      await _player.setVolume(volume.clamp(0.0, 1.0));
    } catch (e) {
      throw AudioException('设置音量失败：${e.toString()}');
    }
  }

  Future<void> setSpeed(double speed) async {
    try {
      await _player.setSpeed(speed.clamp(0.5, 2.0));
    } catch (e) {
      throw AudioException('设置播放速度失败：${e.toString()}');
    }
  }

  Future<void> setLoopMode(LoopMode mode) async {
    try {
      await _player.setLoopMode(mode);
    } catch (e) {
      throw AudioException('设置循环模式失败：${e.toString()}');
    }
  }

  Future<void> setShuffleModeEnabled(bool enabled) async {
    try {
      await _player.setShuffleModeEnabled(enabled);
    } catch (e) {
      throw AudioException('设置随机播放失败：${e.toString()}');
    }
  }

  Future<void> addToPlaylist(AudioSource source) async {
    try {
      _playlist.add(source);
      await _player.setAudioSource(
        ConcatenatingAudioSource(children: _playlist),
        initialIndex: _currentIndex,
      );
    } catch (e) {
      throw AudioException('添加到播放列表失败：${e.toString()}');
    }
  }

  Future<void> removeFromPlaylist(int index) async {
    try {
      if (index < 0 || index >= _playlist.length) {
        throw AudioException('索引超出范围');
      }

      _playlist.removeAt(index);

      if (index < _currentIndex) {
        _currentIndex--;
      } else if (index == _currentIndex && _currentIndex >= _playlist.length) {
        _currentIndex = _playlist.length - 1;
      }

      await _player.setAudioSource(
        ConcatenatingAudioSource(children: _playlist),
        initialIndex: _currentIndex,
      );
    } catch (e) {
      throw AudioException('从播放列表移除失败：${e.toString()}');
    }
  }

  Future<void> clearPlaylist() async {
    try {
      _playlist.clear();
      _currentIndex = 0;
      await _player.setAudioSource(null);
    } catch (e) {
      throw AudioException('清空播放列表失败：${e.toString()}');
    }
  }

  Future<void> playAtIndex(int index) async {
    try {
      if (index < 0 || index >= _playlist.length) {
        throw AudioException('索引超出范围');
      }

      _currentIndex = index;
      await _player.seek(Duration.zero, index: index);
      await _player.play();
    } catch (e) {
      throw AudioException('播放指定索引失败：${e.toString()}');
    }
  }

  AudioSource? getCurrentAudio() {
    if (_currentIndex >= 0 && _currentIndex < _playlist.length) {
      return _playlist[_currentIndex];
    }
    return null;
  }

  Future<AudioMetadata?> getCurrentMetadata() async {
    final currentAudio = getCurrentAudio();
    if (currentAudio == null) return null;

    try {
      final sequenceState = await _player.sequenceState.first;
      final currentSource = sequenceState?.currentSource;

      if (currentSource != null) {
        return AudioMetadata(
          title: currentSource.tag.title ?? '未知标题',
          artist: currentSource.tag.artist ?? '未知艺术家',
          album: currentSource.tag.album ?? '未知专辑',
          duration: currentSource.tag.duration ?? Duration.zero,
          artwork: currentSource.tag.artwork,
        );
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> dispose() async {
    try {
      await _player.dispose();
      _isInitialized = false;
    } catch (e) {
      throw AudioException('释放播放器失败：${e.toString()}');
    }
  }
}

class AudioException implements Exception {
  final String message;
  final String? code;

  AudioException(this.message, {this.code});

  @override
  String toString() {
    return 'AudioException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}

class AudioMetadata {
  final String title;
  final String artist;
  final String album;
  final Duration duration;
  final Uint8List? artwork;

  AudioMetadata({
    required this.title,
    required this.artist,
    required this.album,
    required this.duration,
    this.artwork,
  });

  String get formattedDuration {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
```

### 3.2 音频播放 UI 组件

```dart
class AudioPlayerPage extends StatefulWidget {
  @override
  _AudioPlayerPageState createState() => _AudioPlayerPageState();
}

class _AudioPlayerPageState extends State<AudioPlayerPage> {
  final AudioPlayerManager _audioManager = AudioPlayerManager();
  PlayerState? _playerState;
  Duration? _position;
  Duration? _duration;
  AudioMetadata? _metadata;
  double _volume = 1.0;
  double _speed = 1.0;
  LoopMode _loopMode = LoopMode.off;
  bool _isShuffleModeEnabled = false;

  @override
  void initState() {
    super.initState();
    _initializeAudioPlayer();
  }

  @override
  void dispose() {
    _audioManager.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('音频播放器'),
        actions: [
          IconButton(
            icon: Icon(Icons.playlist_play),
            onPressed: _showPlaylist,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            _buildAlbumArt(),
            SizedBox(height: 24),
            _buildTrackInfo(),
            SizedBox(height: 24),
            _buildProgressBar(),
            SizedBox(height: 24),
            _buildPlaybackControls(),
            SizedBox(height: 24),
            _buildAdvancedControls(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadSampleAudio,
        child: Icon(Icons.add),
      ),
    );
  }

  Widget _buildAlbumArt() {
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.grey[300],
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: _metadata?.artwork != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.memory(
                _metadata!.artwork!,
                fit: BoxFit.cover,
              ),
            )
          : Icon(
              Icons.music_note,
              size: 80,
              color: Colors.grey[600],
            ),
    );
  }

  Widget _buildTrackInfo() {
    return Column(
      children: [
        Text(
          _metadata?.title ?? '未加载音频',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        SizedBox(height: 8),
        Text(
          '${_metadata?.artist ?? '未知艺术家'} • ${_metadata?.album ?? '未知专辑'}',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildProgressBar() {
    return Column(
      children: [
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            thumbShape: RoundSliderThumbShape(enabledThumbRadius: 8),
            trackHeight: 4,
          ),
          child: Slider(
            value: _position?.inMilliseconds.toDouble() ?? 0.0,
            max: _duration?.inMilliseconds.toDouble() ?? 0.0,
            onChanged: (value) {
              _audioManager.seek(Duration(milliseconds: value.toInt()));
            },
          ),
        ),
        SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(_formatDuration(_position)),
            Text(_formatDuration(_duration)),
          ],
        ),
      ],
    );
  }

  Widget _buildPlaybackControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        IconButton(
          icon: Icon(Icons.shuffle),
          onPressed: _toggleShuffleMode,
          color: _isShuffleModeEnabled ? Theme.of(context).primaryColor : null,
        ),
        IconButton(
          icon: Icon(Icons.skip_previous),
          onPressed: _audioManager.previous,
          iconSize: 40,
        ),
        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Theme.of(context).primaryColor,
          ),
          child: IconButton(
            icon: Icon(
              _playerState?.playing == true ? Icons.pause : Icons.play_arrow,
              color: Colors.white,
            ),
            onPressed: _togglePlayback,
            iconSize: 40,
          ),
        ),
        IconButton(
          icon: Icon(Icons.skip_next),
          onPressed: _audioManager.next,
          iconSize: 40,
        ),
        IconButton(
          icon: Icon(_getLoopModeIcon()),
          onPressed: _toggleLoopMode,
          color: _loopMode != LoopMode.off ? Theme.of(context).primaryColor : null,
        ),
      ],
    );
  }

  Widget _buildAdvancedControls() {
    return Column(
      children: [
        Row(
          children: [
            Icon(Icons.volume_up),
            SizedBox(width: 12),
            Expanded(
              child: Slider(
                value: _volume,
                onChanged: (value) {
                  setState(() {
                    _volume = value;
                  });
                  _audioManager.setVolume(value);
                },
              ),
            ),
            Text('${(_volume * 100).toInt()}%'),
          ],
        ),
        SizedBox(height: 16),
        Row(
          children: [
            Icon(Icons.speed,
            SizedBox(width: 12),
            Expanded(
              child: Slider(
                value: _speed,
                min: 0.5,
                max: 2.0,
                divisions: 3,
                onChanged: (value) {
                  setState(() {
                    _speed = value;
                  });
                  _audioManager.setSpeed(value);
                },
              ),
            ),
            Text('${_speed}x'),
          ],
        ),
      ],
    );
  }

  IconData _getLoopModeIcon() {
    switch (_loopMode) {
      case LoopMode.off:
        return Icons.loop;
      case LoopMode.one:
        return Icons.repeat_one;
      case LoopMode.all:
        return Icons.repeat;
    }
  }

  String _formatDuration(Duration? duration) {
    if (duration == null) return '00:00';

    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _initializeAudioPlayer() async {
    try {
      await _audioManager.initialize();

      // 监听播放状态
      _audioManager.playerStateStream.listen((state) {
        setState(() {
          _playerState = state;
        });
      });

      // 监听播放位置
      _audioManager.positionStream.listen((position) {
        setState(() {
          _position = position;
        });
      });

      // 监听音频时长
      _audioManager.durationStream.listen((duration) {
        setState(() {
          _duration = duration;
        });
      });

      // 监听当前播放的音频
      _audioManager.sequenceStateStream.listen((_) async {
        final metadata = await _audioManager.getCurrentMetadata();
        setState(() {
          _metadata = metadata;
        });
      });
    } catch (e) {
      _showErrorDialog('初始化失败', e.toString());
    }
  }

  void _togglePlayback() async {
    try {
      if (_playerState?.playing == true) {
        await _audioManager.pause();
      } else {
        await _audioManager.play();
      }
    } catch (e) {
      _showErrorDialog('播放失败', e.toString());
    }
  }

  void _toggleLoopMode() async {
    LoopMode nextMode;
    switch (_loopMode) {
      case LoopMode.off:
        nextMode = LoopMode.one;
        break;
      case LoopMode.one:
        nextMode = LoopMode.all;
        break;
      case LoopMode.all:
        nextMode = LoopMode.off;
        break;
    }

    try {
      await _audioManager.setLoopMode(nextMode);
      setState(() {
        _loopMode = nextMode;
      });
    } catch (e) {
      _showErrorDialog('设置循环模式失败', e.toString());
    }
  }

  void _toggleShuffleMode() async {
    try {
      final enabled = !_isShuffleModeEnabled;
      await _audioManager.setShuffleModeEnabled(enabled);
      setState(() {
        _isShuffleModeEnabled = enabled;
      });
    } catch (e) {
      _showErrorDialog('设置随机播放失败', e.toString());
    }
  }

  Future<void> _loadSampleAudio() async {
    try {
      final hasPermission = await MediaPermissionManager.checkAudioPermissions();
      if (!hasPermission) {
        final granted = await MediaPermissionManager.requestAudioPermissions();
        if (!granted) {
          _showPermissionDialog();
          return;
        }
      }

      // 加载示例音频
      final audioSource = AudioSource.uri(
        Uri.parse('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
        tag: MediaItem(
          id: 'sample_1',
          title: '示例音频',
          artist: 'SoundHelix',
          album: '示例专辑',
        ),
      );

      await _audioManager.loadSingleAudio(audioSource);
    } catch (e) {
      _showErrorDialog('加载音频失败', e.toString());
    }
  }

  void _showPlaylist() {
    showModalBottomSheet(
      context: context,
      builder: (context) => PlaylistPage(audioManager: _audioManager),
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
        content: Text('应用需要音频权限来播放媒体文件'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              MediaPermissionManager.openSettings();
            },
            child: Text('去设置'),
          ),
        ],
      ),
    );
  }
}
```

## 第四章：视频播放功能实现

### 4.1 视频播放管理器

```dart
import 'package:video_player/video_player.dart';

class VideoPlayerManager {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  double _volume = 1.0;
  double _playbackSpeed = 1.0;

  VideoPlayerController? get controller => _controller;
  bool get isInitialized => _isInitialized;
  bool get isPlaying => _isPlaying;
  Duration get position => _position;
  Duration get duration => _duration;
  double get volume => _volume;
  double get playbackSpeed => _playbackSpeed;

  Future<void> initialize(String dataSource) async {
    try {
      _controller = VideoPlayerController.network(dataSource);

      await _controller!.initialize();

      // 监听播放状态
      _controller!.addListener(_onControllerUpdate);

      _isInitialized = true;
    } catch (e) {
      throw VideoException('视频播放器初始化失败：${e.toString()}');
    }
  }

  Future<void> initializeFromFile(File file) async {
    try {
      _controller = VideoPlayerController.file(file);

      await _controller!.initialize();

      _controller!.addListener(_onControllerUpdate);

      _isInitialized = true;
    } catch (e) {
      throw VideoException('视频播放器初始化失败：${e.toString()}');
    }
  }

  void _onControllerUpdate() {
    if (_controller == null) return;

    setState(() {
      _isPlaying = _controller!.value.isPlaying;
      _position = _controller!.value.position;
      _duration = _controller!.value.duration ?? Duration.zero;
      _volume = _controller!.value.volume;
      _playbackSpeed = _controller!.value.playbackSpeed;
    });
  }

  void setState(VoidCallback fn) {
    fn();
    // 这里可以添加状态更新通知
  }

  Future<void> play() async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.play();
    } catch (e) {
      throw VideoException('播放失败：${e.toString()}');
    }
  }

  Future<void> pause() async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.pause();
    } catch (e) {
      throw VideoException('暂停失败：${e.toString()}');
    }
  }

  Future<void> stop() async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.pause();
      await _controller!.seekTo(Duration.zero);
    } catch (e) {
      throw VideoException('停止失败：${e.toString()}');
    }
  }

  Future<void> seekTo(Duration position) async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.seekTo(position);
    } catch (e) {
      throw VideoException('跳转失败：${e.toString()}');
    }
  }

  Future<void> setVolume(double volume) async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.setVolume(volume.clamp(0.0, 1.0));
    } catch (e) {
      throw VideoException('设置音量失败：${e.toString()}');
    }
  }

  Future<void> setPlaybackSpeed(double speed) async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.setPlaybackSpeed(speed.clamp(0.25, 2.0));
    } catch (e) {
      throw VideoException('设置播放速度失败：${e.toString()}');
    }
  }

  Future<void> setLooping(bool looping) async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.setLooping(looping);
    } catch (e) {
      throw VideoException('设置循环播放失败：${e.toString()}');
    }
  }

  Future<void> enterFullscreen() async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.enterFullscreen();
    } catch (e) {
      throw VideoException('进入全屏失败：${e.toString()}');
    }
  }

  Future<void> exitFullscreen() async {
    if (_controller == null || !_isInitialized) {
      throw VideoException('播放器未初始化');
    }

    try {
      await _controller!.exitFullscreen();
    } catch (e) {
      throw VideoException('退出全屏失败：${e.toString()}');
    }
  }

  Future<void> dispose() async {
    try {
      await _controller?.dispose();
      _controller = null;
      _isInitialized = false;
    } catch (e) {
      throw VideoException('释放播放器失败：${e.toString()}');
    }
  }

  String get formattedPosition {
    return _formatDuration(_position);
  }

  String get formattedDuration {
    return _formatDuration(_duration);
  }

  double get progress {
    if (_duration.inMilliseconds == 0) return 0.0;
    return _position.inMilliseconds / _duration.inMilliseconds;
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    final seconds = duration.inSeconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:'
             '${minutes.toString().padLeft(2, '0')}:'
             '${seconds.toString().padLeft(2, '0')}';
    } else {
      return '${minutes.toString().padLeft(2, '0')}:'
             '${seconds.toString().padLeft(2, '0')}';
    }
  }
}

class VideoException implements Exception {
  final String message;
  final String? code;

  VideoException(this.message, {this.code});

  @override
  String toString() {
    return 'VideoException: $message${code != null ? ' (Code: $code)' : ''}';
  }
}
```

### 4.2 视频播放 UI 组件

```dart
class VideoPlayerPage extends StatefulWidget {
  final String? videoUrl;
  final File? videoFile;

  const VideoPlayerPage({
    this.videoUrl,
    this.videoFile,
  });

  @override
  _VideoPlayerPageState createState() => _VideoPlayerPageState();
}

class _VideoPlayerPageState extends State<VideoPlayerPage> {
  final VideoPlayerManager _videoManager = VideoPlayerManager();
  bool _showControls = true;
  Timer? _hideControlsTimer;

  @override
  void initState() {
    super.initState();
    _initializeVideoPlayer();
  }

  @override
  void dispose() {
    _hideControlsTimer?.cancel();
    _videoManager.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          children: [
            // 视频播放器
            Center(
              child: _buildVideoPlayer(),
            ),

            // 控制面板
            if (_showControls)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.7),
                        Colors.transparent,
                        Colors.transparent,
                        Colors.black.withOpacity(0.7),
                      ],
                      stops: [0.0, 0.2, 0.8, 1.0],
                    ),
                  ),
                  child: Column(
                    children: [
                      _buildTopControls(),
                      Spacer(),
                      _buildBottomControls(),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoPlayer() {
    if (!_videoManager.isInitialized) {
      return Container(
        width: double.infinity,
        height: double.infinity,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.white),
              SizedBox(height: 16),
              Text(
                '正在加载视频...',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      );
    }

    return AspectRatio(
      aspectRatio: _videoManager.controller!.value.aspectRatio,
      child: VideoPlayer(_videoManager.controller!),
    );
  }

  Widget _buildTopControls() {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            Spacer(),
            IconButton(
              icon: Icon(Icons.fullscreen, color: Colors.white),
              onPressed: _toggleFullscreen,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // 进度条
            Row(
              children: [
                Text(
                  _videoManager.formattedPosition,
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      thumbShape: RoundSliderThumbShape(enabledThumbRadius: 6),
                      trackHeight: 3,
                      thumbColor: Colors.white,
                      activeTrackColor: Colors.white,
                      inactiveTrackColor: Colors.white.withOpacity(0.3),
                    ),
                    child: Slider(
                      value: _videoManager.progress,
                      onChanged: (value) {
                        final position = Duration(
                          milliseconds: (value * _videoManager.duration.inMilliseconds).toInt(),
                        );
                        _videoManager.seekTo(position);
                      },
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Text(
                  _videoManager.formattedDuration,
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
              ],
            ),
            SizedBox(height: 16),
            // 播放控制
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: Icon(Icons.replay_10, color: Colors.white),
                  onPressed: _rewind10Seconds,
                ),
                IconButton(
                  icon: Icon(
                    _videoManager.isPlaying ? Icons.pause : Icons.play_arrow,
                    color: Colors.white,
                    size: 40,
                  ),
                  onPressed: _togglePlayback,
                ),
                IconButton(
                  icon: Icon(Icons.forward_10, color: Colors.white),
                  onPressed: _forward10Seconds,
                ),
              ],
            ),
            SizedBox(height: 16),
            // 高级控制
            Row(
              children: [
                Icon(Icons.volume_up, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      thumbShape: RoundSliderThumbShape(enabledThumbRadius: 4),
                      trackHeight: 2,
                      thumbColor: Colors.white,
                      activeTrackColor: Colors.white,
                      inactiveTrackColor: Colors.white.withOpacity(0.3),
                    ),
                    child: Slider(
                      value: _videoManager.volume,
                      onChanged: (value) {
                        _videoManager.setVolume(value);
                      },
                    ),
                  ),
                ),
                SizedBox(width: 8),
                PopupMenuButton<String>(
                  icon: Icon(Icons.speed, color: Colors.white),
                  onSelected: _setPlaybackSpeed,
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: '0.5',
                      child: Text('0.5x'),
                    ),
                    PopupMenuItem(
                      value: '0.75',
                      child: Text('0.75x'),
                    ),
                    PopupMenuItem(
                      value: '1.0',
                      child: Text('1.0x'),
                    ),
                    PopupMenuItem(
                      value: '1.25',
                      child: Text('1.25x'),
                    ),
                    PopupMenuItem(
                      value: '1.5',
                      child: Text('1.5x'),
                    ),
                    PopupMenuItem(
                      value: '2.0',
                      child: Text('2.0x'),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _initializeVideoPlayer() async {
    try {
      if (widget.videoUrl != null) {
        await _videoManager.initialize(widget.videoUrl!);
      } else if (widget.videoFile != null) {
        await _videoManager.initializeFromFile(widget.videoFile!);
      } else {
        throw VideoException('未提供视频源');
      }

      setState(() {});

      // 开始播放
      await _videoManager.play();
    } catch (e) {
      _showErrorDialog('初始化失败', e.toString());
    }
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });

    if (_showControls) {
      _hideControlsTimer?.cancel();
      _hideControlsTimer = Timer(Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _showControls = false;
          });
        }
      });
    }
  }

  void _togglePlayback() async {
    try {
      if (_videoManager.isPlaying) {
        await _videoManager.pause();
      } else {
        await _videoManager.play();
      }
    } catch (e) {
      _showErrorDialog('播放失败', e.toString());
    }
  }

  void _rewind10Seconds() async {
    final newPosition = _videoManager.position - Duration(seconds: 10);
    final clampedPosition = newPosition < Duration.zero
        ? Duration.zero
        : newPosition;
    await _videoManager.seekTo(clampedPosition);
  }

  void _forward10Seconds() async {
    final newPosition = _videoManager.position + Duration(seconds: 10);
    final clampedPosition = newPosition > _videoManager.duration
        ? _videoManager.duration
        : newPosition;
    await _videoManager.seekTo(clampedPosition);
  }

  void _setPlaybackSpeed(String speed) async {
    await _videoManager.setPlaybackSpeed(double.parse(speed));
  }

  Future<void> _toggleFullscreen() async {
    try {
      if (_videoManager.controller?.value.isFullScreen == true) {
        await _videoManager.exitFullscreen();
      } else {
        await _videoManager.enterFullscreen();
      }
    } catch (e) {
      _showErrorDialog('全屏切换失败', e.toString());
    }
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
}
```

## 第五章：后台播放和音频焦点

### 5.1 后台播放服务

```dart
import 'package:audio_service/audio_service.dart';

class BackgroundAudioService {
  static Future<void> initialize() async {
    final audioServiceHandler = AudioServiceHandler();

    await AudioService.init(
      builder: () => audioServiceHandler,
      config: AudioServiceConfig(
        androidNotificationChannelId: 'com.example.audio_service.audio',
        androidNotificationChannelName: 'Audio Service',
        androidNotificationOngoing: true,
        androidStopForegroundOnPause: true,
        androidNotificationIcon: 'mipmap/ic_launcher',
        androidEnableQueue: true,
        androidNotificationColor: 0xFF2196F3,
        notificationColor: Color(0xFF2196F3),
        artDownscaleWidth: 600,
        artDownscaleHeight: 600,
      ),
    );
  }
}

class AudioServiceHandler extends BaseAudioHandler with QueueHandler {
  final AudioPlayerManager _audioManager = AudioPlayerManager();

  AudioServiceHandler() {
    _listenToPlaybackEvents();
  }

  @override
  Future<void> play() async {
    if (queue.value.isNotEmpty) {
      final mediaItem = queue.value[mediaItem.value?.index ?? 0];
      await _audioManager.playAtIndex(mediaItem.index ?? 0);
      mediaItem.add(mediaItem);
    }
  }

  @override
  Future<void> pause() async {
    await _audioManager.pause();
  }

  @override
  Future<void> stop() async {
    await _audioManager.stop();
    await super.stop();
  }

  @override
  Future<void> seek(Duration position) async {
    await _audioManager.seek(position);
  }

  @override
  Future<void> skipToNext() async {
    await _audioManager.next();
    final currentIndex = _audioManager.currentIndex;
    if (currentIndex < queue.value.length) {
      mediaItem.add(queue.value[currentIndex]);
    }
  }

  @override
  Future<void> skipToPrevious() async {
    await _audioManager.previous();
    final currentIndex = _audioManager.currentIndex;
    if (currentIndex < queue.value.length) {
      mediaItem.add(queue.value[currentIndex]);
    }
  }

  @override
  Future<void> setRepeatMode(AudioServiceRepeatMode repeatMode) async {
    LoopMode loopMode;
    switch (repeatMode) {
      case AudioServiceRepeatMode.none:
        loopMode = LoopMode.off;
        break;
      case AudioServiceRepeatMode.one:
        loopMode = LoopMode.one;
        break;
      case AudioServiceRepeatMode.all:
      case AudioServiceRepeatMode.group:
        loopMode = LoopMode.all;
        break;
    }

    await _audioManager.setLoopMode(loopMode);
    repeatMode.add(repeatMode);
  }

  @override
  Future<void> setShuffleMode(AudioServiceShuffleMode shuffleMode) async {
    final enabled = shuffleMode == AudioServiceShuffleMode.all;
    await _audioManager.setShuffleModeEnabled(enabled);
    shuffleMode.add(shuffleMode);
  }

  void _listenToPlaybackEvents() {
    _audioManager.playerStateStream.listen((state) {
      playbackState.add(_mapPlayerState(state));
    });

    _audioManager.positionStream.listen((position) {
      playbackState.add(playbackState.value.copyWith(
        updatePosition: position,
      ));
    });

    _audioManager.sequenceStateStream.listen((sequenceState) async {
      if (sequenceState?.currentSource != null) {
        final metadata = await _audioManager.getCurrentMetadata();
        if (metadata != null) {
          final mediaItem = MediaItem(
            id: sequenceState!.currentIndex.toString(),
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            duration: metadata.duration,
            artUri: metadata.artwork != null
                ? Uri.parse('data:image/jpeg;base64,${base64Encode(metadata.artwork!)}')
                : null,
          );

          queue.add([mediaItem]);
          mediaItem.add(mediaItem);
        }
      }
    });
  }

  PlaybackState _mapPlayerState(PlayerState playerState) {
    return PlaybackState(
      controls: [
        MediaControl.skipToPrevious,
        MediaControl.playPause,
        MediaControl.skipToNext,
      ],
      systemActions: const {
        MediaAction.seek,
        MediaAction.seekForward,
        MediaAction.seekBackward,
      },
      androidCompactActionIndices: const [0, 1, 2],
      processingState: const {
        ProcessingState.idle: AudioProcessingState.idle,
        ProcessingState.loading: AudioProcessingState.loading,
        ProcessingState.buffering: AudioProcessingState.buffering,
        ProcessingState.ready: AudioProcessingState.ready,
        ProcessingState.completed: AudioProcessingState.completed,
      }[playerState.processingState] ?? AudioProcessingState.idle,
      playing: playerState.playing,
      updatePosition: playerState.position,
      bufferedPosition: playerState.bufferedPosition,
      speed: playerState.speed,
      updateTime: DateTime.now(),
    );
  }
}
```

### 5.2 音频焦点管理

```dart
import 'package:audio_session/audio_session.dart';

class AudioFocusManager {
  static AudioSession? _session;
  static bool _hasFocus = false;

  static Future<void> initialize() async {
    try {
      _session = await AudioSession.instance;
      await _session!.configure(const AudioSessionConfiguration.music());

      // 监听音频焦点变化
      _session!.interruptionEventStream.listen(_handleInterruption);

      // 监听音频路由变化
      _session!.becomingNoisyEventStream.listen(_handleBecomingNoisy);
    } catch (e) {
      throw AudioException('音频焦点初始化失败：${e.toString()}');
    }
  }

  static Future<void> requestFocus() async {
    try {
      if (_session != null) {
        await _session!.setActive(true);
        _hasFocus = true;
      }
    } catch (e) {
      throw AudioException('请求音频焦点失败：${e.toString()}');
    }
  }

  static Future<void> releaseFocus() async {
    try {
      if (_session != null) {
        await _session!.setActive(false);
        _hasFocus = false;
      }
    } catch (e) {
      throw AudioException('释放音频焦点失败：${e.toString()}');
    }
  }

  static bool get hasFocus => _hasFocus;

  static void _handleInterruption(InterruptionEvent event) {
    switch (event.begin) {
      case true:
        // 音频被中断
        _hasFocus = false;
        if (event.primary) {
          // 其他应用开始播放音频
          // 暂停当前播放
          AudioPlayerManager().pause();
        }
        break;
      case false:
        // 中断结束
        if (event.primary) {
          // 其他应用停止播放音频
          // 请求音频焦点并恢复播放
          requestFocus().then((_) {
            AudioPlayerManager().play();
          });
        }
        break;
    }
  }

  static void _handleBecomingNoisy() {
    // 耳机拔出等事件
    AudioPlayerManager().pause();
  }
}
```

## 故事结局：小刘的成功

经过几个月的开发，小刘的音乐视频播放应用终于完成了！用户可以流畅地播放音频和视频，支持后台播放、播放列表管理等功能。

"媒体播放功能是音视频应用的核心，通过合理的架构设计和用户体验优化，我们打造出了专业的播放体验。"小刘在项目总结中写道，"特别是后台播放和音频焦点管理，确保了应用在复杂场景下的稳定性。"

小刘的应用获得了用户的好评，特别是流畅的播放体验和丰富的控制功能。他的成功证明了：**掌握音频视频播放桥接技术，是开发媒体类应用的关键技能。**

## 总结

通过小刘的音乐视频播放应用开发故事，我们全面学习了 Flutter 音频视频播放桥接技术：

### 核心技术

- **音频播放**：本地和在线音频播放、播放控制
- **视频播放**：本地和在线视频播放、全屏支持
- **播放控制**：播放、暂停、快进、快退、音量控制
- **播放列表**：列表管理、顺序播放、随机播放

### 高级特性

- **后台播放**：音频服务、通知控制
- **音频焦点**：焦点管理、中断处理
- **播放速度**：变速播放、音调保持
- **循环模式**：单曲循环、列表循环

### 最佳实践

- **用户体验**：流畅的界面和及时反馈
- **性能优化**：内存管理和资源释放
- **错误处理**：异常捕获和用户提示
- **平台适配**：Android 和 iOS 的差异处理

音频视频播放桥接技术为 Flutter 应用打开了多媒体世界的大门，让开发者能够构建出丰富的媒体应用。掌握这些技术，将帮助你在移动应用开发中创造更多可能！
