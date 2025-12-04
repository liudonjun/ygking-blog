---
description: 本文通过一个完整的故事案例，深入浅出地讲解Flutter BLOC状态管理模式的全部用法，包括基础概念、事件处理、状态转换、错误处理和最佳实践。
tag:
  - Flutter
  - BLOC
  - 状态管理
  - 实战指南
  - 故事案例
sticky: 1
sidebar: true
---

# Flutter 状态管理-BLOC 实战指南

## 故事开始：小明的咖啡店应用

小明是一位 Flutter 开发者，他想要开发一个咖啡店管理应用。这个应用需要管理咖啡订单、处理支付、显示菜单，并且要能够实时更新库存状态。在研究了多种状态管理方案后，小明决定使用 BLOC 模式来构建他的应用。

"为什么选择 BLOC 呢？"小明自言自语道，"因为它能让我的业务逻辑和 UI 完全分离，让代码更容易测试和维护。"

## 第一章：BLOC 基础概念

### 1.1 什么是 BLOC？

BLOC（Business Logic Component）是一种状态管理模式，它将业务逻辑与 UI 分离。想象一下，小明的咖啡店里有一个吧台（UI）和一个后厨（业务逻辑）。顾客在前台点单，服务员将订单传递给后厨，后厨准备好咖啡后，再通过服务员将咖啡送到顾客手中。

在这个比喻中：

- **顾客**：用户交互（点击按钮、输入文本等）
- **服务员**：事件（Events）
- **后厨**：BLOC（处理业务逻辑）
- **做好的咖啡**：状态（States）
- **吧台展示**：UI 界面

### 1.2 核心组件

让我们先看看 BLOC 的几个核心组件：

```dart
// 1. 事件基类
abstract class CoffeeEvent {}

// 2. 状态基类
abstract class CoffeeState {}

// 3. BLOC基类
abstract class CoffeeBloc extends Bloc<CoffeeEvent, CoffeeState> {
  CoffeeBloc(CoffeeState initialState) : super(initialState);
}
```

小明开始构建他的咖啡店 BLOC：

```dart
// 咖啡订单事件
class OrderCoffeeEvent extends CoffeeEvent {
  final String coffeeType;
  final int quantity;

  OrderCoffeeEvent(this.coffeeType, this.quantity);
}

// 咖啡准备状态
class CoffeePreparingState extends CoffeeState {
  final String message;

  CoffeePreparingState(this.message);
}

// 咖啡完成状态
class CoffeeReadyState extends CoffeeState {
  final String coffeeType;
  final int quantity;

  CoffeeReadyState(this.coffeeType, this.quantity);
}
```

## 第二章：构建第一个 BLOC

### 2.1 咖啡订单 BLOC

小明开始实现他的第一个 BLOC - 咖啡订单管理：

```dart
class CoffeeOrderBloc extends Bloc<CoffeeEvent, CoffeeState> {
  CoffeeOrderBloc() : super(CoffeeInitialState()) {
    // 注册事件处理器
    on<OrderCoffeeEvent>(_onOrderCoffee);
    on<CancelOrderEvent>(_onCancelOrder);
    on<ModifyOrderEvent>(_onModifyOrder);
  }

  // 处理订单事件
  Future<void> _onOrderCoffee(
    OrderCoffeeEvent event,
    Emitter<CoffeeState> emit,
  ) async {
    emit(CoffeePreparingState('正在准备您的${event.coffeeType}...'));

    try {
      // 模拟制作咖啡的过程
      await _makeCoffee(event.coffeeType, event.quantity);

      emit(CoffeeReadyState(event.coffeeType, event.quantity));
    } catch (e) {
      emit(CoffeeErrorState('制作咖啡时出错：${e.toString()}'));
    }
  }

  // 处理取消订单事件
  Future<void> _onCancelOrder(
    CancelOrderEvent event,
    Emitter<CoffeeState> emit,
  ) async {
    emit(CoffeeCancelledState('订单已取消'));
  }

  // 处理修改订单事件
  Future<void> _onModifyOrder(
    ModifyOrderEvent event,
    Emitter<CoffeeState> emit,
  ) async {
    emit(CoffeePreparingState('正在修改您的订单...'));

    try {
      await _modifyOrder(event.orderId, event.newCoffeeType, event.newQuantity);
      emit(CoffeeReadyState(event.newCoffeeType, event.newQuantity));
    } catch (e) {
      emit(CoffeeErrorState('修改订单时出错：${e.toString()}'));
    }
  }

  // 模拟制作咖啡
  Future<void> _makeCoffee(String coffeeType, int quantity) async {
    // 根据咖啡类型设置不同的制作时间
    final preparationTime = _getPreparationTime(coffeeType);
    await Future.delayed(Duration(seconds: preparationTime));

    // 检查库存
    final hasEnoughIngredients = await _checkIngredients(coffeeType, quantity);
    if (!hasEnoughIngredients) {
      throw Exception('库存不足');
    }

    // 更新库存
    await _updateInventory(coffeeType, quantity);
  }

  // 获取制作时间
  int _getPreparationTime(String coffeeType) {
    switch (coffeeType) {
      case '浓缩咖啡':
        return 1;
      case '拿铁':
        return 3;
      case '卡布奇诺':
        return 4;
      case '美式咖啡':
        return 2;
      default:
        return 3;
    }
  }

  // 检查原料库存
  Future<bool> _checkIngredients(String coffeeType, int quantity) async {
    // 这里应该连接到实际的库存系统
    // 为了演示，我们假设总是有足够的原料
    return true;
  }

  // 更新库存
  Future<void> _updateInventory(String coffeeType, int quantity) async {
    // 这里应该更新实际的库存系统
    print('库存更新：${coffeeType} x ${quantity}');
  }

  // 修改订单
  Future<void> _modifyOrder(String orderId, String newCoffeeType, int newQuantity) async {
    // 模拟修改订单的过程
    await Future.delayed(Duration(seconds: 2));
  }
}
```

