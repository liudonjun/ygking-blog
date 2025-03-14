---
description: Dart 的控制流语句是编程中的基本构建块，掌握它们对于编写结构化的代码至关重要。
tag:
 - Dart
 - 基础
sticky: 1
sidebar: true
---

# Dart 控制流语句详解

## if-else 语句

基本的条件控制：

```dart
int age = 20;

if (age >= 18) {
  print("成年人");
} else if (age >= 12) {
  print("青少年");
} else {
  print("儿童");
}
```

## switch-case 语句

多分支条件控制：

```dart
String grade = 'A';

switch (grade) {
  case 'A':
    print("优秀");
    break;
  case 'B':
    print("良好");
    break;
  case 'C':
    print("及格");
    break;
  default:
    print("不及格");
}
```

## for 循环

### 标准 for 循环

```dart
for (int i = 0; i < 5; i++) {
  print(i); // 输出 0 到 4
}
```

### for-in 循环

```dart
var numbers = [1, 2, 3, 4, 5];
for (var number in numbers) {
  print(number);
}
```

### forEach 循环

```dart
var fruits = ['苹果', '香蕉', '橙子'];
fruits.forEach((fruit) => print(fruit));
```

## while 循环

### while 循环

```dart
int count = 0;
while (count < 5) {
  print(count);
  count++;
}
```

### do-while 循环

```dart
int num = 1;
do {
  print(num);
  num *= 2;
} while (num <= 16);
```

## break 和 continue

### break 语句

```dart
for (int i = 0; i < 10; i++) {
  if (i == 5) {
    break; // 跳出循环
  }
  print(i);
}
```

### continue 语句

```dart
for (int i = 0; i < 5; i++) {
  if (i == 2) {
    continue; // 跳过当前迭代
  }
  print(i);
}
```

## 标签语句

```dart
outerLoop: for (int i = 0; i < 3; i++) {
  for (int j = 0; j < 3; j++) {
    if (i == 1 && j == 1) {
      break outerLoop; // 跳出外层循环
    }
    print("$i, $j");
  }
}
```

## 异常处理流程

```dart
try {
  int result = 12 ~/ 0; // 除以零异常
  print(result);
} on IntegerDivisionByZeroException {
  print("不能除以零");
} catch (e) {
  print("捕获到异常：$e");
} finally {
  print("总是执行");
}
```

## assert 语句

在开发模式下进行断言：

```dart
int age = -5;
assert(age >= 0, "年龄不能为负数");
```

## 条件表达式

### 三元运算符

```dart
int number = 15;
String result = number % 2 == 0 ? "偶数" : "奇数";
```

### ?? 运算符

```dart
String? name;
String displayName = name ?? "匿名用户";
```

## 最佳实践

1. 合理使用控制流语句，避免过度嵌套
2. 优先使用 for-in 和 forEach 进行集合遍历
3. 适当使用 break 和 continue 控制循环流程
4. 注意异常处理的完整性
5. 合理使用断言进行开发时的调试

## 总结

Dart 的控制流语句提供了丰富的流程控制机制，合理使用这些语句可以编写出结构清晰、逻辑严谨的代码。理解并掌握这些基础知识对于开发高质量的 Flutter 应用至关重要。