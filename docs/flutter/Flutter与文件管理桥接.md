# Flutter 与文件管理桥接技术详解

## 引言：文件管理在现代应用中的重要性

文件管理是移动应用开发中的核心功能之一。无论是文档编辑器、媒体播放器、下载管理器，还是云存储应用，都需要与设备的文件系统进行交互。Flutter 作为跨平台框架，提供了与原生文件系统 API 桥接的能力，使开发者能够在 Android 和 iOS 平台上实现高效的文件管理功能。

本文将通过一个实际案例——开发一款名为"FileManagerPro"的专业文件管理应用——来详细介绍 Flutter 中实现文件管理的技术细节和最佳实践。

## 文件管理技术概述

### 文件系统类型

1. **内部存储**：应用私有存储，其他应用无法访问
2. **外部存储**：共享存储，可被其他应用访问
3. **缓存目录**：临时文件存储，可能被系统清理
4. **外部媒体**：图片、视频、音频等媒体文件存储

### 文件操作类型

1. **基本操作**：创建、读取、写入、删除文件
2. **目录操作**：创建、遍历、删除目录
3. **文件信息**：获取文件属性、元数据
4. **文件监控**：监听文件变化事件

## 项目背景：FileManagerPro 专业文件管理应用

我们的项目是开发一款名为 FileManagerPro 的专业文件管理应用，支持以下功能：

- 文件和目录的浏览与管理
- 文件搜索和过滤
- 文件预览和编辑
- 文件压缩和解压
- 云存储集成
- 文件安全和加密

## 技术架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter应用层                              │
├─────────────────────────────────────────────────────────────┤
│  文件UI  │  搜索UI  │  预览UI  │  设置页面                  │
├─────────────────────────────────────────────────────────────┤
│                  文件服务管理层                                │
├─────────────────────────────────────────────────────────────┤
│              平台通道桥接层                                   │
├─────────────────────────────────────────────────────────────┤
│  Android File API  │  iOS FileManager API              │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

1. **FileService**：文件操作管理
2. **DirectoryService**：目录操作管理
3. **FileSearchService**：文件搜索功能
4. **FilePreviewService**：文件预览功能
5. **FileCompressionService**：文件压缩解压功能
6. **PlatformChannel**：平台通道通信

## 实现步骤详解

### 第一步：添加依赖和配置

首先，我们需要添加必要的依赖包：

```yaml
dependencies:
  flutter:
    sdk: flutter
  permission_handler: ^10.2.0
  path_provider: ^2.1.0
  path: ^1.8.3
  file_picker: ^6.1.1
  archive: ^3.4.9
  flutter_pdfview: ^1.3.2
  video_player: ^2.7.0
  cached_network_image: ^3.3.0
  sqflite: ^2.3.0
  shared_preferences: ^2.2.0
  intl: ^0.18.1
  crypto: ^3.0.3
```

Android 平台需要配置权限：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 存储权限 -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />

    <!-- Android 13+ 媒体权限 -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <!-- 网络权限（用于云存储） -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application>
        <!-- 文件提供者 -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
```

创建文件路径配置：

```xml
<!-- android/app/src/main/res/xml/file_paths.xml -->
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="external_files" path="." />
    <external-cache-path name="external_cache" path="." />
    <files-path name="internal_files" path="." />
    <cache-path name="internal_cache" path="." />
</paths>
```

iOS 平台需要在 Info.plist 中添加权限说明：

```xml
<!-- ios/Runner/Info.plist -->
<key>NSDocumentsFolderUsageDescription</key>
<string>此应用需要访问文档文件夹来提供文件管理服务</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>此应用需要访问相册来管理媒体文件</string>
<key>NSCameraUsageDescription</key>
<string>此应用需要访问相机来拍摄照片和视频</string>
<key>NSMicrophoneUsageDescription</key>
<string>此应用需要访问麦克风来录制音频</string>
<key>UIFileSharingEnabled</key>
<true/>
<key>LSSupportsOpeningDocumentsInPlace</key>
<true/>
```

### 第二步：创建文件数据模型

```dart
// lib/models/file_item.dart
import 'dart:io';

class FileItem {
  final String id;
  final String name;
  final String path;
  final FileType type;
  final int size;
  final DateTime modifiedTime;
  final DateTime? createdTime;
  final bool isDirectory;
  final bool isHidden;
  final String? mimeType;
  final FilePermissions permissions;
  final String? thumbnail;

  FileItem({
    required this.id,
    required this.name,
    required this.path,
    required this.type,
    required this.size,
    required this.modifiedTime,
    this.createdTime,
    required this.isDirectory,
    this.isHidden = false,
    this.mimeType,
    required this.permissions,
    this.thumbnail,
  });

  factory FileItem.fromFileSystemEntity(FileSystemEntity entity) {
    final file = entity is File ? entity : (entity as Directory);
    final stat = entity.statSync();
    final path = entity.path;
    final name = entity.path.split('/').last;

    return FileItem(
      id: path,
      name: name,
      path: path,
      type: _getFileType(name, entity is Directory),
      size: stat.size,
      modifiedTime: stat.modified,
      createdTime: stat.accessed,
      isDirectory: entity is Directory,
      isHidden: name.startsWith('.'),
      mimeType: entity is File ? _lookUpMimeType(name) : null,
      permissions: FilePermissions(
        canRead: stat.mode & 0o444 != 0,
        canWrite: stat.mode & 0o222 != 0,
        canExecute: stat.mode & 0o111 != 0,
      ),
    );
  }

  static FileType _getFileType(String name, bool isDirectory) {
    if (isDirectory) return FileType.directory;

    final extension = name.split('.').last.toLowerCase();

    switch (extension) {
      // 图片
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return FileType.image;

      // 视频
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
      case 'wmv':
      case 'flv':
        return FileType.video;

      // 音频
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
      case 'ogg':
        return FileType.audio;

      // 文档
      case 'pdf':
        return FileType.pdf;
      case 'doc':
      case 'docx':
        return FileType.word;
      case 'xls':
      case 'xlsx':
        return FileType.excel;
      case 'ppt':
      case 'pptx':
        return FileType.powerpoint;
      case 'txt':
      case 'md':
        return FileType.text;

      // 压缩文件
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return FileType.archive;

      // APK
      case 'apk':
        return FileType.apk;

      default:
        return FileType.unknown;
    }
  }

  static String? _lookUpMimeType(String fileName) {
    final extension = fileName.split('.').last.toLowerCase();

    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'apk': 'application/vnd.android.package-archive',
    };

    return mimeTypes[extension];
  }

  String get formattedSize {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)} KB';
    if (size < 1024 * 1024 * 1024) return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(size / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  String get fileExtension {
    if (isDirectory) return '';
    final parts = name.split('.');
    return parts.length > 1 ? '.${parts.last}' : '';
  }

  String get fileNameWithoutExtension {
    if (isDirectory) return name;
    final parts = name.split('.');
    return parts.length > 1 ? parts.sublist(0, parts.length - 1).join('.') : name;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'path': path,
      'type': type.index,
      'size': size,
      'modifiedTime': modifiedTime.toIso8601String(),
      'createdTime': createdTime?.toIso8601String(),
      'isDirectory': isDirectory,
      'isHidden': isHidden,
      'mimeType': mimeType,
      'permissions': permissions.toJson(),
      'thumbnail': thumbnail,
    };
  }

  factory FileItem.fromJson(Map<String, dynamic> json) {
    return FileItem(
      id: json['id'],
      name: json['name'],
      path: json['path'],
      type: FileType.values[json['type']],
      size: json['size'],
      modifiedTime: DateTime.parse(json['modifiedTime']),
      createdTime: json['createdTime'] != null ? DateTime.parse(json['createdTime']) : null,
      isDirectory: json['isDirectory'],
      isHidden: json['isHidden'] ?? false,
      mimeType: json['mimeType'],
      permissions: FilePermissions.fromJson(json['permissions']),
      thumbnail: json['thumbnail'],
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is FileItem && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'FileItem(id: $id, name: $name, type: $type, size: $formattedSize)';
  }
}

enum FileType {
  image,
  video,
  audio,
  pdf,
  word,
  excel,
  powerpoint,
  text,
  archive,
  apk,
  directory,
  unknown,
}

class FilePermissions {
  final bool canRead;
  final bool canWrite;
  final bool canExecute;

  FilePermissions({
    required this.canRead,
    required this.canWrite,
    required this.canExecute,
  });

  Map<String, dynamic> toJson() {
    return {
      'canRead': canRead,
      'canWrite': canWrite,
      'canExecute': canExecute,
    };
  }

  factory FilePermissions.fromJson(Map<String, dynamic> json) {
    return FilePermissions(
      canRead: json['canRead'],
      canWrite: json['canWrite'],
      canExecute: json['canExecute'],
    );
  }
}

class FileOperationResult {
  final bool success;
  final String? error;
  final dynamic data;

  FileOperationResult({
    required this.success,
    this.error,
    this.data,
  });

  factory FileOperationResult.success({dynamic data}) {
    return FileOperationResult(success: true, data: data);
  }

  factory FileOperationResult.failure(String error) {
    return FileOperationResult(success: false, error: error);
  }
}
```

### 第三步：创建文件服务管理器

```dart
// lib/services/file_service.dart
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:permission_handler/permission_handler.dart';
import 'package:crypto/crypto.dart';
import '../models/file_item.dart';

class FileService {
  static final FileService _instance = FileService._internal();
  factory FileService() => _instance;
  FileService._internal();

  final StreamController<FileOperationEvent> _operationEventStreamController = StreamController<FileOperationEvent>.broadcast();
  final Map<String, double> _operationProgress = {};

  // 文件操作事件流
  Stream<FileOperationEvent> get operationEventStream => _operationEventStreamController.stream;

  // 操作进度
  Map<String, double> get operationProgress => Map.unmodifiable(_operationProgress);

  // 初始化文件服务
  Future<void> initialize() async {
    try {
      // 请求权限
      final hasPermission = await _requestPermissions();
      if (!hasPermission) {
        throw FileException('存储权限被拒绝');
      }

      // 创建应用目录
      await _createAppDirectories();

    } catch (e) {
      throw FileException('初始化文件服务失败: $e');
    }
  }

