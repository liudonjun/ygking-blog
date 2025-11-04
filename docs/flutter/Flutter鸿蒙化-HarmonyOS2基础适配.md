# Flutter 鸿蒙化实战：HarmonyOS 2 基础适配

---

description: 手把手搭建 Flutter × HarmonyOS 2 开发环境，从工程配置、生命周期适配到插件迁移，快速跑通基础业务。
tag:

- Flutter
- 鸿蒙
- 实战教程
  sidebar: true

---

## 目录

1. 开发环境准备
2. 项目结构与配置差异
3. 生命周期与窗口管理适配
4. Platform Channel 与插件迁移
5. 构建、调试与常见问题
6. 验收清单与下一步计划

---

## 1. 开发环境准备

### 1.1 工具链版本建议

| 组件          | 推荐版本               | 说明                                        |
| ------------- | ---------------------- | ------------------------------------------- |
| Flutter       | 3.22.x（Harmony 分支） | 对应 `flutter-ohos` 分支，补齐鸿蒙 Embedder |
| Dart          | 3.4.x                  | 随 Flutter 分支提供                         |
| DevEco Studio | 5.0（或更高）          | 官方 HarmonyOS IDE，负责 HAP/HSP 构建       |
| HarmonyOS SDK | API 9 (HarmonyOS 2)    | 面向当前主流商用机型                        |
| Node.js       | ≥ 16                   | 必要时用于脚本工具                          |

> **提示**：Harmony 分支 Flutter 可从 `https://gitee.com/openharmony-sig/flutter_packages` 获取，或使用社区维护的 Flutter-Harmony 发行版。

### 1.2 环境检测

```bash
# 安装依赖后执行
flutter doctor -v

# 样例输出（节选）
[✓] Flutter (Channel harmony, 3.22.0, on macOS, locale zh-Hans-CN)
[✓] HarmonyOS toolchain - DevEco Studio (devicetool 3.1.0, hm BUILD 3.1.6)
[✓] Android Studio (仅用于辅助)
```

若 `HarmonyOS toolchain` 失败，请检查以下项目：

- DevEco Studio 是否安装 CLI 组件（DevEco Device Tool / hdc）。
- `hdc` 命令在环境变量中是否可访问。
- OpenHarmony SDK 路径是否在 `~/.devecostudio/configuration/harmonyOsSdk` 正确指向。

### 1.3 DevEco Studio 创建鸿蒙工程

1. 新建 **OpenHarmony > Application > Empty Ability** 项目。
2. 选择 **FA（Feature Ability）** 模型，保持默认包名与签名设置。
3. 记下工程目录，稍后用于 Flutter 项目嵌入。

## 2. 项目结构与配置差异

Flutter 鸿蒙项目采用「Flutter 工程 + Harmony 工程」并行结构：

```
project_root/
├── flutter_app/            # Flutter 主工程
│   ├── lib/
│   ├── pubspec.yaml
│   └── ohos/               # 与 android/ios 类似的嵌入层目录
│       ├── ets/            # ArkTS 胶水代码（FA）
│       ├── entry/src/main/
│       │   ├── config.json
│       │   └── resources/
│       └── CMakeLists.txt  # Flutter Engine 构建配置
└── harmony_app/            # DevEco 创建的壳工程（可选）
```

### 2.1 添加 Harmony 支持模块

执行以下命令向 Flutter 工程注入鸿蒙目录：

```bash
cd flutter_app
flutter-harmony create --org com.example --project-name flutter_harmony_app

# 或使用新版 flutter 命令
flutter create . --platforms=ohos
```

该命令会生成 `ohos/` 目录，其中包含：

- `entry/src/main/ets/MainAbility.ts`：Ability 入口。
- `entry/src/main/ets/flutter_module/`：创建并启动 Flutter 引擎的 ArkTS 逻辑。
- `cxx/`：嵌入层 C++ 入口，桥接 Harmony API。

### 2.2 配置 manifest（config.json）

```json
{
  "app": {
    "bundleName": "com.example.flutter_harmony_app",
    "vendor": "example",
    "versionCode": 1,
    "versionName": "1.0.0"
  },
  "module": {
    "package": "com.example.flutter",
    "mainAbility": "MainAbility",
    "deviceTypes": ["phone", "tablet"],
    "abilities": [
      {
        "name": "MainAbility",
        "type": "page",
        "srcEntrance": "./ets/MainAbility.ts",
        "launchType": "standard",
        "metaData": [
          {
            "name": "flutterEngineDartEntrypoint",
            "value": "main"
          }
        ]
      }
    ]
  }
}
```

关键点：

- `metaData` 指定 Flutter Dart 入口函数。
- `deviceTypes` 声明目标设备，确保覆盖手机/平板等。
- 如需后台任务，可添加 `type: "service"` Ability 辅助实现。

### 2.3 资源与签名

- 将 Flutter 项目的 `assets`、`fonts` 按目录拷贝到 `entry/src/main/resources/rawfile`。
- 在 DevEco Studio 中配置签名证书（可用调试证书）。

## 3. 生命周期与窗口管理适配

HarmonyOS 2 采用 Ability + Page 模型，与 Android Activity 类似但事件名称存在差异。

### 3.1 ArkTS Ability 入口

```ts
// ohos/entry/src/main/ets/MainAbility.ts
export default class MainAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    FlutterEngineManager.getInstance().initEngine(this.context);
  }

  onDestroy() {
    FlutterEngineManager.getInstance().destroyEngine();
  }
}
```

### 3.2 Flutter 引擎包装