### 2.2 更多的事件和状态

随着咖啡店业务的发展，小明需要处理更多的情况：

```dart
// 更多的事件
class AddToCartEvent extends CoffeeEvent {
  final CoffeeItem item;
  AddToCartEvent(this.item);
}

class RemoveFromCartEvent extends CoffeeEvent {
  final String itemId;
  RemoveFromCartEvent(this.itemId);
}

class ApplyDiscountEvent extends CoffeeEvent {
  final String discountCode;
  ApplyDiscountEvent(this.discountCode);
}

class CheckoutEvent extends CoffeeEvent {
  final PaymentMethod paymentMethod;
  CheckoutEvent(this.paymentMethod);
}

// 更多的状态
class CartUpdatedState extends CoffeeState {
  final List<CoffeeItem> items;
  final double totalPrice;

  CartUpdatedState(this.items, this.totalPrice);
}

class DiscountAppliedState extends CoffeeState {
  final double discountAmount;
  final double newTotal;

  DiscountAppliedState(this.discountAmount, this.newTotal);
}

class PaymentProcessingState extends CoffeeState {
  final String message;

  PaymentProcessingState(this.message);
}

class PaymentCompletedState extends CoffeeState {
  final String transactionId;
  final DateTime timestamp;

  PaymentCompletedState(this.transactionId, this.timestamp);
}

class PaymentFailedState extends CoffeeState {
  final String errorMessage;

  PaymentFailedState(this.errorMessage);
}
```

## 第三章：进阶 BLOC 技术

### 3.1 使用 BlocProvider

小明发现，每次都创建新的 BLOC 实例很浪费资源，于是他学会了使用 BlocProvider：

```dart
class CoffeeShopApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => CoffeeOrderBloc()),
        BlocProvider(create: (context) => CartBloc()),
        BlocProvider(create: (context) => PaymentBloc()),
        BlocProvider(create: (context) => InventoryBloc()),
      ],
      child: MaterialApp(
        title: '小明咖啡店',
        home: CoffeeShopHomePage(),
      ),
    );
  }
}

// 在Widget中使用BLOC
class CoffeeOrderPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('点咖啡')),
      body: BlocBuilder<CoffeeOrderBloc, CoffeeState>(
        builder: (context, state) {
          if (state is CoffeePreparingState) {
            return _buildPreparingUI(state);
          } else if (state is CoffeeReadyState) {
            return _buildReadyUI(state);
          } else if (state is CoffeeErrorState) {
            return _buildErrorUI(state);
          } else {
            return _buildInitialUI();
          }
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCoffeeMenu(context),
        child: Icon(Icons.coffee),
      ),
    );
  }

  Widget _buildPreparingUI(CoffeePreparingState state) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 20),
          Text(state.message),
        ],
      ),
    );
  }

  Widget _buildReadyUI(CoffeeReadyState state) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_circle, size: 100, color: Colors.green),
          SizedBox(height: 20),
          Text('您的${state.coffeeType}准备好了！'),
          Text('数量：${state.quantity}'),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => _navigateToPayment(),
            child: Text('去支付'),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorUI(CoffeeErrorState state) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error, size: 100, color: Colors.red),
          SizedBox(height: 20),
          Text(state.errorMessage),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => _retryOrder(),
            child: Text('重试'),
          ),
        ],
      ),
    );
  }

  Widget _buildInitialUI() {
    return Center(
      child: Text('请选择您喜欢的咖啡'),
    );
  }

  void _showCoffeeMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => CoffeeMenuSheet(),
    );
  }

  void _navigateToPayment() {
    // 导航到支付页面
  }

  void _retryOrder() {
    // 重试订单
  }
}
```