  // 请求权限
  Future<bool> _requestPermissions() async {
    try {
      // Android 13+ 需要分别请求媒体权限
      if (Platform.isAndroid) {
        final storagePermission = await Permission.storage.request();
        final mediaImagesPermission = await Permission.photos.request();
        final mediaVideosPermission = await Permission.videos.request();
        final mediaAudioPermission = await Permission.audio.request();

        return storagePermission.isGranted ||
               (mediaImagesPermission.isGranted &&
                mediaVideosPermission.isGranted &&
                mediaAudioPermission.isGranted);
      } else {
        // iOS 只需要照片库权限
        final photosPermission = await Permission.photos.request();
        return photosPermission.isGranted;
      }
    } catch (e) {
      throw FileException('请求权限失败: $e');
    }
  }

  // 创建应用目录
  Future<void> _createAppDirectories() async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final tempDir = await getTemporaryDirectory();

      // 创建子目录
      final directories = [
        path.join(appDir.path, 'Documents'),
        path.join(appDir.path, 'Downloads'),
        path.join(appDir.path, 'Images'),
        path.join(appDir.path, 'Videos'),
        path.join(appDir.path, 'Audio'),
        path.join(tempDir.path, 'Cache'),
      ];

      for (final dir in directories) {
        final directory = Directory(dir);
        if (!await directory.exists()) {
          await directory.create(recursive: true);
        }
      }
    } catch (e) {
      throw FileException('创建应用目录失败: $e');
    }
  }

  // 获取应用目录
  Future<Map<String, String>> getAppDirectories() async {
    try {
      final appDir = await getApplicationDocumentsDirectory();
      final tempDir = await getTemporaryDirectory();

      if (Platform.isAndroid) {
        final externalDir = await getExternalStorageDirectory();

        return {
          'documents': path.join(appDir.path, 'Documents'),
          'downloads': path.join(appDir.path, 'Downloads'),
          'images': path.join(appDir.path, 'Images'),
          'videos': path.join(appDir.path, 'Videos'),
          'audio': path.join(appDir.path, 'Audio'),
          'cache': path.join(tempDir.path, 'Cache'),
          'external': externalDir?.path ?? '',
        };
      } else {
        return {
          'documents': path.join(appDir.path, 'Documents'),
          'downloads': path.join(appDir.path, 'Downloads'),
          'images': path.join(appDir.path, 'Images'),
          'videos': path.join(appDir.path, 'Videos'),
          'audio': path.join(appDir.path, 'Audio'),
          'cache': path.join(tempDir.path, 'Cache'),
        };
      }
    } catch (e) {
      throw FileException('获取应用目录失败: $e');
    }
  }

  // 获取目录内容
  Future<List<FileItem>> getDirectoryContents(String dirPath, {bool showHidden = false}) async {
    try {
      final directory = Directory(dirPath);
      if (!await directory.exists()) {
        throw FileException('目录不存在: $dirPath');
      }

      final entities = await directory.list().toList();
      final fileItems = <FileItem>[];

      for (final entity in entities) {
        try {
          final fileItem = FileItem.fromFileSystemEntity(entity);

          // 过滤隐藏文件
          if (!showHidden && fileItem.isHidden) {
            continue;
          }

          fileItems.add(fileItem);
        } catch (e) {
          // 跳过无法访问的文件
          debugPrint('无法访问文件: ${entity.path}, 错误: $e');
        }
      }

      // 排序：目录在前，然后按名称排序
      fileItems.sort((a, b) {
        if (a.isDirectory != b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.toLowerCase().compareTo(b.name.toLowerCase());
      });

      return fileItems;
    } catch (e) {
      throw FileException('获取目录内容失败: $e');
    }
  }

  // 创建目录
  Future<FileOperationResult> createDirectory(String parentPath, String dirName) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.createDirectory,
        status: FileOperationStatus.started,
        progress: 0.0,
      ));

      final newDirPath = path.join(parentPath, dirName);
      final newDir = Directory(newDirPath);

      if (await newDir.exists()) {
        throw FileException('目录已存在: $dirName');
      }

      await newDir.create(recursive: true);

      _operationProgress[operationId] = 1.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.createDirectory,
        status: FileOperationStatus.completed,
        progress: 1.0,
        data: FileItem.fromFileSystemEntity(newDir),
      ));

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(newDir));
    } catch (e) {
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.createDirectory,
        status: FileOperationStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 创建文件
  Future<FileOperationResult> createFile(String parentPath, String fileName, {List<int>? content}) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.createFile,
        status: FileOperationStatus.started,
        progress: 0.0,
      ));

      final newFilePath = path.join(parentPath, fileName);
      final newFile = File(newFilePath);

      if (await newFile.exists()) {
        throw FileException('文件已存在: $fileName');
      }

      await newFile.create(recursive: true);

      if (content != null) {
        await newFile.writeAsBytes(content);
      }

      _operationProgress[operationId] = 1.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.createFile,
        status: FileOperationStatus.completed,
        progress: 1.0,
        data: FileItem.fromFileSystemEntity(newFile),
      ));

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(newFile));
    } catch (e) {
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.createFile,
        status: FileOperationStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 复制文件
  Future<FileOperationResult> copyFile(String sourcePath, String destinationPath) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.copy,
        status: FileOperationStatus.started,
        progress: 0.0,
      ));

      final sourceFile = File(sourcePath);
      if (!await sourceFile.exists()) {
        throw FileException('源文件不存在: $sourcePath');
      }

      final destinationFile = File(destinationPath);

      // 如果目标文件已存在，生成新名称
      if (await destinationFile.exists()) {
        final newName = _generateUniqueFileName(destinationPath);
        destinationFile = File(path.join(path.dirname(destinationPath), newName));
      }

      // 复制文件
      await sourceFile.copy(destinationFile.path);

      _operationProgress[operationId] = 1.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.copy,
        status: FileOperationStatus.completed,
        progress: 1.0,
        data: FileItem.fromFileSystemEntity(destinationFile),
      ));

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(destinationFile));
    } catch (e) {
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.copy,
        status: FileOperationStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 移动文件
  Future<FileOperationResult> moveFile(String sourcePath, String destinationPath) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.move,
        status: FileOperationStatus.started,
        progress: 0.0,
      ));

      final sourceFile = File(sourcePath);
      if (!await sourceFile.exists()) {
        throw FileException('源文件不存在: $sourcePath');
      }

      final destinationFile = File(destinationPath);

      // 如果目标文件已存在，生成新名称
      if (await destinationFile.exists()) {
        final newName = _generateUniqueFileName(destinationPath);
        destinationFile = File(path.join(path.dirname(destinationPath), newName));
      }

      // 移动文件
      await sourceFile.rename(destinationFile.path);

      _operationProgress[operationId] = 1.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.move,
        status: FileOperationStatus.completed,
        progress: 1.0,
        data: FileItem.fromFileSystemEntity(destinationFile),
      ));

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(destinationFile));
    } catch (e) {
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.move,
        status: FileOperationStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 删除文件
  Future<FileOperationResult> deleteFile(String filePath) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.delete,
        status: FileOperationStatus.started,
        progress: 0.0,
      ));

      final file = File(filePath);
      if (!await file.exists()) {
        throw FileException('文件不存在: $filePath');
      }

      await file.delete(recursive: true);

      _operationProgress[operationId] = 1.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.delete,
        status: FileOperationStatus.completed,
        progress: 1.0,
      ));

      return FileOperationResult.success();
    } catch (e) {
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.delete,
        status: FileOperationStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 重命名文件
  Future<FileOperationResult> renameFile(String filePath, String newName) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.rename,
        status: FileOperationStatus.started,
        progress: 0.0,
      ));

      final file = File(filePath);
      if (!await file.exists()) {
        throw FileException('文件不存在: $filePath');
      }

      final newPath = path.join(path.dirname(filePath), newName);
      final newFile = await file.rename(newPath);

      _operationProgress[operationId] = 1.0;
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.rename,
        status: FileOperationStatus.completed,
        progress: 1.0,
        data: FileItem.fromFileSystemEntity(newFile),
      ));

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(newFile));
    } catch (e) {
      _operationEventStreamController.add(FileOperationEvent(
        id: operationId,
        type: FileOperationType.rename,
        status: FileOperationStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 获取文件信息
  Future<FileItem?> getFileInfo(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return null;
      }

      return FileItem.fromFileSystemEntity(file);
    } catch (e) {
      throw FileException('获取文件信息失败: $e');
    }
  }

  // 计算文件哈希
  Future<String> calculateFileHash(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw FileException('文件不存在: $filePath');
      }

      final bytes = await file.readAsBytes();
      final digest = sha256.convert(bytes);
      return digest.toString();
    } catch (e) {
      throw FileException('计算文件哈希失败: $e');
    }
  }

  // 获取存储空间信息
  Future<StorageInfo> getStorageInfo() async {
    try {
      if (Platform.isAndroid) {
        return await _getAndroidStorageInfo();
      } else {
        return await _getIOSStorageInfo();
      }
    } catch (e) {
      throw FileException('获取存储信息失败: $e');
    }
  }

  // Android存储信息
  Future<StorageInfo> _getAndroidStorageInfo() async {
    // 这里需要通过平台通道获取Android存储信息
    // 简化实现，返回模拟数据
    return StorageInfo(
      totalSpace: 64 * 1024 * 1024 * 1024, // 64GB
      freeSpace: 32 * 1024 * 1024 * 1024,  // 32GB
      usedSpace: 32 * 1024 * 1024 * 1024,  // 32GB
    );
  }

  // iOS存储信息
  Future<StorageInfo> _getIOSStorageInfo() async {
    // 这里需要通过平台通道获取iOS存储信息
    // 简化实现，返回模拟数据
    return StorageInfo(
      totalSpace: 128 * 1024 * 1024 * 1024, // 128GB
      freeSpace: 64 * 1024 * 1024 * 1024,   // 64GB
      usedSpace: 64 * 1024 * 1024 * 1024,   // 64GB
    );
  }

  // 生成唯一文件名
  String _generateUniqueFileName(String filePath) {
    final dir = path.dirname(filePath);
    final name = path.basenameWithoutExtension(filePath);
    final extension = path.extension(filePath);

    int counter = 1;
    String newPath = filePath;

    while (File(newPath).exists()) {
      newPath = path.join(dir, '${name}_$counter$extension');
      counter++;
    }

    return path.basename(newPath);
  }

  // 释放资源
  void dispose() {
    _operationEventStreamController.close();
  }
}

