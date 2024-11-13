---
title: Flutter 嵌套路由详解
description: 详细介绍 Flutter 中嵌套路由的实现方法和最佳实践。
tag:
 - Flutter
 - 导航
sidebar: true
---

# Flutter 嵌套路由详解

## 简介

嵌套路由允许在应用的某个部分维护独立的导航栈,常用于实现底部导航栏、标签页等场景。

## 基本实现

### Navigator 嵌套
```dart
class NestedNavigationDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Navigator(
        onGenerateRoute: (settings) {
          return MaterialPageRoute(
            builder: (context) => HomePage(),
          );
        },
      ),
    );
  }
}
```

### 使用 NavigatorState
```dart
class SubNavigator extends StatefulWidget {
  @override
  _SubNavigatorState createState() => _SubNavigatorState();
}

class _SubNavigatorState extends State<SubNavigator> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  
  @override
  Widget build(BuildContext context) {
    return Navigator(
      key: _navigatorKey,
      onGenerateRoute: (settings) {
        return MaterialPageRoute(
          builder: (context) => SubPage(),
        );
      },
    );
  }
  
  // 导航方法
  void navigateToDetail() {
    _navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => DetailPage(),
      ),
    );
  }
}
```

## 底部导航实现

```dart
class MainPage extends StatefulWidget {
  @override
  _MainPageState createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _currentIndex = 0;
  final List<GlobalKey<NavigatorState>> _navigatorKeys = [
    GlobalKey<NavigatorState>(),
    GlobalKey<NavigatorState>(),
    GlobalKey<NavigatorState>(),
  ];
  
  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        final isFirstRouteInCurrentTab = 
            !await _navigatorKeys[_currentIndex]
                .currentState!
                .maybePop();
                
        if (isFirstRouteInCurrentTab) {
          if (_currentIndex != 0) {
            setState(() => _currentIndex = 0);
            return false;
          }
        }
        return isFirstRouteInCurrentTab;
      },
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: [
            _buildNavigator(0),
            _buildNavigator(1),
            _buildNavigator(2),
          ],
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() => _currentIndex = index);
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
              icon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildNavigator(int index) {
    return Navigator(
      key: _navigatorKeys[index],
      onGenerateRoute: (settings) {
        return MaterialPageRoute(
          builder: (context) => _buildPage(index),
        );
      },
    );
  }
  
  Widget _buildPage(int index) {
    switch (index) {
      case 0:
        return HomePage();
      case 1:
        return BusinessPage();
      case 2:
        return ProfilePage();
      default:
        return HomePage();
    }
  }
}
```

## 完整示例

```dart
// 页面基类
abstract class TabPage extends StatelessWidget {
  final String title;
  final IconData icon;
  
  const TabPage({
    Key? key,
    required this.title,
    required this.icon,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48),
            SizedBox(height: 16),
            Text(title),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _navigateToDetail(context),
              child: Text('View Detail'),
            ),
          ],
        ),
      ),
    );
  }
  
  void _navigateToDetail(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DetailPage(title: title),
      ),
    );
  }
}

// 具体页面实现
class HomePage extends TabPage {
  HomePage() : super(title: 'Home', icon: Icons.home);
}

class BusinessPage extends TabPage {
  BusinessPage() : super(title: 'Business', icon: Icons.business);
}

class ProfilePage extends TabPage {
  ProfilePage() : super(title: 'Profile', icon: Icons.person);
}

// 详情页
class DetailPage extends StatelessWidget {
  final String title;
  
  const DetailPage({
    Key? key,
    required this.title,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('$title Detail'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Detail page for $title'),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 最佳实践

1. 合理使用 GlobalKey
2. 处理返回键行为
3. 维护导航状态
4. 避免内存泄漏
5. 注意路由生命周期

## 注意事项

1. 处理嵌套返回逻辑
2. 避免过深嵌套
3. 管理好导航状态
4. 注意性能影响
5. 处理页面切换动画

## 总结

嵌套路由是实现复杂导航结构的重要工具。通过合理使用嵌套路由,可以实现更灵活的页面导航和状态管理。 