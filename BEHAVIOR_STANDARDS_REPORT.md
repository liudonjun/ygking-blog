# Flutter 项目行为规范分析报告

**项目：** flutter_bloc_artisan / flutter_find_merchant_v2
**日期：** 2026-05-11

---

## 一、项目架构

两个项目共享相同的架构模式。

### 1.1 目录结构

```
lib/
├── common/ (flutter_find_merchant_v2) 或顶层 (flutter_bloc_artisan)
│   ├── api/              # 网络请求层（静态 API 类）
│   ├── components/       # 公共业务组件
│   ├── extension/        # Dart 扩展方法
│   ├── i18n/             # 国际化
│   ├── mixins/           # Mixin（分页、状态管理等）
│   ├── models/           # 数据模型（fromJson/toJson）
│   ├── routers/          # 路由配置（GetPage + 中间件）
│   ├── services/         # 全局服务（GetxService）
│   ├── utils/            # 工具类
│   ├── values/           # 常量、颜色、尺寸、资源路径
│   └── widgets/          # 通用 UI 组件
├── pages/                # 页面
│   ├── xxx/              # 每个页面是一个 module
│   │   ├── index.dart    # library 声明 + export
│   │   ├── view.dart     # UI（GetView<Controller>）
│   │   ├── controller.dart  # 状态与业务逻辑（GetxController）
│   │   ├── binding.dart  # 依赖注入（可选）
│   │   └── widgets/      # 页面级私有组件（可选）
│   └── ...
├── main.dart             # 入口
└── app.dart              # App 配置（路由、主题、本地化）
```

### 1.2 分层原则

| 层 | 目录 | 职责 |
|---|---|---|
| UI 层 | `pages/` | 只负责展示，不含业务逻辑 |
| 业务层 | `services/` | 全局业务逻辑、状态管理 |
| 数据层 | `api/` + `models/` | 网络请求和数据模型 |
| 公共层 | `common/` | 可复用的工具、组件、扩展 |

---

## 二、Page 模块组织

每个页面是一个独立的 Dart library，由以下文件组成：

### 2.1 index.dart — Library 声明

```dart
library order;

export 'controller.dart';
export 'view.dart';
```

**规则：**
- 文件名必须是 `index.dart`
- library 名和目录名一致
- 只 export view.dart 和 controller.dart
- 不 export binding.dart 或 widgets/

### 2.2 view.dart — 页面视图

```dart
class OrderPage extends GetView<OrderController> {
  const OrderPage({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<OrderController>(
      id: "order",
      builder: (_) {
        // 根据 controller 的状态构建 UI
      },
    );
  }
}
```

**规则：**
- 继承 `GetView<对应Controller>`
- 不要在 view 中写业务逻辑
- 通过 `controller.xxx` 访问状态

### 2.3 controller.dart — 状态控制器

```dart
class OrderController extends GetxController {
  // 状态
  bool isLoading = true;
  List<OrderModel> orders = [];
  int currentPage = 1;

  @override
  void onInit() {
    super.onInit();
    loadOrders();
  }

  Future<void> loadOrders() async {
    isLoading = true;
    update(["order"]);
    try {
      final response = await OrderApi.getList(page: currentPage);
      if (response.success && response.data != null) {
        orders = response.data!;
      }
    } finally {
      isLoading = false;
      update(["order"]);
    }
  }
}
```

**规则：**
- 继承 `GetxController`
- 用 `update(["id"])` 精确刷新
- async 操作必须 try/finally 确保 loading 状态正确

### 2.4 pages/index.dart — 总入口

flutter_bloc_artisan 在 `pages/index.dart` 中用 `library pages;` 统一导出所有页面：

```dart
library pages;

export 'about/index.dart';
export 'busy/index.dart';
export 'grab_order/index.dart';
// ...
```

**导入规范：**
```dart
// ✅ 通过总入口导入
import 'package:flutter_bloc_artisan/pages/index.dart';

// ❌ 不要跨模块直接 import
import 'package:flutter_bloc_artisan/pages/order/controller.dart';
```

---

## 三、状态管理（GetX）

### 3.1 路由注册

```dart
GetPage(
  name: RouteNames.home,
  page: () => HomePage(),
  binding: HomeBinding(),
  middlewares: [AuthMiddleware()],
)
```

**规则：**
- 路由名称引用 `RouteNames` 常量
- 禁止使用 `Get.canPop`，使用 `Get.back()`

### 3.2 GetxService

全局服务必须定义静态访问器：