### 3.2 使用 BlocListener

有时候，小明需要在状态变化时执行一些操作，比如显示 SnackBar 或导航：

```dart
class CoffeeOrderPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<CoffeeOrderBloc, CoffeeState>(
        listener: (context, state) {
          if (state is CoffeeReadyState) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('咖啡制作完成！'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is CoffeeErrorState) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: BlocBuilder<CoffeeOrderBloc, CoffeeState>(
          builder: (context, state) {
            // UI构建逻辑
            return _buildUI(state);
          },
        ),
      ),
    );
  }

  Widget _buildUI(CoffeeState state) {
    // 根据状态构建UI
    return Container();
  }
}
```

### 3.3 使用 BlocConsumer

当需要同时监听状态变化和构建 UI 时，小明学会了使用 BlocConsumer：

```dart
class CoffeeOrderPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<CoffeeOrderBloc, CoffeeState>(
        listener: (context, state) {
          // 监听状态变化
          if (state is CoffeeReadyState) {
            _showSuccessMessage(context);
          } else if (state is CoffeeErrorState) {
            _showErrorMessage(context, state.errorMessage);
          }
        },
        builder: (context, state) {
          // 构建UI
          return _buildUI(context, state);
        },
      ),
    );
  }

  void _showSuccessMessage(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('咖啡制作完成！')),
    );
  }

  void _showErrorMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  Widget _buildUI(BuildContext context, CoffeeState state) {
    // 根据状态构建不同的UI
    if (state is CoffeePreparingState) {
      return _buildPreparingUI(state);
    } else if (state is CoffeeReadyState) {
      return _buildReadyUI(state);
    } else if (state is CoffeeErrorState) {
      return _buildErrorUI(state);
    } else {
      return _buildInitialUI();
    }
  }
}
```

## 第四章：复杂场景处理

### 4.1 购物车 BLOC

小明的咖啡店需要一个购物车功能，这涉及到更复杂的状态管理：

