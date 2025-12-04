---
description: 深入学习Kotlin/JS与Kotlin Multiplatform的协同开发，掌握跨平台代码共享、平台特定实现和项目架构设计。
tag:
  - Kotlin
  - JavaScript
  - Multiplatform
  - 跨平台
  - 代码共享
sidebar: true
---

# Kotlin/JS 与 Kotlin Multiplatform 协同开发

## Kotlin Multiplatform 概述

Kotlin Multiplatform（KMP）是 JetBrains 推出的跨平台开发框架，允许开发者在多个平台间共享代码，包括 JVM、JavaScript、Native（iOS、Android、macOS、Windows、Linux）等。Kotlin/JS 作为 KMP 的重要组成部分，使 Web 平台能够无缝集成到跨平台生态系统中。

### KMP 的核心优势

1. **代码复用**：在多个平台间共享业务逻辑
2. **类型安全**：跨平台的类型一致性
3. **原生性能**：每个平台使用原生实现
4. **渐进式采用**：可以逐步将现有项目迁移到 KMP
5. **统一开发体验**：使用相同的语言和工具链

## 项目结构设计

### 基本 KMP 项目结构

```
kotlin-multiplatform-project/
├── shared/
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/
│       │   └── kotlin/
│       │       ├── common/
│       │       │   ├── models/
│       │       │   │   ├── User.kt
│       │       │   │   └── Product.kt
│       │       │   ├── repository/
│       │       │   │   ├── UserRepository.kt
│       │       │   │   └── ProductRepository.kt
│       │       │   └── utils/
│       │       │       ├── DateUtils.kt
│       │       │       └── ValidationUtils.kt
│       │       └── expect/
│       │           └── Platform.kt
│       ├── jsMain/
│       │   └── kotlin/
│       │       └── actual/
│       │           └── Platform.kt
│       ├── androidMain/
│       │   └── kotlin/
│       │       └── actual/
│       │           └── Platform.kt
│       └── iosMain/
│           └── kotlin/
│               └── actual/
│                   └── Platform.kt
├── webApp/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           └── kotlin/
│               └── main/
│                   ├── App.kt
│                   └── index.kt
├── androidApp/
│   └── src/
│       └── main/
│           └── kotlin/
│               └── MainActivity.kt
└── iosApp/
    └── src/
        └── main/
            └── kotlin/
                └── MainViewController.kt
```

### Gradle 配置

```kotlin
// 根目录 build.gradle.kts
plugins {
    kotlin("multiplatform") version "1.9.20" apply false
    kotlin("plugin.serialization") version "1.9.20" apply false
}

subprojects {
    group = "com.example"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

// settings.gradle.kts
include(":shared")
include(":webApp")
include(":androidApp")
include(":iosApp")

// shared/build.gradle.kts
plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
}

kotlin {
    // 目标平台配置
    js(IR) {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
        }
        binaries.executable()
    }

    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }

    // iOS目标（需要Xcode）
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach {
        it.binaries.framework {
            baseName = "Shared"
            isStatic = true
        }
    }

    // 源集配置
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(kotlin("stdlib"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
            }
        }

        val jsMain by getting {
            dependencies {
                implementation(kotlin("stdlib-js"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-js:1.7.3")
            }
        }

        val androidMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
            }
        }

        val iosMain by creating {
            dependsOn(commonMain)
        }

        val iosX64Main by getting
        val iosArm64Main by getting
        val iosSimulatorArm64Main by getting

        iosX64Main.dependsOn(iosMain)
        iosArm64Main.dependsOn(iosMain)
        iosSimulatorArm64Main.dependsOn(iosMain)
    }
}
```

## 共享代码设计

### 数据模型