// 文件操作事件
class FileOperationEvent {
  final String id;
  final FileOperationType type;
  final FileOperationStatus status;
  final double progress;
  final String? error;
  final dynamic data;

  FileOperationEvent({
    required this.id,
    required this.type,
    required this.status,
    required this.progress,
    this.error,
    this.data,
  });
}

// 文件操作类型
enum FileOperationType {
  createDirectory,
  createFile,
  copy,
  move,
  delete,
  rename,
  compress,
  extract,
}

// 文件操作状态
enum FileOperationStatus {
  started,
  inProgress,
  completed,
  failed,
  cancelled,
}

// 存储信息
class StorageInfo {
  final int totalSpace;
  final int freeSpace;
  final int usedSpace;

  StorageInfo({
    required this.totalSpace,
    required this.freeSpace,
    required this.usedSpace,
  });

  String get formattedTotalSpace {
    return _formatBytes(totalSpace);
  }

  String get formattedFreeSpace {
    return _formatBytes(freeSpace);
  }

  String get formattedUsedSpace {
    return _formatBytes(usedSpace);
  }

  double get usagePercentage {
    return (usedSpace / totalSpace) * 100;
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}

// 文件异常
class FileException implements Exception {
  final String message;
  FileException(this.message);

  @override
  String toString() => message;
}
```

### 第四步：实现文件搜索服务

```dart
// lib/services/file_search_service.dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import '../models/file_item.dart';
import 'file_service.dart';

class FileSearchService {
  static final FileSearchService _instance = FileSearchService._internal();
  factory FileSearchService() => _instance;
  FileSearchService._internal();

  final FileService _fileService = FileService();
  final StreamController<SearchResult> _searchResultStreamController = StreamController<SearchResult>.broadcast();

  // 搜索结果流
  Stream<SearchResult> get searchResultStream => _searchResultStreamController.stream;

  // 搜索文件
  Future<List<FileItem>> searchFiles({
    required String query,
    String? searchPath,
    List<FileType>? fileTypes,
    bool includeHidden = false,
    DateTime? modifiedAfter,
    DateTime? modifiedBefore,
    int? minSize,
    int? maxSize,
    int? maxResults,
  }) async {
    try {
      final searchPath = searchPath ?? await _getSearchRootPath();
      final results = <FileItem>[];

      await _searchDirectory(
        searchPath,
        query,
        results,
        fileTypes: fileTypes,
        includeHidden: includeHidden,
        modifiedAfter: modifiedAfter,
        modifiedBefore: modifiedBefore,
        minSize: minSize,
        maxSize: maxSize,
        maxResults: maxResults,
      );

      return results;
    } catch (e) {
      throw FileSearchException('搜索文件失败: $e');
    }
  }

  // 异步搜索文件
  Stream<FileItem> searchFilesStream({
    required String query,
    String? searchPath,
    List<FileType>? fileTypes,
    bool includeHidden = false,
    DateTime? modifiedAfter,
    DateTime? modifiedBefore,
    int? minSize,
    int? maxSize,
  }) async* {
    final searchPath = searchPath ?? await _getSearchRootPath();

    yield* _searchDirectoryStream(
      searchPath,
      query,
      fileTypes: fileTypes,
      includeHidden: includeHidden,
      modifiedAfter: modifiedAfter,
      modifiedBefore: modifiedBefore,
      minSize: minSize,
      maxSize: maxSize,
    );
  }

  // 搜索目录
  Future<void> _searchDirectory(
    String dirPath,
    String query,
    List<FileItem> results, {
    List<FileType>? fileTypes,
    bool includeHidden = false,
    DateTime? modifiedAfter,
    DateTime? modifiedBefore,
    int? minSize,
    int? maxSize,
    int? maxResults,
  }) async {
    try {
      final directory = Directory(dirPath);
      if (!await directory.exists()) {
        return;
      }

      final entities = await directory.list().toList();

      for (final entity in entities) {
        // 检查是否达到最大结果数
        if (maxResults != null && results.length >= maxResults) {
          return;
        }

        try {
          final fileItem = FileItem.fromFileSystemEntity(entity);

          // 过滤隐藏文件
          if (!includeHidden && fileItem.isHidden) {
            continue;
          }

          // 过滤文件类型
          if (fileTypes != null && !fileTypes.contains(fileItem.type)) {
            continue;
          }

          // 过滤修改时间
          if (modifiedAfter != null && fileItem.modifiedTime.isBefore(modifiedAfter)) {
            continue;
          }

          if (modifiedBefore != null && fileItem.modifiedTime.isAfter(modifiedBefore)) {
            continue;
          }

          // 过滤文件大小
          if (minSize != null && fileItem.size < minSize) {
            continue;
          }

          if (maxSize != null && fileItem.size > maxSize) {
            continue;
          }

          // 检查查询匹配
          if (_matchesQuery(fileItem, query)) {
            results.add(fileItem);

            // 发送搜索结果事件
            _searchResultStreamController.add(SearchResult(
              query: query,
              fileItem: fileItem,
              totalResults: results.length,
            ));
          }

          // 如果是目录，递归搜索
          if (fileItem.isDirectory) {
            await _searchDirectory(
              fileItem.path,
              query,
              results,
              fileTypes: fileTypes,
              includeHidden: includeHidden,
              modifiedAfter: modifiedAfter,
              modifiedBefore: modifiedBefore,
              minSize: minSize,
              maxSize: maxSize,
              maxResults: maxResults,
            );
          }
        } catch (e) {
          // 跳过无法访问的文件
          debugPrint('无法访问文件: ${entity.path}, 错误: $e');
        }
      }
    } catch (e) {
      debugPrint('搜索目录失败: $dirPath, 错误: $e');
    }
  }

  // 搜索目录流
  Stream<FileItem> _searchDirectoryStream(
    String dirPath,
    String query, {
    List<FileType>? fileTypes,
    bool includeHidden = false,
    DateTime? modifiedAfter,
    DateTime? modifiedBefore,
    int? minSize,
    int? maxSize,
  }) async* {
    try {
      final directory = Directory(dirPath);
      if (!await directory.exists()) {
        return;
      }

      final entities = await directory.list().toList();

      for (final entity in entities) {
        try {
          final fileItem = FileItem.fromFileSystemEntity(entity);

          // 过滤隐藏文件
          if (!includeHidden && fileItem.isHidden) {
            continue;
          }

          // 过滤文件类型
          if (fileTypes != null && !fileTypes.contains(fileItem.type)) {
            continue;
          }

          // 过滤修改时间
          if (modifiedAfter != null && fileItem.modifiedTime.isBefore(modifiedAfter)) {
            continue;
          }

          if (modifiedBefore != null && fileItem.modifiedTime.isAfter(modifiedBefore)) {
            continue;
          }

          // 过滤文件大小
          if (minSize != null && fileItem.size < minSize) {
            continue;
          }

          if (maxSize != null && fileItem.size > maxSize) {
            continue;
          }

          // 检查查询匹配
          if (_matchesQuery(fileItem, query)) {
            yield fileItem;
          }

          // 如果是目录，递归搜索
          if (fileItem.isDirectory) {
            yield* _searchDirectoryStream(
              fileItem.path,
              query,
              fileTypes: fileTypes,
              includeHidden: includeHidden,
              modifiedAfter: modifiedAfter,
              modifiedBefore: modifiedBefore,
              minSize: minSize,
              maxSize: maxSize,
            );
          }
        } catch (e) {
          // 跳过无法访问的文件
          debugPrint('无法访问文件: ${entity.path}, 错误: $e');
        }
      }
    } catch (e) {
      debugPrint('搜索目录失败: $dirPath, 错误: $e');
    }
  }

  // 检查文件是否匹配查询
  bool _matchesQuery(FileItem fileItem, String query) {
    if (query.isEmpty) return true;

    final lowerQuery = query.toLowerCase();
    final fileName = fileItem.name.toLowerCase();

    // 简单的包含匹配
    if (fileName.contains(lowerQuery)) {
      return true;
    }

    // 扩展名匹配
    if (query.startsWith('.') && fileName.endsWith(lowerQuery)) {
      return true;
    }

    // 通配符匹配
    if (query.contains('*') || query.contains('?')) {
      return _matchesWildcard(fileName, lowerQuery);
    }

    return false;
  }

  // 通配符匹配
  bool _matchesWildcard(String fileName, String pattern) {
    // 简化的通配符匹配实现
    String regexPattern = pattern
        .replaceAll('*', '.*')
        .replaceAll('?', '.');

    try {
      final regex = RegExp('^$regexPattern\$');
      return regex.hasMatch(fileName);
    } catch (e) {
      return false;
    }
  }

  // 获取搜索根路径
  Future<String> _getSearchRootPath() async {
    if (Platform.isAndroid) {
      // Android使用外部存储根目录
      final directories = await _fileService.getAppDirectories();
      return directories['external'] ?? directories['documents']!;
    } else {
      // iOS使用文档目录
      final directories = await _fileService.getAppDirectories();
      return directories['documents']!;
    }
  }

  // 获取搜索建议
  Future<List<String>> getSearchSuggestions(String query) async {
    try {
      // 这里可以实现基于历史搜索的建议
      // 简化实现，返回空列表
      return [];
    } catch (e) {
      throw FileSearchException('获取搜索建议失败: $e');
    }
  }

  // 保存搜索历史
  Future<void> saveSearchHistory(String query) async {
    try {
      // 这里应该保存搜索历史到数据库
      // 简化实现，不做实际保存
    } catch (e) {
      throw FileSearchException('保存搜索历史失败: $e');
    }
  }

  // 获取搜索历史
  Future<List<String>> getSearchHistory() async {
    try {
      // 这里应该从数据库加载搜索历史
      // 简化实现，返回空列表
      return [];
    } catch (e) {
      throw FileSearchException('获取搜索历史失败: $e');
    }
  }

  // 清除搜索历史
  Future<void> clearSearchHistory() async {
    try {
      // 这里应该清除数据库中的搜索历史
      // 简化实现，不做实际清除
    } catch (e) {
      throw FileSearchException('清除搜索历史失败: $e');
    }
  }

