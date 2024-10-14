---
description: 在 Dart 语言中，可以实现常见的设计模式，这些设计模式提供了在软件开发中解决常见问题的可重用解决方案。设计模式分为三大类：创建型模式、结构型模式 和 行为型模式。我将介绍一些常见的设计模式，并展示如何在 Dart 中实现它们。
sticky: 999
tag:
 - Dart
 - 设计模式
 - Flutter
readingTime: false
# top: 2
sidebar: true
---

# Dart 语言中常见的设计模式

在 Dart 语言中，可以实现常见的设计模式，这些设计模式提供了在软件开发中解决常见问题的可重用解决方案。设计模式分为三大类：创建型模式、结构型模式 和 行为型模式。我将介绍一些常见的设计模式，并展示如何在 Dart 中实现它们。

## 单例模式（Singleton Pattern）

:::tip 一点说明
目的: 确保一个类只有一个实例，并提供一个全局访问点。
:::

在 Dart 中可以通过工厂构造函数来实现单例模式。工厂构造函数允许返回现有的实例，而不是每次都创建新实例。

```dart
class Singleton {
  static final Singleton _instance = Singleton._internal();
  
  // 私有构造函数
  Singleton._internal();

  // 工厂构造函数返回唯一实例
  factory Singleton() {
    return _instance;
  }

  void someMethod() {
    print('Doing something');
  }
}

void main() {
  Singleton s1 = Singleton();
  Singleton s2 = Singleton();

  print(identical(s1, s2));  // 输出：true
}

```

## 工厂模式（Factory Pattern）

:::tip 一点说明
目的：提供一种创建对象的接口，让子类决定实例化哪一个类。
:::

在 Dart 中，可以通过工厂构造函数或者独立的工厂类来实现工厂模式。

```dart
abstract class Shape {
  void draw();
}

class Circle implements Shape {
  @override
  void draw() {
    print('Drawing a Circle');
  }
}

class Square implements Shape {
  @override
  void draw() {
    print('Drawing a Square');
  }
}

class ShapeFactory {
  static Shape getShape(String shapeType) {
    if (shapeType == 'circle') {
      return Circle();
    } else if (shapeType == 'square') {
      return Square();
    } else {
      throw Exception('Shape not found');
    }
  }
}

void main() {
  Shape shape1 = ShapeFactory.getShape('circle');
  shape1.draw();  // 输出：Drawing a Circle
  
  Shape shape2 = ShapeFactory.getShape('square');
  shape2.draw();  // 输出：Drawing a Square
}

```

## 建造者模式（Builder Pattern）

:::tip 一点说明
目的：用于构建复杂对象，通过一步一步构造，允许分步骤创建对象。
:::

在 Dart 中，建造者模式可以通过类中方法链来实现，常用于构建复杂的对象。

```dart
class House {
  String? foundation;
  String? structure;
  String? roof;
  
  @override
  String toString() {
    return 'House with $foundation foundation, $structure structure, and $roof roof';
  }
}

class HouseBuilder {
  final House _house = House();
  
  HouseBuilder setFoundation(String foundation) {
    _house.foundation = foundation;
    return this;
  }
  
  HouseBuilder setStructure(String structure) {
    _house.structure = structure;
    return this;
  }
  
  HouseBuilder setRoof(String roof) {
    _house.roof = roof;
    return this;
  }
  
  House build() {
    return _house;
  }
}

void main() {
  House house = HouseBuilder()
    .setFoundation('Concrete')
    .setStructure('Wood')
    .setRoof('Shingle')
    .build();
  
  print(house);  // 输出：House with Concrete foundation, Wood structure, and Shingle roof
}

```

## 适配器模式（Adapter Pattern）

:::tip 一点说明
目的：将一个类的接口转换成客户端希望的另一种接口，解决接口不兼容的问题。
:::

在 Dart 中，可以通过创建适配器类，将旧接口适配为新的接口。

