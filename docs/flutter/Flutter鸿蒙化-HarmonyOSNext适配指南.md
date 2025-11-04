# Flutter 鸿蒙化：HarmonyOS NEXT 适配指南

---

description: 面向全新的 HarmonyOS NEXT 微内核与 ArkTS 体系，详解 Flutter 工程如何演进、重构 Embedder，并拥抱纯鸿蒙生态。
tag:

- Flutter
- HarmonyOS NEXT
- ArkTS
  sidebar: true

---

## 前言

HarmonyOS NEXT 宣告“纯鸿蒙时代”到来：Android 兼容层移除、ArkTS/ArkUI 成为唯一推荐开发语言与 UI 框架。对于依赖 Flutter 的团队来说，这既是挑战也是机会。本指南从系统架构变化入手，给出适配策略、工程要点与渐进式迁移方案。

## 1. HarmonyOS NEXT 发生了什么变化？

| 维度     | HarmonyOS 2/3                 | HarmonyOS NEXT                    | 影响                                      |
| -------- | ----------------------------- | --------------------------------- | ----------------------------------------- |
| 内核     | Linux + LiteOS 混合           | 纯鸿蒙微内核（自研）              | 需重写系统调用与驱动接入                  |
| 编程语言 | Java/Kotlin、C/C++、ArkTS     | ArkTS 为主（官方），C/C++ 辅助    | Flutter Embedder 需以 ArkTS + NAPI 为桥接 |
| UI 框架  | Java UIAbility + AbilitySlice | ArkUI Declarative                 | 页面容器改为 Stage 模型 + ArkUI 组合      |
| 应用模型 | Ability（FA/Stage 共存）      | Stage Model 统一                  | Flutter 嵌入需 StageEntryAbility          |
| 能力调用 | 多语言混合 API                | Harmony Native API（ArkTS First） | 插件实现重写，适配 ArkTS 模块化           |

## 2. Flutter 在 NEXT 的定位

官方尚未提供 Flutter 官方支持，但社区与企业已经探索出三条路径：

1. **ArkTS 容器 + Flutter Engine**：在 StageEntryAbility 中创建 Flutter Engine，将渲染输出嵌入 ArkUI `CustomComponent`。
2. **ArkTS + WASM + Flutter Web**：将 Flutter 编译为 Web/WASM，通过 ArkUI WebComponent 渲染（适合轻量场景）。
3. **业务拆分**：核心链路使用 ArkTS 原生开发，Flutter 承担特定业务模块，通过分布式或 IPC 集成。

本文重点讨论第一种方案，即直接在 NEXT 上运行 Flutter Engine。

## 3. Stage 模型下的 Flutter 容器设计

### 3.1 项目结构

```
ohos/
├── entry/
│   ├── ets/
│   │   ├── AppStorage.ets
│   │   ├── StageAbility.ets       # StageEntryAbility
│   │   └── flutter_bridge/
│   │       ├── FlutterStage.ets   # ArkUI 容器，与 Flutter Surface 绑定
│   │       └── channels/
│   │           └── MethodChannel.ets
│   └── src/main/resources/
├── cxx/
│   ├── flutter_stage.cc           # 新 Embedder，一致使用 NAPI
│   └── plugins/
└── build-profile.json5
```

### 3.2 StageEntryAbility 入口

```ets
import AbilityStage from '@ohos.app.ability.StageAbility';
import { FlutterStage } from './flutter_bridge/FlutterStage';

@Entry
@Component
struct MainAbility {
  private flutterStage: FlutterStage = new FlutterStage();

  onCreate() {
    this.flutterStage.initialize({
      dartEntrypoint: 'main',
      initialRoute: '/home',
    });
  }

  onForeground() {
    this.flutterStage.onForeground();
  }

  build() {
    Column() {
      this.flutterStage.render();
    }.width('100%').height('100%');
  }
}
```

### 3.3 FlutterStage 封装

```ets
import window from '@ohos.window';
import { FlutterEngine } from './engine/FlutterEngine';

export class FlutterStage {
  private engine: FlutterEngine = new FlutterEngine();
  private surfaceId: number = -1;

  initialize(options: { dartEntrypoint: string; initialRoute: string }) {
    this.engine.init(options);
  }

  onForeground() {
    this.engine.sendLifecycle('resumed');
  }

  render() {
    if (this.surfaceId < 0) {
      // 创建 ArkUI CustomComponent，以承载 Flutter Surface
      return CustomComponent({
        onLoaded: (el: DrawContext) => {
          this.surfaceId = el.surfaceId;
          this.engine.attachSurface(this.surfaceId);
        }
      });
    }
    return CustomComponent({ surfaceId: this.surfaceId });
  }
}
```

