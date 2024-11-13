---
title: Flutter SharedPreferences 详解
description: 详细介绍 Flutter 中使用 SharedPreferences 进行数据持久化的方法。
tag:
 - Flutter
 - 存储
sidebar: true
---

# Flutter SharedPreferences 详解

## 简介

SharedPreferences 是一个轻量级的数据持久化方案,适合存储少量的键值对数据,如用户设置、缓存等。

## 基本配置

### 添加依赖
```yaml
dependencies:
  shared_preferences: ^2.2.0
```

### 基本使用
```dart
// 获取实例
final prefs = await SharedPreferences.getInstance();

// 存储数据
await prefs.setString('name', 'John');
await prefs.setInt('age', 25);
await prefs.setBool('isLogin', true);
await prefs.setStringList('tags', ['flutter', 'dart']);

// 读取数据
final name = prefs.getString('name') ?? 'Unknown';
final age = prefs.getInt('age') ?? 0;
final isLogin = prefs.getBool('isLogin') ?? false;
final tags = prefs.getStringList('tags') ?? [];

// 删除数据
await prefs.remove('name');

// 清空所有数据
await prefs.clear();
```

## 封装工具类

```dart
class PreferencesUtil {
  static SharedPreferences? _prefs;
  
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }
  
  // 存储方法
  static Future<bool> setString(String key, String value) async {
    return await _prefs?.setString(key, value) ?? false;
  }
  
  static Future<bool> setInt(String key, int value) async {
    return await _prefs?.setInt(key, value) ?? false;
  }
  
  static Future<bool> setBool(String key, bool value) async {
    return await _prefs?.setBool(key, value) ?? false;
  }
  
  static Future<bool> setStringList(String key, List<String> value) async {
    return await _prefs?.setStringList(key, value) ?? false;
  }
  
  // 读取方法
  static String getString(String key, {String defaultValue = ''}) {
    return _prefs?.getString(key) ?? defaultValue;
  }
  
  static int getInt(String key, {int defaultValue = 0}) {
    return _prefs?.getInt(key) ?? defaultValue;
  }
  
  static bool getBool(String key, {bool defaultValue = false}) {
    return _prefs?.getBool(key) ?? defaultValue;
  }
  
  static List<String> getStringList(String key, {List<String> defaultValue = const []}) {
    return _prefs?.getStringList(key) ?? defaultValue;
  }
  
  // 删除方法
  static Future<bool> remove(String key) async {
    return await _prefs?.remove(key) ?? false;
  }
  
  static Future<bool> clear() async {
    return await _prefs?.clear() ?? false;
  }
  
  // 检查是否存在
  static bool containsKey(String key) {
    return _prefs?.containsKey(key) ?? false;
  }
}
```

## 完整示例

```dart
// 用户设置管理
class UserSettings {
  static const String keyThemeMode = 'theme_mode';
  static const String keyLanguage = 'language';
  static const String keyFontSize = 'font_size';
  static const String keyNotifications = 'notifications';
  
  // 主题设置
  static Future<void> setThemeMode(String mode) async {
    await PreferencesUtil.setString(keyThemeMode, mode);
  }
  
  static String getThemeMode() {
    return PreferencesUtil.getString(keyThemeMode, defaultValue: 'system');
  }
  
  // 语言设置
  static Future<void> setLanguage(String language) async {
    await PreferencesUtil.setString(keyLanguage, language);
  }
  
  static String getLanguage() {
    return PreferencesUtil.getString(keyLanguage, defaultValue: 'en');
  }
  
  // 字体大小
  static Future<void> setFontSize(double size) async {
    await PreferencesUtil.setString(keyFontSize, size.toString());
  }
  
  static double getFontSize() {
    final size = PreferencesUtil.getString(keyFontSize, defaultValue: '14.0');
    return double.tryParse(size) ?? 14.0;
  }
  
  // 通知设置
  static Future<void> setNotificationsEnabled(bool enabled) async {
    await PreferencesUtil.setBool(keyNotifications, enabled);
  }
  
  static bool getNotificationsEnabled() {
    return PreferencesUtil.getBool(keyNotifications, defaultValue: true);
  }
}

// 设置页面
class SettingsPage extends StatefulWidget {
  @override
  _SettingsPageState createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String _themeMode = UserSettings.getThemeMode();
  String _language = UserSettings.getLanguage();
  double _fontSize = UserSettings.getFontSize();
  bool _notificationsEnabled = UserSettings.getNotificationsEnabled();
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Settings')),
      body: ListView(
        children: [
          ListTile(
            title: Text('Theme Mode'),
            subtitle: Text(_themeMode),
            onTap: _showThemePicker,
          ),
          ListTile(
            title: Text('Language'),
            subtitle: Text(_language),
            onTap: _showLanguagePicker,
          ),
          ListTile(
            title: Text('Font Size'),
            subtitle: Text('${_fontSize.toStringAsFixed(1)}'),
            onTap: _showFontSizePicker,
          ),
          SwitchListTile(
            title: Text('Notifications'),
            value: _notificationsEnabled,
            onChanged: (value) {
              setState(() {
                _notificationsEnabled = value;
                UserSettings.setNotificationsEnabled(value);
              });
            },
          ),
        ],
      ),
    );
  }
  
  void _showThemePicker() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => SimpleDialog(
        title: Text('Select Theme Mode'),
        children: [
          SimpleDialogOption(
            child: Text('System'),
            onPressed: () => Navigator.pop(context, 'system'),
          ),
          SimpleDialogOption(
            child: Text('Light'),
            onPressed: () => Navigator.pop(context, 'light'),
          ),
          SimpleDialogOption(
            child: Text('Dark'),
            onPressed: () => Navigator.pop(context, 'dark'),
          ),
        ],
      ),
    );
    
    if (result != null) {
      setState(() {
        _themeMode = result;
        UserSettings.setThemeMode(result);
      });
    }
  }
  
  // 其他选择器实现...
}
```

## 最佳实���

1. 统一管理键名
2. 提供默认值
3. 封装工具类
4. 异步操作处理
5. 类型安全

## 注意事项

1. 只能存储基本类型
2. 注意数据大小限制
3. 异步操作处理
4. 键名冲突处理
5. 数据迁移考虑

## 总结

SharedPreferences 是一个简单但实用的数据持久化方案,适合存储应用配置和小型数据。通过合理封装和使用,可以方便地实现数据的本地存储功能。 