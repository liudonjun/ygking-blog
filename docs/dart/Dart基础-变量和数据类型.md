---
title: Dart 变量和数据类型详解
description: 详细介绍 Dart 语言中的变量声明和基本数据类型。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 变量和数据类型详解

## 变量声明

在 Dart 中,有多种方式声明变量:

### var 关键字
```dart
var name = 'Bob'; // 类型推断为 String
var age = 20;     // 类型推断为 int
```

### 显式类型声明
```dart
String name = 'Bob';
int age = 20;
double height = 1.75;
bool isStudent = true;
```

### dynamic 和 Object
```dart
dynamic value = 'Hello';
value = 123; // 可以改变类型

Object obj = 'Hello';
obj = 123;   // 也可以改变类型
```

### final 和 const
```dart
final name = 'Bob';    // 运行时常量
const pi = 3.14159;    // 编译时常量
```

## 基本数据类型

### 数值型 (Numbers)

#### int
```dart
int age = 20;
int hexValue = 0xDEADBEEF;
```

#### double
```dart
double height = 1.75;
double exponents = 1.42e5;
```

### 字符串 (String)

#### 字符串声明
```dart
String name = 'Bob';
String message = "Hello World";
```

#### 字符串插值
```dart
String name = 'Bob';
String greeting = 'Hello, $name!';
String calculation = 'The sum is ${2 + 2}';
```

#### 多行字符串
```dart
String multiLine = '''
This is a
multi-line string
in Dart.
''';
```

### 布尔型 (bool)
```dart
bool isStudent = true;
bool isWorking = false;
```

### 列表 (List)
```dart
List<int> numbers = [1, 2, 3, 4, 5];
var fruits = ['apple', 'banana', 'orange'];
```

### 集合 (Set)
```dart
Set<String> uniqueNames = {'Bob', 'Alice', 'Charlie'};
var numbers = {1, 2, 3, 4, 5};
```

### 映射 (Map)
```dart
Map<String, int> ages = {
  'Bob': 20,
  'Alice': 25,
  'Charlie': 30,
};

var scores = {
  'math': 90,
  'history': 85,
  'science': 95,
};
```

## 类型转换

### 字符串转换
```dart
// 字符串转数字
int.parse('123');      // 123
double.parse('1.23');  // 1.23

// 数字转字符串
123.toString();        // '123'
3.14159.toStringAsFixed(2);  // '3.14'
```

### 数值转换
```dart
// int 转 double
int age = 20;
double ageDouble = age.toDouble();

// double 转 int
double price = 9.99;
int priceInt = price.toInt();
```

## 空安全

Dart 2.12 引入了空安全特性:

```dart
// 可空类型
String? nullableName;  // 可以为 null
int? age;             // 可以为 null

// 非空类型
String nonNullName = 'Bob';  // 不能为 null
int nonNullAge = 20;        // 不能为 null

// 空值检查
String? name;
print(name?.length);  // 安全调用
print(name!.length);  // 强制非空
```

## 类型判断

### is 关键字
```dart
var value = 'Hello';
if (value is String) {
  print('Value is a String');
}
```

### runtimeType 属性
```dart
print(value.runtimeType);  // 打印运行时类型
```

## 常见用法示例

```dart
void main() {
  // 基本变量声明和使用
  String name = 'Bob';
  int age = 20;
  double height = 1.75;
  bool isStudent = true;
  
  // 字符串插值
  print('Name: $name, Age: $age, Height: $height, Student: $isStudent');
  
  // 列表操作
  var numbers = [1, 2, 3, 4, 5];
  numbers.add(6);
  numbers.remove(1);
  print('Numbers: $numbers');
  
  // Map操作
  var person = {
    'name': 'Bob',
    'age': 20,
    'height': 1.75,
  };
  person['weight'] = 65;
  print('Person: $person');
  
  // 空安全示例
  String? nullableName;
  print('Nullable name: ${nullableName ?? 'Unknown'}');
  
  // 类型转换
  var numberString = '123';
  var parsedNumber = int.parse(numberString);
  print('Parsed number: $parsedNumber');
}
```

## 注意事项

1. 优先使用 var 声明变量,除非需要明确指定类型
2. const 用于编译时常量,final 用于运行时常量
3. 注意空安全特性,合理使用可空类型
4. 避免滥用 dynamic 类型
5. 使用类型推断时要注意上下文

## 最佳实践

1. 变量命名使用小驼峰命名法
2. 常量命名使用大驼峰命名法
3. 优先使用字符串插值而不是字符串连接
4. 合理使用 final 关键字提高代码的可维护性
5. 显式声明API中的参数和返回类型

## 总结

Dart 的变量和数据类型系统既灵活又严谨,通过合理使用可以写出更安全、更易维护的代码。理解并掌握这些基础知识对于 Flutter 开发至关重要。 