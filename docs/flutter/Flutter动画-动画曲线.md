---
title: Flutter 动画曲线详解
description: 详细介绍 Flutter 中的动画曲线(Curves)使用方法和自定义曲线实现。
tag:
 - Flutter
 - 动画
sidebar: true
---

# Flutter 动画曲线详解

## 简介

动画曲线(Curves)定义了动画在执行过程中的变化速率。合适的动画曲线可以让动画效果更加自然和流畅。

## 内置曲线

### 常用曲线
```dart
// 线性
curve: Curves.linear

// 缓入
curve: Curves.easeIn
curve: Curves.easeInQuad
curve: Curves.easeInCubic

// 缓出
curve: Curves.easeOut
curve: Curves.easeOutQuad
curve: Curves.easeOutCubic

// 缓入缓出
curve: Curves.easeInOut
curve: Curves.easeInOutQuad
curve: Curves.easeInOutCubic

// 弹性
curve: Curves.elasticIn
curve: Curves.elasticOut
curve: Curves.elasticInOut

// 弹跳
curve: Curves.bounceIn
curve: Curves.bounceOut
curve: Curves.bounceInOut
```

### 曲线示例
```dart
class CurvesDemo extends StatefulWidget {
  @override
  _CurvesDemoState createState() => _CurvesDemoState();
}

class _CurvesDemoState extends State<CurvesDemo> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Curve> curves = [
    Curves.linear,
    Curves.easeIn,
    Curves.easeOut,
    Curves.easeInOut,
    Curves.elasticIn,
    Curves.elasticOut,
    Curves.bounceIn,
    Curves.bounceOut,
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Curves Demo')),
      body: ListView.builder(
        itemCount: curves.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: EdgeInsets.all(8.0),
            child: Column(
              children: [
                Text(curves[index].toString()),
                SizedBox(height: 8),
                SlideTransition(
                  position: Tween(
                    begin: Offset(-1, 0),
                    end: Offset(1, 0),
                  ).animate(CurvedAnimation(
                    parent: _controller,
                    curve: curves[index],
                  )),
                  child: Container(
                    width: 50,
                    height: 50,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
          );
        },
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

## 自定义曲线

### 基本实现
```dart
class CustomCurve extends Curve {
  @override
  double transform(double t) {
    // t 从 0.0 到 1.0
    // 返回值也应该从 0.0 到 1.0
    return t * t; // 示例：平方曲线
  }
}
```

### 复杂曲线
```dart
class ElasticOutCurve extends Curve {
  final double period;

  const ElasticOutCurve([this.period = 0.4]);

  @override
  double transform(double t) {
    if (t == 0.0 || t == 1.0) {
      return t;
    }

    double s = period / 4.0;
    t = t - 1.0;
    return pow(2.0, -10.0 * t) * 
           sin((t - s) * (pi * 2.0) / period) + 1.0;
  }
}
```

## 组合曲线

### Interval
```dart
CurvedAnimation(
  parent: controller,
  curve: Interval(
    0.0,
    0.5,
    curve: Curves.easeOut,
  ),
)
```

### 曲线序列
```dart
class SequenceCurve extends Curve {
  final List<Curve> curves;
  final List<double> weights;

  SequenceCurve(this.curves, this.weights) {
    assert(curves.length == weights.length);
    assert(weights.reduce((a, b) => a + b) == 1.0);
  }

  @override
  double transform(double t) {
    double total = 0.0;
    for (int i = 0; i < curves.length; i++) {
      double weight = weights[i];
      if (t < total + weight) {
        double localT = (t - total) / weight;
        return curves[i].transform(localT);
      }
      total += weight;
    }
    return t;
  }
}
```

## 完整示例

```dart
class AnimationCurvesDemo extends StatefulWidget {
  @override
  _AnimationCurvesDemoState createState() => _AnimationCurvesDemoState();
}

class _AnimationCurvesDemoState extends State<AnimationCurvesDemo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation1;
  late Animation<double> _animation2;
  late Animation<double> _animation3;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 3),
      vsync: this,
    );

    // 基本曲线
    _animation1 = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    // 自定义曲线
    _animation2 = CurvedAnimation(
      parent: _controller,
      curve: CustomCurve(),
    );

    // 组合曲线
    _animation3 = CurvedAnimation(
      parent: _controller,
      curve: SequenceCurve(
        [Curves.easeOut, Curves.elasticOut],
        [0.3, 0.7],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Animation Curves')),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildAnimationDemo('Ease In Out', _animation1),
          _buildAnimationDemo('Custom Curve', _animation2),
          _buildAnimationDemo('Sequence Curve', _animation3),
        ],
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

  Widget _buildAnimationDemo(String title, Animation<double> animation) {
    return Column(
      children: [
        Text(title),
        SizedBox(height: 8),
        AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(200 * animation.value - 100, 0),
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.blue,
                  borderRadius: BorderRadius.circular(8),
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

## 最佳实践

1. 根据动画效果选择合适的曲线
2. 合理使用组合曲线
3. 避免过于复杂的自定义曲线
4. 注意性能影响
5. 保持动画的自然流畅

## 注意事项

1. 曲线的输入输出范围都是0.0到1.0
2. 避免曲线计算过于复杂
3. 注意曲线的连续性
4. 合理设置动画时长
5. 测试不同设备上的表现

## 总结

动画曲线是创建流畅自然动画的关键。通过合理使用内置曲线、自定义曲线和组合曲线,可以实现各种丰富的动画效果。理解并掌握动画曲线的使用对于开发高质量的 Flutter 动画很有帮助。 