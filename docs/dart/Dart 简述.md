---
description: Dart 是由 Google 开发的一种开源、通用的编程语言，最早用于构建 Web 应用程序，现已广泛用于跨平台移动应用开发，尤其是与 Flutter 框架结合使用。
sticky: 999
tag:
 - Dart
 - 基础
# top: 1
sidebar: true
---

# 一篇文章然你对 Dart 有初步了解 
Dart 是由 Google 开发的一种开源、通用的编程语言，最早用于构建 Web 应用程序，现已广泛用于跨平台移动应用开发，尤其是与 Flutter 框架结合使用。它是一门面向对象的语言，具备多范式编程能力，包括面向对象编程、函数式编程和反应式编程。Dart 编写的代码可以直接编译为原生代码，也可以通过 Dart VM 解释执行，适用于 Web、移动、桌面等平台。

## Dart 的特点
- 简单易学：语法类似于 Java 和 C++，非常适合具备其他编程语言基础的开发者快速上手。
- 高效：Dart 代码可以编译为原生 ARM 或 JavaScript，适合高性能应用开发，尤其在需要极致性能的移动应用中表现突出。
- 异步编程支持：内置 Future 和 Stream 等异步编程机制，让网络请求、I/O 操作等并发任务更加简洁高效。
- 跨平台支持：通过 Dart 和 Flutter，开发者可以使用一套代码跨平台构建 Android、iOS、Web、Windows、macOS 和 Linux 应用程序。


# 安装 Dart

在编写 Dart 代码之前，需要先安装 Dart SDK。可以通过两种方式安装 Dart：

## 安装 Dart SDK

