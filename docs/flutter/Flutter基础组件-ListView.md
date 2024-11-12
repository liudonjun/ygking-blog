---
title: Flutter ListView 组件详解
description: ListView 是 Flutter 中最常用的列表组件之一,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter ListView 组件详解

## 简介

ListView 是 Flutter 中最基础的列表组件,用于展示可滚动的列表内容。它支持垂直和水平方向滚动,可以构建简单的列表、无限滚动列表等。

## 基本用法

```dart
ListView(
  children: <Widget>[
    ListTile(
      leading: Icon(Icons.map),
      title: Text('Map'),
    ),
    ListTile(
      leading: Icon(Icons.photo_album),
      title: Text('Album'),
    ),
    ListTile(
      leading: Icon(Icons.phone),
      title: Text('Phone'),
    ),
  ],
)
```

## 构建方式

### ListView.builder
适用于列表项比较多的场景。

```dart
ListView.builder(
  itemCount: 100,
  itemBuilder: (context, index) {
    return ListTile(
      title: Text('Item $index'),
    );
  },
)
```

### ListView.separated
可以在列表项之间添加分割组件。

```dart
ListView.separated(
  itemCount: 100,
  separatorBuilder: (context, index) => Divider(),
  itemBuilder: (context, index) {
    return ListTile(
      title: Text('Item $index'),
    );
  },
)
```

### ListView.custom
自定义列表项构建方式。

```dart
ListView.custom(
  childrenDelegate: SliverChildBuilderDelegate(
    (context, index) {
      return ListTile(
        title: Text('Item $index'),
      );
    },
    childCount: 100,
  ),
)
```

## 常用属性

### scrollDirection
滚动方向。

### controller
滚动控制器。

### itemExtent
列表项固定高度。

### shrinkWrap
是否根据子组件的总长度来设置ListView的长度。

## 使用场景

1. 简单的列表展示
2. 聊天消息列表
3. 设置页面
4. 商品列表

## 完整示例

```dart
class ListViewDemo extends StatelessWidget {
  final List<String> items = List.generate(100, (index) => 'Item $index');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('ListView Demo'),
      ),
      body: ListView.builder(
        itemCount: items.length,
        itemBuilder: (context, index) {
          return Card(
            margin: EdgeInsets.all(8.0),
            child: ListTile(
              leading: CircleAvatar(
                child: Text('${index + 1}'),
              ),
              title: Text(items[index]),
              subtitle: Text('This is item number ${index + 1}'),
              trailing: Icon(Icons.arrow_forward_ios),
              onTap: () {
                print('Tapped ${items[index]}');
              },
            ),
          );
        },
      ),
    );
  }
}
```

## 进阶用法

### 1. 下拉刷新

```dart
RefreshIndicator(
  onRefresh: () async {
    // 刷新数据
    await Future.delayed(Duration(seconds: 2));
  },
  child: ListView.builder(
    itemCount: items.length,
    itemBuilder: (context, index) {
      return ListTile(
        title: Text('Item $index'),
      );
    },
  ),
)
```

### 2. 无限加载

```dart
class InfiniteListView extends StatefulWidget {
  @override
  _InfiniteListViewState createState() => _InfiniteListViewState();
}

class _InfiniteListViewState extends State<InfiniteListView> {
  List<String> items = List.generate(20, (i) => 'Item $i');
  ScrollController _scrollController = ScrollController();
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels ==
          _scrollController.position.maxScrollExtent) {
        _loadMore();
      }
    });
  }

  Future<void> _loadMore() async {
    if (!isLoading) {
      setState(() {
        isLoading = true;
      });
      await Future.delayed(Duration(seconds: 2));
      setState(() {
        items.addAll(List.generate(10, (i) => 'Item ${items.length + i}'));
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      itemCount: items.length + 1,
      itemBuilder: (context, index) {
        if (index == items.length) {
          return Center(
            child: isLoading ? CircularProgressIndicator() : null,
          );
        }
        return ListTile(title: Text(items[index]));
      },
    );
  }
}
```

## 性能优化建议

1. 使用 ListView.builder 而不是普通构造函数
2. 合理设置 itemExtent 提高性能
3. 避免在列表项中进行复杂计算
4. 使用 const 构造函数优化重建

## 注意事项

1. 注意内存管理,避免创建过多列表项
2. 合理使用 shrinkWrap
3. 处理好列表项的状态管理
4. 注意滚动控制器的释放

## 总结

ListView 是 Flutter 中最常用的列表组件,掌握其用法对于开发高质量的应用至关重要。在使用时需要注意性能优化和内存管理。 