```dart
class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc() : super(CartInitialState()) {
    on<AddToCartEvent>(_onAddToCart);
    on<RemoveFromCartEvent>(_onRemoveFromCart);
    on<UpdateQuantityEvent>(_onUpdateQuantity);
    on<ClearCartEvent>(_onClearCart);
    on<ApplyDiscountEvent>(_onApplyDiscount);
  }

  Future<void> _onAddToCart(
    AddToCartEvent event,
    Emitter<CartState> emit,
  ) async {
    final currentState = state;
    List<CoffeeItem> items = [];
    double totalPrice = 0.0;

    if (currentState is CartUpdatedState) {
      items = List.from(currentState.items);
      totalPrice = currentState.totalPrice;
    }

    // 检查商品是否已在购物车中
    final existingItemIndex = items.indexWhere(
      (item) => item.id == event.item.id,
    );

    if (existingItemIndex != -1) {
      // 如果已存在，增加数量
      items[existingItemIndex] = items[existingItemIndex].copyWith(
        quantity: items[existingItemIndex].quantity + event.item.quantity,
      );
    } else {
      // 如果不存在，添加新商品
      items.add(event.item);
    }

    // 重新计算总价
    totalPrice = _calculateTotalPrice(items);

    emit(CartUpdatedState(items, totalPrice));
  }

  Future<void> _onRemoveFromCart(
    RemoveFromCartEvent event,
    Emitter<CartState> emit,
  ) async {
    final currentState = state;
    if (currentState is CartUpdatedState) {
      final items = currentState.items
          .where((item) => item.id != event.itemId)
          .toList();
      final totalPrice = _calculateTotalPrice(items);

      emit(CartUpdatedState(items, totalPrice));
    }
  }

  Future<void> _onUpdateQuantity(
    UpdateQuantityEvent event,
    Emitter<CartState> emit,
  ) async {
    final currentState = state;
    if (currentState is CartUpdatedState) {
      final items = currentState.items.map((item) {
        if (item.id == event.itemId) {
          return item.copyWith(quantity: event.newQuantity);
        }
        return item;
      }).toList();

      final totalPrice = _calculateTotalPrice(items);
      emit(CartUpdatedState(items, totalPrice));
    }
  }

  Future<void> _onClearCart(
    ClearCartEvent event,
    Emitter<CartState> emit,
  ) async {
    emit(CartUpdatedState([], 0.0));
  }

  Future<void> _onApplyDiscount(
    ApplyDiscountEvent event,
    Emitter<CartState> emit,
  ) async {
    final currentState = state;
    if (currentState is CartUpdatedState) {
      try {
        final discount = await _validateDiscountCode(event.discountCode);
        final discountedTotal = currentState.totalPrice * (1 - discount.percentage);

        emit(DiscountAppliedState(
          currentState.totalPrice - discountedTotal,
          discountedTotal,
        ));

        // 更新购物车状态
        emit(CartUpdatedState(currentState.items, discountedTotal));
      } catch (e) {
        emit(DiscountErrorState('无效的优惠码'));
      }
    }
  }

  double _calculateTotalPrice(List<CoffeeItem> items) {
    return items.fold(0.0, (total, item) => total + (item.price * item.quantity));
  }

  Future<Discount> _validateDiscountCode(String code) async {
    // 这里应该连接到实际的优惠码验证系统
    // 为了演示，我们返回一个模拟的折扣
    if (code == 'COFFEE10') {
      return Discount(code: code, percentage: 0.1, description: '九折优惠');
    } else if (code == 'NEWUSER') {
      return Discount(code: code, percentage: 0.15, description: '新用户八五折');
    } else {
      throw Exception('无效的优惠码');
    }
  }
}

// 购物车商品
class CoffeeItem {
  final String id;
  final String name;
  final double price;
  final int quantity;
  final String imageUrl;

  CoffeeItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.imageUrl,
  });

  CoffeeItem copyWith({
    String? id,
    String? name,
    double? price,
    int? quantity,
    String? imageUrl,
  }) {
    return CoffeeItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }
}

// 折扣信息
class Discount {
  final String code;
  final double percentage;
  final String description;

  Discount({
    required this.code,
    required this.percentage,
    required this.description,
  });
}
```

### 4.2 支付 BLOC

支付是咖啡店最关键的功能，小明需要确保支付流程的可靠性：

```dart
class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {
  PaymentBloc() : super(PaymentInitialState()) {
    on<ProcessPaymentEvent>(_onProcessPayment);
    on<ValidatePaymentEvent>(_onValidatePayment);
    on<CancelPaymentEvent>(_onCancelPayment);
  }

  Future<void> _onProcessPayment(
    ProcessPaymentEvent event,
    Emitter<PaymentState> emit,
  ) async {
    emit(PaymentProcessingState('正在处理支付...'));

    try {
      // 验证支付信息
      await _validatePaymentInfo(event.paymentInfo);

      // 处理支付
      final result = await _processPaymentWithProvider(
        event.paymentInfo,
        event.paymentMethod,
      );

      if (result.success) {
        emit(PaymentCompletedState(
          transactionId: result.transactionId,
          timestamp: DateTime.now(),
        ));

        // 清空购物车
        BlocProvider.of<CartBloc>(context).add(ClearCartEvent());
      } else {
        emit(PaymentFailedState(result.errorMessage));
      }
    } catch (e) {
      emit(PaymentFailedState('支付处理失败：${e.toString()}'));
    }
  }

  Future<void> _onValidatePayment(
    ValidatePaymentEvent event,
    Emitter<PaymentState> emit,
  ) async {
    try {
      final isValid = await _validatePaymentInfo(event.paymentInfo);

      if (isValid) {
        emit(PaymentValidState());
      } else {
        emit(PaymentInvalidState('支付信息无效'));
      }
    } catch (e) {
      emit(PaymentErrorState('验证支付信息时出错：${e.toString()}'));
    }
  }

  Future<void> _onCancelPayment(
    CancelPaymentEvent event,
    Emitter<PaymentState> emit,
  ) async {
    emit(PaymentCancelledState());
  }

  Future<bool> _validatePaymentInfo(PaymentInfo paymentInfo) async {
    // 验证卡号
    if (paymentInfo.cardNumber.length != 16) {
      return false;
    }

    // 验证有效期
    final now = DateTime.now();
    if (paymentInfo.expiryYear < now.year ||
        (paymentInfo.expiryYear == now.year && paymentInfo.expiryMonth < now.month)) {
      return false;
    }

    // 验证CVV
    if (paymentInfo.cvv.length != 3) {
      return false;
    }

    return true;
  }

  Future<PaymentResult> _processPaymentWithProvider(
    PaymentInfo paymentInfo,
    PaymentMethod paymentMethod,
  ) async {
    // 这里应该连接到实际的支付提供商
    // 为了演示，我们模拟支付过程

    await Future.delayed(Duration(seconds: 3));

    // 模拟支付成功
    return PaymentResult(
      success: true,
      transactionId: 'TXN${DateTime.now().millisecondsSinceEpoch}',
      errorMessage: null,
    );
  }
}

// 支付信息
class PaymentInfo {
  final String cardNumber;
  final int expiryMonth;
  final int expiryYear;
  final String cvv;
  final String cardholderName;

  PaymentInfo({
    required this.cardNumber,
    required this.expiryMonth,
    required this.expiryYear,
    required this.cvv,
    required this.cardholderName,
  });
}

// 支付方式
enum PaymentMethod {
  creditCard,
  debitCard,
  mobilePayment,
  cash,
}

// 支付结果
class PaymentResult {
  final bool success;
  final String transactionId;
  final String? errorMessage;

  PaymentResult({
    required this.success,
    required this.transactionId,
    this.errorMessage,
  });
}
```