```dart
class OldAudioPlayer {
  void playMp3(String fileName) {
    print('Playing MP3 file: $fileName');
  }
}

abstract class AudioPlayer {
  void play(String fileName);
}

class AudioPlayerAdapter implements AudioPlayer {
  final OldAudioPlayer _oldAudioPlayer;

  AudioPlayerAdapter(this._oldAudioPlayer);

  @override
  void play(String fileName) {
    _oldAudioPlayer.playMp3(fileName);
  }
}

void main() {
  OldAudioPlayer oldPlayer = OldAudioPlayer();
  AudioPlayer player = AudioPlayerAdapter(oldPlayer);
  
  player.play('song.mp3');  // 输出：Playing MP3 file: song.mp3
}

```

## 装饰器模式（Decorator Pattern）

:::tip 一点说明
目的：动态地为对象添加功能。装饰器提供了比继承更灵活的扩展功能的方式。
:::


在 Dart 中，可以通过创建装饰类来增强原始类的功能。

```dart
abstract class Coffee {
  String description = 'Unknown Coffee';
  String getDescription() => description;
  double cost();
}

class SimpleCoffee implements Coffee {
  @override
  String description = 'Simple Coffee';

  @override
  double cost() => 5.0;
}

class MilkDecorator implements Coffee {
  final Coffee _coffee;

  MilkDecorator(this._coffee);

  @override
  String getDescription() => _coffee.getDescription() + ', Milk';

  @override
  double cost() => _coffee.cost() + 1.5;
}

class SugarDecorator implements Coffee {
  final Coffee _coffee;

  SugarDecorator(this._coffee);

  @override
  String getDescription() => _coffee.getDescription() + ', Sugar';

  @override
  double cost() => _coffee.cost() + 0.5;
}

void main() {
  Coffee coffee = SimpleCoffee();
  print('${coffee.getDescription()} costs \$${coffee.cost()}');
  
  coffee = MilkDecorator(coffee);
  print('${coffee.getDescription()} costs \$${coffee.cost()}');
  
  coffee = SugarDecorator(coffee);
  print('${coffee.getDescription()} costs \$${coffee.cost()}');
}

```

## 观察者模式（Observer Pattern）

:::tip 一点说明
目的：定义对象间一对多的依赖，当一个对象的状态发生改变时，所有依赖于它的对象都得到通知并被自动更新。
:::

在 Dart 中，可以通过 Stream 来实现观察者模式。

```dart
class NewsPublisher {
  final _newsController = StreamController<String>();

  Stream<String> get newsStream => _newsController.stream;

  void publishNews(String news) {
    _newsController.add(news);
  }
}

void main() {
  NewsPublisher publisher = NewsPublisher();
  
  publisher.newsStream.listen((news) {
    print('Subscriber 1 received news: $news');
  });
  
  publisher.newsStream.listen((news) {
    print('Subscriber 2 received news: $news');
  });

  publisher.publishNews('Dart 3.0 Released');
  publisher.publishNews('Flutter 3.0 Released');
}

```

## 策略模式（Strategy Pattern）

:::tip 一点说明
目的：定义一系列算法，并将它们封装在独立的类中，使它们可以互换使用。
:::

在 Dart 中，可以通过接口或者抽象类定义策略，然后通过传递不同的策略类来实现策略模式。

```dart
abstract class PaymentStrategy {
  void pay(double amount);
}

class CreditCardPayment implements PaymentStrategy {
  @override
  void pay(double amount) {
    print('Paid \$${amount} with Credit Card');
  }
}

class PaypalPayment implements PaymentStrategy {
  @override
  void pay(double amount) {
    print('Paid \$${amount} with Paypal');
  }
}

class PaymentContext {
  final PaymentStrategy _strategy;

  PaymentContext(this._strategy);

  void executePayment(double amount) {
    _strategy.pay(amount);
  }
}

void main() {
  PaymentContext context = PaymentContext(CreditCardPayment());
  context.executePayment(100.0);  // 输出：Paid $100.0 with Credit Card

  context = PaymentContext(PaypalPayment());
  context.executePayment(200.0);  // 输出：Paid $200.0 with Paypal
}

```

## 总结

这些设计模式可以帮助你在 Dart 应用程序中解决常见的问题，并提高代码的可维护性和可扩展性。每种设计模式都有其适用场景，选择合适的模式可以使你的代码更加简洁、灵活。