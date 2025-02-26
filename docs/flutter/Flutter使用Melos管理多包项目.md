---
title: Flutter 使用 Melos 管理多包项目
description: 详细介绍如何使用 Melos 工具管理 Flutter 多包项目，包括项目配置、包管理、版本控制等内容。
tag:
 - Flutter
 - 工程化
sidebar: true
---

# Flutter 使用 Melos 管理多包项目

## 简介

Melos 是一个用于管理 Dart/Flutter 多包项目(monorepo)的工具，它提供了强大的工作空间管理、版本控制和发布功能。本文将详细介绍如何使用 Melos 来管理 Flutter 多包项目。

## 基本配置

### 安装 Melos

```bash
# 全局安装 melos
dart pub global activate melos

# 验证安装
melos --version
```

### 初始化项目

```bash
# 创建新项目
mkdir my_monorepo
cd my_monorepo

# 初始化 melos
melos init
```

### melos.yaml 配置

```yaml
name: my_monorepo

packages:
  - packages/**
  - apps/**

command:
  version:
    # 确保所有包使用相同的版本号
    linkToCommit: true
    
  bootstrap:
    # 运行 pub get 之前的钩子
    hooks:
      pre: |
        dart pub global activate melos
        
scripts:
  analyze:
    # 分析所有包
    run: |
      melos exec -c 1 -- \
        flutter analyze .
    description: Run `flutter analyze` for all packages
    
  test:
    # 运行所有测试
    run: |
      melos exec -c 1 --fail-fast -- \
        flutter test
    description: Run all tests in this project
    
  build:
    # 构建所有包
    run: |
      melos exec -c 1 -- \
        flutter build
    description: Build all packages
```

## 项目结构

```
my_monorepo/
├── apps/                 # 应用程序
│   ├── mobile/          # 移动应用
│   └── web/             # Web 应用
├── packages/            # 共享包
│   ├── core/           # 核心库
│   ├── ui/             # UI 组件库
│   └── utils/          # 工具库
├── melos.yaml          # Melos 配置
└── pubspec.yaml        # 根 pubspec
```

## 包管理

### 创建新包

```bash
# 创建新的 Flutter 包
cd packages
flutter create --template=package my_package

# 创建新的 Dart 包
dart create -t package my_dart_package
```

### 包依赖管理

```yaml
# packages/my_package/pubspec.yaml
name: my_package
version: 0.1.0
dependencies:
  core:
    path: ../core
  utils:
    path: ../utils
```

### 工作空间命令

```bash
# 初始化所有包
melos bootstrap

# 清理所有包
melos clean

# 运行特定脚本
melos run analyze
melos run test
melos run build
```

## 版本管理

### 版本更新

```bash
# 更新所有包版本
melos version

# 指定版本类型
melos version --graduate
melos version --preid beta
```

### 发布配置

```yaml
# melos.yaml
command:
  publish:
    # 确保在发布前运行测试
    hooks:
      pre: |
        melos run test
    
    # 发布配置
    ignoredPackages:
      - "example*"
```

### 发布包

```bash
# 发布所有包
melos publish

# 发布特定包
melos publish --package my_package
```

## 工作流示例

### 开发流程

```bash
# 1. 克隆项目
git clone my_monorepo
cd my_monorepo

# 2. 初始化工作空间
melos bootstrap

# 3. 创建新功能分支
git checkout -b feature/new-feature

# 4. 开发和测试
melos run test
melos run analyze

# 5. 提交更改
git commit -m "feat: add new feature"

# 6. 更新版本
melos version
```

### CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Flutter
      uses: subosito/flutter-action@v2
      
    - name: Install Melos
      run: dart pub global activate melos
      
    - name: Bootstrap workspace
      run: melos bootstrap
      
    - name: Run tests
      run: melos run test
      
    - name: Analyze
      run: melos run analyze
```

## 最佳实践

1. **包组织**
   - 按功能划分包
   - 保持包的独立性
   - 避免循环依赖

```
packages/
├── core/           # 核心功能
├── ui/            # UI 组件
│   ├── buttons/
│   └── forms/
└── features/      # 业务功能
    ├── auth/
    └── profile/
```

2. **版本控制**
   - 使用语义化版本
   - 保持版本一致性
   - 记录更新日志

```bash
# 更新版本并生成更新日志
melos version --graduate \
  --changelog-path CHANGELOG.md
```

3. **依赖管理**
   - 明确依赖关系
   - 避免重复依赖
   - 定期更新依赖

```yaml
# packages/feature/pubspec.yaml
dependencies:
  core:
    path: ../core
  ui:
    path: ../ui
```

## 常见问题

### 1. 依赖冲突

```bash
# 检查依赖冲突
melos exec -- flutter pub deps

# 解决冲突
melos clean
melos bootstrap --force
```

### 2. 版本同步

```yaml
# melos.yaml
command:
  version:
    linkToCommit: true
    synchronize: true
```

### 3. 发布失败

```bash
# 检查发布状态
melos publish --dry-run

# 强制发布
melos publish --force-publish
```

## 注意事项

1. **工作空间管理**
   - 定期清理缓存
   - 保持依赖最新
   - 避免全局状态

2. **性能优化**
   - 合理划分包大小
   - 优化构建脚本
   - 缓存构建产物

3. **团队协作**
   - 统一版本规范
   - 完善文档说明
   - 规范提交信息

## 总结

Melos 是一个强大的多包项目管理工具，它可以帮助我们更好地组织和管理 Flutter 项目。通过合理使用 Melos，我们可以提高开发效率，简化版本管理，实现更好的代码复用。在使用过程中，需要注意包的划分、依赖管理和版本控制等问题，确保项目的可维护性和可扩展性。 