## 第五章：BLOC 测试

### 5.1 测试咖啡订单 BLOC

小明知道，好的代码必须有好的测试。他开始为他的 BLOC 编写测试：

```dart
void main() {
  group('CoffeeOrderBloc', () {
    late CoffeeOrderBloc coffeeOrderBloc;

    setUp(() {
      coffeeOrderBloc = CoffeeOrderBloc();
    });

    tearDown(() {
      coffeeOrderBloc.close();
    });

    test('初始状态应该是CoffeeInitialState', () {
      expect(coffeeOrderBloc.state, isA<CoffeeInitialState>());
    });

    test('应该能够处理订单事件', () async {
      // 准备
      const expectedStates = [
        CoffeePreparingState('正在准备您的拿铁...'),
        CoffeeReadyState('拿铁', 1),
      ];

      // 执行
      coffeeOrderBloc.add(OrderCoffeeEvent('拿铁', 1));

      // 验证
      await expectLater(
        coffeeOrderBloc.stream,
        emitsInOrder(expectedStates),
      );
    });

    test('应该能够处理取消订单事件', () async {
      // 先添加一个订单
      coffeeOrderBloc.add(OrderCoffeeEvent('拿铁', 1));
      await Future.delayed(Duration(seconds: 1));

      // 然后取消订单
      coffeeOrderBloc.add(CancelOrderEvent());

      // 验证
      await expectLater(
        coffeeOrderBloc.stream,
        emits(CoffeeCancelledState('订单已取消')),
      );
    });

    test('应该能够处理修改订单事件', () async {
      // 先添加一个订单
      coffeeOrderBloc.add(OrderCoffeeEvent('拿铁', 1));
      await Future.delayed(Duration(seconds: 1));

      // 然后修改订单
      coffeeOrderBloc.add(ModifyOrderEvent('order1', '卡布奇诺', 2));

      // 验证
      await expectLater(
        coffeeOrderBloc.stream,
        emitsInOrder([
          CoffeePreparingState('正在修改您的订单...'),
          CoffeeReadyState('卡布奇诺', 2),
        ]),
      );
    });

    test('应该能够处理制作咖啡时的错误', () async {
      // 使用一个会导致错误的咖啡类型
      coffeeOrderBloc.add(OrderCoffeeEvent('未知咖啡', 1));

      // 验证
      await expectLater(
        coffeeOrderBloc.stream,
        emitsInOrder([
          CoffeePreparingState('正在准备您的未知咖啡...'),
          isA<CoffeeErrorState>(),
        ]),
      );
    });
  });
}
```

### 5.2 测试购物车 BLOC

