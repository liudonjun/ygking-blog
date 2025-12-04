---
description: 深入学习Kotlin/JS与React的集成，掌握使用Kotlin构建React组件、状态管理、路由和现代Web应用的技巧。
tag:
  - Kotlin
  - JavaScript
  - React
  - 组件开发
  - 状态管理
sidebar: true
---

# Kotlin/JS React 集成与组件开发

## React 与 Kotlin/JS 集成概述

React 是现代 Web 开发中最流行的前端框架之一，而 Kotlin/JS 为 React 开发带来了类型安全、空安全和现代语言特性的优势。通过 Kotlin/JS React Wrappers，开发者可以使用 Kotlin 的优雅语法构建 React 应用程序。

### Kotlin/JS React 的优势

1. **类型安全**：编译时检查 Props 和 State 类型
2. **空安全**：避免 NullPointerException
3. **DSL 支持**：使用类型安全的 HTML DSL
4. **协程支持**：优雅的异步编程
5. **代码复用**：与 Kotlin Multiplatform 共享业务逻辑

## 环境配置

### 添加 React 依赖

在`build.gradle.kts`中添加 React 相关依赖：

```kotlin
dependencies {
    // React核心库
    implementation(enforcedPlatform("org.jetbrains.kotlin-wrappers:kotlin-wrappers-bom:1.0.0-pre.600"))
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-dom")

    // React工具库
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-router-dom")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-query")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-emotion")

    // 可选：Redux支持
    implementation("org.jetbrains.kotlin-wrappers:kotlin-redux")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-redux")

    // 协程支持
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-js:1.7.3")
}
```

### 基本配置

```kotlin
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
```

## 基础 React 组件

### 函数组件

```kotlin
import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.h1
import react.dom.html.ReactHTML.button

// 基本函数组件
val Greeting = FC<GreetingProps> { props ->
    div {
        h1 {
            +"Hello, ${props.name}!"
        }

        if (props.showButton) {
            button {
                onClick = {
                    props.onButtonClick?.invoke()
                }
                +"Click me"
            }
        }
    }
}

// Props接口
external interface GreetingProps : Props {
    var name: String
    var showButton: Boolean
    var onButtonClick: (() -> Unit)?
}
```

### 类组件

```kotlin
import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.input
import react.dom.html.ReactHTML.p

// 类组件示例
external interface CounterState : State {
    var count: Int
}

external interface CounterProps : Props {
    var initialValue: Int
}

class Counter : Component<CounterProps, CounterState>() {
    init {
        state = CounterState().apply {
            count = props.initialValue
        }
    }

    override fun render() {
        div {
            p {
                +"Count: ${state.count}"
            }

            button {
                onClick = {
                    setState(CounterState().apply {
                        count = state.count + 1
                    })
                }
                +"Increment"
            }

            button {
                onClick = {
                    setState(CounterState().apply {
                        count = state.count - 1
                    })
                }
                +"Decrement"
            }
        }
    }
}
```

### 使用组件

```kotlin
import react.*
import react.dom.client.createRoot
import kotlinx.browser.document

fun main() {
    val container = document.getElementById("root") ?: error("Couldn't find root container")
    createRoot(container).render(
        Fragment.create {
            Greeting {
                name = "Kotlin/JS"
                showButton = true
                onButtonClick = {
                    println("Button clicked!")
                }
            }

            Counter {
                initialValue = 0
            }
        }
    )
}
```

## 状态管理

### useState Hook

```kotlin
import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.input
import react.dom.html.ReactHTML.p

// 使用useState Hook
val TextInput = FC<Props> {
    var text by useState("")
    var charCount by useState(0)

    div {
        input {
            type = InputType.text
            value = text
            onChange = { event ->
                text = event.target.value
                charCount = text.length
            }
        }

        p {
            +"Character count: $charCount"
        }
    }
}
```

### useEffect Hook

```kotlin
import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.p
import kotlinx.browser.window

// 使用useEffect Hook
val Timer = FC<Props> {
    var seconds by useState(0)

    useEffect {
        val interval = window.setInterval({
            seconds++
        }, 1000)

        cleanup {
            window.clearInterval(interval)
        }
    }

    div {
        p {
            +"Timer: $seconds seconds"
        }
    }
}
```

### 自定义 Hook

