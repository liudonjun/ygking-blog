---
title: Dart 元数据和注解详解
description: 详细介绍 Dart 语言中的元数据和注解使用方法。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 元数据和注解详解

## 简介

元数据(Metadata)是用于为代码添加额外信息的方式。在 Dart 中,元数据以 @ 符号开头,可以应用于类、方法、变量、参数和其他程序元素。

## 内置注解

### @deprecated
```dart
// 标记已废弃的 API
@deprecated
void oldMethod() {
  print('This method is deprecated');
}

// 添加废弃说明
@Deprecated('Use newMethod() instead')
void oldMethod() {
  print('This method is deprecated');
}
```

### @override
```dart
class Animal {
  void makeSound() {
    print('Some sound');
  }
}

class Dog extends Animal {
  @override
  void makeSound() {
    print('Woof!');
  }
}
```

### @required
```dart
class Person {
  final String name;
  final int age;

  Person({
    @required this.name,
    @required this.age,
  });
}
```

## 自定义注解

### 定义注解
```dart
class Todo {
  final String message;
  final String assignee;
  
  const Todo(this.message, {this.assignee});
}

// 使用注解
@Todo('Implement this method', assignee: 'john')
void implementMe() {
  throw UnimplementedError();
}
```

### 复杂注解
```dart
class JsonKey {
  final String name;
  final bool ignore;
  final Object? defaultValue;
  
  const JsonKey({
    this.name,
    this.ignore = false,
    this.defaultValue,
  });
}

class User {
  @JsonKey(name: 'user_name')
  final String name;
  
  @JsonKey(ignore: true)
  final String password;
  
  @JsonKey(defaultValue: 0)
  final int age;
  
  User(this.name, this.password, this.age);
}
```

## 反射使用

### 获取注解
```dart
import 'dart:mirrors';

void printAnnotations(Object object) {
  InstanceMirror instanceMirror = reflect(object);
  ClassMirror classMirror = instanceMirror.type;
  
  // 获取类的注解
  classMirror.metadata.forEach((metadata) {
    print('Class annotation: ${metadata.reflectee}');
  });
  
  // 获取方法的注解
  classMirror.declarations.forEach((symbol, declarationMirror) {
    if (declarationMirror is MethodMirror) {
      declarationMirror.metadata.forEach((metadata) {
        print('Method annotation: ${metadata.reflectee}');
      });
    }
  });
}
```

## 完整示例

```dart
// 自定义注解
class Route {
  final String path;
  final String name;
  final bool auth;
  
  const Route({
    required this.path,
    required this.name,
    this.auth = false,
  });
}

class Api {
  final String path;
  final String method;
  final bool cache;
  
  const Api({
    required this.path,
    this.method = 'GET',
    this.cache = false,
  });
}

// 使用注解
@Route(
  path: '/users',
  name: 'users_page',
  auth: true,
)
class UsersPage {
  @Api(
    path: '/api/users',
    method: 'GET',
    cache: true,
  )
  Future<List<User>> getUsers() async {
    // 实现获取用户列表
    return [];
  }
  
  @Api(
    path: '/api/users',
    method: 'POST',
  )
  Future<void> createUser(User user) async {
    // 实现创建用户
  }
  
  @deprecated
  void oldMethod() {
    print('This method is deprecated');
  }
}

// 处理注解
void processAnnotations() {
  final usersPage = UsersPage();
  
  // 获取类的注解
  final route = reflect(usersPage)
      .type
      .metadata
      .firstWhere((m) => m.reflectee is Route)
      .reflectee as Route;
      
  print('Route: ${route.path}, Auth: ${route.auth}');
  
  // 获取方法的注解
  final mirror = reflect(usersPage);
  mirror.type.declarations.forEach((symbol, declarationMirror) {
    if (declarationMirror is MethodMirror) {
      final apis = declarationMirror.metadata
          .where((m) => m.reflectee is Api)
          .map((m) => m.reflectee as Api);
          
      for (var api in apis) {
        print('API: ${api.method} ${api.path}, Cache: ${api.cache}');
      }
    }
  });
}
```

## 最佳实践

1. 合理使用内置注解
2. 为自定义注解提供清晰的文档
3. 注意注解的性能影响
4. 避免过度使用注解
5. 注意反射的使用限制

## 注意事项

1. 反射在生产环境可能受限
2. 注解应该是常量
3. 注意注解的作用域
4. 合理处理注解的默认值
5. 注意版本兼容性

## 总结

元数据和注解是 Dart 中用于添加额外信息的重要机制。通过合理使用注解,可以实现更好的代码文档、编译时检查和运行时行为定制。理解并掌握注解的使用对于开发高质量的 Dart 应用很有帮助。 