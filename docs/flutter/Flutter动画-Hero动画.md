---
title: Flutter Hero 动画详解
description: 详细介绍 Flutter 中的 Hero 动画实现,包括基础用法和进阶技巧。
tag:
 - Flutter
 - 动画
sidebar: true
---

# Flutter Hero 动画详解

## 简介

Hero 动画(也称为共享元素转场动画)可以在页面切换时为共享元素提供流畅的动画效果。它通常用于在列表页面和详情页面之间创建视觉连续性。

## 基本用法

### 简单示例
```dart
// 列表页面
Hero(
  tag: 'imageHero',
  child: Image.network(
    'https://picsum.photos/250?image=1',
  ),
)

// 详情页面
Hero(
  tag: 'imageHero',
  child: Image.network(
    'https://picsum.photos/250?image=1',
  ),
)
```

### 页面导航
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => DetailPage(),
  ),
);
```

## 完整示例

```dart
// 列表页面
class GridPage extends StatelessWidget {
  final List<String> images = List.generate(
    10,
    (index) => 'https://picsum.photos/500?image=${index + 1}',
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Hero Animation')),
      body: GridView.builder(
        padding: EdgeInsets.all(8),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
        ),
        itemCount: images.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DetailPage(
                    imageUrl: images[index],
                    tag: 'image_$index',
                  ),
                ),
              );
            },
            child: Hero(
              tag: 'image_$index',
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  image: DecorationImage(
                    image: NetworkImage(images[index]),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// 详情页面
class DetailPage extends StatelessWidget {
  final String imageUrl;
  final String tag;

  DetailPage({
    required this.imageUrl,
    required this.tag,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GestureDetector(
        onTap: () => Navigator.pop(context),
        child: Container(
          color: Colors.black,
          child: Center(
            child: Hero(
              tag: tag,
              child: Image.network(imageUrl),
            ),
          ),
        ),
      ),
    );
  }
}
```

## 高级用法

### 自定义Hero动画
```dart
Hero(
  tag: 'customHero',
  flightShuttleBuilder: (
    BuildContext flightContext,
    Animation<double> animation,
    HeroFlightDirection flightDirection,
    BuildContext fromHeroContext,
    BuildContext toHeroContext,
  ) {
    return RotationTransition(
      turns: animation,
      child: Material(
        color: Colors.transparent,
        child: toHeroContext.widget,
      ),
    );
  },
  child: YourWidget(),
)
```

### 占位Hero
```dart
Hero(
  tag: 'placeholderHero',
  placeholderBuilder: (
    BuildContext context,
    Size heroSize,
    Widget child,
  ) {
    return Container(
      width: heroSize.width,
      height: heroSize.height,
      color: Colors.grey,
    );
  },
  child: YourWidget(),
)
```

### 组合动画
```dart
class CombinedHeroAnimation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: 'combinedHero',
      child: Material(
        color: Colors.transparent,
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: Duration(milliseconds: 500),
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: child,
            );
          },
          child: YourWidget(),
        ),
      ),
    );
  }
}
```

## 最佳实践

1. 使用唯一的标签
```dart
// 推荐
Hero(tag: 'image_${item.id}', child: ...)

// 不推荐
Hero(tag: 'image', child: ...)
```

2. 保持Hero内容一致
```dart
// 推荐
Hero(
  tag: 'avatar',
  child: CircleAvatar(
    backgroundImage: NetworkImage(url),
  ),
)

// 不推荐在不同页面使用不同的widget
```

3. 处理Hero动画中断
```dart
WillPopScope(
  onWillPop: () async {
    Navigator.pop(context);
    return false;
  },
  child: YourHeroWidget(),
)
```

## 注意事项

1. Hero标签必须在整个应用中唯一
2. 避免在Hero动画期间修改widget树
3. 注意内存管理,特别是大图片
4. 合理设置动画时长
5. 处理好Hero动画的交互

## 性能优化

1. 使用适当的图片尺寸
```dart
Image.network(
  imageUrl,
  cacheWidth: 300,
  cacheHeight: 300,
)
```

2. 优化Hero内容
```dart
Hero(
  tag: tag,
  child: OptimizedImage(), // 使用优化过的图片组件
)
```

3. 避免复杂的Hero内容
```dart
// 推荐
Hero(
  tag: tag,
  child: SimpleWidget(),
)

// 避免
Hero(
  tag: tag,
  child: ComplexWidget(), // 包含大量子widget的复杂组件
)
```

## 总结

Hero 动画是 Flutter 中一个强大的页面转场动画特性,通过合理使用可以显著提升应用的用户体验。理解并掌握 Hero 动画的使用对于开发高质量的 Flutter 应用很有帮助。 