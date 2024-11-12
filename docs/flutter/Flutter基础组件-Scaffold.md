---
title: Flutter Scaffold 组件详解
description: Scaffold 是 Flutter 中用于实现基础页面布局的组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter Scaffold 组件详解

## 简介

Scaffold 是 Flutter 中用于实现 Material Design 布局结构的基础组件。它提供了诸如抽屉、SnackBar、底部导航栏等常用的应用程序功能。

## 基本用法

```dart
Scaffold(
  appBar: AppBar(
    title: Text('Scaffold Demo'),
  ),
  body: Center(
    child: Text('Hello Flutter'),
  ),
  floatingActionButton: FloatingActionButton(
    onPressed: () {},
    child: Icon(Icons.add),
  ),
)
```

## 常用属性

### appBar
顶部应用栏。

### body
页面主体内容。

### bottomNavigationBar
底部导航栏。

### drawer
左侧抽屉菜单。

### endDrawer
右侧抽屉菜单。

### floatingActionButton
浮动操作按钮。

### floatingActionButtonLocation
浮动按钮位置。

### bottomSheet
底部持久化展示的工作表。

## 使用场景

1. 创建基础页面布局
2. 实现导航抽屉
3. 显示底部导航栏
4. 添加浮动按钮

## 完整示例

```dart
class ScaffoldDemo extends StatefulWidget {
  @override
  _ScaffoldDemoState createState() => _ScaffoldDemoState();
}

class _ScaffoldDemoState extends State<ScaffoldDemo> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // 应用栏
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(Icons.menu),
          onPressed: () {},
        ),
        title: Text('Scaffold Demo'),
        actions: [
          IconButton(
            icon: Icon(Icons.search),
            onPressed: () {},
          ),
          IconButton(
            icon: Icon(Icons.more_vert),
            onPressed: () {},
          ),
        ],
      ),
      
      // 抽屉菜单
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                color: Colors.blue,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundImage: NetworkImage('https://picsum.photos/200'),
                  ),
                  SizedBox(height: 16),
                  Text(
                    'John Doe',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                    ),
                  ),
                  Text(
                    'john.doe@example.com',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: Icon(Icons.home),
              title: Text('Home'),
              onTap: () {},
            ),
            ListTile(
              leading: Icon(Icons.settings),
              title: Text('Settings'),
              onTap: () {},
            ),
            ListTile(
              leading: Icon(Icons.help),
              title: Text('Help'),
              onTap: () {},
            ),
          ],
        ),
      ),
      
      // 主体内容
      body: Center(
        child: _buildBody(_selectedIndex),
      ),
      
      // 底部导航栏
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.business),
            label: 'Business',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.school),
            label: 'School',
          ),
        ],
      ),
      
      // 浮动按钮
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Add button pressed'),
              action: SnackBarAction(
                label: 'UNDO',
                onPressed: () {},
              ),
            ),
          );
        },
        child: Icon(Icons.add),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  Widget _buildBody(int index) {
    switch (index) {
      case 0:
        return Text('Home Page');
      case 1:
        return Text('Business Page');
      case 2:
        return Text('School Page');
      default:
        return Text('Unknown Page');
    }
  }
}
```

## 进阶用法

### 1. 自定义 AppBar

```dart
AppBar(
  flexibleSpace: Container(
    decoration: BoxDecoration(
      gradient: LinearGradient(
        colors: [Colors.purple, Colors.blue],
      ),
    ),
  ),
  title: Text('Custom AppBar'),
  bottom: TabBar(
    tabs: [
      Tab(icon: Icon(Icons.directions_car)),
      Tab(icon: Icon(Icons.directions_transit)),
      Tab(icon: Icon(Icons.directions_bike)),
    ],
  ),
)
```

### 2. 持久化底部工作表

```dart
Scaffold(
  bottomSheet: Container(
    padding: EdgeInsets.all(16),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        IconButton(
          icon: Icon(Icons.skip_previous),
          onPressed: () {},
        ),
        IconButton(
          icon: Icon(Icons.play_arrow),
          onPressed: () {},
        ),
        IconButton(
          icon: Icon(Icons.skip_next),
          onPressed: () {},
        ),
      ],
    ),
  ),
)
```

## 性能优化建议

1. 避免在 build 方法中创建复杂的 Widget
2. 合理使用 const 构造函数
3. 注意状态管理
4. 避免不必要的重建

## 注意事项

1. Scaffold 通常作为应用的根组件
2. 注意处理抽屉手势冲突
3. 合理使用 ScaffoldMessenger
4. 注意浮动按钮的位置

## 总结

Scaffold 是 Flutter 应用程序中最基础的布局组件之一,它提供了丰富的功能来实现 Material Design 风格的应用界面。在使用时需要注意性能优化和用户体验。 