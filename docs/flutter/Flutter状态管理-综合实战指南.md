---
description: 本文通过一个完整的电商应用开发故事，深入浅出地讲解Flutter各种状态管理方案的实战应用，包括Provider、BLOC、GetX、Riverpod等，帮助开发者选择合适的状态管理方案。
tag:
  - Flutter
  - 状态管理
  - Provider
  - BLOC
  - GetX
  - Riverpod
  - 实战指南
sticky: 1
sidebar: true
---

# Flutter 状态管理-综合实战指南

## 故事开始：小丽的电商创业梦

小丽是一位充满激情的 Flutter 开发者，她梦想开发一个属于自己的电商应用。这个应用需要管理商品列表、购物车、用户认证、订单处理等复杂状态。在开始开发之前，小丽面临一个重要选择：使用哪种状态管理方案？

"Flutter 有这么多状态管理方案，我该如何选择？"小丽陷入了沉思。于是她决定通过实际开发，体验不同的状态管理方案，找到最适合自己项目的解决方案。

## 第一章：Provider 入门 - 简单的开始

### 1.1 为什么选择 Provider？

小丽决定从 Provider 开始，因为它是 Flutter 官方推荐的状态管理方案，学习曲线平缓，适合中小型项目。

"就像开一家小店，我需要先学会基本的记账方法。"小丽比喻道。

### 1.2 商品列表管理

小丽首先实现商品列表功能：

```dart
// 商品模型
class Product {
  final String id;
  final String name;
  final double price;
  final String imageUrl;
  final String description;
  final bool isFavorite;

  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.imageUrl,
    required this.description,
    this.isFavorite = false,
  });

  Product copyWith({
    String? id,
    String? name,
    double? price,
    String? imageUrl,
    String? description,
    bool? isFavorite,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      description: description ?? this.description,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }
}

// 商品服务
class ProductService {
  final List<Product> _products = [
    Product(
      id: '1',
      name: 'iPhone 15 Pro',
      price: 8999.0,
      imageUrl: 'https://example.com/iphone15.jpg',
      description: '最新款iPhone，搭载A17 Pro芯片',
    ),
    Product(
      id: '2',
      name: 'MacBook Pro',
      price: 14999.0,
      imageUrl: 'https://example.com/macbook.jpg',
      description: '专业级笔记本电脑，M3芯片加持',
    ),
    // 更多商品...
  ];

  List<Product> getProducts() => _products;

  List<Product> getFavoriteProducts() =>
      _products.where((product) => product.isFavorite).toList();

  Product? getProductById(String id) =>
      _products.firstWhere((product) => product.id == id);

  void toggleFavorite(String productId) {
    final index = _products.indexWhere((product) => product.id == productId);
    if (index != -1) {
      _products[index] = _products[index].copyWith(
        isFavorite: !_products[index].isFavorite,
      );
    }
  }
}

// 商品状态管理
class ProductProvider extends ChangeNotifier {
  final ProductService _productService = ProductService();
  List<Product> _products = [];
  List<Product> _favoriteProducts = [];
  bool _isLoading = false;
  String? _error;

  List<Product> get products => _products;
  List<Product> get favoriteProducts => _favoriteProducts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadProducts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // 模拟网络请求
      await Future.delayed(Duration(seconds: 1));

      _products = _productService.getProducts();
      _favoriteProducts = _productService.getFavoriteProducts();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleFavorite(String productId) async {
    try {
      _productService.toggleFavorite(productId);

      // 更新本地状态
      final index = _products.indexWhere((product) => product.id == productId);
      if (index != -1) {
        _products[index] = _products[index].copyWith(
          isFavorite: !_products[index].isFavorite,
        );
      }

      _favoriteProducts = _productService.getFavoriteProducts();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Product? getProductById(String id) {
    try {
      return _productService.getProductById(id);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
```

### 1.3 在 UI 中使用 Provider

```dart
class ProductListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => ProductProvider()..loadProducts(),
      child: Scaffold(
        appBar: AppBar(
          title: Text('商品列表'),
          actions: [
            Consumer<ProductProvider>(
              builder: (context, provider, child) {
                return IconButton(
                  icon: Icon(Icons.favorite),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => FavoriteProductsPage(),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
        body: Consumer<ProductProvider>(
          builder: (context, provider, child) {
            if (provider.isLoading) {
              return Center(child: CircularProgressIndicator());
            }

            if (provider.error != null) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error, size: 64, color: Colors.red),
                    SizedBox(height: 16),
                    Text('加载失败：${provider.error}'),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => provider.loadProducts(),
                      child: Text('重试'),
                    ),
                  ],
                ),
              );
            }

            return GridView.builder(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.8,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              padding: EdgeInsets.all(16),
              itemCount: provider.products.length,
              itemBuilder: (context, index) {
                final product = provider.products[index];
                return ProductCard(product: product);
              },
            );
          },
        ),
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  final Product product;

  const ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Image.network(
              product.imageUrl,
              fit: BoxFit.cover,
              width: double.infinity,
            ),
          ),
          Padding(
            padding: EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4),
                Text(
                  '¥${product.price.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProductDetailPage(product: product),
                            ),
                          );
                        },
                        child: Text('查看详情'),
                      ),
                    ),
                    Consumer<ProductProvider>(
                      builder: (context, provider, child) {
                        return IconButton(
                          icon: Icon(
                            product.isFavorite
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: product.isFavorite
                                ? Colors.red
                                : Colors.grey,
                          ),
                          onPressed: () {
                            provider.toggleFavorite(product.id);
                          },
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

## 第二章：购物车功能 - Provider 进阶

### 2.1 购物车状态管理

小丽发现购物车功能比商品列表更复杂，需要处理数量变化、价格计算等：

```dart
// 购物车项目
class CartItem {
  final Product product;
  int quantity;