```kotlin
// shared/src/commonMain/kotlin/common/models/User.kt
@Serializable
data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatar: String? = null,
    val createdAt: Long,
    val updatedAt: Long
) {
    fun getDisplayName(): String {
        return name.ifBlank { email.substringBefore("@") }
    }

    fun isRecentlyCreated(): Boolean {
        val now = getCurrentTimeMillis()
        return (now - createdAt) < 24 * 60 * 60 * 1000 // 24小时
    }
}

// shared/src/commonMain/kotlin/common/models/Product.kt
@Serializable
data class Product(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val currency: String,
    val images: List<String>,
    val category: String,
    val inStock: Boolean,
    val rating: Double,
    val reviewCount: Int
) {
    fun getFormattedPrice(): String {
        return when (currency) {
            "USD" -> "$$price"
            "EUR" -> "€$price"
            "CNY" -> "¥$price"
            else -> "$price $currency"
        }
    }

    fun getRatingStars(): String {
        val fullStars = rating.toInt()
        val hasHalfStar = rating % 1 >= 0.5
        val emptyStars = 5 - fullStars - if (hasHalfStar) 1 else 0

        return "★".repeat(fullStars) +
               (if (hasHalfStar) "☆" else "") +
               "☆".repeat(emptyStars)
    }
}
```

### 仓库模式

```kotlin
// shared/src/commonMain/kotlin/common/repository/UserRepository.kt
interface UserRepository {
    suspend fun getUsers(): Result<List<User>>
    suspend fun getUserById(id: String): Result<User>
    suspend fun createUser(user: CreateUserRequest): Result<User>
    suspend fun updateUser(id: String, user: UpdateUserRequest): Result<User>
    suspend fun deleteUser(id: String): Result<Unit>
}

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String,
    val password: String
)

@Serializable
data class UpdateUserRequest(
    val name: String? = null,
    val email: String? = null,
    val avatar: String? = null
)

// shared/src/commonMain/kotlin/common/repository/ProductRepository.kt
interface ProductRepository {
    suspend fun getProducts(category: String? = null): Result<List<Product>>
    suspend fun getProductById(id: String): Result<Product>
    suspend fun searchProducts(query: String): Result<List<Product>>
    suspend fun getFeaturedProducts(): Result<List<Product>>
}
```

### 业务逻辑

```kotlin
// shared/src/commonMain/kotlin/common/usecase/GetUserUseCase.kt
class GetUserUseCase(
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(id: String): Result<User> {
        return try {
            val user = userRepository.getUserById(id)
                .getOrElse { throw UserNotFoundException(id) }

            // 业务逻辑验证
            if (user.email.isBlank()) {
                throw InvalidUserException("User email cannot be blank")
            }

            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class UserNotFoundException(userId: String) : Exception("User not found: $userId")
class InvalidUserException(message: String) : Exception(message)

// shared/src/commonMain/kotlin/common/usecase/SearchProductsUseCase.kt
class SearchProductsUseCase(
    private val productRepository: ProductRepository
) {
    suspend operator fun invoke(
        query: String,
        category: String? = null,
        minPrice: Double? = null,
        maxPrice: Double? = null
    ): Result<List<Product>> {
        return try {
            // 输入验证
            if (query.length < 2) {
                return Result.failure(InvalidSearchQueryException("Query too short"))
            }

            val products = productRepository.searchProducts(query)
                .getOrElse { throw SearchFailedException("Search failed", it) }

            // 应用过滤条件
            val filteredProducts = products.filter { product ->
                val categoryMatch = category?.let { product.category == it } ?: true
                val priceMatch = when {
                    minPrice != null && maxPrice != null ->
                        product.price in minPrice..maxPrice
                    minPrice != null -> product.price >= minPrice
                    maxPrice != null -> product.price <= maxPrice
                    else -> true
                }

                categoryMatch && priceMatch
            }

            Result.success(filteredProducts)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class InvalidSearchQueryException(message: String) : Exception(message)
class SearchFailedException(message: String, cause: Throwable? = null) : Exception(message, cause)
```

## 平台特定实现

### expect/actual 机制

