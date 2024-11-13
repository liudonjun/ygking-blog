---
title: Flutter 权限处理详解
description: 详细介绍 Flutter 中处理应用权限的方法和最佳实践。
tag:
 - Flutter
 - 实战
sidebar: true
---

# Flutter 权限处理详解

## 简介

移动应用经常需要访问设备的各种功能(如相机、位置等),这就需要合理处理权限申请和检查。本文介绍 Flutter 中权限处理的方法。

## 基本配置

### 添加依赖
```yaml
dependencies:
  permission_handler: ^10.4.3
```

### 配置平台权限

#### Android (AndroidManifest.xml)
```xml
<manifest xmlns:android="...">
    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
</manifest>
```

#### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机以拍摄照片</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册以选择照片</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要访问位置信息以提供相关服务</string>
```

## 基本使用

### 检查权限
```dart
Future<bool> checkPermission(Permission permission) async {
  final status = await permission.status;
  return status.isGranted;
}
```

### 请求权限
```dart
Future<bool> requestPermission(Permission permission) async {
  final status = await permission.request();
  return status.isGranted;
}
```

### 打开设置
```dart
void openSettings() async {
  await openAppSettings();
}
```

## 完整示例

```dart
class PermissionManager {
  static final PermissionManager _instance = PermissionManager._internal();
  factory PermissionManager() => _instance;
  
  PermissionManager._internal();
  
  // 检查多个权限
  Future<Map<Permission, bool>> checkPermissions(
    List<Permission> permissions,
  ) async {
    Map<Permission, bool> statuses = {};
    for (var permission in permissions) {
      statuses[permission] = await checkPermission(permission);
    }
    return statuses;
  }
  
  // 请求多个权限
  Future<Map<Permission, bool>> requestPermissions(
    List<Permission> permissions,
  ) async {
    Map<Permission, bool> statuses = {};
    for (var permission in permissions) {
      statuses[permission] = await requestPermission(permission);
    }
    return statuses;
  }
  
  // 检查单个权限
  Future<bool> checkPermission(Permission permission) async {
    final status = await permission.status;
    return status.isGranted;
  }
  
  // 请求单个权限
  Future<bool> requestPermission(Permission permission) async {
    final status = await permission.request();
    return status.isGranted;
  }
  
  // 检查并请求权限
  Future<bool> checkAndRequestPermission(Permission permission) async {
    if (await checkPermission(permission)) {
      return true;
    }
    return await requestPermission(permission);
  }
}

// 使用示例
class PermissionDemo extends StatefulWidget {
  @override
  _PermissionDemoState createState() => _PermissionDemoState();
}

class _PermissionDemoState extends State<PermissionDemo> {
  final permissionManager = PermissionManager();
  Map<Permission, bool> _permissionStatuses = {};
  
  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }
  
  Future<void> _checkPermissions() async {
    final statuses = await permissionManager.checkPermissions([
      Permission.camera,
      Permission.storage,
      Permission.location,
    ]);
    
    setState(() {
      _permissionStatuses = statuses;
    });
  }
  
  Future<void> _requestPermission(Permission permission) async {
    final granted = await permissionManager.requestPermission(permission);
    
    setState(() {
      _permissionStatuses[permission] = granted;
    });
    
    if (!granted) {
      _showPermissionDialog();
    }
  }
  
  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('需要权限'),
        content: Text('请在设置中开启相关权限'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: Text('去设置'),
          ),
        ],
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('权限管理')),
      body: ListView(
        children: [
          _buildPermissionTile(
            '相机权限',
            Permission.camera,
            Icons.camera_alt,
          ),
          _buildPermissionTile(
            '存储权限',
            Permission.storage,
            Icons.storage,
          ),
          _buildPermissionTile(
            '位置权限',
            Permission.location,
            Icons.location_on,
          ),
        ],
      ),
    );
  }
  
  Widget _buildPermissionTile(
    String title,
    Permission permission,
    IconData icon,
  ) {
    final granted = _permissionStatuses[permission] ?? false;
    
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(granted ? '已授权' : '未授权'),
      trailing: Switch(
        value: granted,
        onChanged: (value) {
          if (value) {
            _requestPermission(permission);
          }
        },
      ),
    );
  }
}
```

## 最佳实践

1. 合理组织权限管理代码
2. 提供清晰的权限说明
3. 优雅处理权限拒绝
4. 实现权限状态缓存
5. 提供设置跳转

## 注意事项

1. 权限申请时机
2. 权限说明文案
3. 平台差异处理
4. 权限拒绝处理
5. 权限变更监听

## 总结

合理的权限处理对于应用的用户体验至关重要。通过使用 permission_handler 插件,可以轻松实现权限的申请和管理。注意在实现过程中要考虑用户体验和平台差异。 