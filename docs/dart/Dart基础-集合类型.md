---
title: Dart 集合类型详解
description: 详细介绍 Dart 语言中的集合类型,包括 List、Set、Map 等。
tag:
 - Dart
 - 基础教程
sidebar: true
---

# Dart 集合类型详解

## List（列表）

### 列表创建
```dart
// 字面量创建
var numbers = [1, 2, 3, 4, 5];
List<String> fruits = ['apple', 'banana', 'orange'];

// 构造函数创建
var fixedList = List<int>.filled(5, 0); // 固定长度列表
var growableList = List<int>.empty(growable: true); // 可增长列表
var generatedList = List<int>.generate(5, (i) => i * i); // 生成列表
```

### 列表操作
```dart
var list = [1, 2, 3];

// 添加元素
list.add(4);
list.addAll([5, 6]);

// 删除元素
list.remove(1);
list.removeAt(0);
list.removeLast();

// 查找元素
int index = list.indexOf(3);
bool contains = list.contains(2);

// 修改元素
list[0] = 10;

// 遍历列表
for (var item in list) {
  print(item);
}

list.forEach((item) => print(item));
```

## Set（集合）

### 集合创建
```dart
// 字面量创建
var numbers = {1, 2, 3, 4, 5};
Set<String> fruits = {'apple', 'banana', 'orange'};

// 构造函数创建
var numberSet = Set<int>();
numberSet.addAll([1, 2, 3]);
```

### 集合操作
```dart
var set1 = {1, 2, 3};
var set2 = {3, 4, 5};

// 添加和删除
set1.add(4);
set1.remove(1);

// 集合运算
var union = set1.union(set2);         // 并集
var intersection = set1.intersection(set2); // 交集
var difference = set1.difference(set2);     // 差集

// 检查包含关系
bool contains = set1.contains(2);
bool subset = set1.isSubsetOf(set2);
```

## Map（映射）

### 映射创建
```dart
// 字面量创建
var scores = {
  'math': 90,
  'history': 85,
  'science': 95,
};

Map<String, int> ages = {
  'John': 20,
  'Alice': 25,
  'Bob': 30,
};

// 构造函数创建
var map = Map<String, int>();
map['one'] = 1;
map['two'] = 2;
```

### 映射操作
```dart
var map = {'a': 1, 'b': 2};

// 添加和更新
map['c'] = 3;
map.putIfAbsent('d', () => 4);

// 删除
map.remove('a');

// 访问元素
int? value = map['b'];
bool containsKey = map.containsKey('c');

// 遍历映射
map.forEach((key, value) => print('$key: $value'));

for (var entry in map.entries) {
  print('${entry.key}: ${entry.value}');
}
```

## 完整示例

```dart
class CollectionDemo {
  // List示例
  void listExample() {
    var fruits = ['apple', 'banana', 'orange'];
    
    // 基本操作
    fruits.add('grape');
    fruits.insert(1, 'mango');
    fruits.removeAt(0);
    
    // 变换操作
    var upperFruits = fruits.map((f) => f.toUpperCase()).toList();
    var longFruits = fruits.where((f) => f.length > 5).toList();
    
    // 排序
    fruits.sort((a, b) => a.compareTo(b));
    
    print('Fruits: $fruits');
    print('Upper fruits: $upperFruits');
    print('Long fruits: $longFruits');
  }
  
  // Set示例
  void setExample() {
    var numbers1 = {1, 2, 3, 4, 5};
    var numbers2 = {4, 5, 6, 7, 8};
    
    // 集合运算
    var union = numbers1.union(numbers2);
    var intersection = numbers1.intersection(numbers2);
    var difference = numbers1.difference(numbers2);
    
    print('Union: $union');
    print('Intersection: $intersection');
    print('Difference: $difference');
  }
  
  // Map示例
  void mapExample() {
    var students = {
      'John': {'age': 20, 'grade': 'A'},
      'Alice': {'age': 22, 'grade': 'B'},
      'Bob': {'age': 21, 'grade': 'A'},
    };
    
    // 基本操作
    students['Charlie'] = {'age': 23, 'grade': 'B'};
    students.remove('John');
    
    // 过滤和转换
    var gradeA = students.entries
        .where((entry) => entry.value['grade'] == 'A')
        .map((entry) => entry.key)
        .toList();
    
    print('Grade A students: $gradeA');
    
    // 遍历
    students.forEach((name, info) {
      print('$name: Age ${info['age']}, Grade ${info['grade']}');
    });
  }
}

void main() {
  var demo = CollectionDemo();
  
  print('=== List Example ===');
  demo.listExample();
  
  print('\n=== Set Example ===');
  demo.setExample();
  
  print('\n=== Map Example ===');
  demo.mapExample();
}
```

## 集合操作技巧

### 列表转换和过滤
```dart
var numbers = [1, 2, 3, 4, 5];

// 映射转换
var doubled = numbers.map((n) => n * 2).toList();

// 过滤
var evenNumbers = numbers.where((n) => n.isEven).toList();

// 归约
var sum = numbers.reduce((a, b) => a + b);
```

### 集合排序
```dart
var items = [3, 1, 4, 1, 5, 9, 2, 6, 5];

// 简单排序
items.sort();

// 自定义排序
items.sort((a, b) => b.compareTo(a)); // 降序

// 对象排序
var people = [
  {'name': 'Bob', 'age': 20},
  {'name': 'Alice', 'age': 25},
];
people.sort((a, b) => a['age'].compareTo(b['age']));
```

## 注意事项

1. 使用类型安全的集合
2. 注意不可变集合的使用
3. 合理处理空值
4. 避免过度嵌套
5. 注意集合的性能影响

## 最佳实践

1. 优先使用不可变集合
2. 合理使用泛型
3. 使用集合方法而不是循环
4. 注意内存使用
5. 适当使用懒加载集合

## 总结

Dart 的集合类型提供了丰富的功能和操作方法,通过合理使用这些特性可以编写出更简洁、高效的代码。理解并掌握这些知识对于开发高质量的 Flutter 应用至关重要。 