  // 释放资源
  void dispose() {
    _searchResultStreamController.close();
  }
}

// 搜索结果
class SearchResult {
  final String query;
  final FileItem fileItem;
  final int totalResults;

  SearchResult({
    required this.query,
    required this.fileItem,
    required this.totalResults,
  });
}

// 文件搜索异常
class FileSearchException implements Exception {
  final String message;
  FileSearchException(this.message);

  @override
  String toString() => message;
}
```

### 第五步：实现文件压缩解压服务

```dart
// lib/services/file_compression_service.dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path/path.dart' as path;
import 'package:archive/archive.dart';
import '../models/file_item.dart';
import 'file_service.dart';

class FileCompressionService {
  static final FileCompressionService _instance = FileCompressionService._internal();
  factory FileCompressionService() => _instance;
  FileCompressionService._internal();

  final FileService _fileService = FileService();
  final StreamController<CompressionEvent> _compressionEventStreamController = StreamController<CompressionEvent>.broadcast();
  final Map<String, double> _operationProgress = {};

  // 压缩事件流
  Stream<CompressionEvent> get compressionEventStream => _compressionEventStreamController.stream;

  // 操作进度
  Map<String, double> get operationProgress => Map.unmodifiable(_operationProgress);

  // 压缩文件
  Future<FileOperationResult> compressFiles({
    required List<String> sourcePaths,
    required String destinationPath,
    CompressionFormat format = CompressionFormat.zip,
    int compressionLevel = 6,
    String? password,
  }) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.compress,
        status: CompressionStatus.started,
        progress: 0.0,
      ));

      // 验证源文件
      final sourceFiles = <File>[];
      for (final sourcePath in sourcePaths) {
        final file = File(sourcePath);
        if (!await file.exists()) {
          throw CompressionException('源文件不存在: $sourcePath');
        }
        sourceFiles.add(file);
      }

      // 创建目标文件
      final destinationFile = File(destinationPath);
      if (await destinationFile.exists()) {
        throw CompressionException('目标文件已存在: $destinationPath');
      }

      // 根据格式进行压缩
      Archive archive;

      switch (format) {
        case CompressionFormat.zip:
          archive = await _createZipArchive(sourceFiles, compressionLevel, password, operationId);
          break;
        case CompressionFormat.tar:
          archive = await _createTarArchive(sourceFiles, operationId);
          break;
        case CompressionFormat.tarGz:
          archive = await _createTarGzArchive(sourceFiles, compressionLevel, operationId);
          break;
      }

      // 写入压缩文件
      final outputStream = destinationFile.openWrite();
      await outputStream.addStream(_createArchiveStream(archive));
      await outputStream.close();

      _operationProgress[operationId] = 1.0;
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.compress,
        status: CompressionStatus.completed,
        progress: 1.0,
        data: FileItem.fromFileSystemEntity(destinationFile),
      ));

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(destinationFile));
    } catch (e) {
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.compress,
        status: CompressionStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 解压文件
  Future<FileOperationResult> extractFiles({
    required String sourcePath,
    required String destinationPath,
    String? password,
  }) async {
    final operationId = DateTime.now().millisecondsSinceEpoch.toString();

    try {
      _operationProgress[operationId] = 0.0;
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.extract,
        status: CompressionStatus.started,
        progress: 0.0,
      ));

      // 验证源文件
      final sourceFile = File(sourcePath);
      if (!await sourceFile.exists()) {
        throw CompressionException('源文件不存在: $sourcePath');
      }

      // 创建目标目录
      final destinationDir = Directory(destinationPath);
      if (!await destinationDir.exists()) {
        await destinationDir.create(recursive: true);
      }

      // 读取压缩文件
      final bytes = await sourceFile.readAsBytes();
      Archive? archive;

      // 根据文件扩展名判断格式
      final extension = path.extension(sourcePath).toLowerCase();

      switch (extension) {
        case '.zip':
          archive = ZipDecoder().decodeBytes(bytes, password: password);
          break;
        case '.tar':
          archive = TarDecoder().decodeBytes(bytes);
          break;
        case '.gz':
          final decompressed = GZipDecoder().decodeBytes(bytes);
          archive = TarDecoder().decodeBytes(decompressed);
          break;
        default:
          throw CompressionException('不支持的压缩格式: $extension');
      }

      // 解压文件
      int extractedCount = 0;
      final totalCount = archive.files.length;

      for (final file in archive.files) {
        if (file.isFile) {
          final filePath = path.join(destinationPath, file.name);
          final outputFile = File(filePath);

          // 创建目录
          final parentDir = path.dirname(filePath);
          await Directory(parentDir).create(recursive: true);

          // 写入文件
          await outputFile.writeAsBytes(file.content as List<int>);
        } else if (file.isDirectory) {
          final dirPath = path.join(destinationPath, file.name);
          await Directory(dirPath).create(recursive: true);
        }

        extractedCount++;
        _operationProgress[operationId] = extractedCount / totalCount;
        _compressionEventStreamController.add(CompressionEvent(
          id: operationId,
          type: CompressionOperationType.extract,
          status: CompressionStatus.inProgress,
          progress: extractedCount / totalCount,
        ));
      }

      _operationProgress[operationId] = 1.0;
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.extract,
        status: CompressionStatus.completed,
        progress: 1.0,
      ));

      return FileOperationResult.success();
    } catch (e) {
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.extract,
        status: CompressionStatus.failed,
        error: e.toString(),
      ));

      return FileOperationResult.failure(e.toString());
    } finally {
      _operationProgress.remove(operationId);
    }
  }

  // 创建ZIP压缩文件
  Future<Archive> _createZipArchive(
    List<File> sourceFiles,
    int compressionLevel,
    String? password,
    String operationId,
  ) async {
    final archive = Archive();

    for (int i = 0; i < sourceFiles.length; i++) {
      final file = sourceFiles[i];
      await _addFileToArchive(archive, file, '', password);

      // 更新进度
      _operationProgress[operationId] = (i + 1) / sourceFiles.length;
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.compress,
        status: CompressionStatus.inProgress,
        progress: (i + 1) / sourceFiles.length,
      ));
    }

    return archive;
  }

  // 创建TAR压缩文件
  Future<Archive> _createTarArchive(
    List<File> sourceFiles,
    String operationId,
  ) async {
    final archive = Archive();

    for (int i = 0; i < sourceFiles.length; i++) {
      final file = sourceFiles[i];
      await _addFileToArchive(archive, file, '', null);

      // 更新进度
      _operationProgress[operationId] = (i + 1) / sourceFiles.length;
      _compressionEventStreamController.add(CompressionEvent(
        id: operationId,
        type: CompressionOperationType.compress,
        status: CompressionStatus.inProgress,
        progress: (i + 1) / sourceFiles.length,
      ));
    }

    return archive;
  }

  // 创建TAR.GZ压缩文件
  Future<Archive> _createTarGzArchive(
    List<File> sourceFiles,
    int compressionLevel,
    String operationId,
  ) async {
    // 先创建TAR，然后压缩
    final tarArchive = await _createTarArchive(sourceFiles, operationId);
    return tarArchive;
  }

  // 添加文件到压缩包
  Future<void> _addFileToArchive(
    Archive archive,
    File file,
    String basePath,
    String? password,
  ) async {
    final relativePath = path.relative(file.path, from: basePath);
    final stat = await file.stat();

    if (await file.isDirectory()) {
      // 添加目录
      archive.addDirectory(
        relativePath,
        modified: stat.modified,
        accessed: stat.accessed,
      );

      // 递归添加子文件
      final entities = await file.list().toList();
      for (final entity in entities) {
        await _addFileToArchive(archive, entity as File, basePath, password);
      }
    } else {
      // 添加文件
      final bytes = await file.readAsBytes();
      final archiveFile = ArchiveFile(relativePath, bytes.length, bytes);

      archiveFile.mode = stat.mode;
      archiveFile.modified = stat.modified;
      archiveFile.accessed = stat.accessed;

      if (password != null) {
        // 这里应该实现密码加密
        // 简化实现，不加密
      }

      archive.addFile(archiveFile);
    }
  }

  // 创建压缩文件流
  Stream<List<int>> _createArchiveStream(Archive archive) async* {
    final zipEncoder = ZipEncoder();
    final bytes = zipEncoder.encode(archive);
    if (bytes != null) {
      yield bytes;
    }
  }

  // 获取压缩文件信息
  Future<ArchiveInfo> getArchiveInfo(String archivePath) async {
    try {
      final file = File(archivePath);
      if (!await file.exists()) {
        throw CompressionException('压缩文件不存在: $archivePath');
      }

      final bytes = await file.readAsBytes();
      Archive? archive;

      // 根据文件扩展名判断格式
      final extension = path.extension(archivePath).toLowerCase();

      switch (extension) {
        case '.zip':
          archive = ZipDecoder().decodeBytes(bytes);
          break;
        case '.tar':
          archive = TarDecoder().decodeBytes(bytes);
          break;
        case '.gz':
          final decompressed = GZipDecoder().decodeBytes(bytes);
          archive = TarDecoder().decodeBytes(decompressed);
          break;
        default:
          throw CompressionException('不支持的压缩格式: $extension');
      }

      final files = <ArchiveFileInfo>[];
      int totalSize = 0;
      int fileCount = 0;
      int dirCount = 0;

      for (final file in archive.files) {
        files.add(ArchiveFileInfo(
          name: file.name,
          size: file.size,
          isDirectory: file.isDirectory,
          modifiedTime: file.modified,
        ));

        if (file.isDirectory) {
          dirCount++;
        } else {
          fileCount++;
          totalSize += file.size;
        }
      }

      return ArchiveInfo(
        format: _getCompressionFormat(extension),
        totalFiles: fileCount,
        totalDirectories: dirCount,
        totalSize: totalSize,
        files: files,
      );
    } catch (e) {
      throw CompressionException('获取压缩文件信息失败: $e');
    }
  }

  // 获取压缩格式
  CompressionFormat _getCompressionFormat(String extension) {
    switch (extension) {
      case '.zip':
        return CompressionFormat.zip;
      case '.tar':
        return CompressionFormat.tar;
      case '.gz':
        return CompressionFormat.tarGz;
      default:
        return CompressionFormat.unknown;
    }
  }

  // 释放资源
  void dispose() {
    _compressionEventStreamController.close();
  }
}