```kotlin
import react.*
import kotlinx.browser.window

// 自定义Hook：窗口大小
fun useWindowSize(): Pair<Int, Int> {
    var size by useState(Pair(window.innerWidth, window.innerHeight))

    useEffect {
        val resizeHandler = {
            size = Pair(window.innerWidth, window.innerHeight)
        }

        window.addEventListener("resize", resizeHandler)

        cleanup {
            window.removeEventListener("resize", resizeHandler)
        }
    }

    return size
}

// 使用自定义Hook
val ResponsiveComponent = FC<Props> {
    val (width, height) = useWindowSize()

    div {
        p {
            +"Window size: ${width}x$height"
        }

        if (width < 768) {
            p {
                +"Mobile view"
            }
        } else {
            p {
                +"Desktop view"
            }
        }
    }
}
```

## 事件处理

### 基本事件处理

```kotlin
import react.*
import react.dom.html.ReactHTML.button
import react.dom.html.ReactHTML.input
import react.dom.html.ReactHTML.div

// 事件处理示例
val EventHandling = FC<Props> {
    var inputValue by useState("")
    var clickCount by useState(0)
    var mousePosition by useState(Pair(0, 0))

    div {
        input {
            type = InputType.text
            value = inputValue
            placeholder = "Type something..."
            onChange = { event ->
                inputValue = event.target.value
            }

            // 键盘事件
            onKeyDown = { event ->
                if (event.key == "Enter") {
                    println("Entered: $inputValue")
                }
            }
        }

        button {
            onClick = {
                clickCount++
                println("Button clicked $clickCount times")
            }
            +"Click me ($clickCount)"
        }

        div {
            onMouseMove = { event ->
                mousePosition = Pair(event.clientX, event.clientY)
            }

            style = js("{ width: '200px', height: '200px', border: '1px solid black' }")

            p {
                +"Mouse position: (${mousePosition.first}, ${mousePosition.second})"
            }
        }
    }
}
```

### 表单处理

```kotlin
import react.*
import react.dom.html.ReactHTML.form
import react.dom.html.ReactHTML.input
import react.dom.html.ReactHTML.label
import react.dom.html.ReactHTML.button

// 表单数据模型
data class FormData(
    val username: String = "",
    val email: String = "",
    val age: Int = 0,
    val newsletter: Boolean = false
)

// 表单组件
val UserForm = FC<Props> {
    var formData by useState(FormData())
    var errors by useState(emptyMap<String, String>())

    fun validateForm(): Boolean {
        val newErrors = mutableMapOf<String, String>()

        if (formData.username.isBlank()) {
            newErrors["username"] = "Username is required"
        }

        if (formData.email.isBlank()) {
            newErrors["email"] = "Email is required"
        } else if (!formData.email.contains("@")) {
            newErrors["email"] = "Invalid email format"
        }

        if (formData.age < 18) {
            newErrors["age"] = "Must be 18 or older"
        }

        errors = newErrors
        return newErrors.isEmpty()
    }

    fun handleSubmit(event: Event) {
        event.preventDefault()

        if (validateForm()) {
            println("Form submitted: $formData")
        }
    }

    form {
        onSubmit = { handleSubmit(it) }

        // Username field
        div {
            label {
                htmlFor = "username"
                +"Username:"
            }

            input {
                type = InputType.text
                id = "username"
                value = formData.username
                onChange = { event ->
                    formData = formData.copy(username = event.target.value)
                }
            }

            errors["username"]?.let { error ->
                div {
                    style = js("{ color: 'red' }")
                    +error
                }
            }
        }

        // Email field
        div {
            label {
                htmlFor = "email"
                +"Email:"
            }

            input {
                type = InputType.email
                id = "email"
                value = formData.email
                onChange = { event ->
                    formData = formData.copy(email = event.target.value)
                }
            }

            errors["email"]?.let { error ->
                div {
                    style = js("{ color: 'red' }")
                    +error
                }
            }
        }

        // Age field
        div {
            label {
                htmlFor = "age"
                +"Age:"
            }

            input {
                type = InputType.number
                id = "age"
                value = formData.age.toString()
                onChange = { event ->
                    val age = event.target.value.toIntOrNull() ?: 0
                    formData = formData.copy(age = age)
                }
            }

            errors["age"]?.let { error ->
                div {
                    style = js("{ color: 'red' }")
                    +error
                }
            }
        }

        // Newsletter checkbox
        div {
            input {
                type = InputType.checkbox
                id = "newsletter"
                checked = formData.newsletter
                onChange = { event ->
                    formData = formData.copy(newsletter = event.target.checked)
                }
            }

            label {
                htmlFor = "newsletter"
                +"Subscribe to newsletter"
            }
        }

        button {
            type = ButtonType.submit
            +"Submit"
        }
    }
}
```

