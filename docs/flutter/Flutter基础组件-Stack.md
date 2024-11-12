---
title: Flutter Stack 组件详解
description: Stack 是 Flutter 中用于堆叠布局的基础组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter Stack 组件详解

## 简介

Stack 是 Flutter 中用于堆叠布局的组件,允许子组件堆叠在一起。它常用于实现复杂的叠加布局,如在图片上显示文字、在页面上显示浮动按钮等。

## 基本用法

```dart
Stack(
  children: <Widget>[
    Container(
      width: 300,
      height: 300,
      color: Colors.red,
    ),
    Positioned(
      left: 20,
      top: 20,
      child: Container(
        width: 100,
        height: 100,
        color: Colors.blue,
      ),
    ),
    Positioned(
      right: 20,
      bottom: 20,
      child: Container(
        width: 100,
        height: 100,
        color: Colors.green,
      ),
    ),
  ],
)
```

## 常用属性

### alignment
未定位子组件的对齐方式。

### fit
未定位子组件的适应方式。

### clipBehavior
超出部分的裁剪方式。

### textDirection
文本方向,影响alignment的参考方向。

## 定位

### Positioned
精确定位子组件。

```dart
Positioned(
  left: 20,
  top: 20,
  width: 100,
  height: 100,
  child: Container(
    color: Colors.blue,
  ),
)
```

### Positioned.fill
填充整个 Stack 空间。

```dart
Positioned.fill(
  child: Container(
    color: Colors.black.withOpacity(0.5),
  ),
)
```

### Positioned.directional
根据文本方向定位。

```dart
Positioned.directional(
  textDirection: TextDirection.ltr,
  start: 20,
  top: 20,
  child: Container(
    color: Colors.blue,
  ),
)
```

## 使用场景

1. 图片上显示文字或图标
2. 实现浮动按钮
3. 创建遮罩层
4. 实现卡片叠加效果

## 完整示例

```dart
class StackDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Stack Demo'),
      ),
      body: Center(
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // 底层卡片
            Container(
              width: 300,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.blue,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
            ),
            // 头像
            Positioned(
              top: -40,
              left: 20,
              child: Container(
                padding: EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 40,
                  backgroundImage: NetworkImage(
                    'https://picsum.photos/200',
                  ),
                ),
              ),
            ),
            // 文本内容
            Positioned(
              top: 60,
              left: 20,
              right: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'John Doe',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Software Developer',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            // 操作按钮
            Positioned(
              bottom: 20,
              right: 20,
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.favorite, color: Colors.white),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: Icon(Icons.share, color: Colors.white),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 进阶用法

### 1. 响应式布局

```dart
LayoutBuilder(
  builder: (context, constraints) {
    return Stack(
      children: [
        Container(
          width: constraints.maxWidth,
          height: constraints.maxHeight,
          color: Colors.grey[200],
        ),
        Positioned(
          left: constraints.maxWidth * 0.1,
          top: constraints.maxHeight * 0.1,
          width: constraints.maxWidth * 0.8,
          height: constraints.maxHeight * 0.8,
          child: Container(
            color: Colors.blue,
          ),
        ),
      ],
    );
  },
)
```

### 2. 手势交互

```dart
class DraggableStack extends StatefulWidget {
  @override
  _DraggableStackState createState() => _DraggableStackState();
}

class _DraggableStackState extends State<DraggableStack> {
  double _top = 0;
  double _left = 0;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          left: _left,
          top: _top,
          child: GestureDetector(
            onPanUpdate: (details) {
              setState(() {
                _left += details.delta.dx;
                _top += details.delta.dy;
              });
            },
            child: Container(
              width: 100,
              height: 100,
              color: Colors.blue,
            ),
          ),
        ),
      ],
    );
  }
}
```

## 性能优化建议

1. 避免使用过多的 Positioned 组件
2. 合理使用 clipBehavior
3. 注意子组件的重建开销
4. 使用 const 构造函数优化性能

## 注意事项

1. Stack 的大小由未定位的子组件决定
2. Positioned 组件只能用于 Stack 中
3. 注意层级关系,后面的子组件会覆盖前面的
4. 合理��理溢出情况

## 总结

Stack 是实现复杂叠加布局的重要组件,通过合理使用 Positioned 可以实现灵活的定位效果。在使用时需要注意性能优化和布局规则。 