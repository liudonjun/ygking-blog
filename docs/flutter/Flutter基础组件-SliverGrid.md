---
title: Flutter SliverGrid 组件详解
description: SliverGrid 是 Flutter 中用于在 CustomScrollView 中创建网格布局的组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter SliverGrid 组件详解

## 简介

SliverGrid 是 CustomScrollView 中用于显示网格布局的组件。它可以创建固定大小或者可变大小的网格项,常用于展示图片、商品等网格布局。

## 基本用法

```dart
SliverGrid(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3, // 横轴三个子widget
    mainAxisSpacing: 10.0, // 主轴方向的间距
    crossAxisSpacing: 10.0, // 横轴方向子widget之间的间距
    childAspectRatio: 1.0, // 子widget宽高比例
  ),
  delegate: SliverChildBuilderDelegate(
    (BuildContext context, int index) {
      return Container(
        color: Colors.primaries[index % Colors.primaries.length],
        child: Center(
          child: Text('$index'),
        ),
      );
    },
    childCount: 20,
  ),
)
```

## 网格代理类型

### SliverGridDelegateWithFixedCrossAxisCount
固定列数的网格布局。

```dart
SliverGridDelegateWithFixedCrossAxisCount(
  crossAxisCount: 3,
  mainAxisSpacing: 10.0,
  crossAxisSpacing: 10.0,
  childAspectRatio: 1.0,
)
```

### SliverGridDelegateWithMaxCrossAxisExtent
固定最大宽度的网格布局。

```dart
SliverGridDelegateWithMaxCrossAxisExtent(
  maxCrossAxisExtent: 200.0,
  mainAxisSpacing: 10.0,
  crossAxisSpacing: 10.0,
  childAspectRatio: 1.0,
)
```

## 常用属性

### crossAxisCount
横轴的网格数量。

### mainAxisSpacing
主轴方向的间距。

### crossAxisSpacing
横轴方向的间距。

### childAspectRatio
子项的宽高比。

## 使用场景

1. 图片墙展示
2. 商品网格展示
3. 应用图标网格布局

## 完整示例

```dart
class SliverGridDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: <Widget>[
          SliverAppBar(
            title: Text('SliverGrid Demo'),
            floating: true,
          ),
          SliverGrid(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10.0,
              crossAxisSpacing: 10.0,
              childAspectRatio: 1.0,
            ),
            delegate: SliverChildBuilderDelegate(
              (BuildContext context, int index) {
                return Card(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.image,
                        size: 40,
                        color: Colors.primaries[index % Colors.primaries.length],
                      ),
                      SizedBox(height: 8),
                      Text('Item $index'),
                    ],
                  ),
                );
              },
              childCount: 30,
            ),
          ),
        ],
      ),
    );
  }
}
```

## 进阶用法

### 1. 瀑布流布局

```dart
SliverGrid(
  gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
    maxCrossAxisExtent: 200.0,
    mainAxisSpacing: 10.0,
    crossAxisSpacing: 10.0,
    childAspectRatio: 0.8, // 控制高度比例
  ),
  delegate: SliverChildBuilderDelegate(
    (context, index) {
      return Container(
        height: (index % 2 + 1) * 100.0, // 不同的高度
        color: Colors.primaries[index % Colors.primaries.length],
        child: Center(child: Text('Item $index')),
      );
    },
    childCount: 20,
  ),
)
```

### 2. 响应式网格

```dart
LayoutBuilder(
  builder: (context, constraints) {
    return SliverGrid(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: constraints.maxWidth > 600 ? 4 : 2, // 根据宽度调整列数
        mainAxisSpacing: 10.0,
        crossAxisSpacing: 10.0,
        childAspectRatio: 1.0,
      ),
      delegate: SliverChildBuilderDelegate(
        (context, index) => Container(
          color: Colors.primaries[index % Colors.primaries.length],
          child: Center(child: Text('Item $index')),
        ),
        childCount: 20,
      ),
    );
  },
)
```

## 性能优化建议

1. 使用 SliverChildBuilderDelegate 而不是 SliverChildListDelegate
2. 避免在网格项中进行复杂计算
3. 合理设置网格项大小,避免过大导致性能问题
4. 使用图片缓存来优化图片加载

## 注意事项

1. 注意网格项的大小计算
2. 合理设置 childAspectRatio
3. 处理好网格项的状态管理
4. 注意内存管理,避免创建过多网格项

## 总结

SliverGrid 是一个强大的网格布局组件,通过合理配置可以实现各种网格效果。在使用时需要注意性能优化和布局计算。 