## 路由管理

### 基本路由配置

```kotlin
import react.*
import react.router.dom.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.h1
import react.dom.html.ReactHTML.nav
import react.dom.html.ReactHTML.a

// 页面组件
val HomePage = FC<Props> {
    div {
        h1 { +"Home Page" }
        p { +"Welcome to our Kotlin/JS React app!" }
    }
}

val AboutPage = FC<Props> {
    div {
        h1 { +"About Page" }
        p { +"Learn more about our application." }
    }
}

val ContactPage = FC<Props> {
    div {
        h1 { +"Contact Page" }
        p { +"Get in touch with us." }
    }
}

// 导航组件
val Navigation = FC<Props> {
    nav {
        a {
            href = "/"
            +"Home"
        }

        a {
            href = "/about"
            +"About"
        }

        a {
            href = "/contact"
            +"Contact"
        }
    }
}

// 主应用组件
val App = FC<Props> {
    BrowserRouter {
        div {
            Navigation()

            Routes {
                Route {
                    path = "/"
                    element = HomePage.create()
                }

                Route {
                    path = "/about"
                    element = AboutPage.create()
                }

                Route {
                    path = "/contact"
                    element = ContactPage.create()
                }
            }
        }
    }
}
```

### 动态路由

```kotlin
// 用户数据模型
data class User(val id: Int, val name: String, val email: String)

// 用户详情页面
val UserDetailPage = FC<Props> {
    val params = useParams()
    val userId = params["id"]?.toIntOrNull() ?: 0

    var user by useState<User?>(null)
    var loading by useState(true)

    useEffect(userId) {
        loading = true

        GlobalScope.launch {
            try {
                // 模拟API调用
                delay(1000)
                user = User(userId, "User $userId", "user$userId@example.com")
            } catch (e: Exception) {
                println("Error loading user: ${e.message}")
            } finally {
                loading = false
            }
        }
    }

    div {
        when {
            loading -> {
                p { +"Loading user data..." }
            }
            user != null -> {
                h1 { +"User Details" }
                p { +"Name: ${user.name}" }
                p { +"Email: ${user.email}" }
            }
            else -> {
                p { +"User not found" }
            }
        }

        a {
            href = "/users"
            +"Back to Users"
        }
    }
}

// 用户列表页面
val UsersPage = FC<Props> {
    var users by useState<List<User>>(emptyList())
    var loading by useState(true)

    useEffect {
        GlobalScope.launch {
            try {
                // 模拟API调用
                delay(1000)
                users = listOf(
                    User(1, "Alice", "alice@example.com"),
                    User(2, "Bob", "bob@example.com"),
                    User(3, "Charlie", "charlie@example.com")
                )
            } catch (e: Exception) {
                println("Error loading users: ${e.message}")
            } finally {
                loading = false
            }
        }
    }

    div {
        h1 { +"Users" }

        when {
            loading -> {
                p { +"Loading users..." }
            }
            users.isNotEmpty() -> {
                ul {
                    users.forEach { user ->
                        li {
                            a {
                                href = "/users/${user.id}"
                                +user.name
                            }
                        }
                    }
                }
            }
            else -> {
                p { +"No users found" }
            }
        }
    }
}

// 更新路由配置
val AppWithDynamicRoutes = FC<Props> {
    BrowserRouter {
        div {
            Navigation()

            Routes {
                Route {
                    path = "/"
                    element = HomePage.create()
                }

                Route {
                    path = "/users"
                    element = UsersPage.create()
                }

                Route {
                    path = "/users/:id"
                    element = UserDetailPage.create()
                }
            }
        }
    }
}
```

## 样式处理

### CSS-in-JS

```kotlin
import emotion.react.css
import csstype.*

// 使用Emotion进行样式处理
val StyledComponent = FC<Props> {
    div {
        css {
            padding = 20.px
            backgroundColor = NamedColor.lightblue
            borderRadius = 8.px
            boxShadow = BoxShadow(0.px, 2.px, 4.px, rgba(0, 0, 0, 0.1))

            hover {
                backgroundColor = NamedColor.lightcyan
                transform = scale(1.05)
            }
        }

        h1 {
            css {
                color = NamedColor.darkblue
                fontSize = 24.px
                marginBottom = 16.px
            }
            +"Styled Component"
        }

        p {
            css {
                color = NamedColor.gray
                lineHeight = 1.5
            }
            +"This component uses Emotion for styling."
        }
    }
}
```

