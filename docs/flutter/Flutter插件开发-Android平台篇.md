---
description: 本文详细介绍 Flutter 插件在 Android 平台的开发流程，包括 Java/Kotlin 接口实现、生命周期管理和权限处理。
tag:
  - Flutter
  - 插件开发
  - Android
sticky: 1
sidebar: true
---

# Flutter 插件开发 Android 平台篇

## 开发环境配置

### 1. Android 开发环境

- Android Studio 安装
- Android SDK 配置
- Gradle 版本设置

### 2. 项目配置

```groovy
// android/build.gradle
android {
  compileSdkVersion 33
  
  defaultConfig {
    minSdkVersion 21
    targetSdkVersion 33
  }
}

dependencies {
  implementation 'androidx.core:core-ktx:1.9.0'
  // 其他依赖
}
```

## 插件实现

### 1. Kotlin 实现

```kotlin
// android/src/main/kotlin/com/example/example_plugin/ExamplePlugin.kt
class ExamplePlugin: FlutterPlugin, MethodCallHandler {
  private lateinit var channel: MethodChannel
  private lateinit var context: Context

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    context = binding.applicationContext
    channel = MethodChannel(binding.binaryMessenger, "example_plugin")
    channel.setMethodCallHandler(this)
  }

  override fun onMethodCall(call: MethodCall, result: Result) {
    when (call.method) {
      "getPlatformVersion" -> {
        result.success("Android ${android.os.Build.VERSION.RELEASE}")
      }
      else -> {
        result.notImplemented()
      }
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel.setMethodCallHandler(null)
  }
}
```

### 2. Java 实现

```java
// android/src/main/java/com/example/example_plugin/ExamplePlugin.java
public class ExamplePlugin implements FlutterPlugin, MethodCallHandler {
  private MethodChannel channel;
  private Context context;

  @Override
  public void onAttachedToEngine(@NonNull FlutterPluginBinding binding) {
    context = binding.getApplicationContext();
    channel = new MethodChannel(binding.getBinaryMessenger(), "example_plugin");
    channel.setMethodCallHandler(this);
  }

  @Override
  public void onMethodCall(@NonNull MethodCall call, @NonNull Result result) {
    if (call.method.equals("getPlatformVersion")) {
      result.success("Android " + android.os.Build.VERSION.RELEASE);
    } else {
      result.notImplemented();
    }
  }

  @Override
  public void onDetachedFromEngine(@NonNull FlutterPluginBinding binding) {
    channel.setMethodCallHandler(null);
  }
}
```

## 生命周期管理

### 1. Activity 感知

```kotlin
class ExamplePlugin: FlutterPlugin, ActivityAware {
  private var activity: Activity? = null

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activity = binding.activity
  }

  override fun onDetachedFromActivity() {
    activity = null
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    onAttachedToActivity(binding)
  }

  override fun onDetachedFromActivityForConfigChanges() {
    onDetachedFromActivity()
  }
}
```

### 2. 资源管理

```kotlin
class ExamplePlugin: FlutterPlugin {
  private var resources: Resources? = null
  private var disposables = CompositeDisposable()

  override fun onAttachedToEngine(binding: FlutterPluginBinding) {
    resources = binding.applicationContext.resources
  }

  override fun onDetachedFromEngine(binding: FlutterPluginBinding) {
    resources = null
    disposables.clear()
  }
}
```

## 权限处理

### 1. 权限声明

```xml
<!-- android/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.example.example_plugin">
  
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
</manifest>
```

### 2. 运行时权限

```kotlin
class ExamplePlugin: FlutterPlugin, ActivityAware {
  private val PERMISSION_REQUEST_CODE = 100
  private var permissionResult: Result? = null

  private fun checkAndRequestPermission(permission: String, result: Result) {
    if (activity == null) {
      result.error("NO_ACTIVITY", "Plugin requires activity", null)
      return
    }

    if (ContextCompat.checkSelfPermission(activity!!, permission)
        == PackageManager.PERMISSION_GRANTED) {
      result.success(true)
    } else {
      permissionResult = result
      ActivityCompat.requestPermissions(
        activity!!,
        arrayOf(permission),
        PERMISSION_REQUEST_CODE
      )
    }
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<String>,
    grantResults: IntArray
  ): Boolean {
    if (requestCode == PERMISSION_REQUEST_CODE && permissionResult != null) {
      permissionResult?.success(
        grantResults.isNotEmpty() &&
        grantResults[0] == PackageManager.PERMISSION_GRANTED
      )
      permissionResult = null
      return true
    }
    return false
  }
}
```

## 性能优化

### 1. 异步处理

```kotlin
class ExamplePlugin: FlutterPlugin {
  private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

  private fun performHeavyTask(result: Result) {
    scope.launch {
      try {
        // 执行耗时操作
        val data = processData()
        // 切换到主线程返回结果
        withContext(Dispatchers.Main) {
          result.success(data)
        }
      } catch (e: Exception) {
        withContext(Dispatchers.Main) {
          result.error("ERROR", e.message, null)
        }
      }
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPluginBinding) {
    scope.cancel()
  }
}
```

### 2. 内存管理

```kotlin
class ExamplePlugin: FlutterPlugin {
  private var cache: LruCache<String, Bitmap>? = null

  override fun onAttachedToEngine(binding: FlutterPluginBinding) {
    val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    val cacheSize = maxMemory / 8
    cache = object : LruCache<String, Bitmap>(cacheSize) {
      override fun sizeOf(key: String, bitmap: Bitmap): Int {
        return bitmap.byteCount / 1024
      }
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPluginBinding) {
    cache?.evictAll()
    cache = null
  }
}
```

## 调试与测试

### 1. 日志记录

```kotlin
class ExamplePlugin: FlutterPlugin {
  companion object {
    private const val TAG = "ExamplePlugin"
  }

  private fun logDebug(message: String) {
    if (BuildConfig.DEBUG) {
      Log.d(TAG, message)
    }
  }

  private fun logError(message: String, error: Throwable? = null) {
    Log.e(TAG, message, error)
  }
}
```

### 2. 单元测试

```kotlin
// android/src/test/kotlin/com/example/example_plugin/ExamplePluginTest.kt
class ExamplePluginTest {
  @Test
  fun testPlugin() {
    val plugin = ExamplePlugin()
    // 测试代码
  }
}
```

## 最佳实践

### 1. 代码规范

- 使用 Kotlin 编写新代码
- 遵循 Android 编码规范
- 合理组织代码结构

### 2. 错误处理

- 提供详细的错误信息
- 实现优雅降级
- 添加适当的重试机制

### 3. 版本兼容

- 处理 API 版本差异
- 提供向后兼容性
- 文档化版本要求

## 总结

Android 平台插件开发的关键点：

1. 合理的项目结构
2. 完善的生命周期管理
3. 规范的权限处理
4. 优秀的性能表现

通过本文的学习，你应该已经掌握了 Flutter 插件在 Android 平台的开发要点。下一篇文章将介绍 iOS 平台插件的开发。