```ts
// ohos/entry/src/main/ets/flutter_module/FlutterEngineManager.ts
import Ability from "@ohos.application.UIAbility";
import window from "@ohos.window";

export class FlutterEngineManager {
  private static instance: FlutterEngineManager;
  private engine?: FlutterBoostEngine;

  static getInstance(): FlutterEngineManager {
    if (!FlutterEngineManager.instance) {
      FlutterEngineManager.instance = new FlutterEngineManager();
    }
    return FlutterEngineManager.instance;
  }

  initEngine(context: Ability.Context) {
    if (this.engine) {
      return;
    }
    this.engine = new FlutterBoostEngine(context, {
      dartEntrypoint: "main",
      initialRoute: "/",
    });

    window.getLastWindow(context, (err, data) => {
      if (!err && data) {
        this.engine?.attachToWindow(data);
      }
    });
  }

  destroyEngine() {
    this.engine?.detach();
    this.engine = undefined;
  }
}
```

> **技巧**：为提升页面切换性能，可改为多 Ability 共用单 FlutterEngine，并通过自定义路由表控制页面。

### 3.3 生命周期映射

| Harmony 事件   | 对应 Flutter 方法                         | 建议处理                  |
| -------------- | ----------------------------------------- | ------------------------- |
| `onCreate`     | `WidgetsFlutterBinding.ensureInitialized` | 初始化插件、MethodChannel |
| `onForeground` | `AppLifecycleState.resumed`               | 恢复动画、任务            |
| `onBackground` | `AppLifecycleState.paused`                | 暂停耗电任务、释放资源    |
| `onDestroy`    | `dispose`                                 | 销毁引擎、保存状态        |

Flutter 中可通过 `WidgetsBindingObserver` 监听 app 生命周期：

```dart
class HarmonyLifecycleObserver with WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // 根据 state 做资源管理
  }
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  WidgetsBinding.instance.addObserver(HarmonyLifecycleObserver());
  runApp(const MyApp());
}
```

## 4. Platform Channel 与插件迁移

### 4.1 基础通信模板

Harmony Embedder 在 C++ 层实现 `BinaryMessenger`，ArkTS 层通过 NAPI/ArkUI 访问原生能力。标准 Flutter 插件结构保持不变，但需要新增 `ohos/` 实现。

```
my_plugin/
├── lib/my_plugin.dart
└── ohos/
    ├── ets/MyPlugin.ts       # ArkTS 能力实现
    └── src/main/cpp/plugin.cpp
```

ArkTS 示例：

```ts
import { MethodChannel, MethodCall } from "../flutter_module/method_channel";

export class DeviceInfoPlugin {
  constructor(channel: MethodChannel) {
    channel.setMethodCallHandler(this.handle.bind(this));
  }

  async handle(call: MethodCall): Promise<any> {
    if (call.method === "getDeviceModel") {
      return deviceInfo.getModel();
    }
    throw new Error("Method not implemented");
  }
}
```

Dart 侧：

```dart
const _channel = MethodChannel('com.example/device_info');

Future<String> getDeviceModel() async {
  final model = await _channel.invokeMethod<String>('getDeviceModel');
  return model ?? 'unknown';
}
```

### 4.2 常用插件迁移建议

| 能力          | 推荐做法                                                |
| ------------- | ------------------------------------------------------- |
| 路由混合      | 使用 FlutterBoost Harmony 版，或自建页面栈调度          |
| 图片/文件选择 | 使用鸿蒙系统 API `chooseFile`，注意权限声明             |
| 网络请求      | 优先使用 Dart 层 `dio`，必要时桥接鸿蒙原生网络能力      |
| 定位与地图    | 优先接入华为位置服务（HMS），ArkTS 侧封装 MethodChannel |
| 存储权限      | 配置 `config.json > requestPermissions`，调用前检查授权 |

## 5. 构建、调试与常见问题

### 5.1 命令行构建

```bash
# Debug 构建并安装
flutter build ohos --debug
flutter install ohos --device-id=<deviceId>

# Release 构建 HAP
flutter build ohos --release --split-debug-info=./symbols
```

> `flutter devices` 可列出鸿蒙真机或模拟器，需先通过 `hdc list targets` 确认连接。

### 5.2 调试技巧

- 在 DevEco Studio 中打开 `ohos/` 目录，可直接 ArkTS 断点调试。
- Flutter 层可继续使用 `flutter run` 热重载、DevTools 性能面板。
- 如需查看 Harmony 原生日志，使用 `hdc shell hilog`。

### 5.3 常见问题排查

| 问题                 | 原因分析                        | 解决方案                                                          |
| -------------------- | ------------------------------- | ----------------------------------------------------------------- |
| 启动白屏             | Flutter 引擎未 attach 至 window | 确认 `window.getLastWindow` 回调正常；在 onForeground 再次 attach |
| MethodChannel 无响应 | ArkTS 未正确注册 Handler        | 检查 channel 名称与注册时机，确保在 onCreate 完成注册             |
| 资源找不到           | `rawfile` 路径不正确            | 使用 `AssetManager` API，确保 `config.json` 中声明资源路径        |
| 权限弹窗未出现       | 权限未在 config.json 声明       | 在 `module > abilities > requestPermissions` 添加权限配置         |

## 6. 验收清单与下一步计划

完成基础适配后，可根据以下清单自检：

- [ ] 能在鸿蒙真机/模拟器上启动 Flutter 首页并进行基本交互。
- [ ] 生命周期事件映射正确，前后台切换无异常。
- [ ] 核心插件已提供鸿蒙实现或明确替代方案。
- [ ] 构建产物（Debug/Release HAP）可通过 DevEco Studio 上传部署。
- [ ] 梳理剩余鸿蒙专属能力需求（分布式、元服务等）。

> 下一篇《Flutter 鸿蒙化：HarmonyOS 2 深度优化与工程实践》将继续探讨性能调优、分布式能力接入、安全合规等进阶主题。
