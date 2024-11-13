---
title: Flutter 单元测试详解
description: 详细介绍 Flutter 中单元测试的编写方法和最佳实践。
tag:
 - Flutter
 - 测试
sidebar: true
---

# Flutter 单元测试详解

## 简介

单元测试是测试代码最小单元的方法,能够帮助我们及早发现问题。本文介绍如何在 Flutter 中编写单元测试。

## 基本配置

### 添加依赖
```yaml
dev_dependencies:
  test: ^1.24.1
  mockito: ^5.4.2
  build_runner: ^2.4.6
```

### 创建测试文件
```dart
// test/calculator_test.dart
import 'package:test/test.dart';
import 'package:my_app/calculator.dart';

void main() {
  test('Calculator should add two numbers', () {
    final calculator = Calculator();
    expect(calculator.add(2, 3), equals(5));
  });
}
```

## 测试组织

### 测试组
```dart
group('Calculator', () {
  late Calculator calculator;
  
  setUp(() {
    calculator = Calculator();
  });
  
  test('should add two numbers', () {
    expect(calculator.add(2, 3), equals(5));
  });
  
  test('should subtract two numbers', () {
    expect(calculator.subtract(5, 3), equals(2));
  });
  
  test('should multiply two numbers', () {
    expect(calculator.multiply(2, 3), equals(6));
  });
  
  test('should divide two numbers', () {
    expect(calculator.divide(6, 2), equals(3));
  });
});
```

### 生命周期钩子
```dart
group('UserRepository', () {
  late UserRepository repository;
  late MockDatabase database;
  
  setUpAll(() {
    // 在所有测试开始前执行一次
  });
  
  setUp(() {
    // 每个测试前执行
    database = MockDatabase();
    repository = UserRepository(database);
  });
  
  tearDown(() {
    // 每个测试后执行
  });
  
  tearDownAll(() {
    // 在所有测试结束后执行一次
  });
  
  test('should save user', () async {
    final user = User('John');
    await repository.saveUser(user);
    verify(database.insert(user)).called(1);
  });
});
```

## Mock 对象

### 创建 Mock
```dart
// 生成 Mock 类
@GenerateMocks([Database])
void main() {
  // 使用生成的 Mock 类
  final database = MockDatabase();
  
  when(database.query('users'))
      .thenAnswer((_) => Future.value([
        {'id': 1, 'name': 'John'},
        {'id': 2, 'name': 'Jane'},
      ]));
      
  // 验证调用
  verify(database.query('users')).called(1);
  
  // 验证未调用
  verifyNever(database.delete('users'));
}
```

### 异步测试
```dart
test('should fetch users', () async {
  final repository = UserRepository(database);
  
  when(database.query('users'))
      .thenAnswer((_) => Future.value([
        {'id': 1, 'name': 'John'},
      ]));
      
  final users = await repository.getUsers();
  
  expect(users, hasLength(1));
  expect(users.first.name, equals('John'));
});
```

## 完整示例

```dart
// 被测试的类
class UserService {
  final Database database;
  final ApiClient apiClient;
  
  UserService(this.database, this.apiClient);
  
  Future<User?> getUserById(int id) async {
    try {
      final data = await database.query(
        'users',
        where: 'id = ?',
        whereArgs: [id],
      );
      
      if (data.isEmpty) {
        // 从 API 获取
        final user = await apiClient.getUser(id);
        if (user != null) {
          await database.insert('users', user.toMap());
        }
        return user;
      }
      
      return User.fromMap(data.first);
    } catch (e) {
      return null;
    }
  }
  
  Future<List<User>> searchUsers(String query) async {
    if (query.isEmpty) return [];
    
    final data = await database.query(
      'users',
      where: 'name LIKE ?',
      whereArgs: ['%$query%'],
    );
    
    return data.map((e) => User.fromMap(e)).toList();
  }
  
  Future<bool> updateUser(User user) async {
    try {
      // 先更新 API
      final success = await apiClient.updateUser(user);
      if (!success) return false;
      
      // 再更新数据库
      await database.update(
        'users',
        user.toMap(),
        where: 'id = ?',
        whereArgs: [user.id],
      );
      
      return true;
    } catch (e) {
      return false;
    }
  }
}

// 测试文件
@GenerateMocks([Database, ApiClient])
void main() {
  group('UserService', () {
    late UserService service;
    late MockDatabase database;
    late MockApiClient apiClient;
    
    setUp(() {
      database = MockDatabase();
      apiClient = MockApiClient();
      service = UserService(database, apiClient);
    });
    
    group('getUserById', () {
      test('should return user from database when exists', () async {
        // Arrange
        when(database.query(
          'users',
          where: 'id = ?',
          whereArgs: [1],
        )).thenAnswer((_) => Future.value([
          {'id': 1, 'name': 'John'},
        ]));
        
        // Act
        final user = await service.getUserById(1);
        
        // Assert
        expect(user, isNotNull);
        expect(user!.id, equals(1));
        expect(user.name, equals('John'));
        verify(database.query(
          'users',
          where: 'id = ?',
          whereArgs: [1],
        )).called(1);
        verifyNever(apiClient.getUser(any));
      });
      
      test('should fetch from API when not in database', () async {
        // Arrange
        when(database.query(
          'users',
          where: 'id = ?',
          whereArgs: [1],
        )).thenAnswer((_) => Future.value([]));
        
        when(apiClient.getUser(1))
            .thenAnswer((_) => Future.value(User(1, 'John')));
            
        // Act
        final user = await service.getUserById(1);
        
        // Assert
        expect(user, isNotNull);
        expect(user!.id, equals(1));
        expect(user.name, equals('John'));
        verify(apiClient.getUser(1)).called(1);
        verify(database.insert('users', any)).called(1);
      });
    });
  });
}
```

## 最佳实践

1. 测试覆盖关键代码
2. 合理使用 Mock
3. 保持测试简单
4. 测试边界条件
5. 持续集成测试

## 注意事项

1. 避免测试实现细节
2. 注意异步测试
3. 合理组织测试
4. 维护测试代码
5. 控制测试粒度

## 总结

单元测试是保证代码质量的重要手段。通过编写全面的单元测试,可以提高代码的可靠性和可维护性。 