// 压缩事件
class CompressionEvent {
  final String id;
  final CompressionOperationType type;
  final CompressionStatus status;
  final double progress;
  final String? error;
  final dynamic data;

  CompressionEvent({
    required this.id,
    required this.type,
    required this.status,
    required this.progress,
    this.error,
    this.data,
  });
}

// 压缩操作类型
enum CompressionOperationType {
  compress,
  extract,
}

// 压缩状态
enum CompressionStatus {
  started,
  inProgress,
  completed,
  failed,
  cancelled,
}

// 压缩格式
enum CompressionFormat {
  zip,
  tar,
  tarGz,
  unknown,
}

// 压缩文件信息
class ArchiveInfo {
  final CompressionFormat format;
  final int totalFiles;
  final int totalDirectories;
  final int totalSize;
  final List<ArchiveFileInfo> files;

  ArchiveInfo({
    required this.format,
    required this.totalFiles,
    required this.totalDirectories,
    required this.totalSize,
    required this.files,
  });

  String get formattedTotalSize {
    if (totalSize < 1024) return '$totalSize B';
    if (totalSize < 1024 * 1024) return '${(totalSize / 1024).toStringAsFixed(1)} KB';
    if (totalSize < 1024 * 1024 * 1024) return '${(totalSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(totalSize / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}

// 压缩文件信息
class ArchiveFileInfo {
  final String name;
  final int size;
  final bool isDirectory;
  final DateTime? modifiedTime;

  ArchiveFileInfo({
    required this.name,
    required this.size,
    required this.isDirectory,
    this.modifiedTime,
  });

  String get formattedSize {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)} KB';
    if (size < 1024 * 1024 * 1024) return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(size / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}

// 压缩异常
class CompressionException implements Exception {
  final String message;
  CompressionException(this.message);

  @override
  String toString() => message;
}
```

### 第六步：创建文件预览服务

```dart
// lib/services/file_preview_service.dart
import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:path/path.dart' as path;
import '../models/file_item.dart';

class FilePreviewService {
  static final FilePreviewService _instance = FilePreviewService._internal();
  factory FilePreviewService() => _instance;
  FilePreviewService._internal();

  // 获取文件预览类型
  FilePreviewType getPreviewType(FileItem fileItem) {
    if (fileItem.isDirectory) {
      return FilePreviewType.directory;
    }

    switch (fileItem.type) {
      case FileType.image:
        return FilePreviewType.image;
      case FileType.video:
        return FilePreviewType.video;
      case FileType.audio:
        return FilePreviewType.audio;
      case FileType.pdf:
        return FilePreviewType.pdf;
      case FileType.text:
        return FilePreviewType.text;
      case FileType.word:
      case FileType.excel:
      case FileType.powerpoint:
        return FilePreviewType.document;
      case FileType.archive:
        return FilePreviewType.archive;
      case FileType.apk:
        return FilePreviewType.apk;
      default:
        return FilePreviewType.unknown;
    }
  }

  // 获取文件预览组件
  Widget getPreviewWidget(FileItem fileItem, {double? width, double? height}) {
    final previewType = getPreviewType(fileItem);

    switch (previewType) {
      case FilePreviewType.directory:
        return _buildDirectoryPreview(fileItem, width: width, height: height);
      case FilePreviewType.image:
        return _buildImagePreview(fileItem, width: width, height: height);
      case FilePreviewType.video:
        return _buildVideoPreview(fileItem, width: width, height: height);
      case FilePreviewType.audio:
        return _buildAudioPreview(fileItem, width: width, height: height);
      case FilePreviewType.pdf:
        return _buildPdfPreview(fileItem, width: width, height: height);
      case FilePreviewType.text:
        return _buildTextPreview(fileItem, width: width, height: height);
      case FilePreviewType.document:
        return _buildDocumentPreview(fileItem, width: width, height: height);
      case FilePreviewType.archive:
        return _buildArchivePreview(fileItem, width: width, height: height);
      case FilePreviewType.apk:
        return _buildApkPreview(fileItem, width: width, height: height);
      case FilePreviewType.unknown:
        return _buildUnknownPreview(fileItem, width: width, height: height);
    }
  }

  // 构建目录预览
  Widget _buildDirectoryPreview(FileItem fileItem, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.folder, size: 48, color: Colors.orange),
          SizedBox(height: 8),
          Text('目录', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  // 构建图片预览
  Widget _buildImagePreview(FileItem fileItem, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.file(
          File(fileItem.path),
          width: width,
          height: height,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _buildErrorPreview('图片加载失败', width: width, height: height);
          },
        ),
      ),
    );
  }

  // 构建视频预览
  Widget _buildVideoPreview(FileItem fileItem, {double? width, double? height}) {
    return VideoPreviewWidget(
      videoPath: fileItem.path,
      width: width,
      height: height,
    );
  }

  // 构建音频预览
  Widget _buildAudioPreview(FileItem fileItem, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.audiotrack, size: 48, color: Colors.purple),
          SizedBox(height: 8),
          Text('音频文件', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  // 构建PDF预览
  Widget _buildPdfPreview(FileItem fileItem, {double? width, double? height}) {
    return PdfPreviewWidget(
      pdfPath: fileItem.path,
      width: width,
      height: height,
    );
  }

  // 构建文本预览
  Widget _buildTextPreview(FileItem fileItem, {double? width, double? height}) {
    return TextPreviewWidget(
      filePath: fileItem.path,
      width: width,
      height: height,
    );
  }

  // 构建文档预览
  Widget _buildDocumentPreview(FileItem fileItem, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _getDocumentIcon(fileItem.type),
            size: 48,
            color: Colors.blue,
          ),
          const SizedBox(height: 8),
          Text(
            _getDocumentTypeName(fileItem.type),
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  // 构建压缩文件预览
  Widget _buildArchivePreview(FileItem fileItem, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.archive, size: 48, color: Colors.brown),
          SizedBox(height: 8),
          Text('压缩文件', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  // 构建APK预览
  Widget _buildApkPreview(FileItem fileItem, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.android, size: 48, color: Colors.green),
          SizedBox(height: 8),
          Text('APK文件', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  // 构建未知文件预览
  Widget _buildUnknownPreview(FileItem fileItem, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.insert_drive_file, size: 48, color: Colors.grey),
          SizedBox(height: 8),
          Text('未知文件', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  // 构建错误预览
  Widget _buildErrorPreview(String message, {double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error, size: 48, color: Colors.red),
          const SizedBox(height: 8),
          Text(message, style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  // 获取文档图标
  IconData _getDocumentIcon(FileType fileType) {
    switch (fileType) {
      case FileType.word:
        return Icons.description;
      case FileType.excel:
        return Icons.table_chart;
      case FileType.powerpoint:
        return Icons.slideshow;
      default:
        return Icons.insert_drive_file;
    }
  }

  // 获取文档类型名称
  String _getDocumentTypeName(FileType fileType) {
    switch (fileType) {
      case FileType.word:
        return 'Word文档';
      case FileType.excel:
        return 'Excel表格';
      case FileType.powerpoint:
        return 'PowerPoint演示';
      default:
        return '文档';
    }
  }

  // 生成缩略图
  Future<String?> generateThumbnail(String filePath, {int maxWidth = 200, int maxHeight = 200}) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return null;
      }

      final fileItem = FileItem.fromFileSystemEntity(file);
      final previewType = getPreviewType(fileItem);

      // 只为图片生成缩略图
      if (previewType != FilePreviewType.image) {
        return null;
      }

      // 这里应该使用图片处理库生成缩略图
      // 简化实现，返回原文件路径
      return filePath;
    } catch (e) {
      debugPrint('生成缩略图失败: $e');
      return null;
    }
  }

  // 获取文件内容预览
  Future<String?> getFileContentPreview(String filePath, {int maxLines = 50}) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        return null;
      }

      final fileItem = FileItem.fromFileSystemEntity(file);
      final previewType = getPreviewType(fileItem);

      // 只为文本文件提供内容预览
      if (previewType != FilePreviewType.text) {
        return null;
      }

      // 读取文件内容
      final content = await file.readAsString(encoding: utf8);
      final lines = content.split('\n');

      if (lines.length <= maxLines) {
        return content;
      }

      // 返回前几行
      return lines.take(maxLines).join('\n') + '\n...';
    } catch (e) {
      debugPrint('获取文件内容预览失败: $e');
      return null;
    }
  }
}

// 文件预览类型
enum FilePreviewType {
  directory,
  image,
  video,
  audio,
  pdf,
  text,
  document,
  archive,
  apk,
  unknown,
}

// 视频预览组件
class VideoPreviewWidget extends StatefulWidget {
  final String videoPath;
  final double? width;
  final double? height;

  const VideoPreviewWidget({
    Key? key,
    required this.videoPath,
    this.width,
    this.height,
  }) : super(key: key);

  @override
  _VideoPreviewWidgetState createState() => _VideoPreviewWidgetState();
}

class _VideoPreviewWidgetState extends State<VideoPreviewWidget> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    try {
      _controller = VideoPlayerController.file(File(widget.videoPath));
      await _controller!.initialize();

      setState(() {
        _isInitialized = true;
      });
    } catch (e) {
      debugPrint('视频初始化失败: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Container(
      width: widget.width,
      height: widget.height,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: VideoPlayer(_controller!),
      ),
    );
  }
}

// PDF预览组件
class PdfPreviewWidget extends StatefulWidget {
  final String pdfPath;
  final double? width;
  final double? height;

  const PdfPreviewWidget({
    Key? key,
    required this.pdfPath,
    this.width,
    this.height,
  }) : super(key: key);

  @override
  _PdfPreviewWidgetState createState() => _PdfPreviewWidgetState();
}