  CartItem({
    required this.product,
    this.quantity = 1,
  });

  CartItem copyWith({
    Product? product,
    int? quantity,
  }) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }

  double get totalPrice => product.price * quantity;
}

// 购物车状态管理
class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalPrice => _items.fold(0, (sum, item) => sum + item.totalPrice);

  bool get isEmpty => _items.isEmpty;

  bool get isNotEmpty => _items.isNotEmpty;

  void addItem(Product product) {
    final existingIndex = _items.indexWhere(
      (item) => item.product.id == product.id,
    );

    if (existingIndex != -1) {
      _items[existingIndex] = _items[existingIndex].copyWith(
        quantity: _items[existingIndex].quantity + 1,
      );
    } else {
      _items.add(CartItem(product: product));
    }

    notifyListeners();
  }

  void removeItem(String productId) {
    _items.removeWhere((item) => item.product.id == productId);
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    final index = _items.indexWhere(
      (item) => item.product.id == productId,
    );

    if (index != -1) {
      _items[index] = _items[index].copyWith(quantity: quantity);
      notifyListeners();
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  CartItem? getItemById(String productId) {
    try {
      return _items.firstWhere((item) => item.product.id == productId);
    } catch (e) {
      return null;
    }
  }
}
```

### 2.2 多 Provider 协同工作

小丽发现需要同时使用多个 Provider：

```dart
class ShoppingCartPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => CartProvider()),
        ChangeNotifierProvider(create: (context) => ProductProvider()),
      ],
      child: Scaffold(
        appBar: AppBar(
          title: Text('购物车'),
          actions: [
            Consumer<CartProvider>(
              builder: (context, cartProvider, child) {
                return Badge(
                  badgeContent: cartProvider.itemCount.toString(),
                  child: IconButton(
                    icon: Icon(Icons.shopping_cart),
                    onPressed: () {
                      // 购物车页面本身不需要处理
                    },
                  ),
                );
              },
            ),
          ],
        ),
        body: Consumer<CartProvider>(
          builder: (context, cartProvider, child) {
            if (cartProvider.isEmpty) {
              return EmptyCartWidget();
            }

            return Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: cartProvider.items.length,
                    itemBuilder: (context, index) {
                      final cartItem = cartProvider.items[index];
                      return CartItemCard(
                        cartItem: cartItem,
                        onQuantityChanged: (quantity) {
                          cartProvider.updateQuantity(
                            cartItem.product.id,
                            quantity,
                          );
                        },
                        onRemove: () {
                          cartProvider.removeItem(cartItem.product.id);
                        },
                      );
                    },
                  ),
                ),
                CartSummary(cartProvider: cartProvider),
              ],
            );
          },
        ),
      ),
    );
  }
}

class CartItemCard extends StatelessWidget {
  final CartItem cartItem;
  final Function(int) onQuantityChanged;
  final VoidCallback onRemove;

  const CartItemCard({
    required this.cartItem,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                image: DecorationImage(
                  image: NetworkImage(cartItem.product.imageUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    cartItem.product.name,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 8),
                  Text(
                    '¥${cartItem.product.price.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Text('数量：'),
                      SizedBox(width: 8),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.remove, size: 20),
                              onPressed: cartItem.quantity > 1
                                  ? () => onQuantityChanged(cartItem.quantity - 1)
                                  : null,
                              padding: EdgeInsets.zero,
                              constraints: BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 24,
                              color: Colors.grey,
                            ),
                            IconButton(
                              icon: Icon(Icons.add, size: 20),
                              onPressed: () => onQuantityChanged(cartItem.quantity + 1),
                              padding: EdgeInsets.zero,
                              constraints: BoxConstraints(
                                minWidth: 32,
                                minHeight: 32,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Spacer(),
                      Text(
                        '¥${cartItem.totalPrice.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: Icon(Icons.delete, color: Colors.red),
              onPressed: onRemove,
            ),
          ],
        ),
      ),
    );
  }
}