### 条件样式

```kotlin
// 条件样式示例
val ConditionalStyleComponent = FC<Props> {
    var isActive by useState(false)
    var theme by useState("light")

    div {
        css {
            padding = 16.px
            borderRadius = 8.px
            backgroundColor = if (theme == "light") NamedColor.white else NamedColor.black
            color = if (theme == "light") NamedColor.black else NamedColor.white
            border = if (isActive) {
                Border(2.px, LineStyle.solid, NamedColor.blue)
            } else {
                Border(1.px, LineStyle.solid, NamedColor.gray)
            }

            transition = "all 0.3s ease"
        }

        h3 {
            +"Conditional Styling"
        }

        button {
            css {
                marginRight = 8.px
                padding = 8.px.px(16.px)
                backgroundColor = if (theme == "light") NamedColor.lightgray else NamedColor.darkgray
                border = None.none
                borderRadius = 4.px
                cursor = Cursor.pointer
            }

            onClick = { isActive = !isActive }
            +"Toggle Active"
        }

        button {
            css {
                padding = 8.px.px(16.px)
                backgroundColor = if (theme == "light") NamedColor.lightgray else NamedColor.darkgray
                border = None.none
                borderRadius = 4.px
                cursor = Cursor.pointer
            }

            onClick = {
                theme = if (theme == "light") "dark" else "light"
            }
            +"Toggle Theme"
        }
    }
}
```

## 数据获取与状态管理

### React Query 集成

```kotlin
import react.*
import react.query.*
import kotlinx.coroutines.delay

// API服务
class UserService {
    suspend fun getUsers(): List<User> {
        delay(1000) // 模拟网络延迟
        return listOf(
            User(1, "Alice", "alice@example.com"),
            User(2, "Bob", "bob@example.com"),
            User(3, "Charlie", "charlie@example.com")
        )
    }

    suspend fun getUser(id: Int): User {
        delay(500) // 模拟网络延迟
        return User(id, "User $id", "user$id@example.com")
    }
}

// 使用React Query的数据组件
val UsersWithQuery = FC<Props> {
    val queryClient = useQueryClient()
    val userService = UserService()

    val usersQuery = useQuery<List<User>, Error>(
        queryKey = arrayOf("users"),
        queryFn = { userService.getUsers() }
    )

    div {
        h2 { +"Users (with React Query)" }

        when {
            usersQuery.isLoading -> {
                p { +"Loading users..." }
            }
            usersQuery.isError -> {
                p {
                    style = js("{ color: 'red' }")
                    +"Error: ${usersQuery.error?.message}"
                }

                button {
                    onClick = { usersQuery.refetch() }
                    +"Retry"
                }
            }
            else -> {
                ul {
                    usersQuery.data?.forEach { user ->
                        li {
                            key = user.id.toString()
                            +user.name
                        }
                    }
                }

                button {
                    onClick = { usersQuery.refetch() }
                    +"Refresh"
                }
            }
        }
    }
}
```

### Context API

```kotlin
import react.*
import react.createContext
import react.useContext

// 主题Context
val ThemeContext = createContext("light")

// 主题提供者组件
val ThemeProvider = FC<ThemeProviderProps> { props ->
    ThemeContext(props.theme) {
        props.children()
    }
}

external interface ThemeProviderProps : Props {
    var theme: String
    var children: () -> ReactNode
}

// 使用主题的Hook
fun useTheme(): String {
    return useContext(ThemeContext)
}

// 使用主题的组件
val ThemedComponent = FC<Props> {
    val theme = useTheme()

    div {
        css {
            padding = 16.px
            backgroundColor = if (theme == "light") NamedColor.white else NamedColor.black
            color = if (theme == "light") NamedColor.black else NamedColor.white
            borderRadius = 8.px
        }

        h3 { +"Themed Component" }
        p { +"Current theme: $theme" }
    }
}

// 应用主题的示例
val AppWithTheme = FC<Props> {
    var theme by useState("light")

    ThemeProvider {
        theme = theme

        div {
            button {
                onClick = { theme = if (theme == "light") "dark" else "light" }
                +"Toggle Theme"
            }

            ThemedComponent()
        }
    }
}
```

