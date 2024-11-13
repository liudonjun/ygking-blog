---
title: Flutter 自定义动画详解
description: 详细介绍 Flutter 中自定义动画的实现方法,包括自定义 Tween、动画控制器和动画组件。
tag:
 - Flutter
 - 动画
sidebar: true
---

# Flutter 自定义动画详解

## 简介

Flutter 提供了丰富的动画系统,除了使用内置的动画组件外,我们还可以通过自定义 Tween、动画控制器和动画组件来实现更加复杂的动画效果。

## 自定义 Tween

### 基本实现
```dart
class ColorTween extends Tween<Color> {
  ColorTween({required Color begin, required Color end})
      : super(begin: begin, end: end);

  @override
  Color lerp(double t) {
    return Color.lerp(begin, end, t)!;
  }
}

// 使用示例
final colorAnimation = ColorTween(
  begin: Colors.blue,
  end: Colors.red,
).animate(_controller);
```

### 复杂 Tween
```dart
class BoxDecorationTween extends Tween<BoxDecoration> {
  final ColorTween? colorTween;
  final BorderRadiusTween? borderRadiusTween;
  final BoxShadowTween? shadowTween;

  BoxDecorationTween({
    BoxDecoration? begin,
    BoxDecoration? end,
  }) : colorTween = begin?.color != null || end?.color != null
            ? ColorTween(
                begin: begin?.color ?? Colors.transparent,
                end: end?.color ?? Colors.transparent,
              )
            : null,
       borderRadiusTween = begin?.borderRadius != null || 
                          end?.borderRadius != null
            ? BorderRadiusTween(
                begin: begin?.borderRadius as BorderRadius?,
                end: end?.borderRadius as BorderRadius?,
              )
            : null,
       shadowTween = begin?.boxShadow?.first != null || 
                    end?.boxShadow?.first != null
            ? BoxShadowTween(
                begin: begin?.boxShadow?.first,
                end: end?.boxShadow?.first,
              )
            : null,
       super(begin: begin, end: end);

  @override
  BoxDecoration lerp(double t) {
    return BoxDecoration(
      color: colorTween?.lerp(t),
      borderRadius: borderRadiusTween?.lerp(t),
      boxShadow: shadowTween?.lerp(t) != null 
          ? [shadowTween!.lerp(t)!] 
          : null,
    );
  }
}
```

## 自定义动画控制器

### 基本实现
```dart
class CustomAnimationController extends AnimationController {
  CustomAnimationController({
    required TickerProvider vsync,
    Duration? duration,
    Duration? reverseDuration,
  }) : super(
          vsync: vsync,
          duration: duration,
          reverseDuration: reverseDuration,
        );

  void playWithDelay(Duration delay) async {
    await Future.delayed(delay);
    forward();
  }

  void repeatWithInterval(Duration interval) async {
    while (true) {
      await forward();
      await Future.delayed(interval);
      await reverse();
      await Future.delayed(interval);
    }
  }
}
```

### 使用示例
```dart
class CustomAnimationDemo extends StatefulWidget {
  @override
  _CustomAnimationDemoState createState() => _CustomAnimationDemoState();
}

class _CustomAnimationDemoState extends State<CustomAnimationDemo>
    with SingleTickerProviderStateMixin {
  late CustomAnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = CustomAnimationController(
      vsync: this,
      duration: Duration(seconds: 1),
    );
    _controller.playWithDelay(Duration(seconds: 2));
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
        return Transform.scale(
          scale: _controller.value,
          child: child,
        );
      },
      child: Container(
        width: 100,
        height: 100,
        color: Colors.blue,
      ),
    );
  }
}
```

## 自定义动画组件

### 基本实现
```dart
class CustomAnimatedWidget extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;

  CustomAnimatedWidget({
    required this.child,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
  });

  @override
  _CustomAnimatedWidgetState createState() => _CustomAnimatedWidgetState();
}

class _CustomAnimatedWidgetState extends State<CustomAnimatedWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    );
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
          child: Opacity(
            opacity: _animation.value,
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}
```

## 完整示例

```dart
class WaveAnimation extends StatefulWidget {
  @override
  _WaveAnimationState createState() => _WaveAnimationState();
}

class _WaveAnimationState extends State<WaveAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );

    _animations = List.generate(
      5,
      (index) => Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(
        CurvedAnimation(
          parent: _controller,
          curve: Interval(
            index * 0.2,
            (index + 1) * 0.2,
            curve: Curves.easeOutCirc,
          ),
        ),
      ),
    );

    _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Stack(
            alignment: Alignment.center,
            children: List.generate(5, (index) {
              return Transform.scale(
                scale: 1 + _animations[index].value,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.blue.withOpacity(
                      (1 - _animations[index].value) * 0.5,
                    ),
                  ),
                ),
              );
            }),
          );
        },
      ),
    );
  }
}
```

## 最佳实践

1. 合理封装动画逻辑
2. 使用适当的动画曲线
3. 注意性能优化
4. 处理好动画状态
5. 及时释放资源

## 注意事项

1. 避免复杂的动画计算
2. 注意内存管理
3. 合理设置动画时长
4. 处理好动画生命周期
5. 避免过度使用自定义动画

## 总结

自定义动画为我们提供了更大的灵活性,通过合理使用可以实现更加复杂和独特的动画效果。理解并掌握自定义动画的开发对于创建高质量的 Flutter 应用很有帮助。 