class CartSummary extends StatelessWidget {
  final CartProvider cartProvider;

  const CartSummary({required this.cartProvider});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '商品总数：',
                style: TextStyle(fontSize: 16),
              ),
              Text(
                '${cartProvider.itemCount}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '总价：',
                style: TextStyle(fontSize: 18),
              ),
              Text(
                '¥${cartProvider.totalPrice.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: cartProvider.isNotEmpty
                  ? () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CheckoutPage(),
                        ),
                      );
                    }
                  : null,
              child: Text('去结算'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

## 第三章：用户认证 - BLOC 登场

### 3.1 为什么需要 BLOC？

随着应用功能增多，小丽发现 Provider 在处理复杂业务逻辑时显得力不从心。她决定尝试 BLOC 模式。

"我的电商应用需要处理登录、注册、密码重置等复杂流程，BLOC 的清晰架构可能更适合。"小丽分析道。

### 3.2 认证 BLOC 实现

```dart
// 认证事件
abstract class AuthEvent {}

class LoginRequestedEvent extends AuthEvent {
  final String email;
  final String password;

  LoginRequestedEvent(this.email, this.password);
}

class RegisterRequestedEvent extends AuthEvent {
  final String name;
  final String email;
  final String password;

  RegisterRequestedEvent(this.name, this.email, this.password);
}

class LogoutRequestedEvent extends AuthEvent {}

class PasswordResetRequestedEvent extends AuthEvent {
  final String email;

  PasswordResetRequestedEvent(this.email);
}

class GoogleLoginRequestedEvent extends AuthEvent {}

// 认证状态
abstract class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final User user;

  AuthAuthenticated(this.user);
}

class AuthUnauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  AuthError(this.message);
}

// 用户模型
class User {
  final String id;
  final String name;
  final String email;
  final String avatar;
  final DateTime createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.avatar,
    required this.createdAt,
  });
}

// 认证BLOC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc(this._authRepository) : super(AuthInitial()) {
    on<LoginRequestedEvent>(_onLoginRequested);
    on<RegisterRequestedEvent>(_onRegisterRequested);
    on<LogoutRequestedEvent>(_onLogoutRequested);
    on<PasswordResetRequestedEvent>(_onPasswordResetRequested);
    on<GoogleLoginRequestedEvent>(_onGoogleLoginRequested);
  }

  Future<void> _onLoginRequested(
    LoginRequestedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final user = await _authRepository.signIn(
        email: event.email,
        password: event.password,
      );

      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onRegisterRequested(
    RegisterRequestedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final user = await _authRepository.signUp(
        name: event.name,
        email: event.email,
        password: event.password,
      );

      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequestedEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      await _authRepository.signOut();
      emit(AuthUnauthenticated());
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onPasswordResetRequested(
    PasswordResetRequestedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      await _authRepository.resetPassword(email: event.email);
      emit(AuthUnauthenticated());
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onGoogleLoginRequested(
    GoogleLoginRequestedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final user = await _authRepository.signInWithGoogle();
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }
}

// 认证仓库
abstract class AuthRepository {
  Future<User> signIn({required String email, required String password});
  Future<User> signUp({required String name, required String email, required String password});
  Future<void> signOut();
  Future<void> resetPassword({required String email});
  Future<User> signInWithGoogle();
}

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;
  final StorageService _storageService;

  AuthRepositoryImpl(this._apiClient, this._storageService);

  @override
  Future<User> signIn({required String email, required String password}) async {
    try {
      final response = await _apiClient.post('/auth/login', {
        'email': email,
        'password': password,
      });

      final user = User.fromJson(response['user']);
      final token = response['token'];

      await _storageService.saveToken(token);
      await _storageService.saveUser(user);

      return user;
    } catch (e) {
      throw Exception('登录失败：${e.toString()}');
    }
  }

  @override
  Future<User> signUp({required String name, required String email, required String password}) async {
    try {
      final response = await _apiClient.post('/auth/register', {
        'name': name,
        'email': email,
        'password': password,
      });

      final user = User.fromJson(response['user']);
      final token = response['token'];

      await _storageService.saveToken(token);
      await _storageService.saveUser(user);

      return user;
    } catch (e) {
      throw Exception('注册失败：${e.toString()}');
    }
  }

  @override
  Future<void> signOut() async {
    await _storageService.clearToken();
    await _storageService.clearUser();
  }

  @override
  Future<void> resetPassword({required String email}) async {
    await _apiClient.post('/auth/reset-password', {'email': email});
  }

  @override
  Future<User> signInWithGoogle() async {
    try {
      // 这里应该集成Google Sign-In SDK
      // 为了演示，我们模拟Google登录
      await Future.delayed(Duration(seconds: 2));

      final user = User(
        id: 'google_user_123',
        name: 'Google User',
        email: 'user@gmail.com',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: DateTime.now(),
      );

      final token = 'mock_google_token';
      await _storageService.saveToken(token);
      await _storageService.saveUser(user);

      return user;
    } catch (e) {
      throw Exception('Google登录失败：${e.toString()}');
    }
  }
}
```

### 3.3 认证 UI 实现

```dart
class LoginPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => AuthBloc(
        AuthRepositoryImpl(
          ApiClient(),
          StorageService(),
        ),
      ),
      child: Scaffold(
        appBar: AppBar(title: Text('登录')),
        body: BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            if (state is AuthAuthenticated) {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => HomePage()),
                (route) => false,
              );
            } else if (state is AuthError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          child: BlocBuilder<AuthBloc, AuthState>(
            builder: (context, state) {
              if (state is AuthLoading) {
                return Center(child: CircularProgressIndicator());
              }

              return Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '欢迎回来',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 32),
                    LoginForm(),
                    SizedBox(height: 16),
                    GoogleLoginButton(),
                    SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('还没有账号？'),
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => RegisterPage(),
                              ),
                            );
                          },
                          child: Text('立即注册'),
                        ),
                      ],
                    ),
                    SizedBox(height: 16),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ForgotPasswordPage(),
                          ),
                        );
                      },
                      child: Text('忘记密码？'),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class LoginForm extends StatefulWidget {
  @override
  _LoginFormState createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: '邮箱',
              prefixIcon: Icon(Icons.email),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '请输入邮箱';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return '请输入有效的邮箱地址';
              }
              return null;
            },
          ),
          SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            decoration: InputDecoration(
              labelText: '密码',
              prefixIcon: Icon(Icons.lock),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility : Icons.visibility_off,
                ),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              ),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '请输入密码';
              }
              if (value.length < 6) {
                return '密码至少6位';
              }
              return null;
            },
          ),
          SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  context.read<AuthBloc>().add(
                    LoginRequestedEvent(
                      _emailController.text,
                      _passwordController.text,
                    ),
                  );
                }
              },
              child: Text('登录'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class GoogleLoginButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () {
          context.read<AuthBloc>().add(GoogleLoginRequestedEvent());
        },
        icon: Icon(Icons.g_mobiledata),
        label: Text('使用Google登录'),
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
    );
  }
}
```

## 第四章：GetX 体验 - 简洁的力量

### 4.1 为什么尝试 GetX？

小丽听说 GetX 是一个非常简洁的状态管理方案，决定尝试一下：

"GetX 承诺用更少的代码实现更多的功能，这对提高开发效率很有吸引力。"小丽期待道。

### 4.2 订单管理 - GetX 实现

```dart
// 订单模型
class Order {
  final String id;
  final List<CartItem> items;
  final double totalPrice;
  final String status;
  final DateTime createdAt;
  final String? shippingAddress;
  final String? paymentMethod;

  Order({
    required this.id,
    required this.items,
    required this.totalPrice,
    required this.status,
    required this.createdAt,
    this.shippingAddress,
    this.paymentMethod,
  });

  Order copyWith({
    String? id,
    List<CartItem>? items,
    double? totalPrice,
    String? status,
    DateTime? createdAt,
    String? shippingAddress,
    String? paymentMethod,
  }) {
    return Order(
      id: id ?? this.id,
      items: items ?? this.items,
      totalPrice: totalPrice ?? this.totalPrice,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      shippingAddress: shippingAddress ?? this.shippingAddress,
      paymentMethod: paymentMethod ?? this.paymentMethod,
    );
  }
}

// 订单控制器
class OrderController extends GetxController {
  final RxList<Order> orders = <Order>[].obs;
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;

  List<Order> get allOrders => orders;

  List<Order> get pendingOrders => orders
      .where((order) => order.status == 'pending')
      .toList();

  List<Order> get completedOrders => orders
      .where((order) => order.status == 'completed')
      .toList();

  List<Order> get cancelledOrders => orders
      .where((order) => order.status == 'cancelled')
      .toList();

  @override
  void onInit() {
    super.onInit();
    loadOrders();
  }

  Future<void> loadOrders() async {
    try {
      isLoading.value = true;
      error.value = '';

      // 模拟网络请求
      await Future.delayed(Duration(seconds: 1));

      final orderList = await OrderService.getOrders();
      orders.assignAll(orderList);
    } catch (e) {
      error.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> createOrder({
    required List<CartItem> items,
    required String shippingAddress,
    required String paymentMethod,
  }) async {
    try {
      isLoading.value = true;
      error.value = '';

      final order = await OrderService.createOrder(
        items: items,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
      );

      orders.add(order);

      Get.snackbar(
        '订单创建成功',
        '订单号：${order.id}',
        backgroundColor: Colors.green,
        icon: Icon(Icons.check_circle),
      );

      // 导航到订单详情页
      Get.to(() => OrderDetailPage(order: order));
    } catch (e) {
      error.value = e.toString();
      Get.snackbar(
        '订单创建失败',
        e.toString(),
        backgroundColor: Colors.red,
        icon: Icon(Icons.error),
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> cancelOrder(String orderId) async {
    try {
      await OrderService.cancelOrder(orderId);

      final index = orders.indexWhere((order) => order.id == orderId);
      if (index != -1) {
        orders[index] = orders[index].copyWith(status: 'cancelled');
      }

      Get.snackbar(
        '订单已取消',
        '订单号：$orderId',
        backgroundColor: Colors.orange,
        icon: Icon(Icons.info),
      );
    } catch (e) {
      error.value = e.toString();
      Get.snackbar(
        '取消订单失败',
        e.toString(),
        backgroundColor: Colors.red,
        icon: Icon(Icons.error),
      );
    }
  }

  Future<void> refreshOrders() async {
    await loadOrders();
  }

  void clearError() {
    error.value = '';
  }
}

// 订单服务
class OrderService {
  static Future<List<Order>> getOrders() async {
    // 模拟从API获取订单列表
    await Future.delayed(Duration(seconds: 1));

    return [
      Order(
        id: 'ORD001',
        items: [
          CartItem(product: Product(
            id: '1',
            name: 'iPhone 15 Pro',
            price: 8999.0,
            imageUrl: 'https://example.com/iphone15.jpg',
            description: '最新款iPhone',
          )),
        ],
        totalPrice: 8999.0,
        status: 'pending',
        createdAt: DateTime.now().subtract(Duration(days: 2)),
        shippingAddress: '北京市朝阳区xxx街道xxx号',
        paymentMethod: '支付宝',
      ),
      Order(
        id: 'ORD002',
        items: [
          CartItem(product: Product(
            id: '2',
            name: 'MacBook Pro',
            price: 14999.0,
            imageUrl: 'https://example.com/macbook.jpg',
            description: '专业级笔记本电脑',
          )),
        ],
        totalPrice: 14999.0,
        status: 'completed',
        createdAt: DateTime.now().subtract(Duration(days: 5)),
        shippingAddress: '上海市浦东新区xxx路xxx号',
        paymentMethod: '微信支付',
      ),
      // 更多订单...
    ];
  }

  static Future<Order> createOrder({
    required List<CartItem> items,
    required String shippingAddress,
    required String paymentMethod,
  }) async {
    // 模拟创建订单
    await Future.delayed(Duration(seconds: 2));

    final totalPrice = items.fold(0.0, (sum, item) => sum + item.totalPrice);

    return Order(
      id: 'ORD${DateTime.now().millisecondsSinceEpoch}',
      items: items,
      totalPrice: totalPrice,
      status: 'pending',
      createdAt: DateTime.now(),
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
    );
  }

  static Future<void> cancelOrder(String orderId) async {
    // 模拟取消订单
    await Future.delayed(Duration(seconds: 1));
  }
}
```

### 4.3 订单页面 UI

```dart
class OrderListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GetBuilder<OrderController>(
      init: OrderController(),
      builder: (controller) {
        return Scaffold(
          appBar: AppBar(
            title: Text('我的订单'),
            actions: [
              IconButton(
                icon: Icon(Icons.refresh),
                onPressed: () => controller.refreshOrders(),
              ),
            ],
          ),
          body: Obx(() {
            if (controller.isLoading.value) {
              return Center(child: CircularProgressIndicator());
            }

            if (controller.error.value.isNotEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error, size: 64, color: Colors.red),
                    SizedBox(height: 16),
                    Text('加载失败：${controller.error.value}'),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => controller.refreshOrders(),
                      child: Text('重试'),
                    ),
                  ],
                ),
              );
            }

            if (controller.allOrders.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text(
                      '暂无订单',
                      style: TextStyle(
                        fontSize: 18,
                        color: Colors.grey,
                      ),
                    ),
                    SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => Get.to(() => ProductListPage()),
                      child: Text('去购物'),
                    ),
                  ],
                ),
              );
            }

            return DefaultTabController(
              length: 3,
              child: Column(
                children: [
                  TabBar(
                    tabs: [
                      Tab(text: '待付款'),
                      Tab(text: '已完成'),
                      Tab(text: '已取消'),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _buildOrderList(controller.pendingOrders),
                        _buildOrderList(controller.completedOrders),
                        _buildOrderList(controller.cancelledOrders),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildOrderList(List<Order> orders) {
    return ListView.builder(
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return OrderCard(order: order);
      },
    );
  }
}

class OrderCard extends StatelessWidget {
  final Order order;

  const OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '订单号：${order.id}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                _buildStatusChip(order.status),
              ],
            ),
            SizedBox(height: 8),
            Text(
              '下单时间：${_formatDate(order.createdAt)}',
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 8),
            Text(
              '商品数量：${order.items.length}',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 8),
            Text(
              '总价：¥${order.totalPrice.toStringAsFixed(2)}',
              style: TextStyle(
                fontSize: 18,
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (order.shippingAddress != null) ...[
              SizedBox(height: 8),
              Text(
                '收货地址：${order.shippingAddress}',
                style: TextStyle(fontSize: 14),
              ),
            ],
            if (order.paymentMethod != null) ...[
              SizedBox(height: 8),
              Text(
                '支付方式：${order.paymentMethod}',
                style: TextStyle(fontSize: 14),
              ),
            ],
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Get.to(() => OrderDetailPage(order: order));
                    },
                    child: Text('查看详情'),
                  ),
                ),
                SizedBox(width: 16),
                if (order.status == 'pending')
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        _showCancelOrderDialog(order);
                      },
                      child: Text('取消订单'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String text;

    switch (status) {
      case 'pending':
        color = Colors.orange;
        text = '待付款';
        break;
      case 'completed':
        color = Colors.green;
        text = '已完成';
        break;
      case 'cancelled':
        color = Colors.red;
        text = '已取消';
        break;
      default:
        color = Colors.grey;
        text = '未知状态';
    }

    return Chip(
      label: Text(text),
      backgroundColor: color.withOpacity(0.1),
      labelStyle: TextStyle(color: color),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  void _showCancelOrderDialog(Order order) {
    Get.dialog(
      AlertDialog(
        title: Text('取消订单'),
        content: Text('确定要取消订单 ${order.id} 吗？'),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Get.back();
              final controller = Get.find<OrderController>();
              controller.cancelOrder(order.id);
            },
            child: Text('确定'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
          ),
        ],
      ),
    );
  }
}
```

## 第五章：Riverpod 探索 - 现代化的选择

### 5.1 为什么选择 Riverpod？

小丽听说 Riverpod 是 Provider 的进化版，提供了更好的类型安全和测试支持：

"Riverpod 结合了 Provider 的简洁性和 BLOC 的强大功能，这可能是我的最佳选择。"小丽思考道。

### 5.2 用户偏好设置 - Riverpod 实现

```dart
// 用户偏好设置模型
class UserPreferences {
  final String theme;
  final String language;
  final bool notificationsEnabled;
  final bool darkMode;
  final double fontSize;
  final String currency;

  UserPreferences({
    this.theme = 'light',
    this.language = 'zh',
    this.notificationsEnabled = true,
    this.darkMode = false,
    this.fontSize = 14.0,
    this.currency = 'CNY',
  });

  UserPreferences copyWith({
    String? theme,
    String? language,
    bool? notificationsEnabled,
    bool? darkMode,
    double? fontSize,
    String? currency,
  }) {
    return UserPreferences(
      theme: theme ?? this.theme,
      language: language ?? this.language,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      darkMode: darkMode ?? this.darkMode,
      fontSize: fontSize ?? this.fontSize,
      currency: currency ?? this.currency,
    );
  }
}

// 用户偏好设置提供者
final userPreferencesProvider = StateNotifierProvider<UserPreferencesNotifier, UserPreferences>(
  (ref) => UserPreferencesNotifier(),
);

class UserPreferencesNotifier extends StateNotifier<UserPreferences> {
  UserPreferencesNotifier() : super(UserPreferences());

  Future<void> loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final theme = prefs.getString('theme') ?? 'light';
      final language = prefs.getString('language') ?? 'zh';
      final notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
      final darkMode = prefs.getBool('dark_mode') ?? false;
      final fontSize = prefs.getDouble('font_size') ?? 14.0;
      final currency = prefs.getString('currency') ?? 'CNY';

      state = UserPreferences(
        theme: theme,
        language: language,
        notificationsEnabled: notificationsEnabled,
        darkMode: darkMode,
        fontSize: fontSize,
        currency: currency,
      );
    } catch (e) {
      print('加载用户偏好设置失败：$e');
    }
  }

  Future<void> savePreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString('theme', state.theme);
      await prefs.setString('language', state.language);
      await prefs.setBool('notifications_enabled', state.notificationsEnabled);
      await prefs.setBool('dark_mode', state.darkMode);
      await prefs.setDouble('font_size', state.fontSize);
      await prefs.setString('currency', state.currency);
    } catch (e) {
      print('保存用户偏好设置失败：$e');
    }
  }

  void updateTheme(String theme) {
    state = state.copyWith(theme: theme);
    savePreferences();
  }

  void updateLanguage(String language) {
    state = state.copyWith(language: language);
    savePreferences();
  }

  void toggleNotifications() {
    state = state.copyWith(notificationsEnabled: !state.notificationsEnabled);
    savePreferences();
  }

  void toggleDarkMode() {
    state = state.copyWith(darkMode: !state.darkMode);
    savePreferences();
  }

  void updateFontSize(double fontSize) {
    state = state.copyWith(fontSize: fontSize);
    savePreferences();
  }

  void updateCurrency(String currency) {
    state = state.copyWith(currency: currency);
    savePreferences();
  }
}

// 主题提供者
final themeProvider = Provider<ThemeData>((ref) {
  final preferences = ref.watch(userPreferencesProvider);

  if (preferences.darkMode) {
    return ThemeData.dark().copyWith(
      primarySwatch: Colors.blue,
      textTheme: TextTheme(
        bodyLarge: TextStyle(fontSize: preferences.fontSize),
        bodyMedium: TextStyle(fontSize: preferences.fontSize - 2),
        bodySmall: TextStyle(fontSize: preferences.fontSize - 4),
      ),
    );
  } else {
    return ThemeData.light().copyWith(
      primarySwatch: Colors.blue,
      textTheme: TextTheme(
        bodyLarge: TextStyle(fontSize: preferences.fontSize),
        bodyMedium: TextStyle(fontSize: preferences.fontSize - 2),
        bodySmall: TextStyle(fontSize: preferences.fontSize - 4),
      ),
    );
  }
});

// 本地化提供者
final localeProvider = Provider<Locale>((ref) {
  final preferences = ref.watch(userPreferencesProvider);

  switch (preferences.language) {
    case 'en':
      return Locale('en', 'US');
    case 'zh':
    default:
      return Locale('zh', 'CN');
  }
});
```

### 5.3 设置页面 UI

```dart
class SettingsPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final preferences = ref.watch(userPreferencesProvider);
    final theme = ref.watch(themeProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('设置'),
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          _buildSectionTitle('外观设置'),
          _buildThemeSetting(context, ref, preferences),
          _buildFontSizeSetting(context, ref, preferences),
          SizedBox(height: 24),
          _buildSectionTitle('通用设置'),
          _buildLanguageSetting(context, ref, preferences),
          _buildCurrencySetting(context, ref, preferences),
          SizedBox(height: 24),
          _buildSectionTitle('通知设置'),
          _buildNotificationSetting(context, ref, preferences),
          SizedBox(height: 24),
          _buildSectionTitle('其他'),
          _buildAboutSection(context),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }

  Widget _buildThemeSetting(BuildContext context, WidgetRef ref, UserPreferences preferences) {
    return Card(
      child: ListTile(
        title: Text('主题'),
        subtitle: Text(preferences.darkMode ? '深色模式' : '浅色模式'),
        leading: Icon(
          preferences.darkMode ? Icons.dark_mode : Icons.light_mode,
        ),
        trailing: Switch(
          value: preferences.darkMode,
          onChanged: (value) {
            ref.read(userPreferencesProvider.notifier).toggleDarkMode();
          },
        ),
      ),
    );
  }

  Widget _buildFontSizeSetting(BuildContext context, WidgetRef ref, UserPreferences preferences) {
    return Card(
      child: ListTile(
        title: Text('字体大小'),
        subtitle: Text('${preferences.fontSize.toInt()}'),
        leading: Icon(Icons.text_fields),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(Icons.remove),
              onPressed: preferences.fontSize > 10
                  ? () {
                      ref.read(userPreferencesProvider.notifier)
                          .updateFontSize(preferences.fontSize - 1);
                    }
                  : null,
            ),
            IconButton(
              icon: Icon(Icons.add),
              onPressed: preferences.fontSize < 20
                  ? () {
                      ref.read(userPreferencesProvider.notifier)
                          .updateFontSize(preferences.fontSize + 1);
                    }
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageSetting(BuildContext context, WidgetRef ref, UserPreferences preferences) {
    return Card(
      child: ListTile(
        title: Text('语言'),
        subtitle: Text(preferences.language == 'zh' ? '中文' : 'English'),
        leading: Icon(Icons.language),
        trailing: Icon(Icons.chevron_right),
        onTap: () {
          _showLanguageDialog(context, ref, preferences);
        },
      ),
    );
  }

  Widget _buildCurrencySetting(BuildContext context, WidgetRef ref, UserPreferences preferences) {
    return Card(
      child: ListTile(
        title: Text('货币'),
        subtitle: Text(preferences.currency),
        leading: Icon(Icons.attach_money),
        trailing: Icon(Icons.chevron_right),
        onTap: () {
          _showCurrencyDialog(context, ref, preferences);
        },
      ),
    );
  }

  Widget _buildNotificationSetting(BuildContext context, WidgetRef ref, UserPreferences preferences) {
    return Card(
      child: ListTile(
        title: Text('推送通知'),
        subtitle: Text(preferences.notificationsEnabled ? '已开启' : '已关闭'),
        leading: Icon(
          preferences.notificationsEnabled ? Icons.notifications : Icons.notifications_off,
        ),
        trailing: Switch(
          value: preferences.notificationsEnabled,
          onChanged: (value) {
            ref.read(userPreferencesProvider.notifier).toggleNotifications();
          },
        ),
      ),
    );
  }

  Widget _buildAboutSection(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text('关于应用'),
        leading: Icon(Icons.info),
        trailing: Icon(Icons.chevron_right),
        onTap: () {
          showAboutDialog(
            context: context,
            applicationName: '小丽的电商',
            applicationVersion: '1.0.0',
            applicationIcon: Icon(Icons.shopping_bag),
            children: [
              Text('一个使用Flutter开发的电商应用'),
              SizedBox(height: 16),
              Text('© 2024 小丽电商'),
            ],
          );
        },
      ),
    );
  }

  void _showLanguageDialog(BuildContext context, WidgetRef ref, UserPreferences preferences) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('选择语言'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile(
                title: Text('中文'),
                value: 'zh',
                groupValue: preferences.language,
                onChanged: (value) {
                  ref.read(userPreferencesProvider.notifier).updateLanguage(value!);
                  Navigator.pop(context);
                },
              ),
              RadioListTile(
                title: Text('English'),
                value: 'en',
                groupValue: preferences.language,
                onChanged: (value) {
                  ref.read(userPreferencesProvider.notifier).updateLanguage(value!);
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showCurrencyDialog(BuildContext context, WidgetRef ref, UserPreferences preferences) {
    final currencies = ['CNY', 'USD', 'EUR', 'JPY'];

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('选择货币'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: currencies.map((currency) {
              return RadioListTile(
                title: Text(currency),
                value: currency,
                groupValue: preferences.currency,
                onChanged: (value) {
                  ref.read(userPreferencesProvider.notifier).updateCurrency(value!);
                  Navigator.pop(context);
                },
              );
            }).toList(),
          ),
        );
      },
    );
  }
}
```

## 第六章：状态管理方案对比

### 6.1 小丽的总结

经过实际开发体验，小丽总结了各种状态管理方案的优缺点：

#### Provider

**优点：**

- 学习曲线平缓，容易上手
- 官方支持，文档完善
- 适合中小型项目
- 与 Flutter 生态系统集成良好

**缺点：**

- 复杂业务逻辑难以组织
- 状态变化追踪不够精确
- 测试相对复杂

#### BLOC

**优点：**

- 业务逻辑与 UI 完全分离
- 状态变化可预测，易于调试
- 强大的测试支持
- 适合大型复杂项目

**缺点：**

- 学习曲线陡峭
- 代码量较多
- 需要编写大量样板代码

#### GetX

**优点：**

- 极简的 API，代码量少
- 内置路由、依赖注入等功能
- 性能优秀
- 学习成本低

**缺点：**

- 违反 Flutter 的一些设计原则
- 全局状态可能导致调试困难
- 社区争议较大

#### Riverpod

**优点：**

- 类型安全，编译时检查
- 测试友好
- 结合了 Provider 和 BLOC 的优点
- 现代化的 API 设计

**缺点：**

- 相对较新，生态系统不够成熟
- 学习曲线中等
- 需要理解响应式编程概念

### 6.2 选择建议

小丽根据自己的经验，给出了以下选择建议：

1. **小型项目（< 10 个页面）**：推荐 Provider
2. **中型项目（10-30 个页面）**：推荐 Riverpod
3. **大型项目（> 30 个页面）**：推荐 BLOC
4. **快速原型开发**：推荐 GetX
5. **团队协作项目**：推荐 BLOC 或 Riverpod

## 故事结局：小丽的成功

经过几个月的开发，小丽的电商应用终于上线了！她最终选择了 Riverpod 作为主要的状态管理方案，因为它在简洁性和功能性之间取得了很好的平衡。

"选择合适的状态管理方案就像选择合适的工具，没有绝对的好坏，只有适合不适合。"小丽在她的技术博客中写道，"重要的是理解每种方案的优缺点，根据项目需求做出明智的选择。"

小丽的电商应用获得了用户的好评，特别是流畅的用户体验和稳定的性能。她的成功证明了：**掌握状态管理是 Flutter 开发的关键技能，而通过实际项目学习是最好的方式。**

## 总结

通过小丽的电商应用开发故事，我们全面学习了 Flutter 各种状态管理方案的实战应用：

1. **Provider**：适合入门和中小型项目
2. **BLOC**：适合大型复杂项目，提供最佳的可维护性
3. **GetX**：适合快速开发，提供极简的 API
4. **Riverpod**：现代化的选择，结合了多种方案的优点

关键学习要点：

- 理解每种方案的核心概念和设计哲学
- 通过实际项目体验不同方案的优缺点
- 根据项目需求选择合适的状态管理方案
- 重视测试和代码可维护性
- 持续学习和关注社区发展

记住，状态管理的本质是：**管理应用的数据流，确保 UI 与数据同步**。掌握了这一点，无论使用哪种方案，你都能构建出优秀的 Flutter 应用！
