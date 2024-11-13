---
title: Flutter 路由动画详解
description: 详细介绍 Flutter 中自定义路由转场动画的实现方法。
tag:
 - Flutter
 - 导航
 - 动画
sidebar: true
---

# Flutter 路由动画详解

## 简介

路由动画可以让页面切换更加流畅自然。Flutter 提供了丰富的 API 来自定义路由转场动画。

## 基本动画

### 内置转场动画
```dart
// 淡入淡出
Navigator.push(
  context,
  PageRouteBuilder(
    pageBuilder: (context, animation, secondaryAnimation) => SecondPage(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: animation,
        child: child,
      );
    },
  ),
);

// 滑动
Navigator.push(
  context,
  PageRouteBuilder(
    pageBuilder: (context, animation, secondaryAnimation) => SecondPage(),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(1.0, 0.0),
          end: Offset.zero,
        ).animate(animation),
        child: child,
      );
    },
  ),
);
```

### 自定义路由
```dart
class CustomPageRoute extends PageRouteBuilder {
  final Widget page;
  
  CustomPageRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            var begin = 0.0;
            var end = 1.0;
            var curve = Curves.ease;
            
            var tween = Tween(begin: begin, end: end)
                .chain(CurveTween(curve: curve));
                
            return ScaleTransition(
              scale: animation.drive(tween),
              child: child,
            );
          },
        );
}

// 使用
Navigator.push(
  context,
  CustomPageRoute(page: SecondPage()),
);
```

## 复杂动画

### 组合动画
```dart
class CompositePageRoute extends PageRouteBuilder {
  final Widget page;
  
  CompositePageRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            var fadeAnimation = Tween<double>(
              begin: 0.0,
              end: 1.0,
            ).animate(
              CurvedAnimation(
                parent: animation,
                curve: Interval(0.0, 0.5),
              ),
            );
            
            var slideAnimation = Tween<Offset>(
              begin: const Offset(0.0, 1.0),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(
                parent: animation,
                curve: Interval(0.5, 1.0),
              ),
            );
            
            return FadeTransition(
              opacity: fadeAnimation,
              child: SlideTransition(
                position: slideAnimation,
                child: child,
              ),
            );
          },
        );
}
```

## 完整示例

```dart
class RouteAnimationDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Route Animations')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () => _showFadeRoute(context),
              child: Text('Fade Route'),
            ),
            ElevatedButton(
              onPressed: () => _showSlideRoute(context),
              child: Text('Slide Route'),
            ),
            ElevatedButton(
              onPressed: () => _showScaleRoute(context),
              child: Text('Scale Route'),
            ),
            ElevatedButton(
              onPressed: () => _showCompositeRoute(context),
              child: Text('Composite Route'),
            ),
          ],
        ),
      ),
    );
  }
  
  void _showFadeRoute(BuildContext context) {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => 
            DetailPage(title: 'Fade Route'),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
      ),
    );
  }
  
  void _showSlideRoute(BuildContext context) {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            DetailPage(title: 'Slide Route'),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(1.0, 0.0),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(
                parent: animation,
                curve: Curves.easeInOut,
              ),
            ),
            child: child,
          );
        },
      ),
    );
  }
  
  void _showScaleRoute(BuildContext context) {
    Navigator.push(
      context,
      CustomPageRoute(
        page: DetailPage(title: 'Scale Route'),
      ),
    );
  }
  
  void _showCompositeRoute(BuildContext context) {
    Navigator.push(
      context,
      CompositePageRoute(
        page: DetailPage(title: 'Composite Route'),
      ),
    );
  }
}

class DetailPage extends StatelessWidget {
  final String title;
  
  const DetailPage({
    Key? key,
    required this.title,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.headline4,
            ),
            SizedBox(height: 20),
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

1. 选择合适的动画类型
2. 控制动画时长
3. 使用合适的曲线
4. 避免复杂动画
5. 注意性能影响

## 注意事项

1. 动画时长不宜过长
2. 避免多个动画同时执行
3. 注意内存使用
4. 处理动画中断
5. 测试不同设备性能

## 总结

路由动画可以显著提升应用的用户体验。通过合理使用 Flutter 提供的动画 API,可以实现流畅自然的页面转场效果。 