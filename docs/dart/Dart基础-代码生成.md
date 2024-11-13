---
title: Dart 代码生成详解
description: 详细介绍 Dart 语言中的代码生成机制,包括 build_runner、source_gen 等工具的使用。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 代码生成详解

## 简介

代码生成是一种自动创建重复性代码的技术。在 Dart 中,我们可以使用 build_runner 和 source_gen 等工具来实现代码生成。

## 基本配置

### pubspec.yaml 配置
```yaml
dependencies:
  json_annotation: ^4.8.1

dev_dependencies:
  build_runner: ^2.4.6
  json_serializable: ^6.7.1
  source_gen: ^1.4.0
```

### 运行命令
```bash
# 一次性生成
dart run build_runner build

# 持续监听并生成
dart run build_runner watch
```

## JSON 序列化

### 基本用法
```dart
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String name;
  final int age;
  @JsonKey(name: 'is_student')
  final bool isStudent;
  
  User(this.name, this.age, this.isStudent);
  
  // 从 JSON 转换
  factory User.fromJson(Map<String, dynamic> json) => 
      _$UserFromJson(json);
      
  // 转换为 JSON
  Map<String, dynamic> toJson() => _$UserToJson(this);
}
```

### 自定义转换
```dart
@JsonSerializable()
class DateTime {
  @JsonKey(
    fromJson: _dateTimeFromEpoch,
    toJson: _dateTimeToEpoch,
  )
  final DateTime timestamp;
  
  static DateTime _dateTimeFromEpoch(int epoch) =>
      DateTime.fromMillisecondsSinceEpoch(epoch);
      
  static int _dateTimeToEpoch(DateTime time) =>
      time.millisecondsSinceEpoch;
}
```

## 自定义生成器

### Builder 定义
```dart
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

Builder customBuilder(BuilderOptions options) =>
    SharedPartBuilder([CustomGenerator()], 'custom');

class CustomGenerator extends Generator {
  @override
  String generate(LibraryReader library, BuildStep buildStep) {
    // 生成代码的逻辑
    final buffer = StringBuffer();
    
    // 遍历所有类
    for (var element in library.allElements) {
      if (element is ClassElement) {
        // 生成相关代码
        buffer.writeln('// Generated code for ${element.name}');
      }
    }
    
    return buffer.toString();
  }
}
```

### build.yaml 配置
```yaml
targets:
  $default:
    builders:
      custom_builder:
        enabled: true
        generate_for:
          - lib/**/*.dart
```

## 完整示例

```dart
// entity.dart
import 'package:json_annotation/json_annotation.dart';

part 'entity.g.dart';

@JsonSerializable()
class Product {
  final String id;
  final String name;
  final double price;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(defaultValue: false)
  final bool isAvailable;
  
  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.createdAt,
    required this.isAvailable,
  });
  
  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
      
  Map<String, dynamic> toJson() => _$ProductToJson(this);
}

// custom_builder.dart
import 'package:analyzer/dart/element/element.dart';
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

class RepositoryGenerator extends Generator {
  @override
  String generate(LibraryReader library, BuildStep buildStep) {
    final buffer = StringBuffer();
    
    for (var element in library.allElements) {
      if (element is ClassElement) {
        // 生成 Repository 类
        buffer.writeln('''
        class ${element.name}Repository {
          final List<${element.name}> _items = [];
          
          void add(${element.name} item) {
            _items.add(item);
          }
          
          void remove(${element.name} item) {
            _items.remove(item);
          }
          
          List<${element.name}> getAll() {
            return List.unmodifiable(_items);
          }
          
          ${element.name}? findById(String id) {
            return _items.firstWhere(
              (item) => item.id == id,
              orElse: () => null,
            );
          }
        }
        ''');
      }
    }
    
    return buffer.toString();
  }
}

// 使用示例
void main() {
  final product = Product(
    id: '1',
    name: 'Example Product',
    price: 99.99,
    createdAt: DateTime.now(),
    isAvailable: true,
  );
  
  // 序列化
  final json = product.toJson();
  print('JSON: $json');
  
  // 反序列化
  final restored = Product.fromJson(json);
  print('Restored: $restored');
  
  // 使用生成的 Repository
  final repository = ProductRepository();
  repository.add(product);
  
  final found = repository.findById('1');
  print('Found product: $found');
}
```

## 最佳实践

1. 合理组织生成代码
2. 使用适当的注解
3. 处理好异常情况
4. 提供清晰的文档
5. 注意性能影响

## 注意事项

1. 生成的代码不要手动修改
2. 注意代码生成的时机
3. 处理好依赖关系
4. 合理使用配置选项
5. 注意版本兼容性

## 总结

代码生成是一种强大的工具,可以帮助我们减少重复性工作,提高开发效率。通过合理使用代码生成工具,可以让代码更加规范和易于维护。 