```kotlin
// shared/src/commonMain/kotlin/expect/Platform.kt
expect class Platform() {
    val platform: String
    val version: String
    val isDebug: Boolean
}

expect fun getCurrentTimeMillis(): Long
expect fun formatDateTime(timestamp: Long): String
expect fun openUrl(url: String): Boolean
expect fun shareText(text: String): Boolean

// shared/src/jsMain/kotlin/actual/Platform.kt
actual class Platform {
    actual val platform: String = "JavaScript"
    actual val version: String = js("navigator.userAgent")
    actual val isDebug: Boolean = js("process.env.NODE_ENV") === "development"
}

actual fun getCurrentTimeMillis(): Long = Date.now().toLong()

actual fun formatDateTime(timestamp: Long): String {
    val date = Date(timestamp.toDouble())
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
}

actual fun openUrl(url: String): Boolean {
    return try {
        window.open(url, "_blank") != null
    } catch (e: Exception) {
        false
    }
}

actual fun shareText(text: String): Boolean {
    return try {
        if (js("navigator.share") != undefined) {
            js("navigator.share({ title: 'Share', text: text })")
            true
        } else {
            // 降级到复制到剪贴板
            val textarea = document.createElement("textarea") as HTMLTextAreaElement
            textarea.value = text
            document.body?.appendChild(textarea)
            textarea.select()
            val success = document.execCommand("copy")
            document.body?.removeChild(textarea)
            success
        }
    } catch (e: Exception) {
        false
    }
}

// shared/src/androidMain/kotlin/actual/Platform.kt
actual class Platform {
    actual val platform: String = "Android"
    actual val version: String = android.os.Build.VERSION.RELEASE
    actual val isDebug: Boolean = BuildConfig.DEBUG
}

actual fun getCurrentTimeMillis(): Long = System.currentTimeMillis()

actual fun formatDateTime(timestamp: Long): String {
    val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
    return sdf.format(Date(timestamp))
}

actual fun openUrl(url: String): Boolean {
    return try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        Context.startActivity(intent)
        true
    } catch (e: Exception) {
        false
    }
}

actual fun shareText(text: String): Boolean {
    return try {
        val intent = Intent().apply {
            action = Intent.ACTION_SEND
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        Context.startActivity(Intent.createChooser(intent, "Share"))
        true
    } catch (e: Exception) {
        false
    }
}
```

### 网络层实现

```kotlin
// shared/src/commonMain/kotlin/common/network/ApiClient.kt
interface ApiClient {
    suspend fun get(url: String): Result<String>
    suspend fun post(url: String, body: String): Result<String>
    suspend fun put(url: String, body: String): Result<String>
    suspend fun delete(url: String): Result<String>
}

// shared/src/jsMain/kotlin/actual/JsApiClient.kt
class JsApiClient : ApiClient {
    override suspend fun get(url: String): Result<String> {
        return try {
            val response = window.fetch(url).await()
            if (response.ok) {
                Result.success(response.text().await())
            } else {
                Result.failure(NetworkException("HTTP ${response.status}: ${response.statusText}"))
            }
        } catch (e: Exception) {
            Result.failure(NetworkException("Network error", e))
        }
    }

    override suspend fun post(url: String, body: String): Result<String> {
        return try {
            val options = js("{}")
            options.method = "POST"
            options.headers = js("{}")
            options.headers["Content-Type"] = "application/json"
            options.body = body

            val response = window.fetch(url, options).await()
            if (response.ok) {
                Result.success(response.text().await())
            } else {
                Result.failure(NetworkException("HTTP ${response.status}: ${response.statusText}"))
            }
        } catch (e: Exception) {
            Result.failure(NetworkException("Network error", e))
        }
    }

    override suspend fun put(url: String, body: String): Result<String> {
        return try {
            val options = js("{}")
            options.method = "PUT"
            options.headers = js("{}")
            options.headers["Content-Type"] = "application/json"
            options.body = body

            val response = window.fetch(url, options).await()
            if (response.ok) {
                Result.success(response.text().await())
            } else {
                Result.failure(NetworkException("HTTP ${response.status}: ${response.statusText}"))
            }
        } catch (e: Exception) {
            Result.failure(NetworkException("Network error", e))
        }
    }

    override suspend fun delete(url: String): Result<String> {
        return try {
            val options = js("{}")
            options.method = "DELETE"

            val response = window.fetch(url, options).await()
            if (response.ok) {
                Result.success(response.text().await())
            } else {
                Result.failure(NetworkException("HTTP ${response.status}: ${response.statusText}"))
            }
        } catch (e: Exception) {
            Result.failure(NetworkException("Network error", e))
        }
    }
}

class NetworkException(message: String, cause: Throwable? = null) : Exception(message, cause)
```

