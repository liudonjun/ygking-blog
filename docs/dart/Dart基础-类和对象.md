---
title: Dart 类和对象详解
description: 详细介绍 Dart 语言中的类定义、对象创建和面向对象编程特性。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 类和对象详解

## 类的定义

### 基本语法
```dart
class Person {
  // 属性
  String name;
  int age;
  
  // 构造函数
  Person(this.name, this.age);
  
  // 方法
  void sayHello() {
    print('Hello, I am $name');
  }
}
```

### 私有成员
```dart
class Person {
  String _name; // 私有属性
  int _age;     // 私有属性
  
  // Getter
  String get name => _name;
  int get age => _age;
  
  // Setter
  set name(String value) => _name = value;
  set age(int value) {
    if (value >= 0) {
      _age = value;
    }
  }
}
```

## 构造函数

### 默认构造函数
```dart
class Point {
  double x, y;
  
  Point(this.x, this.y);
}
```

### 命名构造函数
```dart
class Point {
  double x, y;
  
  Point(this.x, this.y);
  
  // 命名构造函数
  Point.origin() {
    x = 0;
    y = 0;
  }
  
  Point.fromJson(Map<String, double> json) {
    x = json['x']!;
    y = json['y']!;
  }
}
```

### 初始化列表
```dart
class Point {
  final double x;
  final double y;
  
  Point(double x, double y)
      : x = x,
        y = y {
    print('Point created');
  }
}
```

### 工厂构造函数
```dart
class Logger {
  static final Map<String, Logger> _cache = {};
  
  factory Logger(String name) {
    return _cache.putIfAbsent(name, () => Logger._internal(name));
  }
  
  Logger._internal(String name);
}
```

## 静态成员

### 静态属性
```dart
class MathUtils {
  static const double pi = 3.14159;
  static int count = 0;
}
```

### 静态方法
```dart
class MathUtils {
  static double square(double num) {
    return num * num;
  }
  
  static int add(int a, int b) => a + b;
}
```

## Getter 和 Setter

```dart
class Rectangle {
  double _width;
  double _height;
  
  Rectangle(this._width, this._height);
  
  // Getter
  double get area => _width * _height;
  
  // Setter
  set width(double value) {
    if (value > 0) {
      _width = value;
    }
  }
  
  set height(double value) {
    if (value > 0) {
      _height = value;
    }
  }
}
```

## 抽象类和方法

```dart
abstract class Shape {
  // 抽象方法
  double getArea();
  double getPerimeter();
  
  // 具体方法
  void printInfo() {
    print('Area: ${getArea()}');
    print('Perimeter: ${getPerimeter()}');
  }
}

class Circle extends Shape {
  double radius;
  
  Circle(this.radius);
  
  @override
  double getArea() => 3.14 * radius * radius;
  
  @override
  double getPerimeter() => 2 * 3.14 * radius;
}
```

## 完整示例

```dart
class BankAccount {
  // 私有属性
  String _accountNumber;
  double _balance;
  static const double _minBalance = 100.0;
  
  // 构造函数
  BankAccount(this._accountNumber, [this._balance = 0.0]);
  
  // 命名构造函数
  BankAccount.withBalance(String accountNumber, double balance)
      : _accountNumber = accountNumber,
        _balance = balance {
    print('Account created with initial balance');
  }
  
  // Getter
  String get accountNumber => _accountNumber;
  double get balance => _balance;
  
  // 方法
  bool deposit(double amount) {
    if (amount > 0) {
      _balance += amount;
      return true;
    }
    return false;
  }
  
  bool withdraw(double amount) {
    if (amount > 0 && (_balance - amount) >= _minBalance) {
      _balance -= amount;
      return true;
    }
    return false;
  }
  
  // 静态方法
  static bool validateAccountNumber(String accountNumber) {
    return accountNumber.length == 10;
  }
  
  // 重写 toString 方法
  @override
  String toString() {
    return 'Account: $_accountNumber, Balance: \$$_balance';
  }
}

void main() {
  // 创建账户
  var account1 = BankAccount('1234567890');
  var account2 = BankAccount.withBalance('0987654321', 1000.0);
  
  // 存款
  account1.deposit(500.0);
  print(account1);
  
  // 取款
  if (account2.withdraw(300.0)) {
    print('Withdrawal successful');
    print(account2);
  } else {
    print('Withdrawal failed');
  }
  
  // 验证账号
  print('Account number valid: ${BankAccount.validateAccountNumber('1234567890')}');
}
```

## 注意事项

1. 类名使用大驼峰命名法
2. 私有成员以下划线开头
3. 合理使用 Getter 和 Setter
4. 避免过度使用静态成员
5. 注意构造函数的使用场景

## 最佳实践

1. 遵循单一职责原则
2. 使用工厂构造函数创建单例
3. 合理使用抽象类和接口
4. 适当封装私有成员
5. 提供必要的文档注释

## 总结

Dart 的类和对象系统提供了丰富的面向对象特性,通过合理使用这些特性可以写出更加结构化、可维护的代码。理解并掌握这些知识对于 Flutter 开发至关重要。 