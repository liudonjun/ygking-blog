---
title: Flutter 基础动画详解
description: 详细介绍 Flutter 中的基础动画系统,包括隐式动画、显式动画和自定义动画。
tag:
 - Flutter
 - 动画
sidebar: true
---

# Flutter 基础动画详解

## 简介

Flutter 提供了强大的动画系统,包括隐式动画和显式动画。通过动画可以让应用界面更加生动,提升用户体验。

## 隐式动画

### AnimatedContainer
```dart
class AnimatedContainerDemo extends StatefulWidget {
  @override
  _AnimatedContainerDemoState createState() => _AnimatedContainerDemoState();
}

class _AnimatedContainerDemoState extends State<AnimatedContainerDemo> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _expanded = !_expanded;
        });
      },
      child: AnimatedContainer(
        duration: Duration(milliseconds: 300),
        width: _expanded ? 200.0 : 100.0,
        height: _expanded ? 200.0 : 100.0,
        color: _expanded ? Colors.blue : Colors.red,
        curve: Curves.fastOutSlowIn,
      ),
    );
  }
}
```

### 其他隐式动画组件
```dart
// 透明度动画
AnimatedOpacity(
  opacity: _visible ? 1.0 : 0.0,
  duration: Duration(milliseconds: 500),
  child: Container(
    width: 200,
    height: 200,
    color: Colors.blue,
  ),
)

// 位置动画
AnimatedPositioned(
  duration: Duration(milliseconds: 500),
  left: _left,
  top: _top,
  child: Container(
    width: 50,
    height: 50,
    color: Colors.red,
  ),
)

// 大小动画
AnimatedSize(
  duration: Duration(milliseconds: 300),
  child: Container(
    width: _size,
    height: _size,
    color: Colors.green,
  ),
)
```

## 显式动画

### 基本用法
```dart
class AnimationDemo extends StatefulWidget {
  @override
  _AnimationDemoState createState() => _AnimationDemoState();
}

class _AnimationDemoState extends State<AnimationDemo> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );
    
    _animation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
    
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.scale(
          scale: _animation.value,
          child: Container(
            width: 200,
            height: 200,
            color: Colors.blue,
          ),
        );
      },
    );
  }
}
```

### 动画控制器
```dart
// 启动动画
_controller.forward();

// 反向运行
_controller.reverse();

// 重置动画
_controller.reset();

// 重复动画
_controller.repeat();

// 停止动画
_controller.stop();
```

## 完整示例

```dart
class AnimatedCard extends StatefulWidget {
  @override
  _AnimatedCardState createState() => _AnimatedCardState();
}

class _AnimatedCardState extends State<AnimatedCard> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotateAnimation;
  late Animation<Offset> _slideAnimation;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 800),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(0.0, 0.5, curve: Curves.easeOut),
    ));
    
    _rotateAnimation = Tween<double>(
      begin: 0.0,
      end: 2 * pi,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Interval(0.5, 1.0, curve: Curves.easeOut),
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: Offset(-1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Animated Card')),
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: Transform.rotate(
                angle: _rotateAnimation.value,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: Container(
                    width: 200,
                    height: 300,
                    decoration: BoxDecoration(
                      color: Colors.blue,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black26,
                          offset: Offset(0, 4),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        'Animated Card',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (_controller.status == AnimationStatus.completed) {
            _controller.reverse();
          } else {
            _controller.forward();
          }
        },
        child: Icon(Icons.play_arrow),
      ),
    );
  }
}
```

## 自定义动画

### Tween
```dart
// 自定义 Tween
class ColorTween extends Tween<Color?> {
  ColorTween({Color? begin, Color? end}) : super(begin: begin, end: end);

  @override
  Color? lerp(double t) {
    return Color.lerp(begin, end, t);
  }
}

// 使用自定义 Tween
final colorAnimation = ColorTween(
  begin: Colors.blue,
  end: Colors.red,
).animate(_controller);
```

### AnimatedWidget
```dart
class AnimatedLogo extends AnimatedWidget {
  AnimatedLogo({Key? key, required Animation<double> animation})
      : super(key: key, listenable: animation);

  @override
  Widget build(BuildContext context) {
    final animation = listenable as Animation<double>;
    return Transform.rotate(
      angle: animation.value,
      child: FlutterLogo(size: 100),
    );
  }
}
```

## 最佳实践

1. 合理使用隐式/显式动画
2. 注意动画性能
3. 及时释放资源
4. 使用适当的动画曲线
5. 避免过度使用动画

## 注意事项

1. 避免在动画中进行复杂计算
2. 注意内存泄漏
3. 合理设置动画时长
4. 处理好动画状态
5. 注意动画的用户体验

## 总结

Flutter 的动画系统提供了丰富的功能,通过合理使用可以创建出流畅、生动的用户界面。理解并掌握动画的使用对于开发高质量的 Flutter 应用至关重要。 