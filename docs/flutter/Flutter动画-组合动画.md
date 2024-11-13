---
title: Flutter 组合动画详解
description: 详细介绍 Flutter 中如何组合多个动画实现复杂的动画效果。
tag:
 - Flutter
 - 动画
sidebar: true
---

# Flutter 组合动画详解

## 简介

组合动画是指将多个简单的动画组合在一起，实现更加复杂和丰富的动画效果。本文介绍如何在 Flutter 中实现动画组合。

## 基本组合

### 顺序动画
```dart
class SequentialAnimationDemo extends StatefulWidget {
  @override
  _SequentialAnimationDemoState createState() => _SequentialAnimationDemoState();
}

class _SequentialAnimationDemoState extends State<SequentialAnimationDemo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotateAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 3),
      vsync: this,
    );

    // 缩放动画 (0-1秒)
    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(0.0, 0.33, curve: Curves.easeOut),
    ));

    // 旋转动画 (1-2秒)
    _rotateAnimation = Tween<double>(
      begin: 0.0,
      end: 2 * pi,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(0.33, 0.66, curve: Curves.easeInOut),
    ));

    // 滑动动画 (2-3秒)
    _slideAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: Offset(1.0, 0.0),
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(0.66, 1.0, curve: Curves.easeIn),
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: _slideAnimation.value * 100,
          child: Transform.rotate(
            angle: _rotateAnimation.value,
            child: Transform.scale(
              scale: _scaleAnimation.value,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: Colors.blue,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
```

### 并行动画
```dart
class ParallelAnimationDemo extends StatefulWidget {
  @override
  _ParallelAnimationDemoState createState() => _ParallelAnimationDemoState();
}

class _ParallelAnimationDemoState extends State<ParallelAnimationDemo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _sizeAnimation;
  late Animation<Color?> _colorAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );

    // 所有动画同时进行
    _sizeAnimation = Tween<double>(
      begin: 50.0,
      end: 200.0,
    ).animate(_controller);

    _colorAnimation = ColorTween(
      begin: Colors.blue,
      end: Colors.red,
    ).animate(_controller);

    _opacityAnimation = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(_controller);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: _sizeAnimation.value,
          height: _sizeAnimation.value,
          decoration: BoxDecoration(
            color: _colorAnimation.value,
            borderRadius: BorderRadius.circular(10),
          ),
          opacity: _opacityAnimation.value,
        );
      },
    );
  }
}
```

## 复杂组合

### 交叉动画
```dart
class CrossFadeAnimationDemo extends StatefulWidget {
  @override
  _CrossFadeAnimationDemoState createState() => _CrossFadeAnimationDemoState();
}

class _CrossFadeAnimationDemoState extends State<CrossFadeAnimationDemo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeOutAnimation;
  late Animation<double> _fadeInAnimation;
  late Animation<double> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );

    _fadeOutAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(0.0, 0.5, curve: Curves.easeOut),
    ));

    _fadeInAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(0.5, 1.0, curve: Curves.easeIn),
    ));

    _slideAnimation = Tween<double>(
      begin: 0.0,
      end: 200.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        AnimatedBuilder(
          animation: _fadeOutAnimation,
          builder: (context, child) {
            return Opacity(
              opacity: _fadeOutAnimation.value,
              child: Container(
                width: 100,
                height: 100,
                color: Colors.blue,
              ),
            );
          },
        ),
        AnimatedBuilder(
          animation: _fadeInAnimation,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(_slideAnimation.value, 0),
              child: Opacity(
                opacity: _fadeInAnimation.value,
                child: Container(
                  width: 100,
                  height: 100,
                  color: Colors.red,
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
```

## 动画管理

### 动画状态管理
```dart
class AnimationStateManager {
  final List<AnimationController> controllers;
  
  AnimationStateManager(this.controllers);
  
  void startAll() {
    for (var controller in controllers) {
      controller.forward();
    }
  }
  
  void stopAll() {
    for (var controller in controllers) {
      controller.stop();
    }
  }
  
  void resetAll() {
    for (var controller in controllers) {
      controller.reset();
    }
  }
  
  void dispose() {
    for (var controller in controllers) {
      controller.dispose();
    }
  }
}
```

### 动画队列
```dart
class AnimationQueue {
  final List<AnimationController> _queue = [];
  int _currentIndex = 0;
  
  void addAnimation(AnimationController controller) {
    _queue.add(controller);
    
    controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _playNext();
      }
    });
  }
  
  void start() {
    if (_queue.isNotEmpty) {
      _queue[0].forward();
    }
  }
  
  void _playNext() {
    _currentIndex++;
    if (_currentIndex < _queue.length) {
      _queue[_currentIndex].forward();
    }
  }
  
  void dispose() {
    for (var controller in _queue) {
      controller.dispose();
    }
  }
}
```

## 最佳实践

1. 合理划分动画阶段
2. 使用适当的动画曲线
3. 注意动画性能
4. 合理管理动画状态
5. 避免过度使用动画

## 注意事项

1. 注意动画的时序控制
2. 处理好动画的状态转换
3. 合理设置动画时长
4. 避免动画冲突
5. 注意内存管理

## 总结

组合动画可以创建出更加复杂和丰富的动画效果。通过合理组织和管理多个动画，可以实现流畅自然的用户界面交互。理解并掌握动画组合的技巧对于开发高质量的 Flutter 应用很有帮助。 