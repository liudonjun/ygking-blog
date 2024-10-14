---
title: 简单了解Flutter
description: Flutter 是由 Google 开发的开源 UI 框架，它的最大优势就是可以用一套代码，同时适配 iOS、Android、Web 甚至桌面平台。简单来说，Flutter 帮助开发者快速构建高性能的应用，而不需要为不同平台写不同的代码。它的底层使用 Dart 语言，很多开发者选择 Flutter 就是因为它开发效率高，性能优越，最重要的是：学起来不难。
tag:
 - Dart
 - Flutter
# top: 1
sidebar: true
---

# 为什么选择 Flutter？

很多人会问，为什么要选择 `Flutter`，而不是 `React Native`、`Kotlin`、`Swift` 这些原生或跨平台的框架呢？其实理由很简单：

-  一次开发，多端运行
想象一下，只写一遍代码，然后就可以在 `iOS`、`Android`、`Web`、桌面上运行，是不是听着就很轻松？Flutter 让这个梦想成为了现实。

-  流畅的用户体验
Flutter 的 UI 是完全自绘的，不依赖平台原生控件。你可以想象一下，它的表现和你直接在游戏引擎里绘制一样顺滑，真正实现了 `60fps、120fps` 的高帧率流畅体验。

- 丰富的组件
无论你是想实现 `Material Design` 还是 `iOS` 风格的 `Cupertino` 设计，Flutter 都为你提供了现成的组件库，不仅使用方便，还可以根据需求自由组合和定制。

-  开发效率爆棚
Flutter 提供了热重载（`Hot Reload`）功能，你可以在应用运行过程中修改代码，并立即看到效果。这对调试和快速迭代非常有帮助。

-  活跃的社区
作为一个越来越受欢迎的框架，Flutter 的生态系统非常丰富，几乎所有你需要的功能（比如`状态管理`、`网络请求`、`存储`等）都有现成的开源插件，开发过程中不需要从零开始。

## Flutter 是怎么运作的？

Flutter 的架构分为三层：

- 框架层（`Framework`）

这一层是开发者最常接触的部分，用 `Dart` 编写。你可以通过这层提供的各种控件（比如按钮、文本框、列表等）来快速搭建界面。

-  引擎层（`Engine`）

`Flutter` 的引擎是用 `C++` 写的，主要负责渲染和事件处理。它依赖 `Skia` 这个强大的图形引擎，能够在屏幕上高效绘制 UI。

-  嵌入层（`Embedder`）
  
这个部分负责与操作系统交互，比如窗口管理、输入输出设备的处理等。每个平台都有它的嵌入层，比如 iOS 的是用 `Objective-C` 或 `Swift` 实现的，而 `Android` 则是 `Java` 或 `Kotlin`。

## Flutter 的核心：Widget

Flutter 的一大特色就是它的 UI 是完全由 `Widget` 组成的。可以说，Flutter 的世界里一切皆 `Widget`。它们有点像是积木，你可以通过组合这些小组件，搭建出复杂的用户界面。

### Flutter 的 Widget 分为两种：

- `StatelessWidget`（无状态组件）

顾名思义，它的状态是固定的，比如一个简单的文本显示组件。这类组件不需要响应用户的交互或者数据变化。

- `StatefulWidget`（有状态组件）


这类组件是可以随着用户的操作或者数据的变化而更新的，比如按钮点击后的状态变化、表单输入等。


每个 Widget 可以包含其他 Widget，通过这种嵌套的方式，构建出复杂的 UI 布局。灵活性和复用性是 Flutter 的一个大亮点。

## 实战：写一个简单的 Flutter 应用


让我们来通过代码感受一下 Flutter 的魅力。以下是一个简单的 "Hello, Flutter!" 应用：

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: Text('Hello, Flutter!'),
        ),
        body: Center(
          child: Text(
            '欢迎来到 Flutter 的世界！',
            style: TextStyle(fontSize: 24),
          ),
        ),
      ),
    );
  }
}


```

这段代码通过几个简单的组件搭建了一个基本的应用：一个带标题的 `AppBar` 和一个居中的文本。运行起来效果很简单，但是已经包含了 `Flutter` 的基本框架。


## Flutter 的日常功能

Flutter 提供了许多强大的功能，让开发变得简单高效。下面是一些常用的功能介绍：

- `路由与导航`

使用 `Navigator` 可以实现页面之间的跳转和堆栈管理，非常适合复杂的应用。

- `网络请求`

使用 `http`、`dio` 库，可以方便地进行网络请求，获取数据并处理响应。

- `持久化存储`

如果你需要保存用户偏好或者本地缓存，可以使用 `shared_preferences` 插件，操作简单且高效。

- `插件系统`

Flutter 提供了丰富的插件支持，涵盖了各种原生功能的调用，比如相机、蓝牙、地理位置等。你还可以根据需求自定义插件，实现更复杂的功能。


## Flutter 的未来

随着 Flutter 的不断更新和发展，它的生态系统越来越成熟，功能也越来越强大。Flutter 3.0 的发布标志着它在 Web 和桌面端的支持已经趋于完善，未来会有更多领域采用 Flutter 作为首选框架。

无论是初学者还是经验丰富的开发者，Flutter 都提供了一个高效、优雅的解决方案。如果你希望用更少的时间和精力构建高质量的跨平台应用，Flutter 无疑是一个很好的选择。