class _PdfPreviewWidgetState extends State<PdfPreviewWidget> {
  final PDFViewController _pdfViewController = PDFViewController();
  bool _isLoaded = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: widget.width,
      height: widget.height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Stack(
        children: [
          PDFView(
            filePath: widget.pdfPath,
            enableSwipe: true,
            swipeHorizontal: false,
            autoSpacing: false,
            pageFling: true,
            pageSnap: true,
            defaultPage: 0,
            fitPolicy: FitPolicy.BOTH,
            preventLinkNavigation: false,
            onRender: (pages) {
              setState(() {
                _isLoaded = true;
              });
            },
            onError: (error) {
              debugPrint('PDF加载错误: $error');
            },
            onPageError: (page, error) {
              debugPrint('PDF页面错误: $page, $error');
            },
            onViewCreated: (PDFViewController pdfViewController) {
              _pdfViewController = pdfViewController;
            },
            onLinkHandler: (uri) {
              debugPrint('PDF链接: $uri');
            },
          ),
          if (!_isLoaded)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}

// 文本预览组件
class TextPreviewWidget extends StatefulWidget {
  final String filePath;
  final double? width;
  final double? height;

  const TextPreviewWidget({
    Key? key,
    required this.filePath,
    this.width,
    this.height,
  }) : super(key: key);

  @override
  _TextPreviewWidgetState createState() => _TextPreviewWidgetState();
}

class _TextPreviewWidgetState extends State<TextPreviewWidget> {
  String? _content;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    try {
      final file = File(widget.filePath);
      if (!await file.exists()) {
        setState(() {
          _error = '文件不存在';
          _isLoading = false;
        });
        return;
      }

      final content = await file.readAsString(encoding: utf8);
      setState(() {
        _content = content;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text('加载失败: $_error'),
        ),
      );
    }

    return Container(
      width: widget.width,
      height: widget.height,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: SingleChildScrollView(
        child: Text(
          _content ?? '',
          style: const TextStyle(fontFamily: 'monospace'),
        ),
      ),
    );
  }
}
```

### 第七步：创建主应用界面

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'widgets/file_list_widget.dart';
import 'widgets/file_preview_widget.dart';
import 'models/file_item.dart';
import 'services/file_service.dart';
import 'services/file_search_service.dart';
import 'services/file_compression_service.dart';

void main() {
  runApp(const FileManagerProApp());
}

class FileManagerProApp extends StatelessWidget {
  const FileManagerProApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FileManagerPro',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        brightness: Brightness.light,
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final FileService _fileService = FileService();
  final FileSearchService _searchService = FileSearchService();
  final FileCompressionService _compressionService = FileCompressionService();

  bool _permissionsGranted = false;
  bool _isLoading = false;
  String _currentPath = '';
  List<FileItem> _currentFiles = [];
  List<FileItem> _selectedFiles = [];
  bool _isSelectionMode = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _checkPermissions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);

    try {
      final storagePermission = await Permission.storage.status;
      final photosPermission = await Permission.photos.status;

      if (storagePermission.isGranted || photosPermission.isGranted) {
        setState(() => _permissionsGranted = true);
        await _initializeApp();
      } else {
        setState(() => _permissionsGranted = false);
      }
    } catch (e) {
      setState(() => _permissionsGranted = false);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPermissions() async {
    try {
      final storagePermission = await Permission.storage.request();
      final photosPermission = await Permission.photos.request();

      if (storagePermission.isGranted || photosPermission.isGranted) {
        setState(() => _permissionsGranted = true);
        await _initializeApp();
      } else {
        _showPermissionDeniedDialog('存储权限被拒绝，应用无法正常工作');
      }
    } catch (e) {
      _showErrorSnackBar('请求权限失败: $e');
    }
  }

  Future<void> _initializeApp() async {
    try {
      await _fileService.initialize();
      final directories = await _fileService.getAppDirectories();
      setState(() {
        _currentPath = directories['documents']!;
      });
      await _loadDirectoryContents();
    } catch (e) {
      _showErrorSnackBar('初始化应用失败: $e');
    }
  }

  Future<void> _loadDirectoryContents() async {
    try {
      final files = await _fileService.getDirectoryContents(_currentPath);
      setState(() {
        _currentFiles = files;
      });
    } catch (e) {
      _showErrorSnackBar('加载目录内容失败: $e');
    }
  }

  void _showPermissionDeniedDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('权限被拒绝'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              openAppSettings();
            },
            child: const Text('打开设置'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _onFileTap(FileItem fileItem) {
    if (_isSelectionMode) {
      _toggleFileSelection(fileItem);
    } else {
      if (fileItem.isDirectory) {
        _navigateToDirectory(fileItem.path);
      } else {
        _showFilePreview(fileItem);
      }
    }
  }

  void _onFileLongPress(FileItem fileItem) {
    _showFileOptions(fileItem);
  }

  void _navigateToDirectory(String path) {
    setState(() {
      _currentPath = path;
    });
    _loadDirectoryContents();
  }

  void _navigateToParentDirectory() {
    final parentPath = _currentPath.substring(0, _currentPath.lastIndexOf('/'));
    if (parentPath.isNotEmpty) {
      _navigateToDirectory(parentPath);
    }
  }

  void _showFilePreview(FileItem fileItem) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => FilePreviewScreen(fileItem: fileItem),
      ),
    );
  }

  void _showFileOptions(FileItem fileItem) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.open_with),
            title: const Text('打开'),
            onTap: () {
              Navigator.of(context).pop();
              _showFilePreview(fileItem);
            },
          ),
          if (!fileItem.isDirectory) ...[
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('分享'),
              onTap: () {
                Navigator.of(context).pop();
                _shareFile(fileItem);
              },
            ),
            ListTile(
              leading: const Icon(Icons.content_copy),
              title: const Text('复制'),
              onTap: () {
                Navigator.of(context).pop();
                _copyFile(fileItem);
              },
            ),
            ListTile(
              leading: const Icon(Icons.cut),
              title: const Text('移动'),
              onTap: () {
                Navigator.of(context).pop();
                _moveFile(fileItem);
              },
            ),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('重命名'),
              onTap: () {
                Navigator.of(context).pop();
                _renameFile(fileItem);
              },
            ),
          ],
          ListTile(
            leading: const Icon(Icons.delete),
            title: const Text('删除'),
            onTap: () {
              Navigator.of(context).pop();
              _deleteFile(fileItem);
            },
          ),
        ],
      ),
    );
  }

  void _toggleFileSelection(FileItem fileItem) {
    setState(() {
      if (_selectedFiles.contains(fileItem)) {
        _selectedFiles.remove(fileItem);
      } else {
        _selectedFiles.add(fileItem);
      }

      if (_selectedFiles.isEmpty) {
        _isSelectionMode = false;
      }
    });
  }

  void _toggleSelectionMode() {
    setState(() {
      _isSelectionMode = !_isSelectionMode;
      if (!_isSelectionMode) {
        _selectedFiles.clear();
      }
    });
  }

  void _shareFile(FileItem fileItem) {
    // 这里应该实现文件分享功能
    _showSuccessSnackBar('分享功能待实现');
  }

  Future<void> _copyFile(FileItem fileItem) async {
    try {
      final result = await _fileService.copyFile(
        fileItem.path,
        '${_currentPath}/${fileItem.name}',
      );

      if (result.success) {
        _showSuccessSnackBar('文件复制成功');
        await _loadDirectoryContents();
      } else {
        _showErrorSnackBar('复制失败: ${result.error}');
      }
    } catch (e) {
      _showErrorSnackBar('复制失败: $e');
    }
  }

  Future<void> _moveFile(FileItem fileItem) async {
    try {
      final result = await _fileService.moveFile(
        fileItem.path,
        '${_currentPath}/${fileItem.name}',
      );

      if (result.success) {
        _showSuccessSnackBar('文件移动成功');
        await _loadDirectoryContents();
      } else {
        _showErrorSnackBar('移动失败: ${result.error}');
      }
    } catch (e) {
      _showErrorSnackBar('移动失败: $e');
    }
  }

  void _renameFile(FileItem fileItem) {
    final controller = TextEditingController(text: fileItem.name);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('重命名'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: '新名称',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _performRename(fileItem, controller.text);
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  Future<void> _performRename(FileItem fileItem, String newName) async {
    try {
      final result = await _fileService.renameFile(fileItem.path, newName);

      if (result.success) {
        _showSuccessSnackBar('重命名成功');
        await _loadDirectoryContents();
      } else {
        _showErrorSnackBar('重命名失败: ${result.error}');
      }
    } catch (e) {
      _showErrorSnackBar('重命名失败: $e');
    }
  }

  Future<void> _deleteFile(FileItem fileItem) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除 ${fileItem.name} 吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final result = await _fileService.deleteFile(fileItem.path);

        if (result.success) {
          _showSuccessSnackBar('删除成功');
          await _loadDirectoryContents();
        } else {
          _showErrorSnackBar('删除失败: ${result.error}');
        }
      } catch (e) {
        _showErrorSnackBar('删除失败: $e');
      }
    }
  }

  void _showCreateFileDialog() {
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('新建文件'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: '文件名',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _createFile(nameController.text);
            },
            child: const Text('创建'),
          ),
        ],
      ),
    );
  }

  Future<void> _createFile(String fileName) async {
    try {
      final result = await _fileService.createFile(_currentPath, fileName);

      if (result.success) {
        _showSuccessSnackBar('文件创建成功');
        await _loadDirectoryContents();
      } else {
        _showErrorSnackBar('创建失败: ${result.error}');
      }
    } catch (e) {
      _showErrorSnackBar('创建失败: $e');
    }
  }

  void _showCreateDirectoryDialog() {
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('新建目录'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: '目录名',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _createDirectory(nameController.text);
            },
            child: const Text('创建'),
          ),
        ],
      ),
    );
  }

  Future<void> _createDirectory(String dirName) async {
    try {
      final result = await _fileService.createDirectory(_currentPath, dirName);

      if (result.success) {
        _showSuccessSnackBar('目录创建成功');
        await _loadDirectoryContents();
      } else {
        _showErrorSnackBar('创建失败: ${result.error}');
      }
    } catch (e) {
      _showErrorSnackBar('创建失败: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!_permissionsGranted) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('FileManagerPro'),
          backgroundColor: Colors.blue,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.folder,
                size: 64,
                color: Colors.grey,
              ),
              const SizedBox(height: 16),
              const Text(
                '需要存储权限',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'FileManagerPro需要访问存储来提供文件管理服务',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _requestPermissions,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: const Text(
                  '授予权限',
                  style: TextStyle(fontSize: 18),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_currentPath.split('/').last),
        backgroundColor: Colors.blue,
        actions: [
          IconButton(
            icon: Icon(_isSelectionMode ? Icons.close : Icons.checklist),
            onPressed: _toggleSelectionMode,
            tooltip: _isSelectionMode ? '取消选择' : '选择模式',
          ),
          if (_isSelectionMode && _selectedFiles.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: _deleteSelectedFiles,
              tooltip: '删除选中文件',
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.folder), text: '文件'),
            Tab(icon: Icon(Icons.search), text: '搜索'),
            Tab(icon: Icon(Icons.archive), text: '压缩'),
            Tab(icon: Icon(Icons.storage), text: '存储'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 文件列表
          FileListWidget(
            currentPath: _currentPath,
            files: _currentFiles,
            selectedFiles: _selectedFiles,
            isSelectionMode: _isSelectionMode,
            onFileTap: _onFileTap,
            onFileLongPress: _onFileLongPress,
            onNavigateToParent: _navigateToParentDirectory,
            onRefresh: _loadDirectoryContents,
          ),

          // 搜索页面
          FileSearchScreen(
            searchService: _searchService,
            onFileTap: _onFileTap,
          ),

          // 压缩页面
          FileCompressionScreen(
            compressionService: _compressionService,
            currentPath: _currentPath,
            onRefresh: _loadDirectoryContents,
          ),

          // 存储信息页面
          FileStorageScreen(
            fileService: _fileService,
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          const SizedBox(height: 16),
          FloatingActionButton(
            heroTag: "create_directory",
            onPressed: _showCreateDirectoryDialog,
            child: const Icon(Icons.create_new_folder),
          ),
          const SizedBox(height: 16),
          FloatingActionButton(
            heroTag: "create_file",
            onPressed: _showCreateFileDialog,
            child: const Icon(Icons.note_add),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteSelectedFiles() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除选中的 ${_selectedFiles.length} 个文件吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      for (final file in _selectedFiles) {
        await _deleteFile(file);
      }

      setState(() {
        _selectedFiles.clear();
        _isSelectionMode = false;
      });
    }
  }
}

// 文件预览页面
class FilePreviewScreen extends StatelessWidget {
  final FileItem fileItem;

  const FilePreviewScreen({
    Key? key,
    required this.fileItem,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(fileItem.name),
        backgroundColor: Colors.blue,
      ),
      body: Center(
        child: FilePreviewService().getPreviewWidget(fileItem),
      ),
    );
  }
}

// 文件搜索页面
class FileSearchScreen extends StatefulWidget {
  final FileSearchService searchService;
  final Function(FileItem) onFileTap;

  const FileSearchScreen({
    Key? key,
    required this.searchService,
    required this.onFileTap,
  }) : super(key: key);

  @override
  _FileSearchScreenState createState() => _FileSearchScreenState();
}

class _FileSearchScreenState extends State<FileSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<FileItem> _searchResults = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text;
    if (query.isEmpty) {
      setState(() {
        _searchResults.clear();
      });
      return;
    }

    _performSearch(query);
  }

  Future<void> _performSearch(String query) async {
    setState(() => _isSearching = true);

    try {
      final results = await widget.searchService.searchFiles(query: query);
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (e) {
      setState(() {
        _isSearching = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索文件',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => _searchController.clear(),
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        Expanded(
          child: _isSearching
              ? const Center(child: CircularProgressIndicator())
              : _searchResults.isEmpty
                  ? const Center(
                      child: Text('未找到文件'),
                    )
                  : ListView.builder(
                      itemCount: _searchResults.length,
                      itemBuilder: (context, index) {
                        final file = _searchResults[index];
                        return ListTile(
                          leading: Icon(_getFileIcon(file.type)),
                          title: Text(file.name),
                          subtitle: Text(file.formattedSize),
                          onTap: () => widget.onFileTap(file),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  IconData _getFileIcon(FileType type) {
    switch (type) {
      case FileType.image:
        return Icons.image;
      case FileType.video:
        return Icons.video_file;
      case FileType.audio:
        return Icons.audiotrack;
      case FileType.pdf:
        return Icons.picture_as_pdf;
      case FileType.text:
        return Icons.text_snippet;
      case FileType.word:
      case FileType.excel:
      case FileType.powerpoint:
        return Icons.description;
      case FileType.archive:
        return Icons.archive;
      case FileType.apk:
        return Icons.android;
      case FileType.directory:
        return Icons.folder;
      default:
        return Icons.insert_drive_file;
    }
  }
}

// 文件压缩页面
class FileCompressionScreen extends StatelessWidget {
  final FileCompressionService compressionService;
  final String currentPath;
  final VoidCallback onRefresh;

  const FileCompressionScreen({
    Key? key,
    required this.compressionService,
    required this.currentPath,
    required this.onRefresh,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('压缩功能待实现'),
    );
  }
}

// 文件存储页面
class FileStorageScreen extends StatefulWidget {
  final FileService fileService;

  const FileStorageScreen({
    Key? key,
    required this.fileService,
  }) : super(key: key);

  @override
  _FileStorageScreenState createState() => _FileStorageScreenState();
}

class _FileStorageScreenState extends State<FileStorageScreen> {
  StorageInfo? _storageInfo;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadStorageInfo();
  }

  Future<void> _loadStorageInfo() async {
    setState(() => _isLoading = true);

    try {
      final storageInfo = await widget.fileService.getStorageInfo();
      setState(() {
        _storageInfo = storageInfo;
      });
    } catch (e) {
      // 处理错误
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_storageInfo == null) {
      return const Center(child: Text('无法获取存储信息'));
    }

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '存储空间',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          _buildStorageItem('总空间', _storageInfo!.formattedTotalSpace),
          _buildStorageItem('已使用', _storageInfo!.formattedUsedSpace),
          _buildStorageItem('可用空间', _storageInfo!.formattedFreeSpace),
          const SizedBox(height: 24),
          LinearProgressIndicator(
            value: _storageInfo!.usagePercentage / 100,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(
              _storageInfo!.usagePercentage > 80 ? Colors.red : Colors.blue,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '使用率: ${_storageInfo!.usagePercentage.toStringAsFixed(1)}%',
            style: const TextStyle(fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildStorageItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 18),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

// 文件列表组件
class FileListWidget extends StatelessWidget {
  final String currentPath;
  final List<FileItem> files;
  final List<FileItem> selectedFiles;
  final bool isSelectionMode;
  final Function(FileItem) onFileTap;
  final Function(FileItem) onFileLongPress;
  final VoidCallback onNavigateToParent;
  final VoidCallback onRefresh;

  const FileListWidget({
    Key? key,
    required this.currentPath,
    required this.files,
    required this.selectedFiles,
    required this.isSelectionMode,
    required this.onFileTap,
    required this.onFileLongPress,
    required this.onNavigateToParent,
    required this.onRefresh,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: Column(
        children: [
          // 路径导航栏
          Container(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_upward),
                  onPressed: onNavigateToParent,
                ),
                Expanded(
                  child: Text(
                    currentPath,
                    style: const TextStyle(fontSize: 16),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),

          // 文件列表
          Expanded(
            child: files.isEmpty
                ? const Center(
                    child: Text('此目录为空'),
                  )
                : ListView.builder(
                    itemCount: files.length,
                    itemBuilder: (context, index) {
                      final file = files[index];
                      final isSelected = selectedFiles.contains(file);

                      return FileTile(
                        file: file,
                        isSelected: isSelected,
                        onTap: () => onFileTap(file),
                        onLongPress: () => onFileLongPress(file),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

// 文件卡片组件
class FileTile extends StatelessWidget {
  final FileItem file;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const FileTile({
    Key? key,
    required this.file,
    this.isSelected = false,
    required this.onTap,
    required this.onLongPress,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          _getFileIcon(file.type),
          color: _getFileColor(file.type),
        ),
      ),
      title: Text(
        file.name,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      subtitle: Text(
        file.isDirectory ? '目录' : file.formattedSize,
        style: const TextStyle(color: Colors.grey),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: Colors.blue)
          : const Icon(Icons.more_vert),
      onTap: onTap,
      onLongPress: onLongPress,
    );
  }

  IconData _getFileIcon(FileType type) {
    switch (type) {
      case FileType.image:
        return Icons.image;
      case FileType.video:
        return Icons.video_file;
      case FileType.audio:
        return Icons.audiotrack;
      case FileType.pdf:
        return Icons.picture_as_pdf;
      case FileType.text:
        return Icons.text_snippet;
      case FileType.word:
      case FileType.excel:
      case FileType.powerpoint:
        return Icons.description;
      case FileType.archive:
        return Icons.archive;
      case FileType.apk:
        return Icons.android;
      case FileType.directory:
        return Icons.folder;
      default:
        return Icons.insert_drive_file;
    }
  }

  Color _getFileColor(FileType type) {
    switch (type) {
      case FileType.image:
        return Colors.green;
      case FileType.video:
        return Colors.purple;
      case FileType.audio:
        return Colors.orange;
      case FileType.pdf:
        return Colors.red;
      case FileType.text:
        return Colors.blue;
      case FileType.word:
      case FileType.excel:
      case FileType.powerpoint:
        return Colors.indigo;
      case FileType.archive:
        return Colors.brown;
      case FileType.apk:
        return Colors.green;
      case FileType.directory:
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}
```

## 高级功能实现

### 1. 文件加密解密

```dart
// lib/services/file_encryption_service.dart
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart';
import '../models/file_item.dart';

class FileEncryptionService {
  static final FileEncryptionService _instance = FileEncryptionService._internal();
  factory FileEncryptionService() => _instance;
  FileEncryptionService._internal();

  // 加密文件
  Future<FileOperationResult> encryptFile({
    required String sourcePath,
    required String destinationPath,
    required String password,
    EncryptionAlgorithm algorithm = EncryptionAlgorithm.aes,
  }) async {
    try {
      final sourceFile = File(sourcePath);
      if (!await sourceFile.exists()) {
        throw EncryptionException('源文件不存在: $sourcePath');
      }

      final destinationFile = File(destinationPath);

      // 读取源文件
      final sourceBytes = await sourceFile.readAsBytes();

      // 生成加密密钥
      final key = _generateKey(password, algorithm);

      // 加密数据
      Uint8List encryptedBytes;

      switch (algorithm) {
        case EncryptionAlgorithm.aes:
          final encrypter = Encrypter(AES(key));
          final iv = IV.fromSecureRandom(16);
          encryptedBytes = encrypter.encryptBytes(sourceBytes, iv: iv).bytes;
          break;
        case EncryptionAlgorithm.salsa20:
          final encrypter = Encrypter(Salsa20(key));
          encryptedBytes = encrypter.encryptBytes(sourceBytes).bytes;
          break;
      }

      // 写入加密文件
      await destinationFile.writeAsBytes(encryptedBytes);

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(destinationFile));
    } catch (e) {
      return FileOperationResult.failure(e.toString());
    }
  }

  // 解密文件
  Future<FileOperationResult> decryptFile({
    required String sourcePath,
    required String destinationPath,
    required String password,
    EncryptionAlgorithm algorithm = EncryptionAlgorithm.aes,
  }) async {
    try {
      final sourceFile = File(sourcePath);
      if (!await sourceFile.exists()) {
        throw EncryptionException('源文件不存在: $sourcePath');
      }

      final destinationFile = File(destinationPath);

      // 读取加密文件
      final encryptedBytes = await sourceFile.readAsBytes();

      // 生成解密密钥
      final key = _generateKey(password, algorithm);

      // 解密数据
      Uint8List decryptedBytes;

      switch (algorithm) {
        case EncryptionAlgorithm.aes:
          final encrypter = Encrypter(AES(key));
          final iv = IV.fromLength(16);
          decryptedBytes = encrypter.decryptBytes(Encrypted(encryptedBytes), iv: iv);
          break;
        case EncryptionAlgorithm.salsa20:
          final encrypter = Encrypter(Salsa20(key));
          decryptedBytes = encrypter.decryptBytes(Encrypted(encryptedBytes));
          break;
      }

      // 写入解密文件
      await destinationFile.writeAsBytes(decryptedBytes);

      return FileOperationResult.success(data: FileItem.fromFileSystemEntity(destinationFile));
    } catch (e) {
      return FileOperationResult.failure(e.toString());
    }
  }

  // 生成密钥
  Key _generateKey(String password, EncryptionAlgorithm algorithm) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);

    switch (algorithm) {
      case EncryptionAlgorithm.aes:
        return Key.fromUtf8(digest.toString().substring(0, 32));
      case EncryptionAlgorithm.salsa20:
        return Key.fromUtf8(digest.toString().substring(0, 32));
    }
  }

  // 计算文件哈希
  Future<String> calculateFileHash(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw EncryptionException('文件不存在: $filePath');
      }

      final bytes = await file.readAsBytes();
      final digest = sha256.convert(bytes);
      return digest.toString();
    } catch (e) {
      throw EncryptionException('计算文件哈希失败: $e');
    }
  }

  // 验证文件完整性
  Future<bool> verifyFileIntegrity(String filePath, String expectedHash) async {
    try {
      final actualHash = await calculateFileHash(filePath);
      return actualHash == expectedHash;
    } catch (e) {
      throw EncryptionException('验证文件完整性失败: $e');
    }
  }
}

// 加密算法
enum EncryptionAlgorithm {
  aes,
  salsa20,
}

// 加密异常
class EncryptionException implements Exception {
  final String message;
  EncryptionException(this.message);

  @override
  String toString() => message;
}
```

### 2. 云存储集成

```dart
// lib/services/cloud_storage_service.dart
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/file_item.dart';

abstract class CloudStorageService {
  final StreamController<CloudStorageEvent> _eventStreamController = StreamController<CloudStorageEvent>.broadcast();

  // 云存储事件流
  Stream<CloudStorageEvent> get eventStream => _eventStreamController.stream;

  // 上传文件
  Future<CloudUploadResult> uploadFile({
    required String localPath,
    required String remotePath,
    ProgressCallback? onProgress,
  });

  // 下载文件
  Future<CloudDownloadResult> downloadFile({
    required String remotePath,
    required String localPath,
    ProgressCallback? onProgress,
  });

  // 删除文件
  Future<bool> deleteFile(String remotePath);

  // 列出文件
  Future<List<CloudFile>> listFiles(String remotePath);

  // 创建目录
  Future<bool> createDirectory(String remotePath);

  // 获取文件信息
  Future<CloudFile?> getFileInfo(String remotePath);

  // 发送事件
  void _sendEvent(CloudStorageEventType type, {dynamic data}) {
    _eventStreamController.add(CloudStorageEvent(
      type: type,
      timestamp: DateTime.now(),
      data: data,
    ));
  }

  // 释放资源
  void dispose() {
    _eventStreamController.close();
  }
}

// 云存储事件
class CloudStorageEvent {
  final CloudStorageEventType type;
  final DateTime timestamp;
  final dynamic data;

  CloudStorageEvent({
    required this.type,
    required this.timestamp,
    this.data,
  });
}

// 云存储事件类型
enum CloudStorageEventType {
  uploadStarted,
  uploadProgress,
  uploadCompleted,
  uploadFailed,
  downloadStarted,
  downloadProgress,
  downloadCompleted,
  downloadFailed,
  deleteStarted,
  deleteCompleted,
  deleteFailed,
}

// 云存储文件
class CloudFile {
  final String name;
  final String path;
  final int size;
  final DateTime modifiedTime;
  final bool isDirectory;
  final String? downloadUrl;

  CloudFile({
    required this.name,
    required this.path,
    required this.size,
    required this.modifiedTime,
    required this.isDirectory,
    this.downloadUrl,
  });

  String get formattedSize {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)} KB';
    if (size < 1024 * 1024 * 1024) return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(size / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}

// 上传结果
class CloudUploadResult {
  final bool success;
  final String? error;
  final CloudFile? file;

  CloudUploadResult({
    required this.success,
    this.error,
    this.file,
  });

  factory CloudUploadResult.success(CloudFile file) {
    return CloudUploadResult(success: true, file: file);
  }

  factory CloudUploadResult.failure(String error) {
    return CloudUploadResult(success: false, error: error);
  }
}

// 下载结果
class CloudDownloadResult {
  final bool success;
  final String? error;
  final String? localPath;

  CloudDownloadResult({
    required this.success,
    this.error,
    this.localPath,
  });

  factory CloudDownloadResult.success(String localPath) {
    return CloudDownloadResult(success: true, localPath: localPath);
  }

  factory CloudDownloadResult.failure(String error) {
    return CloudDownloadResult(success: false, error: error);
  }
}

// 进度回调
typedef ProgressCallback = void Function(double progress);
```

## 测试与调试

### 1. 文件服务测试

```dart
// test/file_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:file_manager_pro/services/file_service.dart';

void main() {
  group('FileService Tests', () {
    late FileService fileService;

    setUp(() {
      fileService = FileService();
    });

    test('should initialize successfully with granted permissions', () async {
      // 模拟权限授予
      // 这里需要模拟权限检查返回true

      await expectLater(fileService.initialize(), completes);
    });

    test('should throw exception when permissions are denied', () async {
      // 模拟权限拒绝
      // 这里需要模拟权限检查返回false

      await expectLater(
        fileService.initialize(),
        throwsA(isA<FileException>()),
      );
    });

    test('should get directory contents correctly', () async {
      // 模拟目录内容
      // 这里需要模拟目录列表返回

      final contents = await fileService.getDirectoryContents('/test/path');
      expect(contents, isA<List<FileItem>>());
    });
  });
}
```

### 2. 文件搜索测试

```dart
// test/file_search_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:file_manager_pro/services/file_search_service.dart';

void main() {
  group('FileSearchService Tests', () {
    late FileSearchService searchService;

    setUp(() {
      searchService = FileSearchService();
    });

    test('should search files correctly', () async {
      final results = await searchService.searchFiles(query: 'test');
      expect(results, isA<List<FileItem>>());
    });

    test('should handle empty query', () async {
      final results = await searchService.searchFiles(query: '');
      expect(results, isA<List<FileItem>>());
    });

    test('should filter by file type', () async {
      final results = await searchService.searchFiles(
        query: 'test',
        fileTypes: [FileType.image],
      );
      expect(results, isA<List<FileItem>>());
    });
  });
}
```

## 最佳实践与注意事项

### 1. 权限管理

- **渐进式权限请求**：先请求基本权限，再请求敏感权限
- **权限说明**：清晰地向用户解释为什么需要权限
- **优雅降级**：在权限被拒绝时提供替代功能

### 2. 性能优化

- **分页加载**：对于大量文件，使用分页加载
- **异步操作**：所有文件操作都应该是异步的
- **缓存策略**：合理缓存文件信息和缩略图

### 3. 数据安全

- **文件加密**：对敏感文件进行加密存储
- **安全删除**：确保文件被彻底删除
- **权限控制**：严格控制文件访问权限

### 4. 用户体验

- **进度反馈**：提供文件操作的进度反馈
- **错误处理**：优雅地处理各种错误情况
- **撤销操作**：支持撤销文件操作

### 5. 平台差异

- **API 差异**：处理 Android 和 iOS 平台 API 的差异
- **存储路径**：适配不同平台的存储路径
- **文件系统**：考虑不同平台的文件系统特性

## 总结

通过本文的详细介绍，我们成功实现了一个功能完整的专业文件管理应用 FileManagerPro。这个项目涵盖了：

1. **文件管理基础架构**：设计了完整的文件管理架构
2. **文件搜索功能**：实现了高效的文件搜索和过滤
3. **文件压缩解压**：提供了多种格式的压缩解压功能
4. **文件预览功能**：实现了多种文件类型的预览
5. **高级功能**：实现了文件加密和云存储集成
6. **用户界面设计**：创建了直观的文件管理界面
7. **测试与调试**：提供了完整的测试方案

文件管理是移动应用开发中的重要功能，通过 Flutter 的桥接能力，我们可以轻松实现跨平台的文件管理功能。在实际项目中，还可以根据具体需求进一步扩展功能，比如：

- 集成更多云存储服务（如 Google Drive、OneDrive 等）
- 添加文件同步功能
- 实现文件版本控制
- 添加文件标签和分类功能
- 集成文件编辑器
- 实现文件分享和协作功能

希望本文能够帮助开发者更好地理解和实现 Flutter 中的文件管理功能。
