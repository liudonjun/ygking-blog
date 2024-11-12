---
title: Dart 函数和方法详解
description: 详细介绍 Dart 语言中的函数定义、参数传递和方法使用。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 函数和方法详解

## 函数定义

### 基本语法
```dart
返回类型 函数名(参数列表) {
  函数体
  return 返回值;
}
```

### 简单示例
```dart
int add(int a, int b) {
  return a + b;
}

// 箭头语法(单行函数)
int multiply(int a, int b) => a * b;
```

## 参数类型

### 必需参数
```dart
String getFullName(String firstName, String lastName) {
  return '$firstName $lastName';
}
```

### 可选位置参数
```dart
String sayHello(String name, [String? title]) {
  if (title != null) {
    return 'Hello, $title $name';
  }
  return 'Hello, $name';
}
```

### 可选命名参数
```dart
void printPersonInfo({
  required String name,
  int? age,
  String? address,
}) {
  print('Name: $name');
  if (age != null) print('Age: $age');
  if (address != null) print('Address: $address');
}
```

### 默认参数值
```dart
void greet(String name, {String greeting = 'Hello'}) {
  print('$greeting, $name!');
}
```

## 函数作为一等公民

### 函数赋值给变量
```dart
var sayHi = (String name) => 'Hi, $name!';
Function multiply = (int a, int b) => a * b;
```

### 函数作为参数
```dart
void executeFunction(Function callback) {
  callback();
}

// 使用示例
executeFunction(() => print('Hello'));
```

### 函数作为返回值
```dart
Function makeAdder(int addBy) {
  return (int i) => i + addBy;
}

// 使用示例
var add2 = makeAdder(2);
print(add2(3)); // 输出: 5
```

## 匿名函数

```dart
var list = ['apple', 'banana', 'orange'];

// 使用匿名函数
list.forEach((item) {
  print(item);
});

// 箭头语法
list.forEach((item) => print(item));
```

## 闭包

```dart
Function counter() {
  int count = 0;
  return () {
    count++;
    return count;
  };
}

// 使用示例
var increment = counter();
print(increment()); // 1
print(increment()); // 2
```

## 异步函数

### Future
```dart
Future<String> fetchUserData() async {
  // 模拟网络请求
  await Future.delayed(Duration(seconds: 2));
  return 'User Data';
}
```

### Stream
```dart
Stream<int> countStream(int max) async* {
  for (int i = 1; i <= max; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}
```

## 生成器函数

### 同步生成器
```dart
Iterable<int> naturalsTo(int n) sync* {
  int k = 0;
  while (k < n) yield k++;
}
```

### 异步生成器
```dart
Stream<int> asynchronousNaturalsTo(int n) async* {
  int k = 0;
  while (k < n) {
    await Future.delayed(Duration(seconds: 1));
    yield k++;
  }
}
```

## 完整示例

```dart
class Calculator {
  // 基本运算方法
  int add(int a, int b) => a + b;
  int subtract(int a, int b) => a - b;
  int multiply(int a, int b) => a * b;
  double divide(int a, int b) => a / b;

  // 可选参数示例
  double calculateArea({
    required double length,
    double? width,
  }) {
    if (width == null) {
      // 计算正方形面积
      return length * length;
    }
    // 计算矩形面积
    return length * width;
  }

  // 函数作为参数
  void executeOperation(int a, int b, Function(int, int) operation) {
    print('Result: ${operation(a, b)}');
  }

  // 异步方法示例
  Future<List<int>> generateNumbers(int count) async {
    List<int> numbers = [];
    for (int i = 0; i < count; i++) {
      await Future.delayed(Duration(milliseconds: 100));
      numbers.add(i);
    }
    return numbers;
  }
}

void main() async {
  var calc = Calculator();
  
  // 基本方法调用
  print('Addition: ${calc.add(5, 3)}');
  print('Subtraction: ${calc.subtract(5, 3)}');
  
  // 可选参数
  print('Square area: ${calc.calculateArea(length: 5)}');
  print('Rectangle area: ${calc.calculateArea(length: 5, width: 3)}');
  
  // 函数作为参数
  calc.executeOperation(5, 3, (a, b) => a * b);
  
  // 异步方法
  var numbers = await calc.generateNumbers(5);
  print('Generated numbers: $numbers');
}
```

## 注意事项

1. 优先使用命名参数提高代码可读性
2. 合理使用可选参数和默认值
3. 注意异步函数的使用和错误处理
4. 避免过度使用闭包导致内存泄漏
5. 合理组织函数的长度和复杂度

## 最佳实践

1. 函数命名使用动词开头
2. 一个函数只做一件事
3. 参数数量不要太多
4. 适当添加函数文档注释
5. 保持函数的纯粹性

## 总结

Dart 的函数系统非常灵活,支持多种参数类型和函数特性。合理使用这些特性可以写出更清晰、更易维护的代码。理解并掌握这些知识对于 Flutter 开发至关重要。 