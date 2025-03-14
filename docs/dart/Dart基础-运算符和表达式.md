---
description: Dart 的运算符和表达式是编程中的基础概念，掌握它们对于编写高效的代码至关重要。
tag:
 - Dart
 - 基础
sticky: 1
sidebar: true
---

# Dart 运算符和表达式详解

## 算术运算符

Dart 提供了常见的算术运算符：

```dart
int a = 10;
int b = 3;

print(a + b);  // 加法：13
print(a - b);  // 减法：7
print(a * b);  // 乘法：30
print(a / b);  // 除法：3.3333333333333335
print(a ~/ b); // 整除：3
print(a % b);  // 取余：1
```

## 关系运算符

用于比较两个值之间的关系：

```dart
int x = 5;
int y = 8;

print(x == y); // 等于：false
print(x != y); // 不等于：true
print(x > y);  // 大于：false
print(x < y);  // 小于：true
print(x >= y); // 大于等于：false
print(x <= y); // 小于等于：true
```

## 逻辑运算符

用于组合或修改逻辑条件：

```dart
bool a = true;
bool b = false;

print(a && b); // 与：false
print(a || b); // 或：true
print(!a);     // 非：false
```

## 赋值运算符

Dart 提供了多种赋值运算符：

```dart
int a = 10;    // 基本赋值
a += 5;        // 等同于 a = a + 5
a -= 3;        // 等同于 a = a - 3
a *= 2;        // 等同于 a = a * 2
a ~/= 4;       // 等同于 a = a ~/ 4
```

## 条件运算符

### 三元运算符

```dart
int age = 20;
String status = age >= 18 ? "成年" : "未成年";
```

### ??= 运算符

如果变量为 null，则赋值：

```dart
String? name;
name ??= "默认名称"; // 如果 name 为 null，则赋值
```

## 类型测试运算符

```dart
var str = "Hello";
print(str is String);     // true
print(str is! int);      // true
```

## 级联运算符

允许对同一个对象进行一系列操作：

```dart
class Person {
  String? name;
  int? age;
  
  void printInfo() {
    print("$name, $age");
  }
}

void main() {
  Person()
    ..name = "张三"
    ..age = 25
    ..printInfo();
}
```

## 空安全运算符

### ?. 运算符

安全地访问可能为 null 的对象的属性：

```dart
String? name;
print(name?.length); // 如果 name 为 null，返回 null
```

### ?? 运算符

提供默认值：

```dart
String? name;
print(name ?? "默认名称"); // 如果 name 为 null，返回默认值
```

## 位运算符

```dart
int a = 5;  // 二进制：0101
int b = 3;  // 二进制：0011

print(a & b);  // 与：1 (0001)
print(a | b);  // 或：7 (0111)
print(a ^ b);  // 异或：6 (0110)
print(~a);     // 取反：-6
print(a << 1); // 左移：10 (1010)
print(a >> 1); // 右移：2 (0010)
```

## 表达式

### 算术表达式

```dart
int result = (10 + 5) * 2 / 3;
```

### 字符串表达式

```dart
String name = "张三";
int age = 25;
String info = "我叫$name，今年${age + 1}岁";
```

### 函数表达式

```dart
var sum = (int a, int b) => a + b;
print(sum(5, 3)); // 8
```

## 运算符优先级

Dart 运算符优先级从高到低：

1. 一元后缀运算符 (expr++, expr--)
2. 一元前缀运算符 (-expr, !expr, ++expr, --expr)
3. 乘除运算符 (*, /, %, ~/)
4. 加减运算符 (+, -)
5. 移位运算符 (<<, >>)
6. 按位与 (&)
7. 按位异或 (^)
8. 按位或 (|)
9. 关系运算符 (>=, >, <=, <)
10. 类型测试运算符 (as, is, is!)
11. 相等运算符 (==, !=)
12. 逻辑与 (&&)
13. 逻辑或 (||)
14. 条件运算符 (?:)
15. 级联运算符 (..)
16. 赋值运算符 (=, +=, 等)

## 最佳实践

1. 优先使用括号明确运算优先级，提高代码可读性
2. 合理使用空安全运算符，避免空指针异常
3. 使用级联运算符简化连续操作
4. 注意运算符的副作用，特别是在使用自增自减运算符时

## 总结

Dart 提供了丰富的运算符和表达式支持，合理使用这些特性可以编写出更简洁、高效的代码。理解并掌握这些基础知识对于开发高质量的 Flutter 应用至关重要。