## Web 应用实现

### React 集成

```kotlin
// webApp/src/main/kotlin/main/App.kt
import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.h1
import react.dom.html.ReactHTML.button
import kotlinx.coroutines.launch

val App = FC<Props> {
    val scope = rememberCoroutineScope()
    var users by useState<List<User>>(emptyList())
    var loading by useState(false)
    var error by useState<String?>(null)

    // 使用共享的仓库
    val userRepository = remember { JsUserRepository() }

    useEffect {
        scope.launch {
            loading = true
            error = null

            userRepository.getUsers()
                .onSuccess { userList ->
                    users = userList
                }
                .onFailure { e ->
                    error = e.message
                }
                .also {
                    loading = false
                }
        }
    }

    div {
        css {
            padding = 20.px
            fontFamily = "Arial, sans-serif"
        }

        h1 {
            +"Kotlin Multiplatform Users"
        }

        when {
            loading -> {
                div {
                    +"Loading users..."
                }
            }
            error != null -> {
                div {
                    css {
                        color = NamedColor.red
                    }
                    +"Error: $error"

                    button {
                        onClick = {
                            scope.launch {
                                loading = true
                                error = null

                                userRepository.getUsers()
                                    .onSuccess { userList ->
                                        users = userList
                                    }
                                    .onFailure { e ->
                                        error = e.message
                                    }
                                    .also {
                                        loading = false
                                    }
                            }
                        }
                        +"Retry"
                    }
                }
            }
            else -> {
                div {
                    users.forEach { user ->
                        UserCard {
                            user = user
                            onEdit = { editedUser ->
                                scope.launch {
                                    userRepository.updateUser(user.id, UpdateUserRequest(name = editedUser.name))
                                        .onSuccess {
                                            // 更新本地状态
                                            users = users.map {
                                                if (it.id == user.id) it else editedUser
                                            }
                                        }
                                }
                            }
                            onDelete = { userId ->
                                scope.launch {
                                    userRepository.deleteUser(userId)
                                        .onSuccess {
                                            // 从本地状态中移除
                                            users = users.filter { it.id != userId }
                                        }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// webApp/src/main/kotlin/main/UserCard.kt
val UserCard = FC<UserCardProps> { props ->
    div {
        css {
            border = Border(1.px, LineStyle.solid, NamedColor.gray)
            borderRadius = 8.px
            padding = 16.px
            marginBottom = 16.px
            backgroundColor = NamedColor.white
            boxShadow = BoxShadow(0.px, 2.px, 4.px, rgba(0, 0, 0, 0.1))
        }

        div {
            css {
                display = Display.flex
                alignItems = AlignItems.center
                marginBottom = 12.px
            }

            if (props.user.avatar != null) {
                img {
                    src = props.user.avatar
                    alt = props.user.name
                    css {
                        width = 48.px
                        height = 48.px
                        borderRadius = 50.pct
                        marginRight = 12.px
                    }
                }
            }

            div {
                h3 {
                    css {
                        margin = 0.px
                        fontSize = 18.px
                        fontWeight = FontWeight.bold
                    }
                    +props.user.getDisplayName()
                }

                p {
                    css {
                        margin = 0.px
                        color = NamedColor.gray
                        fontSize = 14.px
                    }
                    +props.user.email
                }
            }
        }

        div {
            css {
                display = Display.flex
                justifyContent = JustifyContent.flexEnd
                gap = 8.px
            }

            button {
                css {
                    padding = 8.px.px(16.px)
                    backgroundColor = NamedColor.blue
                    color = NamedColor.white
                    border = None.none
                    borderRadius = 4.px
                    cursor = Cursor.pointer
                }
                onClick = {
                    props.onEdit(props.user)
                }
                +"Edit"
            }

            button {
                css {
                    padding = 8.px.px(16.px)
                    backgroundColor = NamedColor.red
                    color = NamedColor.white
                    border = None.none
                    borderRadius = 4.px
                    cursor = Cursor.pointer
                }
                onClick = {
                    props.onDelete(props.user.id)
                }
                +"Delete"
            }
        }
    }
}

external interface UserCardProps : Props {
    var user: User
    var onEdit: (User) -> Unit
    var onDelete: (String) -> Unit
}
```