```dart
void main() {
  group('CartBloc', () {
    late CartBloc cartBloc;

    setUp(() {
      cartBloc = CartBloc();
    });

    tearDown(() {
      cartBloc.close();
    });

    test('应该能够添加商品到购物车', () async {
      final item = CoffeeItem(
        id: 'coffee1',
        name: '拿铁',
        price: 25.0,
        quantity: 1,
        imageUrl: 'assets/latte.png',
      );

      cartBloc.add(AddToCartEvent(item));

      await expectLater(
        cartBloc.stream,
        emits(CartUpdatedState([item], 25.0)),
      );
    });

    test('应该能够增加已存在商品的数量', () async {
      final item = CoffeeItem(
        id: 'coffee1',
        name: '拿铁',
        price: 25.0,
        quantity: 1,
        imageUrl: 'assets/latte.png',
      );

      // 先添加一个商品
      cartBloc.add(AddToCartEvent(item));
      await Future.delayed(Duration(milliseconds: 100));

      // 再添加相同的商品
      cartBloc.add(AddToCartEvent(item));

      await expectLater(
        cartBloc.stream,
        emits(CartUpdatedState([item.copyWith(quantity: 2)], 50.0)),
      );
    });

    test('应该能够从购物车移除商品', () async {
      final item1 = CoffeeItem(
        id: 'coffee1',
        name: '拿铁',
        price: 25.0,
        quantity: 1,
        imageUrl: 'assets/latte.png',
      );

      final item2 = CoffeeItem(
        id: 'coffee2',
        name: '卡布奇诺',
        price: 28.0,
        quantity: 1,
        imageUrl: 'assets/cappuccino.png',
      );

      // 先添加两个商品
      cartBloc.add(AddToCartEvent(item1));
      cartBloc.add(AddToCartEvent(item2));
      await Future.delayed(Duration(milliseconds: 100));

      // 移除一个商品
      cartBloc.add(RemoveFromCartEvent('coffee1'));

      await expectLater(
        cartBloc.stream,
        emits(CartUpdatedState([item2], 28.0)),
      );
    });

    test('应该能够应用优惠码', () async {
      final item = CoffeeItem(
        id: 'coffee1',
        name: '拿铁',
        price: 25.0,
        quantity: 2,
        imageUrl: 'assets/latte.png',
      );

      // 先添加商品
      cartBloc.add(AddToCartEvent(item));
      await Future.delayed(Duration(milliseconds: 100));

      // 应用优惠码
      cartBloc.add(ApplyDiscountEvent('COFFEE10'));

      await expectLater(
        cartBloc.stream,
        emitsInOrder([
          DiscountAppliedState(5.0, 45.0),
          CartUpdatedState([item], 45.0),
        ]),
      );
    });

    test('应该能够处理无效的优惠码', () async {
      final item = CoffeeItem(
        id: 'coffee1',
        name: '拿铁',
        price: 25.0,
        quantity: 1,
        imageUrl: 'assets/latte.png',
      );

      // 先添加商品
      cartBloc.add(AddToCartEvent(item));
      await Future.delayed(Duration(milliseconds: 100));

      // 应用无效的优惠码
      cartBloc.add(ApplyDiscountEvent('INVALID'));

      await expectLater(
        cartBloc.stream,
        emits(DiscountErrorState('无效的优惠码')),
      );
    });
  });
}
```

## 第六章：BLOC 最佳实践

### 6.1 事件和状态的命名规范

小明总结了一些命名规范，让代码更易读：

```dart
// 事件命名：[功能名] + Event
class OrderCoffeeEvent extends CoffeeEvent {}
class AddToCartEvent extends CoffeeEvent {}
class ProcessPaymentEvent extends CoffeeEvent {}

// 状态命名：[功能名] + State
class CoffeePreparingState extends CoffeeState {}
class CartUpdatedState extends CoffeeState {}
class PaymentProcessingState extends CoffeeState {}

// 错误状态命名：[功能名] + ErrorState
class CoffeeErrorState extends CoffeeState {}
class PaymentFailedState extends CoffeeState {}
```

### 6.2 BLOC 的职责分离

小明学会了将 BLOC 的职责保持单一：

```dart
// 好的实践：每个BLOC只负责一个业务领域
class CoffeeOrderBloc extends Bloc<CoffeeOrderEvent, CoffeeOrderState> {}
class CartBloc extends Bloc<CartEvent, CartState> {}
class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {}

// 不好的实践：一个BLOC处理多个不相关的业务领域
class CoffeeShopBloc extends Bloc<CoffeeShopEvent, CoffeeShopState> {
  // 处理订单、购物车、支付、库存等所有功能
  // 这会导致BLOC过于复杂，难以维护
}
```

### 6.3 使用 Repository 模式

为了更好地分离业务逻辑和数据访问，小明引入了 Repository 模式：

