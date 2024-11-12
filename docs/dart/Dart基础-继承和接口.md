---
title: Dart 继承和接口详解
description: 详细介绍 Dart 语言中的继承机制、接口实现和多态特性。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 继承和接口详解

## 继承基础

### 基本语法
```dart
class Animal {
  String name;
  
  Animal(this.name);
  
  void makeSound() {
    print('Some sound');
  }
}

class Dog extends Animal {
  Dog(String name) : super(name);
  
  @override
  void makeSound() {
    print('Woof!');
  }
}
```

### 构造函数继承
```dart
class Person {
  String name;
  int age;
  
  Person(this.name, this.age);
  
  // 命名构造函数
  Person.guest() {
    name = 'Guest';
    age = 18;
  }
}

class Student extends Person {
  String school;
  
  // 调用父类构造函数
  Student(String name, int age, this.school) : super(name, age);
  
  // 调用父类命名构造函数
  Student.guest(this.school) : super.guest();
}
```

## 抽象类

```dart
abstract class Shape {
  // 抽象方法
  double getArea();
  double getPerimeter();
  
  // 普通方法
  void printInfo() {
    print('Area: ${getArea()}');
    print('Perimeter: ${getPerimeter()}');
  }
}

class Rectangle extends Shape {
  double width;
  double height;
  
  Rectangle(this.width, this.height);
  
  @override
  double getArea() => width * height;
  
  @override
  double getPerimeter() => 2 * (width + height);
}
```

## 接口实现

### 隐式接口
```dart
class Swimmer {
  void swim() {
    print('Swimming');
  }
}

class Duck implements Swimmer {
  @override
  void swim() {
    print('Duck swimming');
  }
}
```

### 多接口实现
```dart
abstract class Flyer {
  void fly();
}

abstract class Walker {
  void walk();
}

class Bird implements Flyer, Walker {
  @override
  void fly() {
    print('Flying');
  }
  
  @override
  void walk() {
    print('Walking');
  }
}
```

## 多态

```dart
void makeAnimalSound(Animal animal) {
  animal.makeSound();
}

void main() {
  Animal cat = Cat('Whiskers');
  Animal dog = Dog('Rover');
  
  makeAnimalSound(cat); // 输出: Meow!
  makeAnimalSound(dog); // 输出: Woof!
}
```

## 完整示例

```dart
// 抽象类定义
abstract class Vehicle {
  String brand;
  String model;
  
  Vehicle(this.brand, this.model);
  
  void start();
  void stop();
  
  // 普通方法
  void printInfo() {
    print('$brand $model');
  }
}

// 接口定义
abstract class Electric {
  void charge();
}

abstract class Autonomous {
  void selfDrive();
}

// 基础车辆类
class Car extends Vehicle {
  int seats;
  
  Car(String brand, String model, this.seats) : super(brand, model);
  
  @override
  void start() {
    print('Car engine starting...');
  }
  
  @override
  void stop() {
    print('Car engine stopping...');
  }
}

// 电动车类
class ElectricCar extends Car implements Electric {
  int batteryCapacity;
  
  ElectricCar(
    String brand,
    String model,
    int seats,
    this.batteryCapacity,
  ) : super(brand, model, seats);
  
  @override
  void charge() {
    print('Charging electric car...');
  }
  
  @override
  void start() {
    print('Electric car starting silently...');
  }
}

// 自动驾驶电动车
class AutoonomousElectricCar extends ElectricCar implements Autonomous {
  AutoonomousElectricCar(
    String brand,
    String model,
    int seats,
    int batteryCapacity,
  ) : super(brand, model, seats, batteryCapacity);
  
  @override
  void selfDrive() {
    print('Self-driving mode activated');
  }
}

void main() {
  // 创建不同类型的车辆
  Car regularCar = Car('Toyota', 'Camry', 5);
  ElectricCar tesla = ElectricCar('Tesla', 'Model 3', 5, 75);
  AutoonomousElectricCar waymo = AutoonomousElectricCar('Waymo', 'One', 4, 100);
  
  // 使用多态
  List<Vehicle> vehicles = [regularCar, tesla, waymo];
  
  for (var vehicle in vehicles) {
    vehicle.printInfo();
    vehicle.start();
    vehicle.stop();
    
    if (vehicle is Electric) {
      (vehicle as Electric).charge();
    }
    
    if (vehicle is Autonomous) {
      (vehicle as Autonomous).selfDrive();
    }
    
    print('---');
  }
}
```

## 注意事项

1. Dart 不支持多重继承
2. 一个类可以实现多个接口
3. 接口可以包含实现
4. 注意方法重写的正确性
5. 合理使用抽象类和接口

## 最佳实践

1. 优先使用接口而不是继承
2. 抽象类用于定义通用行为
3. 合理使用多态
4. 避免过深的继承层次
5. 遵循里氏替换原则

## 总结

Dart 的继承和接口机制提供了强大的面向对象特性,通过合理使用这些特性可以设计出灵活、可维护的代码结构。理解并掌握这些知识对于编写高质量的 Flutter 应用至关重要。 