### 仓库实现

```kotlin
// webApp/src/main/kotlin/main/JsUserRepository.kt
class JsUserRepository : UserRepository {
    private val apiClient = JsApiClient()
    private val baseUrl = "https://api.example.com/users"

    override suspend fun getUsers(): Result<List<User>> {
        return try {
            val response = apiClient.get(baseUrl)
                .getOrElse { throw it }

            val users = JSON.parse<Array<User>>(response)
            Result.success(users.toList())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getUserById(id: String): Result<User> {
        return try {
            val response = apiClient.get("$baseUrl/$id")
                .getOrElse { throw it }

            val user = JSON.parse<User>(response)
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createUser(user: CreateUserRequest): Result<User> {
        return try {
            val requestBody = JSON.stringify(user)
            val response = apiClient.post(baseUrl, requestBody)
                .getOrElse { throw it }

            val createdUser = JSON.parse<User>(response)
            Result.success(createdUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateUser(id: String, user: UpdateUserRequest): Result<User> {
        return try {
            val requestBody = JSON.stringify(user)
            val response = apiClient.put("$baseUrl/$id", requestBody)
                .getOrElse { throw it }

            val updatedUser = JSON.parse<User>(response)
            Result.success(updatedUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteUser(id: String): Result<Unit> {
        return try {
            apiClient.delete("$baseUrl/$id")
                .getOrElse { throw it }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## 测试策略

### 共享代码测试

```kotlin
// shared/src/commonTest/kotlin/UserRepositoryTest.kt
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.coroutines.test.runTest

class MockUserRepository : UserRepository {
    private val users = mutableListOf<User>()

    override suspend fun getUsers(): Result<List<User>> {
        return Result.success(users.toList())
    }

    override suspend fun getUserById(id: String): Result<User> {
        val user = users.find { it.id == id }
        return if (user != null) {
            Result.success(user)
        } else {
            Result.failure(Exception("User not found"))
        }
    }

    override suspend fun createUser(user: CreateUserRequest): Result<User> {
        val newUser = User(
            id = generateId(),
            name = user.name,
            email = user.email,
            createdAt = getCurrentTimeMillis(),
            updatedAt = getCurrentTimeMillis()
        )
        users.add(newUser)
        return Result.success(newUser)
    }

    override suspend fun updateUser(id: String, user: UpdateUserRequest): Result<User> {
        val index = users.indexOfFirst { it.id == id }
        return if (index >= 0) {
            val updatedUser = users[index].copy(
                name = user.name ?: users[index].name,
                email = user.email ?: users[index].email,
                updatedAt = getCurrentTimeMillis()
            )
            users[index] = updatedUser
            Result.success(updatedUser)
        } else {
            Result.failure(Exception("User not found"))
        }
    }

    override suspend fun deleteUser(id: String): Result<Unit> {
        val removed = users.removeIf { it.id == id }
        return if (removed) {
            Result.success(Unit)
        } else {
            Result.failure(Exception("User not found"))
        }
    }

    private fun generateId(): String {
        return "user_${System.currentTimeMillis()}_${(0..1000).random()}"
    }
}

class UserRepositoryTest {
    private val repository = MockUserRepository()