```dart
abstract class CoffeeRepository {
  Future<List<Coffee>> getCoffeeMenu();
  Future<Coffee> getCoffeeDetails(String coffeeId);
  Future<void> placeOrder(Order order);
  Future<List<Order>> getOrderHistory(String userId);
}

class CoffeeRepositoryImpl implements CoffeeRepository {
  final ApiClient _apiClient;
  final LocalStorage _localStorage;

  CoffeeRepositoryImpl(this._apiClient, this._localStorage);

  @override
  Future<List<Coffee>> getCoffeeMenu() async {
    try {
      // 先从本地缓存获取
      final cachedMenu = await _localStorage.getCoffeeMenu();
      if (cachedMenu.isNotEmpty) {
        return cachedMenu;
      }

      // 从API获取
      final menu = await _apiClient.getCoffeeMenu();

      // 缓存到本地
      await _localStorage.saveCoffeeMenu(menu);

      return menu;
    } catch (e) {
      // 如果API失败，尝试从缓存获取
      return await _localStorage.getCoffeeMenu();
    }
  }

  @override
  Future<Coffee> getCoffeeDetails(String coffeeId) async {
    return await _apiClient.getCoffeeDetails(coffeeId);
  }

  @override
  Future<void> placeOrder(Order order) async {
    return await _apiClient.placeOrder(order);
  }

  @override
  Future<List<Order>> getOrderHistory(String userId) async {
    return await _apiClient.getOrderHistory(userId);
  }
}

// 在BLOC中使用Repository
class CoffeeOrderBloc extends Bloc<CoffeeOrderEvent, CoffeeOrderState> {
  final CoffeeRepository _coffeeRepository;

  CoffeeOrderBloc(this._coffeeRepository) : super(CoffeeOrderInitialState()) {
    on<LoadCoffeeMenuEvent>(_onLoadCoffeeMenu);
    on<OrderCoffeeEvent>(_onOrderCoffee);
  }

  Future<void> _onLoadCoffeeMenu(
    LoadCoffeeMenuEvent event,
    Emitter<CoffeeOrderState> emit,
  ) async {
    emit(CoffeeMenuLoadingState());

    try {
      final menu = await _coffeeRepository.getCoffeeMenu();
      emit(CoffeeMenuLoadedState(menu));
    } catch (e) {
      emit(CoffeeMenuErrorState(e.toString()));
    }
  }

  Future<void> _onOrderCoffee(
    OrderCoffeeEvent event,
    Emitter<CoffeeOrderState> emit,
  ) async {
    emit(CoffeeOrderProcessingState());

    try {
      final order = Order(
        coffeeId: event.coffeeId,
        quantity: event.quantity,
        timestamp: DateTime.now(),
      );

      await _coffeeRepository.placeOrder(order);

      emit(CoffeeOrderSuccessState(order));
    } catch (e) {
      emit(CoffeeOrderErrorState(e.toString()));
    }
  }
}
```

### 6.4 错误处理和重试机制

小明学会了完善的错误处理和重试机制：

```dart
class CoffeeOrderBloc extends Bloc<CoffeeOrderEvent, CoffeeOrderState> {
  final CoffeeRepository _coffeeRepository;
  static const int _maxRetries = 3;

  CoffeeOrderBloc(this._coffeeRepository) : super(CoffeeOrderInitialState()) {
    on<OrderCoffeeEvent>(_onOrderCoffee);
  }

  Future<void> _onOrderCoffee(
    OrderCoffeeEvent event,
    Emitter<CoffeeOrderState> emit,
  ) async {
    emit(CoffeeOrderProcessingState());

    await _executeWithRetry(
      () async {
        final order = Order(
          coffeeId: event.coffeeId,
          quantity: event.quantity,
          timestamp: DateTime.now(),
        );

        await _coffeeRepository.placeOrder(order);

        emit(CoffeeOrderSuccessState(order));
      },
      (error) {
        emit(CoffeeOrderErrorState(error.toString()));
      },
    );
  }

  Future<void> _executeWithRetry(
    Future<void> Function() operation,
    void Function(String) onError,
  ) async {
    int retryCount = 0;

    while (retryCount < _maxRetries) {
      try {
        await operation();
        return;
      } catch (e) {
        retryCount++;

        if (retryCount >= _maxRetries) {
          onError(e.toString());
          return;
        }

        // 指数退避重试
        final delay = Duration(seconds: math.pow(2, retryCount).toInt());
        await Future.delayed(delay);
      }
    }
  }
}
```

## 第七章：高级 BLOC 技巧

### 7.1 使用 BlocBuilder 的 condition 参数