### 3.4 C++ Embedder 要点

主要变化包括：

- 使用 ArkUI 提供的 `OH_NativeWindow` 创建可绘制 Surface。
- 将输入事件（触控、键盘）转换为 Flutter Recognizer 支持的格式。
- 适配微内核线程模型（使用 `uv` 或 Harmony TaskPool）。

```cpp
void FlutterStage::AttachSurface(int64_t surfaceId) {
  OH_NativeWindow* window = OH_NativeWindow_FromSurfaceId(surfaceId);
  flutter_renderer_->SetNativeWindow(window);
  shell_->OnPlatformViewCreated();
}

void FlutterStage::DispatchPointerEvent(const ArkPointerEvent& event) {
  flutter::PointerDataPacket packet;
  // 填充 event -> packet
  shell_->SendPointerEvent(packet);
}
```

> 由于 NEXT 使用全新驱动与图形栈，需关注 GPU 兼容性；Skia 版本升级至 Harmony 要求的 GN/Clang 工具链。

## 4. ArkTS 插件体系重构

NEXT 推荐以 ArkTS 模块化方式封装原生能力：

```
plugins/
├── camera/
│   ├── lib/camera.dart
│   ├── ohos/ets/CameraPlugin.ets
│   └── cxx/camera_plugin.cpp
└── auth/
```

### 4.1 MethodChannel ArkTS 实现

```ets
export class MethodChannel {
  constructor(private name: string) {}

  postMessage(method: string, args?: Object) {
    globalThis.nativeChannel.postMessage(this.name, method, args);
  }

  setHandler(handler: (method: string, args: Object) => Promise<any>) {
    globalThis.nativeChannel.registerHandler(this.name, handler);
  }
}
```

### 4.2 原生能力示例：管控分布式文件

```ets
import fileShare from '@ohos.data.fileShare';

export class DistributedFilePlugin {
  constructor(channel: MethodChannel) {
    channel.setHandler(this.handle.bind(this));
  }

  async handle(method: string, args: any) {
    switch (method) {
      case 'listFiles':
        return fileShare.list(args.path);
      case 'openFile':
        return fileShare.open(args.path, args.mode);
      default:
        throw new Error('unknown method');
    }
  }
}
```

## 5. 迁移策略与风险控制

### 5.1 双轨并行策略

| 阶段       | 目标                         | 说明                             |
| ---------- | ---------------------------- | -------------------------------- |
| T0（现状） | HarmonyOS 2/3 + Flutter      | 继续维护存量用户                 |
| T1（过渡） | 引入 NEXT 版 Flutter 容器    | 少量机型灰度，验证稳定性         |
| T2（目标） | NEXT 原生能力 + Flutter 混合 | 核心流程 ArkTS，增值业务 Flutter |

### 5.2 风险点

1. **官方支持缺失**：需要自行维护 Embedder，关注 Flutter 社区动态。
2. **安全审核**：NEXT 对权限、数据调用审查更严格，需按照 ArkTS 规范实现。
3. **性能不确定性**：Skia 在新内核的表现仍需大量测试，建议准备备选 UI 方案。
4. **人力结构调整**：ArkTS 成为主流，Flutter 团队需补强 ArkTS 能力，或引入双栈人才。

## 6. 工程实践建议

1. **模块化管理**：将 Flutter 部分封装为独立模块，通过 ArkTS API 暴露入口，便于替换。
2. **接口抽象**：所有系统能力先抽象 Dart 接口 + ArkTS 实现，可随时替换为 ArkTS 原生版本。
3. **自动化测试**：搭建 ArkTS UI 自动化（基于 OpenHarmony TestKit）+ Flutter 集成测试的双套测试体系。
4. **可观测性**：引入统一日志、性能监控，支持多框架互通。

## 7. 结论与展望

HarmonyOS NEXT 彻底拥抱 ArkTS，这意味着 Flutter 团队需要：

- 学习并掌握 ArkTS/ArkUI，理解与 Flutter 的互补关系。
- 投资于自研 Embedder，或关注社区合力成果，形成长期维护能力。
- 在业务层做拆分，区别哪部分必须 ArkTS 原生，哪部分可继续由 Flutter 承担。

未来可关注：

- 官方是否推出 Flutter NEXT 适配计划。
- 社区在 GPU、输入、原子化服务等领域的进展。
- Flutter Web/WASM 与 ArkUI 组合的轻量级方案。

下一篇《Flutter 鸿蒙化：LiteOS 设备与 IoT 适配实践》将探索在资源受限设备上运行 Flutter 的方法与经验。
