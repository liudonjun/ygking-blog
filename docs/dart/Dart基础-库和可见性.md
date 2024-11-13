---
title: Dart 库和可见性详解
description: 详细介绍 Dart 语言中的库机制和可见性控制。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 库和可见性详解

## 简介

Dart 中的库机制用于代码组织和重用。通过库,我们可以控制代码的可见性,实现模块化开发。

## 库的定义

### 创建库
```dart
// lib/my_library.dart
library my_library;

// 导出其他文件
export 'src/utils.dart';
export 'src/models.dart';

// 库级别的变量和函数
const version = '1.0.0';

void doSomething() {
  print('Doing something...');
}
```

### 私有成员
```dart
class User {
  // 公开成员
  String name;
  
  // 私有成员(以下划线开头)
  String _password;
  
  // 私有构造函数
  User._(this.name, this._password);
  
  // 工厂构造函数
  factory User.create(String name, String password) {
    return User._(name, password);
  }
  
  // 私有方法
  void _validatePassword() {
    // 实现密码验证
  }
}
```

## 导入机制

### 基本导入
```dart
// 导入 Dart 核心库
import 'dart:core';
import 'dart:async';

// 导入第三方库
import 'package:http/http.dart';
import 'package:path/path.dart';

// 导入项目内的库
import 'package:my_app/src/utils.dart';
```

### 导入别名
```dart
// 使用 as 关键字指定别名
import 'package:lib1/lib1.dart' as lib1;
import 'package:lib2/lib2.dart' as lib2;

void main() {
  lib1.someFunction();
  lib2.someFunction();
}
```

### 部分导入
```dart
// 只导入特定成员
import 'package:lib/lib.dart' show foo, bar;

// 隐藏特定成员
import 'package:lib/lib.dart' hide baz;
```

## 库的组织

### 目录结构
```
my_package/
  ├── lib/
  │   ├── my_package.dart       # 主库文件
  │   └── src/                  # 私有实现
  │       ├── utils.dart
  │       └── models.dart
  ├── test/                     # 测试文件
  └── pubspec.yaml              # 包配置文件
```

### 主库文件
```dart
// lib/my_package.dart
library my_package;

// 导出公共 API
export 'src/utils.dart' show Utility, Helper;
export 'src/models.dart';
```

## 完整示例

```dart
// lib/src/models.dart
part of '../my_package.dart';

class User {
  final String id;
  final String name;
  final String _token;
  
  User._(this.id, this.name, this._token);
  
  factory User.create(String name) {
    final id = DateTime.now().toString();
    final token = _generateToken();
    return User._(id, name, token);
  }
  
  static String _generateToken() {
    // 实现token生成
    return DateTime.now().toString();
  }
}

// lib/src/utils.dart
part of '../my_package.dart';

class ApiClient {
  final String _baseUrl;
  final String _apiKey;
  
  ApiClient._(this._baseUrl, this._apiKey);
  
  factory ApiClient.create(String baseUrl, String apiKey) {
    return ApiClient._(baseUrl, apiKey);
  }
  
  Future<Map<String, dynamic>> get(String endpoint) async {
    // 实现 GET 请求
    return {};
  }
  
  Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    // 实现 POST 请求
    return {};
  }
}

// lib/my_package.dart
library my_package;

import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

part 'src/models.dart';
part 'src/utils.dart';

// 公共 API
class MyPackage {
  static final instance = MyPackage._();
  
  final ApiClient _apiClient;
  
  MyPackage._()
      : _apiClient = ApiClient.create(
          'https://api.example.com',
          'your-api-key',
        );
  
  Future<User> createUser(String name) async {
    final response = await _apiClient.post(
      '/users',
      {'name': name},
    );
    
    return User.create(name);
  }
}
```

## 最佳实践

1. 合理组织库结构
2. 明确公共 API
3. 使用 part 和 part of
4. 控制可见性范围
5. 提供清晰的文档

## 注意事项

1. 避免循环依赖
2. 合理使用私有成员
3. 注意库的版本兼容
4. 控制导出的 API
5. 遵循命名规范

## 总结

Dart 的库机制提供了强大的代码组织和可见性控制能力。通过合理使用库机制,可以构建出结构清晰、易于维护的代码库。理解并掌握库的使用对于开发大型 Dart 应用很有帮助。 