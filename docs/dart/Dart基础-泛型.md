---
title: Dart 泛型详解
description: 详细介绍 Dart 语言中的泛型使用,包括泛型类、泛型方法和泛型约束等。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 泛型详解

## 泛型基础

### 为什么使用泛型
```dart
// 不使用泛型
Object getFirst(List list) {
  return list[0];
}

// 使用泛型
T getFirst<T>(List<T> list) {
  return list[0];
}
```

### 基本语法
```dart
// 泛型类
class Box<T> {
  T value;
  Box(this.value);
}

// 泛型方法
T transform<T>(T value) {
  return value;
}
```

## 泛型类

### 单类型参数
```dart
class Stack<T> {
  final List<T> _items = [];
  
  void push(T item) => _items.add(item);
  T pop() => _items.removeLast();
  bool get isEmpty => _items.isEmpty;
}

// 使用示例
var numberStack = Stack<int>();
var stringStack = Stack<String>();
```

### 多类型参数
```dart
class Pair<K, V> {
  final K first;
  final V second;
  
  Pair(this.first, this.second);
}

// 使用示例
var pair = Pair<String, int>('age', 25);
```

## 泛型方法

### 基本用法
```dart
T findFirst<T>(List<T> items, bool Function(T) test) {
  for (var item in items) {
    if (test(item)) return item;
  }
  throw StateError('No element');
}

// 使用示例
var numbers = [1, 2, 3, 4, 5];
var firstEven = findFirst<int>(numbers, (n) => n.isEven);
```

### 泛型方法约束
```dart
T max<T extends Comparable<T>>(T a, T b) {
  return a.compareTo(b) > 0 ? a : b;
}

// 使用示例
print(max<int>(10, 20));
print(max<String>('hello', 'world'));
```

## 泛型接口

```dart
abstract class Cache<T> {
  T getItem(String key);
  void setItem(String key, T value);
  void removeItem(String key);
}

class MemoryCache<T> implements Cache<T> {
  final Map<String, T> _cache = {};
  
  @override
  T getItem(String key) => _cache[key]!;
  
  @override
  void setItem(String key, T value) => _cache[key] = value;
  
  @override
  void removeItem(String key) => _cache.remove(key);
}
```

## 完整示例

```dart
// 通用数据结构示例
class DataContainer<T> {
  final List<T> _items = [];
  final void Function(T)? _onAdd;
  final void Function(T)? _onRemove;
  
  DataContainer({
    void Function(T)? onAdd,
    void Function(T)? onRemove,
  })  : _onAdd = onAdd,
        _onRemove = onRemove;
  
  void add(T item) {
    _items.add(item);
    _onAdd?.call(item);
  }
  
  bool remove(T item) {
    final removed = _items.remove(item);
    if (removed) {
      _onRemove?.call(item);
    }
    return removed;
  }
  
  List<R> map<R>(R Function(T) transform) {
    return _items.map(transform).toList();
  }
  
  List<T> where(bool Function(T) test) {
    return _items.where(test).toList();
  }
  
  T? find(bool Function(T) test) {
    return _items.firstWhere(test, orElse: () => null as T);
  }
}

// 使用示例
void main() {
  // 创建整数容器
  var numbers = DataContainer<int>(
    onAdd: (number) => print('Added: $number'),
    onRemove: (number) => print('Removed: $number'),
  );
  
  numbers.add(1);
  numbers.add(2);
  numbers.add(3);
  
  // 转换操作
  var doubled = numbers.map((n) => n * 2);
  print('Doubled: $doubled');
  
  // 过滤操作
  var evenNumbers = numbers.where((n) => n.isEven);
  print('Even numbers: $evenNumbers');
  
  // 查找操作
  var firstEven = numbers.find((n) => n.isEven);
  print('First even number: $firstEven');
  
  // 创建字符串容器
  var words = DataContainer<String>(
    onAdd: (word) => print('Added word: $word'),
    onRemove: (word) => print('Removed word: $word'),
  );
  
  words.add('hello');
  words.add('world');
  
  // 字符串操作
  var upperWords = words.map((w) => w.toUpperCase());
  print('Upper words: $upperWords');
  
  var longWords = words.where((w) => w.length > 4);
  print('Long words: $longWords');
}
```

## 泛型约束

### extends 关键字
```dart
class NumberBox<T extends num> {
  T value;
  
  NumberBox(this.value);
  
  void increment() {
    if (value is int) {
      value = (value + 1) as T;
    } else if (value is double) {
      value = (value + 1.0) as T;
    }
  }
}
```

### 多重约束
```dart
class JsonSerializable<T extends Object & Comparable<T>> {
  T value;
  
  JsonSerializable(this.value);
  
  String toJson() => '{"value": "$value"}';
}
```

## 注意事项

1. 泛型类型在运行时会被擦除
2. 注意类型安全和类型检查
3. 合理使用泛型约束
4. 避免过度使用泛型
5. 注意泛型和异步操作的结合

## 最佳实践

1. 优先使用具体类型而不是 dynamic
2. 合理使用泛型约束
3. 为泛型参数使用有意义的名称
4. 适当使用类型推断
5. 注意泛型的性能影响

## 总结

Dart 的泛型系统提供了强大的类型安全和代码复用能力。通过合理使用泛型,可以编写出更加灵活、类型安全的代码。理解并掌握泛型的使用对于开发高质量的 Flutter 应用至关重要。 