    @Test
    fun testGetUsers() = runTest {
        // Given
        val user1 = CreateUserRequest("User 1", "user1@example.com", "password")
        val user2 = CreateUserRequest("User 2", "user2@example.com", "password")

        repository.createUser(user1)
        repository.createUser(user2)

        // When
        val result = repository.getUsers()

        // Then
        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
    }

    @Test
    fun testGetUserById() = runTest {
        // Given
        val createRequest = CreateUserRequest("Test User", "test@example.com", "password")
        val createdUser = repository.createUser(createRequest).getOrThrow()

        // When
        val result = repository.getUserById(createdUser.id)

        // Then
        assertTrue(result.isSuccess)
        assertEquals(createdUser.id, result.getOrNull()?.id)
        assertEquals("Test User", result.getOrNull()?.name)
    }

    @Test
    fun testUpdateUser() = runTest {
        // Given
        val createRequest = CreateUserRequest("Original Name", "original@example.com", "password")
        val createdUser = repository.createUser(createRequest).getOrThrow()
        val updateRequest = UpdateUserRequest(name = "Updated Name")

        // When
        val result = repository.updateUser(createdUser.id, updateRequest)

        // Then
        assertTrue(result.isSuccess)
        assertEquals("Updated Name", result.getOrNull()?.name)
        assertEquals("original@example.com", result.getOrNull()?.email) // 未更新的字段保持不变
    }
}
```

### 平台特定测试

```kotlin
// shared/src/jsTest/kotlin/JsPlatformTest.kt
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class JsPlatformTest {
    @Test
    fun testPlatformInfo() {
        val platform = Platform()

        assertEquals("JavaScript", platform.platform)
        assertTrue(platform.version.isNotEmpty())
    }

    @Test
    fun testGetCurrentTimeMillis() {
        val time1 = getCurrentTimeMillis()
        Thread.sleep(10)
        val time2 = getCurrentTimeMillis()

        assertTrue(time2 > time1)
    }

    @Test
    fun testFormatDateTime() {
        val timestamp = 1609459200000L // 2021-01-01 00:00:00
        val formatted = formatDateTime(timestamp)

        assertTrue(formatted.contains("2021"))
        assertTrue(formatted.contains("01"))
    }
}
```

## 构建与部署

### 多平台构建配置

```kotlin
// webApp/build.gradle.kts
plugins {
    kotlin("js")
}

dependencies {
    implementation(project(":shared"))
    implementation(kotlin("stdlib-js"))
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-dom")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-emotion")
}

kotlin {
    js {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
        }
        binaries.executable()
    }
}

// 构建任务
tasks.register("buildProduction") {
    dependsOn("jsBrowserProductionWebpack")

    doLast {
        // 复制共享模块的输出
        copy {
            from(project(":shared").buildDir.resolve("js/packages/shared"))
            into(buildDir.resolve("js/packages/webApp"))
        }
    }
}
```

### CI/CD 配置

```yaml
# .github/workflows/build.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "temurin"

      - name: Cache Gradle packages
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Run tests
        run: ./gradlew test

      - name: Run JS tests
        run: ./gradlew jsBrowserTest --continue

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            shared/build/test-results/
            webApp/build/test-results/

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "temurin"

      - name: Cache Gradle packages
        uses: actions/cache@v3
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Build web application
        run: ./gradlew buildProduction

      - name: Build Android application
        run: ./gradlew assembleDebug

      - name: Upload web build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: webApp/build/dist/js/productionExecutable/

      - name: Upload Android build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: android-build
          path: androidApp/build/outputs/apk/debug/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download web build artifacts
        uses: actions/download-artifact@v3
        with:
          name: web-build
          path: web-build/

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --dir=web-build --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 最佳实践

### 1. 架构设计原则

