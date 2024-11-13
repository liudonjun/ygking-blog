---
title: Dart 反射和镜像详解
description: 详细介绍 Dart 语言中的反射机制和镜像API使用方法。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 反射和镜像详解

## 简介

反射是在运行时检查、修改和调用程序元素的能力。Dart 通过 mirrors 包提供反射功能,可以用于运行时获取类型信息、调用方法等。

## 基本概念

### 镜像类型
```dart
import 'dart:mirrors';

// 实例镜像
InstanceMirror instanceMirror = reflect(object);

// 类镜像
ClassMirror classMirror = reflectClass(String);

// 库镜像
LibraryMirror libraryMirror = currentMirrorSystem().findLibrary(Symbol('dart.core'));
```

### 符号
```dart
// 创建符号
Symbol symbol = Symbol('methodName');

// 符号转字符串
String name = MirrorSystem.getName(symbol);

// 字符串转符号
Symbol symbol = Symbol('methodName');
```

## 类型反射

### 获取类型信息
```dart
class Person {
  String name;
  int age;
  
  Person(this.name, this.age);
  
  void sayHello() {
    print('Hello, I am $name');
  }
}

void inspectClass() {
  ClassMirror mirror = reflectClass(Person);
  
  // 获取构造函数
  mirror.declarations.forEach((Symbol name, DeclarationMirror declaration) {
    if (declaration is MethodMirror && declaration.isConstructor) {
      print('Constructor: ${MirrorSystem.getName(name)}');
    }
  });
  
  // 获取属性
  mirror.declarations.forEach((Symbol name, DeclarationMirror declaration) {
    if (declaration is VariableMirror) {
      print('Property: ${MirrorSystem.getName(name)}');
    }
  });
  
  // 获取方法
  mirror.declarations.forEach((Symbol name, DeclarationMirror declaration) {
    if (declaration is MethodMirror && !declaration.isConstructor) {
      print('Method: ${MirrorSystem.getName(name)}');
    }
  });
}
```

## 方法调用

### 调用实例方法
```dart
void invokeMethod() {
  var person = Person('John', 30);
  InstanceMirror mirror = reflect(person);
  
  // 调用方法
  mirror.invoke(Symbol('sayHello'), []);
  
  // 调用带参数的方法
  mirror.invoke(Symbol('setAge'), [25]);
  
  // 获取返回值
  var result = mirror.invoke(Symbol('getAge'), []);
  print('Age: ${result.reflectee}');
}
```

### 调用静态方法
```dart
void invokeStaticMethod() {
  ClassMirror mirror = reflectClass(Math);
  
  // 调用静态方法
  var result = mirror.invoke(Symbol('max'), [10, 20]);
  print('Max: ${result.reflectee}');
}
```

## 属性访问

### 读写属性
```dart
void accessProperties() {
  var person = Person('John', 30);
  InstanceMirror mirror = reflect(person);
  
  // 读取属性
  var name = mirror.getField(Symbol('name')).reflectee;
  print('Name: $name');
  
  // 设置属性
  mirror.setField(Symbol('name'), 'Jane');
}
```

### 属性监听
```dart
void watchProperties() {
  var person = Person('John', 30);
  InstanceMirror mirror = reflect(person);
  
  // 监听属性变化
  mirror.type.declarations.forEach((Symbol name, DeclarationMirror declaration) {
    if (declaration is VariableMirror) {
      var oldValue = mirror.getField(name).reflectee;
      // 实现属性变化通知
    }
  });
}
```

## 完整示例

```dart
import 'dart:mirrors';

class User {
  String name;
  int age;
  bool _isAdmin;
  
  User(this.name, this.age, [this._isAdmin = false]);
  
  void greet() {
    print('Hello, I am $name');
  }
  
  bool checkAccess(String resource) {
    return _isAdmin;
  }
  
  @override
  String toString() => 'User($name, $age)';
}

class ReflectionHelper {
  static void inspectObject(Object object) {
    InstanceMirror instanceMirror = reflect(object);
    ClassMirror classMirror = instanceMirror.type;
    
    print('Class: ${MirrorSystem.getName(classMirror.simpleName)}');
    
    // 检查属性
    print('\nProperties:');
    classMirror.declarations.forEach((Symbol name, DeclarationMirror declaration) {
      if (declaration is VariableMirror) {
        var propertyName = MirrorSystem.getName(name);
        var value = instanceMirror.getField(name).reflectee;
        print('  $propertyName = $value');
      }
    });
    
    // 检查方法
    print('\nMethods:');
    classMirror.declarations.forEach((Symbol name, DeclarationMirror declaration) {
      if (declaration is MethodMirror && !declaration.isConstructor) {
        var methodName = MirrorSystem.getName(name);
        var parameters = declaration.parameters
            .map((p) => MirrorSystem.getName(p.simpleName))
            .join(', ');
        print('  $methodName($parameters)');
      }
    });
  }
  
  static void invokeMethod(Object object, String methodName, List arguments) {
    InstanceMirror instanceMirror = reflect(object);
    instanceMirror.invoke(Symbol(methodName), arguments);
  }
  
  static void setProperty(Object object, String propertyName, dynamic value) {
    InstanceMirror instanceMirror = reflect(object);
    instanceMirror.setField(Symbol(propertyName), value);
  }
  
  static dynamic getProperty(Object object, String propertyName) {
    InstanceMirror instanceMirror = reflect(object);
    return instanceMirror.getField(Symbol(propertyName)).reflectee;
  }
}

void main() {
  var user = User('John', 30, true);
  
  // 检查对象
  ReflectionHelper.inspectObject(user);
  
  // 调用方法
  ReflectionHelper.invokeMethod(user, 'greet', []);
  
  // 修改属性
  ReflectionHelper.setProperty(user, 'name', 'Jane');
  
  // 读取属性
  var age = ReflectionHelper.getProperty(user, 'age');
  print('Age: $age');
}
```

## 最佳实践

1. 谨慎使用反射
2. 注意性能影响
3. 处理好异常情况
4. 提供替代方案
5. 合理使用缓存

## 注意事项

1. 反射在生产环境可能受限
2. 影响代码大小和性能
3. 可能破坏类型安全
4. 不是所有平台都支持
5. 注意版本兼容性

## 总结

反射和镜像提供了强大的运行时编程能力,但应该谨慎使用。在开发工具、测试框架等场景下比较适合使用反射,而在生产应用中应该尽量避免使用。 