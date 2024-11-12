---
title: Flutter Row 和 Column 组件详解
description: Row 和 Column 是 Flutter 中最基础的线性布局组件,本文详细介绍其用法和注意事项。
tag:
 - Flutter
 - 组件
sidebar: true
---

# Flutter Row 和 Column 组件详解

## 简介

Row 和 Column 是 Flutter 中用于线性布局的基础组件。Row 在水平方向排列子组件,Column 在垂直方向排列子组件。它们都继承自 Flex 组件。

## 基本用法

### Row 示例
```dart
Row(
  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
  children: <Widget>[
    Icon(Icons.star, size: 50),
    Icon(Icons.star, size: 50),
    Icon(Icons.star, size: 50),
  ],
)
```

### Column 示例
```dart
Column(
  mainAxisAlignment: MainAxisAlignment.center,
  children: <Widget>[
    Text('First Item'),
    Text('Second Item'),
    Text('Third Item'),
  ],
)
```

## 常用属性

### mainAxisAlignment
主轴对齐方式:
- start: 起始对齐
- end: 末尾对齐
- center: 居中对齐
- spaceBetween: 均匀分布
- spaceAround: 周围均匀分布
- spaceEvenly: 等距分布

### crossAxisAlignment
交叉轴对齐方式:
- start: 起始对齐
- end: 末尾对齐
- center: 居中对齐
- stretch: 拉伸填充
- baseline: 基线对齐

### mainAxisSize
主轴尺寸:
- max: 尽可能大
- min: 尽可能小

## 使用场景

1. 工具栏布局
2. 表单布局
3. 列表项布局
4. 导航栏布局

## 完整示例

```dart
class RowColumnDemo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Row & Column Demo'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 顶部工具栏
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Dashboard',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.notifications),
                      onPressed: () {},
                    ),
                    IconButton(
                      icon: Icon(Icons.settings),
                      onPressed: () {},
                    ),
                  ],
                ),
              ],
            ),
            SizedBox(height: 20),
            // 统计卡片
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          Icon(Icons.people, size: 30),
                          SizedBox(height: 8),
                          Text('Users'),
                          Text(
                            '1,234',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          Icon(Icons.shopping_cart, size: 30),
                          SizedBox(height: 8),
                          Text('Orders'),
                          Text(
                            '567',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 20),
            // 列表项
            Expanded(
              child: ListView.builder(
                itemCount: 10,
                itemBuilder: (context, index) {
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        child: Text('${index + 1}'),
                      ),
                      title: Text('Item ${index + 1}'),
                      subtitle: Text('Description for item ${index + 1}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: Icon(Icons.edit),
                            onPressed: () {},
                          ),
                          IconButton(
                            icon: Icon(Icons.delete),
                            onPressed: () {},
                          ),
                        ],
                      ),
                    ),
                  );
                },
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

### 1. 嵌套使用

```dart
Row(
  children: [
    Column(
      children: [
        Icon(Icons.star),
        Text('Rating'),
      ],
    ),
    Column(
      children: [
        Icon(Icons.timer),
        Text('Duration'),
      ],
    ),
  ],
)
```

### 2. 响应式布局

```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 600) {
      return Row(
        children: _buildChildren(),
      );
    } else {
      return Column(
        children: _buildChildren(),
      );
    }
  },
)
```

## 性能优化建议

1. 避免过深的嵌套
2. 合理使用 Expanded 和 Flexible
3. 使用 const 构造函数
4. 避免不必要的重建

## 注意事项

1. Row 中的子组件不会自动换行
2. 注意处理溢出情况
3. 合理使用 mainAxisSize
4. 注意交叉轴的对齐方式

## 总结

Row 和 Column 是 Flutter 中最基础的布局组件,掌握它们的用法对于实现各种布局至关重要。在使用时需要注意性能优化和布局规则。 