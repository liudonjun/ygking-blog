---
title: Flutter GridView 组件详解
description: GridView 是 Flutter 中用于创建网格布局的基础组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter GridView 组件详解

## 简介

GridView 是 Flutter 中用于创建网格布局的基础组件,可以在水平和垂直方向上排列子组件。它支持固定数量和最大宽度两种布局方式。

## 基本用法

```dart
GridView.count(
  crossAxisCount: 3, // 横轴子元素的数量
  children: List.generate(9, (index) {
    return Container(
      color: Colors.primaries[index],
      child: Center(
        child: Text('Item $index'),
      ),
    );
  }),
)
```

## 构建方式

### GridView.count
固定列数的网格。

```dart
GridView.count(
  crossAxisCount: 2,
  mainAxisSpacing: 10.0,
  crossAxisSpacing: 10.0,
  padding: EdgeInsets.all(10.0),
  children: <Widget>[
    Container(color: Colors.red),
    Container(color: Colors.green),
    Container(color: Colors.blue),
    Container(color: Colors.yellow),
  ],
)
```

### GridView.extent
固定最大宽度的网格。

```dart
GridView.extent(
  maxCrossAxisExtent: 200.0,
  mainAxisSpacing: 10.0,
  crossAxisSpacing: 10.0,
  padding: EdgeInsets.all(10.0),
  children: <Widget>[
    Container(color: Colors.red),
    Container(color: Colors.green),
    Container(color: Colors.blue),
    Container(color: Colors.yellow),
  ],
)
```

### GridView.builder
适用于大量子项的网格。

```dart
GridView.builder(
  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 3,
    mainAxisSpacing: 10.0,
    crossAxisSpacing: 10.0,
  ),
  itemCount: 100,
  itemBuilder: (context, index) {
    return Container(
      color: Colors.primaries[index % Colors.primaries.length],
      child: Center(
        child: Text('Item $index'),
      ),
    );
  },
)
```

## 常用属性

### gridDelegate
控制子项布局的代理。

### scrollDirection
滚动方向。

### reverse
是否反向。

### controller
滚动控制器。

## 使用场景

1. 照片墙
2. 应用启动页
3. 商品展示
4. 表情包选择器

## 完整示例

```dart
class GridViewDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('GridView Demo'),
      ),
      body: GridView.builder(
        padding: EdgeInsets.all(16.0),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 16.0,
          crossAxisSpacing: 16.0,
          childAspectRatio: 0.75,
        ),
        itemCount: 20,
        itemBuilder: (context, index) {
          return Card(
            elevation: 2.0,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Container(
                    color: Colors.primaries[index % Colors.primaries.length],
                    child: Center(
                      child: Icon(
                        Icons.image,
                        size: 50,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Item $index',
                        style: TextStyle(
                          fontSize: 16.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4.0),
                      Text(
                        'Description for item $index',
                        style: TextStyle(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

## 进阶用法

### 1. 响应式网格

```dart
LayoutBuilder(
  builder: (context, constraints) {
    return GridView.builder(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: constraints.maxWidth > 600 ? 4 : 2,
        childAspectRatio: 1.0,
      ),
      itemBuilder: (context, index) => Container(
        color: Colors.primaries[index % Colors.primaries.length],
        child: Center(child: Text('Item $index')),
      ),
    );
  },
)
```

### 2. 瀑布流布局

```dart
StaggeredGridView.countBuilder(
  crossAxisCount: 4,
  itemCount: 20,
  itemBuilder: (BuildContext context, int index) => Container(
    color: Colors.green,
    child: Center(
      child: CircleAvatar(
        backgroundColor: Colors.white,
        child: Text('$index'),
      ),
    ),
  ),
  staggeredTileBuilder: (int index) =>
      StaggeredTile.count(2, index.isEven ? 2 : 1),
  mainAxisSpacing: 4.0,
  crossAxisSpacing: 4.0,
)
```

## 性能优化建议

1. 使用 GridView.builder 而不是默认构造函数
2. 避免在网格项中进行复杂计算
3. 合理设置网格项大小
4. 使用图片缓存

## 注意事项

1. 注意内存管理
2. 合理设置 childAspectRatio
3. 处理好网格项的状态管理
4. 注意滚动控制器的释放

## 总结

GridView 是一个灵活的网格布局组件,通过不同的构造函数和属性配置可以实现各种网格效果。在使用时需要注意性能优化和内存管理。 