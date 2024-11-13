---
title: Flutter 路由参数传递详解
description: 详细介绍 Flutter 中路由参数传递的各种方式和最佳实践。
tag:
 - Flutter
 - 导航
sidebar: true
---

# Flutter 路由参数传递详解

## 简介

在页面导航时,经常需要传递参数。Flutter 提供了多种参数传递方式,本文详细介绍这些方法。

## 基本参数传递

### 构造函数传参
```dart
// 定义页面
class DetailPage extends StatelessWidget {
  final String id;
  final String title;
  
  const DetailPage({
    Key? key,
    required this.id,
    required this.title,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(child: Text('ID: $id')),
    );
  }
}

// 导航并传参
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => DetailPage(
      id: '123',
      title: 'Product Detail',
    ),
  ),
);
```

### 命名路由参数
```dart
// 注册路由
MaterialApp(
  onGenerateRoute: (settings) {
    if (settings.name == '/detail') {
      final args = settings.arguments as Map<String, dynamic>;
      return MaterialPageRoute(
        builder: (context) => DetailPage(
          id: args['id'],
          title: args['title'],
        ),
      );
    }
    return null;
  },
);

// 导航并传参
Navigator.pushNamed(
  context,
  '/detail',
  arguments: {
    'id': '123',
    'title': 'Product Detail',
  },
);
```

## 类型安全的参数传递

### 使用泛型
```dart
class TypedPageRoute<T> extends MaterialPageRoute<T> {
  TypedPageRoute({
    required WidgetBuilder builder,
    required this.arguments,
  }) : super(builder: builder);
  
  final T arguments;
}

// 使用示例
class DetailArguments {
  final String id;
  final String title;
  
  DetailArguments({
    required this.id,
    required this.title,
  });
}

Navigator.push(
  context,
  TypedPageRoute<DetailArguments>(
    builder: (context) => DetailPage(),
    arguments: DetailArguments(
      id: '123',
      title: 'Product Detail',
    ),
  ),
);
```

## 完整示例

```dart
// 参数模型
class ProductArguments {
  final String id;
  final String title;
  final double price;
  final String imageUrl;
  
  const ProductArguments({
    required this.id,
    required this.title,
    required this.price,
    required this.imageUrl,
  });
  
  // 从 Map 创建实例
  factory ProductArguments.fromMap(Map<String, dynamic> map) {
    return ProductArguments(
      id: map['id'] as String,
      title: map['title'] as String,
      price: map['price'] as double,
      imageUrl: map['imageUrl'] as String,
    );
  }
  
  // 转换为 Map
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'price': price,
      'imageUrl': imageUrl,
    };
  }
}

// 产品详情页
class ProductDetailPage extends StatelessWidget {
  final ProductArguments args;
  
  const ProductDetailPage({
    Key? key,
    required this.args,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(args.title)),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Image.network(
            args.imageUrl,
            width: double.infinity,
            height: 200,
            fit: BoxFit.cover,
          ),
          Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  args.title,
                  style: Theme.of(context).textTheme.headline6,
                ),
                SizedBox(height: 8),
                Text(
                  'Price: \$${args.price.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.subtitle1,
                ),
                SizedBox(height: 8),
                Text('Product ID: ${args.id}'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// 路由配置
class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/product-detail':
        final args = settings.arguments as Map<String, dynamic>;
        final productArgs = ProductArguments.fromMap(args);
        return MaterialPageRoute(
          builder: (_) => ProductDetailPage(args: productArgs),
        );
      default:
        return MaterialPageRoute(
          builder: (_) => NotFoundPage(),
        );
    }
  }
}

// 使用示例
class ProductListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Products')),
      body: ListView.builder(
        itemCount: 10,
        itemBuilder: (context, index) {
          return ListTile(
            title: Text('Product $index'),
            onTap: () {
              Navigator.pushNamed(
                context,
                '/product-detail',
                arguments: {
                  'id': 'PROD_$index',
                  'title': 'Product $index',
                  'price': 9.99 + index,
                  'imageUrl': 'https://picsum.photos/200?$index',
                },
              );
            },
          );
        },
      ),
    );
  }
}
```

## 最佳实践

1. 使用类型安全的参数模型
2. 参数验证和错误处理
3. 合理组织参数结构
4. 使用工厂构造函数
5. 提供参数序列化方法

## 注意事项

1. 避免传递过多参数
2. 注意参数类型安全
3. 处理参数为空的情况
4. 避免传递敏感信息
5. 注意参数大小限制

## 总结

合理的参数传递机制可以让页面之间的数据交互更加清晰和安全。通过使用类型安全的参数模型和良好的错误处理,可以提高应用的稳定性和可维护性。 