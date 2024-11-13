---
title: Flutter 应用打包发布详解
description: 详细介绍 Flutter 应用的打包和发布流程。
tag:
 - Flutter
 - 实战
sidebar: true
---

# Flutter 应用打包发布详解

## 简介

应用打包发布是开发流程中的重要环节。本文详细介绍如何打包和发布 Flutter 应用到 Android 和 iOS 平台。

## Android 打包

### 生成密钥
```bash
keytool -genkey -v -keystore key.jks \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -alias key
```

### 配置密钥

#### 创建 key.properties
```properties
storePassword=<store password>
keyPassword=<key password>
keyAlias=key
storeFile=<key store file location>
```

#### 配置 build.gradle
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'),
                    'proguard-rules.pro'
        }
    }
}
```

### 打包命令
```bash
# 生成 APK
flutter build apk --release

# 生成 App Bundle
flutter build appbundle
```

## iOS 打包

### 配置证书
1. 在 Apple Developer 网站创建证书
2. 在 Xcode 中配置证书和 Provisioning Profile

### 配置应用信息
```xml
<!-- ios/Runner/Info.plist -->
<key>CFBundleDisplayName</key>
<string>应用名称</string>
<key>CFBundleIdentifier</key>
<string>com.example.myapp</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

### 打包命令
```bash
flutter build ios --release
```

## 版本管理

### pubspec.yaml
```yaml
version: 1.0.0+1  # 版本号+构建号
```

### 版本号格式
- 主版本号.次版本号.修订号
- 构建号(整数,单调递增)

## 多渠道打包

### Android 渠道配置
```gradle
android {
    flavorDimensions "default"
    productFlavors {
        google {
            dimension "default"
            manifestPlaceholders = [
                CHANNEL_VALUE: "google"
            ]
        }
        huawei {
            dimension "default"
            manifestPlaceholders = [
                CHANNEL_VALUE: "huawei"
            ]
        }
    }
}
```

### 打包命令
```bash
# 打包特定渠道
flutter build apk --flavor google
flutter build apk --flavor huawei
```

## 自动化打包

### Fastlane 配置
```ruby
# fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Deploy to Play Store"
  lane :deploy do
    gradle(
      task: "clean assembleRelease",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_FILE"],
        "android.injected.signing.store.password" => ENV["STORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
      }
    )
    upload_to_play_store(
      track: 'internal',
      aab: '../build/app/outputs/bundle/release/app-release.aab'
    )
  end
end

platform :ios do
  desc "Deploy to App Store"
  lane :deploy do
    build_ios_app(
      workspace: "Runner.xcworkspace",
      scheme: "Runner",
      export_method: "app-store"
    )
    upload_to_app_store(
      skip_screenshots: true,
      skip_metadata: true
    )
  end
end
```

### CI/CD 配置
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v1
        with:
          java-version: '11'
      - uses: subosito/flutter-action@v1
      - run: flutter pub get
      - run: flutter test
      - run: flutter build apk --release
      - uses: actions/upload-artifact@v2
        with:
          name: release-apk
          path: build/app/outputs/flutter-apk/app-release.apk
```

## 发布检查清单

### 通用检查
- [ ] 版本号更新
- [ ] Changelog 更新
- [ ] 隐私政策更新
- [ ] 用户协议更新
- [ ] 应用图标和启动图
- [ ] 应用名称和描述
- [ ] 测试覆盖
- [ ] 性能测试

### Android 检查
- [ ] 签名配置
- [ ] 混淆配置
- [ ] 权限声明
- [ ] 应用截图
- [ ] 应用分级

### iOS 检查
- [ ] 证书配置
- [ ] 设备支持
- [ ] 隐私声明
- [ ] 应用截图
- [ ] 审核信息

## 最佳实践

1. 使用版本控制
2. 自动化构建流程
3. 分环境配置
4. 代码混淆
5. 安全性检查

## 注意事项

1. 密钥保管
2. 敏感信息处理
3. 版本兼容性
4. 发布时间规划
5. 紧急回滚方案

## 总结

应用打包发布是一个复杂的过程,需要注意很多细节。通过合理的配置和自动化工具,可以简化发布流程,提高发布效率。 