## 最佳实践

### 1. 组件设计原则

```kotlin
// 单一职责原则
val UserAvatar = FC<UserAvatarProps> { props ->
    img {
        src = props.avatarUrl
        alt = "${props.name}'s avatar"
        css {
            width = 48.px
            height = 48.px
            borderRadius = 50.pct
        }
    }
}

external interface UserAvatarProps : Props {
    var name: String
    var avatarUrl: String
}

// 组合优于继承
val UserCard = FC<UserCardProps> { props ->
    div {
        css {
            display = Display.flex
            alignItems = AlignItems.center
            padding = 16.px
            border = Border(1.px, LineStyle.solid, NamedColor.gray)
            borderRadius = 8.px
        }

        UserAvatar {
            name = props.user.name
            avatarUrl = props.user.avatarUrl
        }

        div {
            css {
                marginLeft = 16.px
            }

            h4 {
                +props.user.name
            }

            p {
                +props.user.email
            }
        }
    }
}

external interface UserCardProps : Props {
    var user: User
}
```

### 2. 性能优化

```kotlin
import react.*
import react.memo

// 使用React.memo进行组件记忆化
val ExpensiveComponent = FC<ExpensiveComponentProps> { props ->
    // 模拟昂贵的计算
    val expensiveValue = useMemo(props.data) {
        props.data.fold(0) { acc, item -> acc + item.value }
    }

    div {
        h3 { +"Expensive Component" }
        p { +"Computed value: $expensiveValue" }
    }
}.memo()

external interface ExpensiveComponentProps : Props {
    var data: List<DataItem>
}

data class DataItem(val id: Int, val value: Int)

// 使用useCallback优化事件处理
val CallbackOptimizedComponent = FC<Props> {
    var count by useState(0)

    val handleClick = useCallback {
        count++
    }

    div {
        h3 { +"Callback Optimized Component" }
        p { +"Count: $count" }

        ExpensiveComponent {
            data = listOf(DataItem(1, 10), DataItem(2, 20), DataItem(3, 30))
        }

        button {
            onClick = handleClick
            +"Increment"
        }
    }
}
```

### 3. 错误边界

```kotlin
import react.*
import react.dom.html.ReactHTML.div
import react.dom.html.ReactHTML.h1

// 错误边界组件
external interface ErrorBoundaryState : State {
    var hasError: Boolean
    var error: String?
}

class ErrorBoundary : Component<PropsWithChildren, ErrorBoundaryState>() {
    init {
        state = ErrorBoundaryState().apply {
            hasError = false
            error = null
        }
    }

    override fun componentDidCatch(error: Throwable, errorInfo: dynamic) {
        console.error("Error caught by boundary:", error, errorInfo)
        setState(ErrorBoundaryState().apply {
            hasError = true
            this.error = error.message
        })
    }

    override fun render(): ReactNode {
        return if (state.hasError) {
            div {
                h1 {
                    style = js("{ color: 'red' }")
                    +"Something went wrong"
                }

                state.error?.let { error ->
                    p {
                        style = js("{ color: 'gray' }")
                        +"Error: $error"
                    }
                }

                button {
                    onClick = {
                        setState(ErrorBoundaryState().apply {
                            hasError = false
                            error = null
                        })
                    }
                    +"Try again"
                }
            }
        } else {
            props.children
        }
    }
}

// 使用错误边界
val AppWithErrorBoundary = FC<Props> {
    ErrorBoundary {
        // 可能出错的组件
        PotentiallyFailingComponent()
    }
}

val PotentiallyFailingComponent = FC<Props> {
    var shouldFail by useState(false)

    div {
        if (shouldFail) {
            throw Error("Component failed!")
        }

        h3 { +"Potentially Failing Component" }

        button {
            onClick = { shouldFail = true }
            +"Trigger Error"
        }
    }
}
```

## 总结

Kotlin/JS 与 React 的集成为现代 Web 开发提供了强大的工具链。通过类型安全的组件开发、优雅的状态管理、灵活的路由系统和丰富的样式处理，开发者可以构建出高质量、可维护的 React 应用程序。

在下一篇文章中，我们将学习 Kotlin/JS 的性能优化与调试技巧，探索如何提升应用程序的性能和开发体验。
