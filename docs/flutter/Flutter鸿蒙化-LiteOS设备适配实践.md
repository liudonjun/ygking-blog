# Flutter 鸿蒙化：LiteOS 与 IoT 设备适配实践

---

description: 总结 Flutter 在 LiteOS / OpenHarmony 小型设备中的运行方式，涵盖精简引擎、资源裁剪、低功耗调优与典型场景案例。
tag:

- Flutter
- LiteOS
- IoT
  sidebar: true

---

## 背景概述

LiteOS（含 OpenHarmony 小型系统）主要面向内存 128MB 以下的 IoT、穿戴、车载等设备。Flutter 作为一套重量级 UI 框架，默认难以直接运行在 LiteOS 上。但通过裁剪引擎、定制嵌入层、调整资源策略，仍可实现“Flutter UI + 鸿蒙微内核”的组合，为多终端体验提供统一界面。

## 1. LiteOS 设备特性与挑战

| 指标 | 常见配置                 | 对 Flutter 的影响                |
| ---- | ------------------------ | -------------------------------- |
| RAM  | 64MB ~ 256MB             | 需裁剪 Dart VM、Skia 纹理缓存    |
| 存储 | 128MB ~ 512MB Flash      | 资源压缩、分包加载               |
| CPU  | ARM Cortex-M / A7        | 单核频率低，需谨慎调度线程       |
| GPU  | 无/基础 2D 加速          | 可能需要软件渲染或轻量 GPU 管线  |
| OS   | LiteOS、小型 OpenHarmony | 需要自实现平台接口、系统服务有限 |

## 2. 精简版 Flutter 引擎构建

### 2.1 定制编译参数

在 `engine/src/third_party` 中配置 GN 编译选项：

```gn
flutter_runtime_mode = "release"
dart_runtime_mode = "product"
enable_skia = true
enable_impeller = false          # 若设备无 GPU 支持
skia_use_fontconfig = false
dart_enable_error_messaging = false
```

编译命令：

```bash
./flutter/tools/gn --target-os=ohos --runtime-mode=release --embedder-for-liteos
ninja -C out/ohos_release
```

### 2.2 Dart VM 裁剪策略

- 禁用 JIT，使用 AOT 预编译（`flutter build ohos --release --tree-shake-icons`）。
- 移除不必要的核心库（镜像反射、开发者工具）。
- 启用 `--obfuscate` + `--split-debug-info` 减小代码体积。

### 2.3 纹理与图片资源管理

- 限制缓存张数：

```dart
PaintingBinding.instance.imageCache.maximumSize = 50;
PaintingBinding.instance.imageCache.maximumSizeBytes = 20 * 1024 * 1024;
```

- 对图片资源进行 WebP/AVIF 压缩；必要时动态下载。

## 3. LiteOS Embedder 关键实现

### 3.1 事件循环与线程模型

LiteOS 提供轻量级 Task 调度，需要自行实现 `TaskRunner`：

```cpp
class LiteOSTaskRunner : public flutter::TaskRunner {
 public:
  void PostTask(flutter::Task task) override {
    LOS_TaskCreate(&taskAttr_, [](void* arg) {
      auto* t = reinterpret_cast<flutter::Task*>(arg);
      t->task();
    }, &task);
  }
};

flutter::Settings settings;
settings.task_runners = {
  .platform = std::make_unique<LiteOSTaskRunner>(),
  .raster = std::make_unique<LiteOSTaskRunner>(),
  .ui = std::make_unique<LiteOSTaskRunner>(),
  .io = std::make_unique<LiteOSTaskRunner>(),
};
```

### 3.2 渲染输出

无 GPU 时，可使用 Skia CPU Backend，将渲染结果输出到 Framebuffer：

```cpp
sk_sp<GrDirectContext> context = nullptr; // 关闭 GPU
sk_sp<SkSurface> surface = SkSurface::MakeRasterN32Premul(width, height);
shell->GetPlatformView()->NotifyCreated(surface);
```

若设备支持 OpenGL ES 2.0，可引入轻量 EGL 实现。

### 3.3 输入事件

将触控/按键事件映射为 Flutter PointerEvent：

```cpp
void LiteOSEmbedder::DispatchTouch(float x, float y, TouchType type) {
  flutter::PointerData data;
  data.x = x;
  data.y = y;
  data.change = type == DOWN ? flutter::PointerData::kDown : flutter::PointerData::kUp;
  data.kind = flutter::PointerData::kTouch;
  pointer_queue_.Push(data);
  shell_->SendPointerEvent(pointer_queue_);
}
```

## 4. 场景案例

### 4.1 穿戴设备（eSIM 手表）

- 屏幕尺寸小，需准备专用 UI 适配：使用 `LayoutBuilder` 做环形布局。
- 音频播放可调用 LiteOS 提供的 PCM 接口，Flutter 侧封装 MethodChannel。
- 常驻任务受限，建议将耗时逻辑迁移至设备云端。

### 4.2 车载仪表（仪表盘、HUD）

- 多数设备提供基础 GPU，可开启 Skia GPU Backend。
- 实现多屏渲染：Flutter 输出主屏，辅助屏 ArkTS/原生实现。
- 通过鸿蒙分布式能力与主车机协同，接收实时数据。

### 4.3 智能家居面板

- 资源受限但需炫酷 UI，可以 Flutter 绘制动画，ArkTS 负责传感器。
- 与 Harmony 原子化服务结合，实现手机一碰即用交互。

## 5. 低功耗与稳定性策略

| 方向     | 策略                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| CPU 占用 | 降低动画帧率（`SchedulerBinding.instance.timeDilation = 1.2`）；在后台暂停动画 |
| 内存泄漏 | 避免全局缓存、释放静态资源；定期触发 GC                                        |
| 启动速度 | 预加载 Flutter Engine，使用压缩快启包                                          |
| 崩溃恢复 | LiteOS Watchdog 结合 Flutter 状态持久化；崩溃后自动重启指定能力                |

## 6. 测试与验收

### 6.1 自动化测试

- 单元测试：Flutter 层 `flutter test`。
- 集成测试：基于 `integration_test` + LiteOS 定制驱动。
- 真机回归：构建设备农场（可与华为云设备云结合）。

### 6.2 验收项

- [ ] 启动耗时 < 3 秒（含引擎初始化）。
- [ ] 内存峰值 < 设备可用 RAM 的 70%。
- [ ] 恒温运行 24 小时无泄漏、卡死。
- [ ] 低电量模式下模块自动降帧、降频。
- [ ] 通过鸿蒙小型系统适配测试。

## 7. 推荐工具与资源

- **OpenHarmony 小型系统源码**：<https://gitee.com/openharmony>
- **鸿蒙 IoT 社区插件**：关注 `openharmony-sig` 维护的 Flutter 插件。
- **Skia CPU 渲染指南**：官方 Skia 文档。
- **DevEco Device Tool**：用于 LiteOS 设备的烧录、调试。

## 结语

让 Flutter 运行在 LiteOS 上并非一蹴而就，它需要跨越引擎裁剪、系统调用改写、性能调优等多个技术门槛。然而，一旦打通，即可实现移动端、IoT、车载的视觉与交互统一，为多设备体验构建提供强有力的支撑。

至此，《Flutter 鸿蒙化》系列五篇文章全部完成：

1. 概述篇
2. HarmonyOS 2 基础适配
3. HarmonyOS 2 进阶优化
4. HarmonyOS NEXT 适配指南
5. LiteOS 设备适配实践

欢迎结合团队业务实际，制定适配路线图，并持续关注鸿蒙生态的更新迭代。
