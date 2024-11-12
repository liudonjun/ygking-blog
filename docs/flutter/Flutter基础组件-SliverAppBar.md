---
title: Flutter SliverAppBar 组件详解
description: SliverAppBar 是 Flutter 中一个可伸缩的应用栏组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter SliverAppBar 组件详解

## 简介

SliverAppBar 是 Flutter 中一个可伸缩的应用栏组件,通常用于 CustomScrollView 中。它可以在滚动时自动展开和折叠,实现类似于 Material Design 中的 Collapsing Toolbar 效果。

## 基本属性

```dart
SliverAppBar(
  // 是否固定在顶部
  pinned: true,
  // 是否随着滚动隐藏
  floating: false,
  // 是否随着滚动超出屏幕
  snap: false,
  // 展开时的高度
  expandedHeight: 200.0,
  // 折叠时的高度
  collapsedHeight: 60.0,
  // 应用栏标题
  title: Text('SliverAppBar Demo'),
  // 可伸缩区域
  flexibleSpace: FlexibleSpaceBar(
    title: Text('Collapsing Toolbar'),
    background: Image.network(
      'https://picsum.photos/seed/picsum/200/300',
      fit: BoxFit.cover,
    ),
  ),
)
```

## 重要属性说明

### pinned
- true: 应用栏会固定在顶部
- false: 应用栏会随着滚动完全消失

### floating
- true: 向下滚动时,应用栏会立即显示
- false: 需要滚动到顶部才会显示应用栏

### snap
- true: 配合 floating 使用,会在松手时自动展开或折叠
- false: 停在任何位置

### expandedHeight
展开时的最大高度

### flexibleSpace
可伸缩区域的内容,通常使用 FlexibleSpaceBar

## 使用场景

1. 需要实现可伸缩头部的列表页面
2. 详情页面的图片展示
3. 个人主页等需要特殊头部效果的页面

## 完整示例

```dart
class SliverAppBarDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: <Widget>[
          SliverAppBar(
            // 固定在顶部
            pinned: true,
            // 是否随着滚动隐藏
            floating: true,
            // 展开时的高度
            expandedHeight: 200.0,
            // 头部
            flexibleSpace: FlexibleSpaceBar(
              title: Text('SliverAppBar Demo'),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    'https://picsum.photos/seed/picsum/200/300',
                    fit: BoxFit.cover,
                  ),
                  // 添加渐变效果
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [
                          Colors.black54,
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // 左侧按钮
            leading: IconButton(
              icon: Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
            // 右侧按钮
            actions: [
              IconButton(
                icon: Icon(Icons.share),
                onPressed: () {},
              ),
              IconButton(
                icon: Icon(Icons.more_vert),
                onPressed: () {},
              ),
            ],
          ),
          // 列表内容
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => ListTile(
                title: Text('Item $index'),
                subtitle: Text('Subtitle $index'),
              ),
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

### 1. 自定义折叠效果

```dart
flexibleSpace: LayoutBuilder(
  builder: (context, constraints) {
    // 获取当前折叠程度
    double percent = (constraints.maxHeight - kToolbarHeight) /
        (expandedHeight - kToolbarHeight);
    // 根据折叠程度调整UI
    return FlexibleSpaceBar(
      title: Text(
        'Custom Collapse',
        style: TextStyle(
          fontSize: 16.0 + (percent * 4), // 字体大小随折叠变化
        ),
      ),
      background: Opacity(
        opacity: percent, // 透明度随折叠变化
        child: Image.network(
          'https://picsum.photos/seed/picsum/200/300',
          fit: BoxFit.cover,
        ),
      ),
    );
  },
),
```

### 2. 添加下拉刷新

```dart
CustomScrollView(
  physics: BouncingScrollPhysics(),
  slivers: [
    CupertinoSliverRefreshControl(
      onRefresh: () async {
        // 刷新逻辑
        await Future.delayed(Duration(seconds: 2));
      },
    ),
    SliverAppBar(
      // ... AppBar配置
    ),
    // ... 其他内容
  ],
)
```

## 注意事项

1. SliverAppBar 必须在 CustomScrollView 中使用
2. 设置 floating 和 snap 时要注意性能影响
3. expandedHeight 不要设置太大,会影响性能
4. 合理使用 pinned 属性,避免遮挡重要内容

## 总结

SliverAppBar 是一个功能强大的应用栏组件,通过合理配置可以实现丰富的视觉效果。在使用时需要注意性能优化和用户体验。 