有时候，小明只想在特定条件下重建 UI：

```dart
BlocBuilder<CoffeeOrderBloc, CoffeeOrderState>(
  buildWhen: (previousState, currentState) {
    // 只有在状态类型改变时才重建
    return previousState.runtimeType != currentState.runtimeType;
  },
  builder: (context, state) {
    return _buildUI(state);
  },
)
```

### 7.2 使用 BlocListener 的 condition 参数

同样，小明也学会了只在特定条件下执行监听逻辑：

```dart
BlocListener<CoffeeOrderBloc, CoffeeOrderState>(
  listenWhen: (previousState, currentState) {
    // 只有在订单成功时才显示SnackBar
    return previousState is! CoffeeOrderSuccessState &&
           currentState is CoffeeOrderSuccessState;
  },
  listener: (context, state) {
    if (state is CoffeeOrderSuccessState) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('订单成功！')),
      );
    }
  },
  child: BlocBuilder<CoffeeOrderBloc, CoffeeOrderState>(
    builder: (context, state) {
      return _buildUI(state);
    },
  ),
)
```

### 7.3 使用 MultiBlocListener 和 MultiBlocProvider

当需要监听多个 BLOC 时，小明学会了使用 MultiBlocListener：

```dart
MultiBlocListener(
  listeners: [
    BlocListener<CoffeeOrderBloc, CoffeeOrderState>(
      listener: (context, state) {
        if (state is CoffeeOrderErrorState) {
          _showOrderError(context, state);
        }
      },
    ),
    BlocListener<CartBloc, CartState>(
      listener: (context, state) {
        if (state is CartUpdatedState) {
          _updateCartBadge(state.items.length);
        }
      },
    ),
    BlocListener<PaymentBloc, PaymentState>(
      listener: (context, state) {
        if (state is PaymentCompletedState) {
          _showPaymentSuccess(context);
        }
      },
    ),
  ],
  child: Scaffold(
    body: _buildBody(),
  ),
)
```

### 7.4 使用 RepositoryProvider

为了更好地管理依赖，小明学会了使用 RepositoryProvider：

```dart
MultiRepositoryProvider(
  providers: [
    RepositoryProvider<CoffeeRepository>(
      create: (context) => CoffeeRepositoryImpl(
        apiClient: context.read<ApiClient>(),
        localStorage: context.read<LocalStorage>(),
      ),
    ),
    RepositoryProvider<PaymentRepository>(
      create: (context) => PaymentRepositoryImpl(
        paymentGateway: context.read<PaymentGateway>(),
      ),
    ),
  ],
  child: MultiBlocProvider(
    providers: [
      BlocProvider<CoffeeOrderBloc>(
        create: (context) => CoffeeOrderBloc(
          coffeeRepository: context.read<CoffeeRepository>(),
        ),
      ),
      BlocProvider<PaymentBloc>(
        create: (context) => PaymentBloc(
          paymentRepository: context.read<PaymentRepository>(),
        ),
      ),
    ],
    child: CoffeeShopApp(),
  ),
)
```

## 故事结局：小明的成功

经过几个月的开发，小明的咖啡店应用终于上线了！使用 BLOC 模式，他实现了：

1. **清晰的代码结构**：每个 BLOC 只负责一个业务领域
2. **易于测试**：所有业务逻辑都可以独立测试
3. **良好的用户体验**：状态变化及时反映到 UI
4. **可维护性**：新功能可以轻松添加，不会影响现有代码

最重要的是，小明的咖啡店应用获得了用户的好评，业务蒸蒸日上！

## 总结

通过小明的故事，我们学习了 BLOC 状态管理模式的全部用法：

1. **基础概念**：事件、状态、BLOC 的关系
2. **核心组件**：BlocProvider、BlocBuilder、BlocListener、BlocConsumer
3. **复杂场景**：购物车、支付、错误处理
4. **测试技巧**：如何为 BLOC 编写单元测试
5. **最佳实践**：命名规范、职责分离、Repository 模式
6. **高级技巧**：条件重建、多 BLOC 监听、依赖管理

BLOC 模式虽然有一定的学习曲线，但一旦掌握，它将为你构建复杂 Flutter 应用提供强大的支持。就像小明的咖啡店一样，你的应用也将拥有清晰的架构、良好的可维护性和出色的用户体验！

记住，BLOC 的核心思想是：**将业务逻辑与 UI 分离，让数据单向流动**。掌握了这一点，你就掌握了 BLOC 的精髓。
