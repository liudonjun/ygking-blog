---
title: Flutter 自定义注解详解
description: 详细介绍如何在 Flutter 和 Dart 中创建和使用自定义注解，包括注解处理器的开发、代码生成等高级主题。
tag:
 - Flutter
 - Dart
sidebar: true
---

# Flutter 自定义注解详解

## 简介

自定义注解是 Flutter 和 Dart 中的一个强大特性，它允许开发者创建自己的元数据标记，用于代码生成、运行时反射等场景。本文将详细介绍如何创建和使用自定义注解。

## 基本概念

### 注解的定义

在 Dart 中，注解是一个类，通常使用 `const` 构造函数。注解可以包含参数，用于传递额外的信息。

```dart
class CustomAnnotation {
  final String value;
  final int priority;
  
  const CustomAnnotation(this.value, {this.priority = 0});
}
```

### 注解的使用位置

注解可以应用在以下位置：
- 类声明
- 方法声明
- 字段声明
- 参数声明
- 变量声明

## 创建自定义注解

### 基本注解

```dart
// 简单的标记注解
class Todo {
  const Todo();
}

// 带参数的注解
class Route {
  final String path;
  final String name;
  
  const Route(this.path, {this.name = ''});
}
```

### 复杂注解

```dart
class Entity {
  final String table;
  final List<String> indices;
  final bool autoIncrement;
  
  const Entity({
    required this.table,
    this.indices = const [],
    this.autoIncrement = true,
  });
}

class Column {
  final String name;
  final String type;
  final bool nullable;
  final bool primary;
  
  const Column({
    required this.name,
    required this.type,
    this.nullable = false,
    this.primary = false,
  });
}
```

## 注解处理器开发

### 基本结构

```dart
import 'package:source_gen/source_gen.dart';
import 'package:analyzer/dart/element/element.dart';

class MyAnnotationGenerator extends GeneratorForAnnotation<MyAnnotation> {
  @override
  String generateForAnnotatedElement(
    Element element,
    ConstantReader annotation,
    BuildStep buildStep,
  ) {
    // 处理注解
    return ''; // 返回生成的代码
  }
}
```

### 完整示例

```dart
// 注解定义
class ApiEndpoint {
  final String path;
  final String method;
  final List<String> params;
  
  const ApiEndpoint({
    required this.path,
    this.method = 'GET',
    this.params = const [],
  });
}

// 注解处理器
class ApiEndpointGenerator extends GeneratorForAnnotation<ApiEndpoint> {
  @override
  String generateForAnnotatedElement(
    Element element,
    ConstantReader annotation,
    BuildStep buildStep,
  ) {
    if (element is! ClassElement) {
      throw InvalidGenerationSourceError(
        'ApiEndpoint can only be applied to classes',
        element: element,
      );
    }
    
    final path = annotation.read('path').stringValue;
    final method = annotation.read('method').stringValue;
    final params = annotation.read('params').listValue
        .map((e) => e.toStringValue())
        .whereType<String>()
        .toList();
    
    return '''
    // Generated code for ${element.name}
    class ${element.name}Client {
      final HttpClient client;
      
      ${element.name}Client(this.client);
      
      Future<Response> call(${_generateParams(params)}) async {
        return await client.$method(
          '$path${_generateQueryParams(params)}',
        );
      }
    }
    ''';
  }
  
  String _generateParams(List<String> params) {
    return params.map((p) => 'String $p').join(', ');
  }
  
  String _generateQueryParams(List<String> params) {
    if (params.isEmpty) return '';
    return '?' + params.map((p) => '$p=\$$p').join('&');
  }
}
```

## 使用自定义注解

### 基本用法

```dart
@Todo()
void implementThis() {
  throw UnimplementedError();
}

@Route('/users', name: 'users_page')
class UsersPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
```

### 数据库实体示例

```dart
@Entity(table: 'users')
class User {
  @Column(name: 'id', type: 'INTEGER', primary: true)
  final int id;
  
  @Column(name: 'name', type: 'TEXT')
  final String name;
  
  @Column(name: 'email', type: 'TEXT', nullable: true)
  final String? email;
  
  const User({
    required this.id,
    required this.name,
    this.email,
  });
}
```

### API 客户端示例

```dart
@ApiEndpoint(
  path: '/api/users',
  method: 'GET',
  params: ['page', 'limit'],
)
class UsersApi {
  // 生成的代码将创建 UsersApiClient 类
}

// 使用生成的代码
void main() {
  final client = HttpClient();
  final usersApi = UsersApiClient(client);
  
  // 调用生成的方法
  final response = await usersApi.call(
    page: '1',
    limit: '10',
  );
}
```

## 代码生成配置

### build.yaml 配置

```yaml
targets:
  $default:
    builders:
      my_annotations|annotations:
        enabled: true
        generate_for:
          - lib/**/*.dart

builders:
  annotations:
    import: "package:my_annotations/builder.dart"
    builder_factories: ["annotationsBuilder"]
    build_extensions: {".dart": [".g.dart"]}
    auto_apply: dependents
    build_to: source
```

### 运行代码生成

```bash
# 一次性生成
flutter pub run build_runner build

# 监听文件变化
flutter pub run build_runner watch
```

## 最佳实践

1. **明确注解用途**：每个自定义注解应该有明确的用途和文档
2. **参数验证**：在注解处理器中进行严格的参数验证
3. **生成代码质量**：确保生成的代码符合代码规范和最佳实践
4. **错误处理**：提供清晰的错误信息和异常处理
5. **测试覆盖**：为注解处理器编写单元测试

## 注意事项

1. **性能影响**：注解处理和代码生成会影响构建时间
2. **代码可读性**：生成的代码应该易于理解和调试
3. **版本兼容**：注意处理不同 Dart 版本的兼容性
4. **依赖管理**：合理管理注解相关的依赖
5. **调试支持**：提供足够的调试信息

## 总结

自定义注解是一个强大的工具，可以帮助我们自动化代码生成、提供编译时检查等功能。通过合理设计和使用自定义注解，可以显著提高开发效率和代码质量。在使用时需要注意性能影响和维护成本，确保注解真正为项目带来价值。 