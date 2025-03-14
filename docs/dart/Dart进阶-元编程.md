---
description: 本文深入介绍 Dart 的元编程特性，包括反射 API 的高级应用、代码生成工具链等高级主题。
tag:
  - Dart
  - 元编程
sticky: 1
sidebar: true
---

# Dart 元编程进阶

## 反射 API 高级应用

### 1. 运行时类型操作

```dart
void main() {
  final mirror = reflect(MyClass());
  final classMirror = mirror.type;
  
  // 获取类的元数据
  print('类名: ${classMirror.simpleName}');
  print('是否为抽象类: ${classMirror.isAbstract}');
  
  // 获取所有方法
  classMirror.declarations.forEach((symbol, declarationMirror) {
    if (declarationMirror is MethodMirror && !declarationMirror.isConstructor) {
      print('方法: ${symbol}');
      print('返回类型: ${declarationMirror.returnType.reflectedType}');
    }
  });
}

class MyClass {
  String getName() => 'MyClass';
  int calculate(int x) => x * 2;
}
```

### 2. 动态调用方法

```dart
void main() {
  final instance = MyService();
  final mirror = reflect(instance);
  
  // 动态调用方法
  final result = mirror.invoke(
    #processData,
    ['test data'],
    {#option: true},
  );
  
  print('调用结果: ${result.reflectee}');
}

class MyService {
  String processData(String data, {bool option = false}) {
    return option ? data.toUpperCase() : data.toLowerCase();
  }
}
```

## 代码生成工具链

### 1. 构建器配置

```yaml
# build.yaml
targets:
  $default:
    builders:
      my_builder:
        enabled: true
        generate_for:
          - lib/**/*.dart
```

### 2. 自定义构建器

```dart
import 'package:build/build.dart';
import 'package:source_gen/source_gen.dart';

class MyBuilder extends Builder {
  @override
  Map<String, List<String>> get buildExtensions => {
    '.dart': ['.g.dart'],
  };
  
  @override
  Future<void> build(BuildStep buildStep) async {
    final inputId = buildStep.inputId;
    final content = await buildStep.readAsString(inputId);
    
    // 生成代码逻辑
    final generatedCode = generateCode(content);
    
    // 写入生成的文件
    final outputId = inputId.changeExtension('.g.dart');
    await buildStep.writeAsString(outputId, generatedCode);
  }
}

String generateCode(String source) {
  // 实现代码生成逻辑
  return '''// 生成的代码
// ...
''';
}
```

### 3. 注解处理器

```dart
// 定义注解
class GenerateJson {
  const GenerateJson();
}

// 注解处理器
class JsonGenerator extends GeneratorForAnnotation<GenerateJson> {
  @override
  String generateForAnnotatedElement(
    Element element,
    ConstantReader annotation,
    BuildStep buildStep,
  ) {
    if (element is! ClassElement) {
      throw InvalidGenerationSourceError(
        '只能在类上使用 @GenerateJson 注解',
        element: element,
      );
    }
    
    return generateJsonCode(element);
  }
}

String generateJsonCode(ClassElement class) {
  final fields = class.fields;
  final buffer = StringBuffer();
  
  // 生成 toJson 方法
  buffer.writeln('Map<String, dynamic> toJson() => {');
  for (final field in fields) {
    buffer.writeln("'${field.name}': ${field.name},");
  }
  buffer.writeln('};');
  
  return buffer.toString();
}
```

## 元数据处理

### 1. 自定义注解

```dart
// 定义注解
class Validate {
  final String pattern;
  final String message;
  
  const Validate(this.pattern, {this.message = ''});
}

// 使用注解
class User {
  @Validate(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$', message: '无效的邮箱格式')
  String email;
  
  @Validate(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$', message: '密码至少8位，包含字母和数字')
  String password;
  
  User(this.email, this.password);
}
```

### 2. 注解处理

```dart
class ValidationProcessor {
  static List<String> validate(Object instance) {
    final errors = <String>[];
    final mirror = reflect(instance);
    final classMirror = mirror.type;
    
    classMirror.declarations.forEach((symbol, declarationMirror) {
      if (declarationMirror is VariableMirror) {
        final annotations = declarationMirror.metadata;
        for (final annotation in annotations) {
          if (annotation.reflectee is Validate) {
            final validate = annotation.reflectee as Validate;
            final value = mirror.getField(symbol).reflectee as String;
            
            if (!RegExp(validate.pattern).hasMatch(value)) {
              errors.add(validate.message.isNotEmpty
                ? validate.message
                : '${symbol} 验证失败');
            }
          }
        }
      }
    });
    
    return errors;
  }
}
```

## 代码生成最佳实践

### 1. 性能优化

- 缓存生成的代码
- 增量构建支持
- 优化文件 IO 操作

```dart
class CachingBuilder extends Builder {
  final cache = <String, String>{};
  
  @override
  Future<void> build(BuildStep buildStep) async {
    final inputId = buildStep.inputId;
    final cacheKey = inputId.path;
    
    if (cache.containsKey(cacheKey)) {
      // 使用缓存的生成代码
      return;
    }
    
    // 生成新代码
    final content = await buildStep.readAsString(inputId);
    final generatedCode = generateCode(content);
    
    // 更新缓存
    cache[cacheKey] = generatedCode;
    
    // 写入文件
    final outputId = inputId.changeExtension('.g.dart');
    await buildStep.writeAsString(outputId, generatedCode);
  }
}
```

### 2. 错误处理

```dart
class ErrorHandlingBuilder extends Builder {
  @override
  Future<void> build(BuildStep buildStep) async {
    try {
      // 构建逻辑
    } catch (e, stackTrace) {
      log.severe('构建失败', e, stackTrace);
      // 提供有用的错误信息
      throw BuilderError(
        '构建失败: ${e.toString()}\n'
        '文件: ${buildStep.inputId.path}\n'
        '请检查源代码或报告问题',
      );
    }
  }
}

class BuilderError extends Error {
  final String message;
  
  BuilderError(this.message);
  
  @override
  String toString() => message;
}
```

## 调试技巧

### 1. 日志记录

```dart
class DebugBuilder extends Builder {
  static const _debug = true;
  
  void debugLog(String message) {
    if (_debug) {
      print('[DEBUG] $message');
    }
  }
  
  @override
  Future<void> build(BuildStep buildStep) async {
    debugLog('开始处理: ${buildStep.inputId.path}');
    // 构建逻辑
    debugLog('处理完成');
  }
}
```

### 2. 代码检查

```dart
class CodeAnalyzer {
  static void analyzeGeneratedCode(String code) {
    // 检查语法错误
    try {
      parseString(content: code).unit;
    } catch (e) {
      print('生成的代码存在语法错误: $e');
    }
    
    // 检查代码风格
    final linter = Linter([]);
    // 添加规则检查
  }
}
```

## 总结

Dart 的元编程特性为开发者提供了强大的工具：

1. 反射 API 支持运行时的动态行为
2. 代码生成工具链简化重复工作
3. 注解处理提供声明式的元数据
4. 构建系统支持自动化的代码生成

合理使用这些特性可以：

- 减少样板代码
- 提高代码质量
- 增强代码的可维护性
- 实现更灵活的架构设计