---
title: Flutter Provider 状态管理详解
description: 详细介绍 Flutter 中使用 Provider 进行状态管理的方法和最佳实践。
tag:
 - Flutter
 - 状态管理
sidebar: true
---

# Flutter Provider 状态管理详解

## 简介

Provider 是 Flutter 官方推荐的状态管理方案,它基于 InheritedWidget 封装,提供了一种简单且可扩展的状态管理方式。

## 基本概念

### ChangeNotifier
```dart
class Counter extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners(); // 通知监听器数据已更新
  }
}
```

### Provider 类型
```dart
// 基础 Provider
Provider<T>

// 可监听变化的 Provider
ChangeNotifierProvider<T>

// 多个 Provider 组合
MultiProvider

// 消费者组件
Consumer<T>
```

## 基本用法

### 创建 Provider
```dart
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) => Counter(),
      child: MyApp(),
    ),
  );
}
```

### 访问数据
```dart
// 方式1: Consumer
Consumer<Counter>(
  builder: (context, counter, child) {
    return Text('Count: ${counter.count}');
  },
);

// 方式2: Provider.of
final counter = Provider.of<Counter>(context);
Text('Count: ${counter.count}');

// 方式3: context.read/watch
Text('Count: ${context.watch<Counter>().count}');
```

## 完整示例

```dart
// 数据模型
class TodoModel extends ChangeNotifier {
  final List<Todo> _todos = [];
  
  List<Todo> get todos => _todos;
  
  void addTodo(Todo todo) {
    _todos.add(todo);
    notifyListeners();
  }
  
  void toggleTodo(int index) {
    _todos[index].completed = !_todos[index].completed;
    notifyListeners();
  }
  
  void removeTodo(int index) {
    _todos.removeAt(index);
    notifyListeners();
  }
}

// 页面组件
class TodoListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Todo List')),
      body: Consumer<TodoModel>(
        builder: (context, todoModel, child) {
          return ListView.builder(
            itemCount: todoModel.todos.length,
            itemBuilder: (context, index) {
              final todo = todoModel.todos[index];
              return ListTile(
                leading: Checkbox(
                  value: todo.completed,
                  onChanged: (_) => todoModel.toggleTodo(index),
                ),
                title: Text(todo.title),
                trailing: IconButton(
                  icon: Icon(Icons.delete),
                  onPressed: () => todoModel.removeTodo(index),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // 添加新任务
          context.read<TodoModel>().addTodo(
            Todo(title: 'New Task ${DateTime.now()}'),
          );
        },
        child: Icon(Icons.add),
      ),
    );
  }
}

// 主应用
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => TodoModel()),
        ChangeNotifierProvider(create: (_) => ThemeModel()),
      ],
      child: Consumer<ThemeModel>(
        builder: (context, themeModel, child) {
          return MaterialApp(
            theme: themeModel.currentTheme,
            home: TodoListPage(),
          );
        },
      ),
    );
  }
}
```

## 高级用法

### 选择性重建
```dart
// 使用 Selector 只在特定值变化时重建
Selector<TodoModel, int>(
  selector: (context, todoModel) => todoModel.todos.length,
  builder: (context, todoCount, child) {
    return Text('Todo count: $todoCount');
  },
);
```

### Provider 组合
```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => UserModel()),
    ProxyProvider<UserModel, CartModel>(
      update: (context, userModel, previous) =>
          CartModel(userModel.userId),
    ),
    ChangeNotifierProxyProvider<UserModel, SettingsModel>(
      create: (_) => SettingsModel(),
      update: (context, userModel, settings) =>
          settings!..updateUser(userModel),
    ),
  ],
  child: MyApp(),
)
```

## 最佳实践

1. 合理划分状态模型
2. 避免频繁通知
3. 使用 Consumer 而不是整体重建
4. 及时释放资源
5. 合理使用 ProxyProvider

## 注意事项

1. 避免在 build 方法中调用 notifyListeners
2. 注意状态更新的粒度
3. 合理使用 context.read 和 context.watch
4. 处理好异步操作
5. 注意内存泄漏

## 总结

Provider 提供了一种简单且强大的状态管理方案,通过合理使用可以有效管理应用状态。理解并掌握 Provider 的使用对于开发高质量的 Flutter 应用至关重要。 