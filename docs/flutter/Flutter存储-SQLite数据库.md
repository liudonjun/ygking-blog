---
title: Flutter SQLite 数据库详解
description: 详细介绍 Flutter 中使用 SQLite 数据库进行数据持久化的方法。
tag:
 - Flutter
 - 存储
sidebar: true
---

# Flutter SQLite 数据库详解

## 简介

SQLite 是一个轻量级的关系型数据库,Flutter 通过 sqflite 插件提供了 SQLite 数据库支持。

## 基本配置

### 添加依赖
```yaml
dependencies:
  sqflite: ^2.3.0
  path: ^1.8.3
```

### 初始化数据库
```dart
class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  static Database? _database;
  
  factory DatabaseHelper() => _instance;
  
  DatabaseHelper._internal();
  
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }
  
  Future<Database> _initDatabase() async {
    // 获取数据库路径
    String path = join(await getDatabasesPath(), 'my_app.db');
    
    // 打开数据库
    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }
  
  Future<void> _onCreate(Database db, int version) async {
    // 创建表
    await db.execute('''
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER
      )
    ''');
  }
  
  Future<void> _onUpgrade(
    Database db,
    int oldVersion,
    int newVersion,
  ) async {
    // 数据库升级逻辑
  }
}
```

## 基本操作

### 插入数据
```dart
Future<int> insertUser(User user) async {
  final db = await database;
  return await db.insert(
    'users',
    user.toMap(),
    conflictAlgorithm: ConflictAlgorithm.replace,
  );
}
```

### 查询数据
```dart
Future<List<User>> getUsers() async {
  final db = await database;
  final List<Map<String, dynamic>> maps = await db.query('users');
  
  return List.generate(maps.length, (i) {
    return User.fromMap(maps[i]);
  });
}

Future<User?> getUserById(int id) async {
  final db = await database;
  final List<Map<String, dynamic>> maps = await db.query(
    'users',
    where: 'id = ?',
    whereArgs: [id],
  );
  
  if (maps.isEmpty) return null;
  return User.fromMap(maps.first);
}
```

### 更新数据
```dart
Future<int> updateUser(User user) async {
  final db = await database;
  return await db.update(
    'users',
    user.toMap(),
    where: 'id = ?',
    whereArgs: [user.id],
  );
}
```

### 删除数据
```dart
Future<int> deleteUser(int id) async {
  final db = await database;
  return await db.delete(
    'users',
    where: 'id = ?',
    whereArgs: [id],
  );
}
```

## 完整示例

```dart
// 用户模型
class User {
  final int? id;
  final String name;
  final String email;
  final int age;
  
  User({
    this.id,
    required this.name,
    required this.email,
    required this.age,
  });
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'age': age,
    };
  }
  
  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'],
      name: map['name'],
      email: map['email'],
      age: map['age'],
    );
  }
}

// 数据库管理类
class DatabaseManager {
  static final DatabaseManager _instance = DatabaseManager._internal();
  final dbHelper = DatabaseHelper();
  
  factory DatabaseManager() => _instance;
  
  DatabaseManager._internal();
  
  // 添加用户
  Future<User> addUser(User user) async {
    final id = await dbHelper.insertUser(user);
    return user.copyWith(id: id);
  }
  
  // 获取所有用户
  Future<List<User>> getAllUsers() async {
    return await dbHelper.getUsers();
  }
  
  // 获取单个用户
  Future<User?> getUser(int id) async {
    return await dbHelper.getUserById(id);
  }
  
  // 更新用户
  Future<bool> updateUser(User user) async {
    final count = await dbHelper.updateUser(user);
    return count > 0;
  }
  
  // 删除用户
  Future<bool> deleteUser(int id) async {
    final count = await dbHelper.deleteUser(id);
    return count > 0;
  }
}

// 使用示例
class UserListPage extends StatefulWidget {
  @override
  _UserListPageState createState() => _UserListPageState();
}

class _UserListPageState extends State<UserListPage> {
  final dbManager = DatabaseManager();
  List<User> _users = [];
  
  @override
  void initState() {
    super.initState();
    _loadUsers();
  }
  
  Future<void> _loadUsers() async {
    final users = await dbManager.getAllUsers();
    setState(() {
      _users = users;
    });
  }
  
  Future<void> _addUser() async {
    final user = User(
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    );
    
    await dbManager.addUser(user);
    _loadUsers();
  }
  
  Future<void> _deleteUser(int id) async {
    await dbManager.deleteUser(id);
    _loadUsers();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Users')),
      body: ListView.builder(
        itemCount: _users.length,
        itemBuilder: (context, index) {
          final user = _users[index];
          return ListTile(
            title: Text(user.name),
            subtitle: Text(user.email),
            trailing: IconButton(
              icon: Icon(Icons.delete),
              onPressed: () => _deleteUser(user.id!),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addUser,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

## 事务处理

```dart
Future<void> transferMoney(
  int fromId,
  int toId,
  double amount,
) async {
  final db = await database;
  await db.transaction((txn) async {
    // 扣除转出账户金额
    await txn.rawUpdate('''
      UPDATE accounts
      SET balance = balance - ?
      WHERE id = ?
    ''', [amount, fromId]);
    
    // 增加转入账户金额
    await txn.rawUpdate('''
      UPDATE accounts
      SET balance = balance + ?
      WHERE id = ?
    ''', [amount, toId]);
  });
}
```

## 最佳实践

1. 使用单例模式管理数据库连接
2. 实现数据库版本管理
3. 使用事务保证数据一致性
4. 异步操作处理
5. 合理设计表结构

## 注意事项

1. 及时关闭数据库连接
2. 处理并发访问
3. 注意性能优化
4. 数据迁移处理
5. 错误处理

## 总结

SQLite 数据库为 Flutter 应用提供了强大的数据持久化能力。通过合理使用数据库特性,可以实现高效可靠的数据存储和管理。 