- 在 Windows、macOS 或 Linux 系统上，可以通过访问 [Dart](https://dart.dev/get-dart) 官方网站 下载并安装 Dart SDK，安装后可以在终端中使用 dart 命令来运行 Dart 代码。
通过 Flutter SDK 安装 Dart：

- 如果你已经安装了 Flutter SDK，那么 Dart 已经包含在 [Flutter](https://docs.flutter.dev/get-started/install) 中，无需单独安装 Dart SDK。
在线使用 DartPad：

- 如果不想在本地安装 Dart，可以使用 Dart 官方提供的 DartPad 在线编写和运行 Dart 代码，适合学习和测试。

#  变量与数据类型

- 定义变量可以使用显式声明的方式定义变量并指定其类型：
```dart
int age = 25;   // 整数类型
double height = 5.9;  // 浮点数类型
String name = 'John'; // 字符串类型
bool isStudent = true; // 布尔类型
```

- 使用 `var` 关键字时，Dart 会根据初始赋值来推断变量的类型，编译器会自动确定类型：
```dart
var name = 'Alice'; // Dart 自动推断为 String 类型
var age = 30;       // Dart 自动推断为 int 类型
```

- `dynamic` 关键字允许定义动态类型的变量，该变量的类型可以在运行时改变：

```dart
dynamic value = 10;
value = 'Hello';  // 允许更改类型
```

##  常量

Dart 中可以使用 `const` 或 `final` 关键字定义常量。两者的区别在于 const 是编译时常量，值必须在编译时确定，而 final 是运行时常量，值可以在运行时赋予。

```dart
const double pi = 3.14;  // 编译时常量
final DateTime now = DateTime.now(); // 运行时常量
```

## 运算符

Dart 支持常见的运算符，如加减乘除、逻辑运算符等：

```dart
int a = 10;
int b = 20;
int sum = a + b;    // 加法
bool isEqual = a == b;  // 等于

```

# 控制流语句

## 条件语句

Dart 提供了 `if` 和 `else` 语句来处理条件逻辑：

```dart
int age = 18;
if (age >= 18) {
  print('成年人');
} else {
  print('未成年');
}

```


## 循环语句

Dart 支持 `for`、`while` 和 `do-while` 循环。

- `for` 循环：

```dart
for (int i = 0; i < 5; i++) {
  print(i);
}

```

- `while` 循环：

```dart

int i = 0;
while (i < 5) {
  print(i);
  i++;
}
```

- `do-while` 循环：

```dart

int i = 0;
do {
  print(i);
  i++;
} while (i < 5);

```

# 函数与方法

##  定义函数
Dart 使用 returnType functionName(parameters) 来定义函数：

```dart
int add(int a, int b) {
  return a + b;
}

```

## 可选参数与默认值

Dart 支持命名参数、位置参数和默认值：

```dart
void greet(String name, {int age = 18}) {
  print('Hello, $name! You are $age years old.');
}

```

调用时可以忽略可选参数：

```dart
greet('John');  // 输出: Hello, John! You are 18 years old.

```

# 面向对象编程
Dart 是一门完全面向对象的语言，所有的东西都是对象，包括数字、函数和 null。
## 定义类

类使用 class 关键字定义，类可以包含属性和方法。

```dart
class Person {
  String name;
  int age;
  
  Person(this.name, this.age);
  
  void introduce() {
    print('My name is $name, and I am $age years old.');
  }
}

```

## 创建对象

通过类的构造函数创建对象并调用方法：

```dart
Person john = Person('John', 25);
john.introduce(); // 输出: My name is John, and I am 25 years old.

```

## 继承

Dart 支持继承，子类通过 `extends` 关键字继承父类，并可以重写父类的方法。

```dart
class Student extends Person {
  String school;
  
  Student(String name, int age, this.school) : super(name, age);
  
  @override
  void introduce() {
    print('I am $name from $school.');
  }
}

```

## 抽象类

Dart 允许定义 抽象类，通过 `abstract` 关键字,它可以包含抽象方法，也可以有实现。抽象类无法被实例化，必须通过子类继承并实现其方法。

```dart

abstract class Animal {
  void makeSound();  // 抽象方法
}

class Dog extends Animal {
  @override
  void makeSound() {
    print('Bark!');
  }
}

void main() {
  Dog dog = Dog();
  dog.makeSound();  // 输出：Bark!
}

```

# 异常处理

Dart 使用 `try-catch` 来捕获和处理异常：

```dart
try {
  int result = 10 ~/ 0; // 会抛出异常
} catch (e) {
  print('异常发生: $e');
} finally {
  print('总是会执行');
}

```

# 异步编程
## 使用 Future

Dart 提供了 `Future` 来处理异步操作：

```dart
Future<String> fetchData() async {
  return Future.delayed(Duration(seconds: 2), () => '数据加载完成');
}

void main() async {
  print('开始加载');
  String data = await fetchData();
  print(data);
}


```

## 使用 Stream

`Stream` 用于处理一系列异步事件：

```dart
Stream<int> countStream() async* {
  for (int i = 1; i <= 5; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}

void main() async {
  await for (int count in countStream()) {
    print(count);  // 每秒输出一个数字：1, 2, 3, 4, 5
  }
}


```

# Dart的高级用法

## 泛型

Dart 支持泛型，可以定义类型参数：

```dart
class Box<T> {
  T data;
  
  void add(T value) {
    data = value;
  }
  
  T get() {
    return data;
  }
}

```

## 混合继承与扩展

Dart 支持使用 `mixin` 来实现多重继承：

```dart
mixin A {
  void printA() {
    print('A');
  }
}

mixin B on A {
  void printB() {
    print('B');
  }
}

class C with A, B {}

void main() {
  C c = C();
  c.printA(); // 输出: A
  c.printB(); // 输出: B
}

```

## 枚举 `Enums`

Dart 支持枚举，适用于定义一组有意义的常量。枚举类型是值不可变且有限的类型。

```dart
enum Weather { sunny, cloudy, rainy }

void main() {
  Weather today = Weather.sunny;
  
  switch (today) {
    case Weather.sunny:
      print('The weather is sunny');
      break;
    case Weather.cloudy:
      print('The weather is cloudy');
      break;
    case Weather.rainy:
      print('The weather is rainy');
      break;
  }
}

```

## 扩展方法

Dart 支持扩展方法，通过关键字 `extension` ,可以在已有类上添加新的方法：

```dart
extension StringExtension on String {
  String reverse() {
    return split('').reversed.join();
  }
}

void main() {
  String message = 'hello';
  print(message.reverse());  // 输出：olleh
}
```

## 混入 Mixin

Dart 支持 `Mixin`，可以定义多个类的行为：

```dart
class A {
  void printA() {
    print('A');
  }
}

class B {
  void printB() {
    print('B');
  }
}

class C with A, B {}

void main() {
  C c = C();
  c.printA(); // 输出: A
  c.printB(); // 输出: B
}

```

# 函数式编程

Dart 支持函数式编程风格，允许使用高阶函数、匿名函数和闭包等特性。

```dart
void main() {
  List<int> numbers = [1, 2, 3];
  numbers.forEach((num) => print(num)); // 输出: 1, 2, 3
}

```

## 匿名函数
匿名函数没有名字，通常用于传递给其他函数作为参数。

```dart
void main() {
  List<int> numbers = [1, 2, 3, 4, 5];
  numbers.forEach((number) {
    print(number * 2);  // 输出：2, 4, 6, 8, 10
  });
}

```
## 高阶函数

高阶函数是接受其他函数作为参数，或返回函数作为结果的函数。

```dart
void printResult(int Function(int, int) operation, int a, int b) {
  print(operation(a, b));
}

int add(int a, int b) => a + b;
int subtract(int a, int b) => a - b;

void main() {
  printResult(add, 5, 3);  // 输出：8
  printResult(subtract, 5, 3); // 输出：2
}

```

## 闭包

闭包是能够捕获并存储其作用域内变量的函数，即使函数的上下文已经销毁，闭包仍然可以访问这些变量。

```dart
Function makeMultiplier(int multiplier) {
  return (int value) => value * multiplier;
}

void main() {
  var multiplyBy2 = makeMultiplier(2);
  var multiplyBy3 = makeMultiplier(3);
  
  print(multiplyBy2(4));  // 输出：8
  print(multiplyBy3(4));  // 输出：12
}

```

## 元编程

Dart 支持反射（reflection）和元编程，这使得程序可以在运行时动态地检查和操作代码结构。


`dart:mirrors`
dart:mirrors 库提供了反射 API，允许程序在运行时检查类型、实例和调用方法。以下是一个简单的反射示例：
```dart
import 'dart:mirrors';

class Person {
  String name = 'John';
  void sayHello() {
    print('Hello');
  }
}

void main() {
  Person person = Person();
  InstanceMirror im = reflect(person);
  im.invoke(Symbol('sayHello'), []);  // 调用 sayHello 方法
  print(im.getField(Symbol('name')).reflectee);  // 输出：John
}

```
:::tip 注意
需要注意的是，在 Flutter 和 Web 上不支持 `dart:mirrors` 库。
:::

## 异步生成器

Dart 支持异步生成器，它允许在异步函数中使用 yield 关键字生成值。异步生成器可以用于延迟地产生多个值。

```dart
Stream<int> asyncNumberGenerator() async* {
  for (int i = 1; i <= 5; i++) {
    await Future.delayed(Duration(seconds: 1));
    yield i;
  }
}

void main() async {
  await for (var value in asyncNumberGenerator()) {
    print(value);  // 每秒输出一个数字：1, 2, 3, 4, 5
  }
}

```

## 可空安全 （Null Safety）

Dart 的可空安全特性（从 Dart 2.12 引入）允许开发者在编译时发现可能的 null 引用问题，从而提高代码的安全性。Dart 的类型系统将 null 和非 null 类型区分开，确保在运行时不会出现 null 异常。

```dart
String? nullableString;  // 可以为空的字符串
String nonNullableString = 'Hello';  // 非空字符串

void main() {
  nullableString = null;
  
  // 使用 `?.` 进行 null 安全访问
  print(nullableString?.length);  // 输出：null
}

```

## Isolates

Dart 使用 `Isolate` 来实现并发编程。与传统的线程不同，Isolate 拥有自己的内存堆，并且它们之间不共享内存，而是通过消息传递进行通信。Isolate 适用于 CPU 密集型任务或需要在后台并行执行的操作。

```dart
import 'dart:isolate';

void isolateFunction(SendPort sendPort) {
  sendPort.send('Hello from Isolate');
}

void main() async {
  ReceivePort receivePort = ReceivePort();
  await Isolate.spawn(isolateFunction, receivePort.sendPort);
  
  receivePort.listen((message) {
    print(message);  // 输出：Hello from Isolate
  });
}

```

## 延迟初始化

Dart 提供了 `late` 关键字，允许在声明变量时不立即初始化，而是在稍后初始化。late 变量在首次使用前才会被初始化。

```dart
late String description;

void main() {
  description = 'This is a late-initialized variable';
  print(description);  // 输出：This is a late-initialized variable
}

```

## 静态扩展

Dart 是强类型语言，支持静态类型和类型推断。可以显式地为变量、函数和类指定类型，Dart 也能根据上下文自动推断类型。

```dart
var number = 42;  // Dart 推断类型为 int
String text = 'Hello, Dart';  // 显式类型声明

void main() {
  print(number);
  print(text);
}

```

## 类型别名 Type Alias

Dart 允许使用 `typedef` 定义类型别名。它可以为复杂的类型定义简洁的别名，常用于函数类型的定义。

```dart

typedef IntToString = String Function(int);

String numberToString(int num) {
  return 'Number is: $num';
}

void main() {
  IntToString func = numberToString;
  print(func(42));  // 输出：Number is: 42
}

```

## 注解

Dart 支持使用 注解（Annotations） 来提供元数据。注解用于为类、方法、变量添加额外信息，通常与编译器或框架交互。最常见的注解包括 @override 和 @deprecated。

- 自定义注解：
```dart
class MyAnnotation {
  final String info;
  const MyAnnotation(this.info);
}

@MyAnnotation('This is a custom annotation')
class MyClass {
  void printMessage() {
    print('Hello from MyClass');
  }
}

void main() {
  MyClass().printMessage();  // 输出：Hello from MyClass
}

```

## 重载运算符

Dart 允许为自定义类重载运算符。可以为类定义 +, -, * 等操作符的行为，使对象之间可以使用这些运算符进行操作。

- 运算符重载示例：

```dart
class Vector {
  final int x, y;
  Vector(this.x, this.y);
  
  Vector operator +(Vector v) {
    return Vector(x + v.x, y + v.y);
  }
  
  @override
  String toString() {
    return 'Vector($x, $y)';
  }
}

void main() {
  Vector v1 = Vector(1, 2);
  Vector v2 = Vector(3, 4);
  Vector result = v1 + v2;
  print(result);  // 输出：Vector(4, 6)
}

```

## 不可变类

Dart 提供了不可变对象的支持，常用于创建值对象。通过将所有属性定义为 `final`，可以使类变得不可变。

```dart
class Point {
  final int x;
  final int y;
  
  const Point(this.x, this.y);  // 使用 const 构造函数
  
  @override
  String toString() => 'Point($x, $y)';
}

void main() {
  const Point p1 = Point(1, 2);
  print(p1);  // 输出：Point(1, 2)
}

```

## 尾递归优化

Dart 支持尾递归优化，即如果一个函数的最后一步是递归调用自身，Dart 可以优化递归调用以避免堆栈溢出。

```dart
int factorial(int n, [int acc = 1]) {
  if (n <= 1) return acc;
  return factorial(n - 1, acc * n);  // 尾递归调用
}

void main() {
  print(factorial(5));  // 输出：120
}

```

## 延迟加载

Dart 支持延迟加载库，可以在需要时动态加载库，从而优化应用的启动时间和内存占用。通常在大型应用中使用，尤其是 Flutter 项目。

```dart
import 'dart:async';

Future<void> loadLibrary() async {
  // 使用 `deferred` 加载库
  await Future.delayed(Duration(seconds: 2));  // 模拟加载延迟
  print('Library loaded');
}

void main() async {
  print('Loading library...');
  await loadLibrary();
  print('Library has been loaded');
}

```

# 总结

Dart 是一门功能强大且灵活的编程语言，特别适合开发跨平台应用程序。通过掌握 Dart 的基本语法和面向对象编程理念，可以为接下来的 Flutter 开发打下坚实的基础。