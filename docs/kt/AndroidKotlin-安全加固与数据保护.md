---
description: 盘点 Android Kotlin 应用的安全加固措施，从本地存储、网络传输到代码混淆与安全测试。
tag:
  - Kotlin
  - 安全
  - 数据保护
sidebar: true
---

# Android Kotlin 安全加固与数据保护

## 风险模型

| 环节       | 风险                       |
| ---------- | -------------------------- |
| 本地存储   | 明文存储 Token、数据库泄漏 |
| 网络传输   | 中间人攻击、证书伪造       |
| 代码与逻辑 | 逆向分析、调试注入         |
| 第三方 SDK | 数据滥用、隐私泄露         |

## 本地数据保护

- 使用 `EncryptedSharedPreferences`。
- Room 加密：`SQLCipher` 或 `WCDB`。
- 文件加密：AES + 文件分块。

```kotlin
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

val securePrefs = EncryptedSharedPreferences.create(
    context,
    "secure_settings",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

## 网络安全

- 强制 HTTPS，禁用明文流量。
- 证书钉扎：OkHttp `CertificatePinner`。
- 请求签名：HMAC + 时间戳。

```kotlin
val certificatePinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAA=")
    .build()

val client = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

## 代码防护

- R8 混淆、去除日志。
- 启用 `minifyEnabled` + `shrinkResources`。
- 使用 `BuildConfig.DEBUG` 控制调试开关。

`proguard-rules.pro`

```
-keep class kotlinx.coroutines.** { *; }
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
-assumenosideeffects class android.util.Log {
    public static *** d(...);
}
```

## 设备完整性检测

- Root/越狱检测：`SafetyNet`、`Play Integrity`。
- Debug 检测：`adb`、`isDebuggerConnected()`。

```kotlin
if (Debug.isDebuggerConnected()) {
    throw SecurityException("Debugger detected")
}
```

## 权限最小化

- 清单中仅声明必要权限。
- 动态权限申请前提醒用户用途。
- 对敏感权限设置降级方案。

## 日志与监控

- 日志脱敏：对手机号、身份证号等做掩码。
- 安全告警：接入 SIEM 或自建审计。
- 数据生命周期：按需设置自动清理策略。

## 安全测试

- 静态扫描：`MobSF`、`SonarQube`。
- 动态测试：抓包、注入测试。
- 模糊测试：对 API 接口进行异常输入测试。

```bash
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=keystore.jks \
  -Pandroid.injected.signing.store.password=***
```

## 常见问题

| 问题         | 原因                   | 解决方案                                |
| ------------ | ---------------------- | --------------------------------------- |
| 混淆导致崩溃 | keep 规则缺失          | 根据堆栈补充 keep，关注反射与序列化框架 |
| 证书钉扎失败 | 证书更新后 hash 不匹配 | 在服务端更新新证书时同时发布新 hash     |
| 安全补丁滞后 | 依赖库过旧             | 定期检查 CVE，建立依赖升级流程          |

## 总结

1. Kotlin 提供多种安全工具，需要结合系统能力与第三方方案整体设计。
2. 建立“存储、传输、代码”三位一体的安全策略。
3. 将安全测试与监控纳入 CI/CD，实现持续的风险发现与响应。
