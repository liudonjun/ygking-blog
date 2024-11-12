---
title: Flutter PageView 组件详解
description: PageView 是 Flutter 中用于创建可滑动页面的组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter PageView 组件详解

## 简介

PageView 是 Flutter 中用于创建可滑动页面的组件,可以实现类似轮播图、引导页等效果。它支持水平和垂直方向的滑动,并且可以自定义滑动效果。

## 基本用法

```dart
PageView(
  children: <Widget>[
    Container(
      color: Colors.red,
      child: Center(child: Text('Page 1')),
    ),
    Container(
      color: Colors.green,
      child: Center(child: Text('Page 2')),
    ),
    Container(
      color: Colors.blue,
      child: Center(child: Text('Page 3')),
    ),
  ],
)
```

## 构建方式

### PageView.builder
适用于大量页面的情况。

```dart
PageView.builder(
  itemCount: 10,
  itemBuilder: (context, index) {
    return Container(
      color: Colors.primaries[index % Colors.primaries.length],
      child: Center(
        child: Text('Page $index'),
      ),
    );
  },
)
```

### PageView.custom
自定义页面构建方式。

```dart
PageView.custom(
  childrenDelegate: SliverChildBuilderDelegate(
    (context, index) {
      return Container(
        color: Colors.primaries[index % Colors.primaries.length],
        child: Center(
          child: Text('Page $index'),
        ),
      );
    },
    childCount: 10,
  ),
)
```

## 常用属性

### scrollDirection
滚动方向。

### controller
页面控制器。

### onPageChanged
页面切换回调。

### pageSnapping
是否自动对齐到页面边界。

## 使用场景

1. 引导页
2. 轮播图
3. 图片查看器
4. 卡片切换

## 完整示例

```dart
class PageViewDemo extends StatefulWidget {
  @override
  _PageViewDemoState createState() => _PageViewDemoState();
}

class _PageViewDemoState extends State<PageViewDemo> {
  final PageController _controller = PageController(initialPage: 0);
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('PageView Demo'),
      ),
      body: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            onPageChanged: (int page) {
              setState(() {
                _currentPage = page;
              });
            },
            itemCount: 5,
            itemBuilder: (context, index) {
              return Container(
                color: Colors.primaries[index % Colors.primaries.length],
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.image,
                        size: 100,
                        color: Colors.white,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Page ${index + 1}',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return Container(
                  margin: EdgeInsets.symmetric(horizontal: 4),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentPage == index
                        ? Colors.white
                        : Colors.white.withOpacity(0.4),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

## 进阶用法

### 1. 无限滚动

```dart
class InfinitePageView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      itemBuilder: (context, index) {
        final actualIndex = index % 3; // 实际只有3个页面
        return Container(
          color: Colors.primaries[actualIndex],
          child: Center(
            child: Text('Page $actualIndex'),
          ),
        );
      },
    );
  }
}
```

### 2. 视差效果

```dart
class ParallaxPageView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      itemCount: 5,
      itemBuilder: (context, index) {
        return Stack(
          children: [
            // 背景层
            ParallaxBackground(index: index),
            // 内容层
            Positioned.fill(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Page $index',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
```

## 性能优化建议

1. 使用 PageView.builder 而不是默认构造函数
2. 合理使用 keepPage 属性
3. 避免在页面中进行复杂计算
4. 及时释放资源

## 注意事项

1. 注意内存管理
2. 处理好页面的状态管理
3. 注意控制器的释放
4. 合理设置缓存页面数量

## 总结

PageView 是一个强大的页面切换组件,通过合理配置可以实现各种炫酷的切换效果。在使用时需要注意性能优化和内存管理。 