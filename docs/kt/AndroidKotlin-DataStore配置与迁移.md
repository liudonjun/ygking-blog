---
description: 详解 Jetpack DataStore 的使用场景、Proto 配置与 SharedPreferences 迁移方案。
tag:
  - Kotlin
  - DataStore
  - Android
sidebar: true
---

# Android Kotlin DataStore 配置与迁移

## DataStore 简介

- 替代 SharedPreferences 的数据存储方案。
- 分为 Preferences（键值对）与 Proto（类型安全）。
- 支持 Kotlin Flow，天然异步。

## Preferences DataStore

```kotlin
val Context.settingsDataStore by preferencesDataStore(name = "settings")

object SettingsKeys {
    val DARK_MODE = booleanPreferencesKey("dark_mode")
}

suspend fun setDarkMode(enabled: Boolean, context: Context) {
    context.settingsDataStore.edit { prefs ->
        prefs[SettingsKeys.DARK_MODE] = enabled
    }
}

val darkModeFlow: Flow<Boolean> = context.settingsDataStore.data
    .map { prefs -> prefs[SettingsKeys.DARK_MODE] ?: false }
```

## Proto DataStore

### 1. 定义 proto

`user_prefs.proto`

```
syntax = "proto3";

option java_package = "com.example.datastore";

message UserPreferences {
  string userId = 1;
  string locale = 2;
}
```

### 2. 配置 Gradle

```kotlin
plugins {
    id("com.google.protobuf") version "0.9.4"
}

protobuf {
    protoc { artifact = "com.google.protobuf:protoc:3.25.3" }
    generateProtoTasks {
        all().forEach { task ->
            task.builtins {
                create("java")
                create("kotlin")
            }
        }
    }
}
```

### 3. 使用 ProtoDataStore

```kotlin
val Context.userPreferencesDataStore: DataStore<UserPreferences> by dataStore(
    fileName = "user_prefs.pb",
    serializer = UserPreferencesSerializer
)

object UserPreferencesSerializer : Serializer<UserPreferences> {
    override val defaultValue: UserPreferences = UserPreferences.getDefaultInstance()

    override suspend fun readFrom(input: InputStream): UserPreferences =
        try {
            UserPreferences.parseFrom(input)
        } catch (e: InvalidProtocolBufferException) {
            throw CorruptionException("Cannot read proto.", e)
        }

    override suspend fun writeTo(t: UserPreferences, output: OutputStream) = t.writeTo(output)
}
```

## SharedPreferences 迁移

```kotlin
val Context.migratedDataStore by dataStore(
    fileName = "settings.pb",
    serializer = SettingsSerializer,
    produceMigrations = { context ->
        listOf(SharedPreferencesMigration(context, "old_settings"))
    }
)
```

迁移逻辑可在 `SharedPreferencesMigration.migrate` 中自定义。

## 多模块集成

- 在 `core/datastore` 模块封装公共接口。
- 通过 Hilt `@Provides` 注入 `DataStore` 实例。

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {
    @Provides
    fun provideUserPreferences(@ApplicationContext context: Context): DataStore<UserPreferences> {
        return context.userPreferencesDataStore
    }
}
```

## 测试与调试

```kotlin
@RunWith(AndroidJUnit4::class)
class DataStoreTest {
    @get:Rule
    val tmpFolder = TemporaryFolder()

    private val testContext = ApplicationProvider.getApplicationContext<Context>()
        .createDeviceProtectedStorageContext()

    @Test
    fun writeAndRead() = runTest {
        val store = PreferenceDataStoreFactory.create(
            scope = TestScope(UnconfinedTestDispatcher()),
            produceFile = { tmpFolder.newFile("settings.preferences_pb") }
        )
        store.edit { it[booleanPreferencesKey("flag")] = true }
        assertTrue(store.data.first()[booleanPreferencesKey("flag")] == true)
    }
}
```

## 常见问题

| 问题           | 原因           | 解决方案                                     |
| -------------- | -------------- | -------------------------------------------- |
| 数据读取卡住   | 未消费 Flow    | 使用 `collect` 或 `first` 获取数据           |
| Proto 解析失败 | 序列化字段缺失 | 升级 schema 并提供默认值                     |
| UI 不更新      | 未切换到主线程 | `flowOn(Dispatchers.IO)` + `collect` 在 Main |

## 总结

1. DataStore 更适合现代 Kotlin 异步流程，与 Flow、协程配合紧密。
2. Preferences 模式简单易用，Proto 模式提供类型安全与扩展性。
3. 合理设计迁移方案，可平滑替代旧的 SharedPreferences，保障数据连续性。