```kotlin
// 依赖注入容器
object DI {
    private val services = mutableMapOf<Class<*>, Any>()

    fun <T> register(clazz: Class<T>, instance: T) {
        services[clazz] = instance
    }

    @Suppress("UNCHECKED_CAST")
    fun <T> get(clazz: Class<T>): T {
        return services[clazz] as T
    }

    fun init() {
        // 注册平台特定的服务
        register(ApiClient::class.js, createPlatformApiClient())
        register(PlatformLogger::class.js, createPlatformLogger())
    }

    private fun createPlatformApiClient(): ApiClient {
        return when (Platform().platform) {
            "JavaScript" -> JsApiClient()
            "Android" -> AndroidApiClient()
            else -> throw UnsupportedOperationException("Unsupported platform")
        }
    }

    private fun createPlatformLogger(): PlatformLogger {
        return when (Platform().platform) {
            "JavaScript" -> JsLogger()
            "Android" -> AndroidLogger()
            else -> throw UnsupportedOperationException("Unsupported platform")
        }
    }
}

interface PlatformLogger {
    fun d(tag: String, message: String)
    fun e(tag: String, message: String, throwable: Throwable? = null)
}

class JsLogger : PlatformLogger {
    override fun d(tag: String, message: String) {
        console.log("[$tag] $message")
    }

    override fun e(tag: String, message: String, throwable: Throwable?) {
        console.error("[$tag] $message", throwable)
    }
}
```

### 2. 错误处理策略

```kotlin
// 统一错误处理
sealed class AppError : Exception {
    class NetworkError(message: String, cause: Throwable? = null) : AppError()
    class ValidationError(message: String) : AppError()
    class BusinessLogicError(message: String) : AppError()
    class UnknownError(cause: Throwable) : AppError()
}

// 错误处理器
class ErrorHandler {
    private val logger = DI.get(PlatformLogger::class.js)

    fun handleError(error: Throwable): AppError {
        return when (error) {
            is AppError -> error
            is NetworkException -> AppError.NetworkError(error.message ?: "Network error", error)
            is IllegalArgumentException -> AppError.ValidationError(error.message ?: "Validation error")
            else -> {
                logger.e("ErrorHandler", "Unknown error occurred", error)
                AppError.UnknownError(error)
            }
        }
    }

    fun getErrorMessage(error: AppError): String {
        return when (error) {
            is AppError.NetworkError -> "网络连接失败，请检查网络设置"
            is AppError.ValidationError -> "输入数据有误，请检查后重试"
            is AppError.BusinessLogicError -> error.message ?: "操作失败"
            is AppError.UnknownError -> "系统错误，请稍后重试"
        }
    }
}
```

### 3. 性能监控

```kotlin
// 跨平台性能监控
class PerformanceMonitor {
    private val logger = DI.get(PlatformLogger::class.js)

    fun startTiming(name: String): () -> Unit {
        val startTime = getCurrentTimeMillis()

        return {
            val endTime = getCurrentTimeMillis()
            val duration = endTime - startTime

            logger.d("Performance", "$name took ${duration}ms")

            // 发送到分析服务
            reportMetric(name, duration)
        }
    }

    private fun reportMetric(name: String, duration: Long) {
        GlobalScope.launch {
            try {
                val metricData = mapOf(
                    "name" to name,
                    "duration" to duration,
                    "platform" to Platform().platform,
                    "timestamp" to getCurrentTimeMillis()
                )

                // 使用平台特定的API发送数据
                when (Platform().platform) {
                    "JavaScript" -> {
                        window.fetch("/api/metrics", js("""
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(metricData)
                            }
                        """)).await()
                    }
                    "Android" -> {
                        // Android特定的实现
                    }
                }
            } catch (e: Exception) {
                logger.e("PerformanceMonitor", "Failed to report metric", e)
            }
        }
    }
}
```

## 总结

Kotlin/JS 与 Kotlin Multiplatform 的协同开发为构建跨平台应用提供了强大的解决方案。通过合理的架构设计、平台特定实现和共享代码策略，开发者可以在保持代码复用的同时，充分利用各平台的特性。

在最后一篇文章中，我们将通过一个完整的实战项目，综合运用所学知识，构建一个功能丰富的 Kotlin/JS 应用程序。