```dart
class AuthService extends GetxService {
  static AuthService get to => Get.find<AuthService>();
}
```

### 3.3 LoadingUtil

```dart
// ✅ 正确
LoadingUtil.show();
LoadingUtil.dismiss();
LoadingUtil.showToast('操作成功');

// ❌ 错误
showLoading();
hideLoading();
```

### 3.4 异步数据更新

首页异步数据获取后必须触发 `update(["home"])`：

```dart
// ✅ 正确
recentOrders = await fetchOrders();
update(["home"]);

// ❌ 错误 — 依赖初始 update，异步结果可能还未赋值
update(["home"]);
recentOrders = await fetchOrders();
```

---

## 四、UI 规范

### 4.1 页面布局骨架

```dart
Scaffold(
  body: JLayout.basic(
    child: SafeArea(
      child: ...
    ),
  ),
)
```

不需要额外处理背景，layout 组件已统一处理。

### 4.2 颜色使用

```dart
// ✅ 正确
Color bgColor = HexColor('#F5F5F5');

// ❌ 错误
Color bgColor = Color(0xFFF5F5F5);
```

### 4.3 手势处理

```dart
JoonFlatGesture(child: widget).onTap(() {
  // handle tap
});
```

### 4.4 Loading 组件

```dart
JddInitialLoadingGuard(
  loading: JddPageLoading(message: '加载中...', fullScreen: false),
  child: JEasyRefresh(...),
)
```

### 4.5 禁止事项

- 非必要场景禁止使用 `IntrinsicHeight` / `IntrinsicWidth`
- 禁止使用 `Get.canPop`

---

## 五、命名规范

| 类型 | 规则 | 示例 |
|---|---|---|
| 文件 | 小写下划线 | `login_page.dart` |
| 类 | 大驼峰 | `LoginPage`, `OrderController` |
| 变量 | 小驼峰 | `userName`, `isLoading` |
| 私有变量 | _ + 小驼峰 | `_currentPage` |
| 枚举值 | 小驼峰 | `OrderType.all` |
| 目录 | 全小写 | `pages/`, `models/` |

---

## 六、AI 编码工作流

### 6.1 开发流程

1. **先描述方案再写代码** — 在编写任何代码之前，先描述你的方案并等待批准
2. **需求不明确先澄清** — 如果需求不明确，在编写代码之前务必提出澄清问题
3. **大任务拆小** — 如果一项任务需要修改超过 3 个文件，先停下来，将其分解成更小的任务
4. **先修复后补测试** — 当用户明确要求先修复后补测试时，先完成修复并说明影响点

### 6.2 Bug 处理流程

1. **先写复现测试** — 发现 bug 时，首先要编写一个能够重现该 bug 的测试
2. **不断修复直到通过** — 不断修复它，直到测试通过

### 6.3 规则沉淀

每次被纠正之后，在 CLAUDE.md 中添加新规则，避免重复犯错。

### 6.4 代码注释

禁止在 view/代码中写设计稿规格类注释（如「设计稿 690×266、padding 30」）。

### 6.5 插件依赖

当用户说需要的 plugin 已下载到 `plugins/` 时，切换依赖为本地 `plugins/` 路径，修改本地 plugin 代码，不要继续改 `.pub-cache`。

### 6.6 Federated 插件

当 federated 插件和平台实现都可用时，两个都要切换到本地路径。

---

## 七、网络层

### 7.1 API 静态类

```dart
class OrderApi {
  static Future<ResponseData<List<OrderModel>>> getList({int page = 1}) async {
    final response = await JddHttp.post<dynamic>('/order/getList', data: {'page': page});
    return response.toModelListData(OrderModel.fromJson);
  }
}
```

### 7.2 数据模型

```dart
class OrderModel {
  final String id;
  final String name;

  OrderModel({required this.id, required this.name});

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }
}
```

**规则：**
- 接口数据必须通过 Model 类转换
- 禁止在业务代码中直接使用 `Map<String, dynamic>`

---

## 八、Flutter 桥接技术文档

已整理缺失文档大纲：`/Users/joon/Desktop/code/dcos/ygking-blog/Flutter桥接技术缺失文档大纲.md`

覆盖 Flutter 与以下系统的桥接：
- 定位服务、联系人管理、短信电话
- 文件管理、设备信息
- 小窗播放、通知系统、蓝牙
- 相机、麦克风
- NFC、AR、传感器

每个主题包含技术方案、示例代码和适配平台。
