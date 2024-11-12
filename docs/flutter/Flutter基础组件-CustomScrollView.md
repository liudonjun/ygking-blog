---
title: Flutter CustomScrollView 组件详解
description: CustomScrollView 是 Flutter 中用于创建自定义滚动效果的组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter CustomScrollView 组件详解

## 简介

CustomScrollView 是一个可以组合多个滚动组件的高级滚动组件。它允许我们创建一个统一的可滚动区域,其中可以包含不同的滚动效果。所有的子组件必须是 Sliver 家族的组件。

## 基本用法

```dart
CustomScrollView(
  slivers: <Widget>[
    // 一个 AppBar,包含一个标题
    SliverAppBar(
      pinned: true,
      expandedHeight: 200.0,
      flexibleSpace: FlexibleSpaceBar(
        title: Text('CustomScrollView Demo'),
      ),
    ),
    // 一个网格
    SliverGrid(
      gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 200.0,
        mainAxisSpacing: 10.0,
        crossAxisSpacing: 10.0,
        childAspectRatio: 4.0,
      ),
      delegate: SliverChildBuilderDelegate(
        (BuildContext context, int index) {
          return Container(
            alignment: Alignment.center,
            color: Colors.teal[100 * (index % 9)],
            child: Text('grid item $index'),
          );
        },
        childCount: 20,
      ),
    ),
    // 一个列表
    SliverFixedExtentList(
      itemExtent: 50.0,
      delegate: SliverChildBuilderDelegate(
        (BuildContext context, int index) {
          return Container(
            alignment: Alignment.center,
            color: Colors.lightBlue[100 * (index % 9)],
            child: Text('list item $index'),
          );
        },
        childCount: 20,
      ),
    ),
  ],
)
```

## 常用的 Sliver 组件

1. SliverAppBar: 可以展开和折叠的应用栏
2. SliverList: 列表
3. SliverGrid: 网格
4. SliverToBoxAdapter: 将普通 Widget 转换为 Sliver
5. SliverPadding: 为 Sliver 添加内边距
6. SliverPersistentHeader: 可以固定在顶部的头部组件

## 使用场景

1. 需要组合多种滚动效果时
2. 实现复杂的滚动界面
3. 需要自定义滚动行为时

## 注意事项

1. CustomScrollView 的子组件必须是 Sliver 家族的组件
2. 如果要使用普通 Widget,需要用 SliverToBoxAdapter 包裹
3. 注意性能优化,合理使用懒加载

## 完整示例

```dart
class CustomScrollViewDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: <Widget>[
          // 应用栏
          SliverAppBar(
            pinned: true,
            expandedHeight: 200.0,
            flexibleSpace: FlexibleSpaceBar(
              title: Text('CustomScrollView Demo'),
              background: Image.network(
                'https://picsum.photos/seed/picsum/200/300',
                fit: BoxFit.cover,
              ),
            ),
          ),
          // 网格部分
          SliverPadding(
            padding: const EdgeInsets.all(8.0),
            sliver: SliverGrid(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 10.0,
                crossAxisSpacing: 10.0,
                childAspectRatio: 4.0,
              ),
              delegate: SliverChildBuilderDelegate(
                (BuildContext context, int index) {
                  return Container(
                    alignment: Alignment.center,
                    color: Colors.teal[100 * (index % 9)],
                    child: Text('grid item $index'),
                  );
                },
                childCount: 20,
              ),
            ),
          ),
          // 列表部分
          SliverFixedExtentList(
            itemExtent: 50.0,
            delegate: SliverChildBuilderDelegate(
              (BuildContext context, int index) {
                return Container(
                  alignment: Alignment.center,
                  color: Colors.lightBlue[100 * (index % 9)],
                  child: Text('list item $index'),
                );
              },
              childCount: 20,
            ),
          ),
        ],
      ),
    );
  }
}
```

## 总结

CustomScrollView 是一个强大的滚动组件,通过组合不同的 Sliver 组件,可以实现复杂的滚动效果。在使用时需要注意性能优化和组件的正确使用方式。 