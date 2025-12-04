---
description: 通过一个完整的实战项目，综合运用Kotlin/JS的各项技术，学习项目架构设计、开发流程和最佳实践。
tag:
  - Kotlin
  - JavaScript
  - 实战项目
  - 最佳实践
  - 项目架构
sidebar: true
---

# Kotlin/JS 实战项目与最佳实践

## 项目概述

在本篇文章中，我们将构建一个完整的任务管理应用，综合运用前面学到的 Kotlin/JS 知识。这个项目将包含用户认证、任务管理、数据持久化、实时更新等功能，展示 Kotlin/JS 在实际项目中的应用。

### 项目功能特性

1. **用户认证**：注册、登录、会话管理
2. **任务管理**：创建、编辑、删除、完成任务
3. **分类管理**：任务分类、标签系统
4. **搜索过滤**：按状态、分类、日期筛选
5. **实时同步**：多设备数据同步
6. **离线支持**：本地存储、离线操作
7. **响应式设计**：适配桌面和移动设备

## 项目架构设计

### 整体架构

```
task-manager/
├── shared/
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/
│       │   └── kotlin/
│       │       ├── models/
│       │       │   ├── User.kt
│       │       │   ├── Task.kt
│       │       │   ├── Category.kt
│       │       │   └── ApiResponse.kt
│       │       ├── repository/
│       │       │   ├── UserRepository.kt
│       │       │   ├── TaskRepository.kt
│       │       │   └── CategoryRepository.kt
│       │       ├── usecase/
│       │       │   ├── auth/
│       │       │   ├── task/
│       │       │   └── category/
│       │       ├── utils/
│       │       │   ├── DateUtils.kt
│       │       │   ├── ValidationUtils.kt
│       │       │   └── StorageUtils.kt
│       │       └── platform/
│       │           └── Platform.kt
│       └── jsMain/
│           └── kotlin/
│               └── platform/
│                   └── PlatformImpl.kt
├── webApp/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           ├── kotlin/
│           │   ├── main/
│           │   │   ├── App.kt
│           │   │   ├── index.kt
│           │   │   ├── components/
│           │   │   │   ├── common/
│           │   │   │   │   ├── Button.kt
│           │   │   │   │   ├── Modal.kt
│           │   │   │   │   ├── Form.kt
│           │   │   │   │   └── Loading.kt
│           │   │   │   ├── auth/
│           │   │   │   │   ├── LoginForm.kt
│           │   │   │   │   └── RegisterForm.kt
│           │   │   │   ├── task/
│           │   │   │   │   ├── TaskList.kt
│           │   │   │   │   ├── TaskItem.kt
│           │   │   │   │   ├── TaskForm.kt
│           │   │   │   │   └── TaskFilter.kt
│           │   │   │   └── layout/
│           │   │   │       ├── Header.kt
│           │   │   │       ├── Sidebar.kt
│           │   │   │       └── Footer.kt
│           │   ├── services/
│           │   │   ├── AuthService.kt
│           │   │   ├── TaskService.kt
│           │   │   └── StorageService.kt
│           │   ├── state/
│           │   │   ├── AppState.kt
│           │   │   ├── AuthState.kt
│           │   │   └── TaskState.kt
│           │   └── utils/
│           │       ├── ApiClient.kt
│           │       ├── Router.kt
│           │       └── ThemeManager.kt
│           └── resources/
│               ├── index.html
│               ├── styles/
│               │   ├── main.css
│               │   ├── components.css
│               │   └── responsive.css
│               └── images/
│                   └── icons/
└── build.gradle.kts
```

### 数据模型设计

```kotlin
// shared/src/commonMain/kotlin/models/User.kt
@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String,
    val avatar: String? = null,
    val createdAt: Long,
    val updatedAt: Long
) {
    fun getInitials(): String {
        return name.split(" ")
            .mapNotNull { it.firstOrNull()?.uppercase() }
            .take(2)
            .joinToString("")
    }
}

// shared/src/commonMain/kotlin/models/Task.kt
@Serializable
data class Task(
    val id: String,
    val title: String,
    val description: String? = null,
    val categoryId: String? = null,
    val priority: TaskPriority = TaskPriority.MEDIUM,
    val status: TaskStatus = TaskStatus.TODO,
    val dueDate: Long? = null,
    val tags: List<String> = emptyList(),
    val createdAt: Long,
    val updatedAt: Long,
    val completedAt: Long? = null
) {
    fun isOverdue(): Boolean {
        if (status == TaskStatus.COMPLETED) return false
        return dueDate?.let { it < getCurrentTimeMillis() } ?: false
    }

    fun getDaysUntilDue(): Int? {
        return dueDate?.let {
            val diff = it - getCurrentTimeMillis()
            (diff / (24 * 60 * 60 * 1000)).toInt()
        }
    }

    fun canBeCompleted(): Boolean {
        return status == TaskStatus.TODO || status == TaskStatus.IN_PROGRESS
    }
}

@Serializable
enum class TaskPriority {
    LOW, MEDIUM, HIGH, URGENT
}

@Serializable
enum class TaskStatus {
    TODO, IN_PROGRESS, COMPLETED, CANCELLED
}

// shared/src/commonMain/kotlin/models/Category.kt
@Serializable
data class Category(
    val id: String,
    val name: String,
    val color: String,
    val icon: String? = null,
    val userId: String,
    val createdAt: Long,
    val updatedAt: Long
)
```

## 核心功能实现

### 用户认证系统

```kotlin
// shared/src/commonMain/kotlin/usecase/auth/LoginUseCase.kt
class LoginUseCase(
    private val userRepository: UserRepository,
    private val storageService: StorageService
) {
    suspend operator fun invoke(email: String, password: String): Result<User> {
        return try {
            // 输入验证
            if (email.isBlank() || password.isBlank()) {
                return Result.failure(ValidationException("Email and password are required"))
            }

            if (!isValidEmail(email)) {
                return Result.failure(ValidationException("Invalid email format"))
            }

            // 尝试登录
            val user = userRepository.login(email, password)
                .getOrElse { throw AuthenticationException("Invalid credentials") }

            // 保存会话
            storageService.saveUserSession(user)

            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun isValidEmail(email: String): Boolean {
        return email.contains("@") && email.contains(".")
    }
}

class ValidationException(message: String) : Exception(message)
class AuthenticationException(message: String) : Exception(message)

// webApp/src/main/kotlin/components/auth/LoginForm.kt
val LoginForm = FC<LoginFormProps> { props ->
    var email by useState("")
    var password by useState("")
    var loading by useState(false)
    var error by useState<String?>(null)

    val scope = rememberCoroutineScope()

    val handleSubmit = useCallback(email, password) { event ->
        event.preventDefault()

        if (email.isBlank() || password.isBlank()) {
            error = "Please fill in all fields"
            return@useCallback
        }

        scope.launch {
            loading = true
            error = null

            props.onLogin(email, password)
                .onSuccess { user ->
                    props.onSuccess(user)
                }
                .onFailure { e ->
                    error = e.message ?: "Login failed"
                }
                .also {
                    loading = false
                }
        }
    }

    div {
        css {
            maxWidth = 400.px
            margin = Margin.auto
            padding = 32.px
            backgroundColor = NamedColor.white
            borderRadius = 8.px
            boxShadow = BoxShadow(0.px, 4.px, 6.px, rgba(0, 0, 0, 0.1))
        }

        h2 {
            css {
                textAlign = TextAlign.center
                marginBottom = 24.px
                color = NamedColor.black
            }
            +"Sign In"
        }

        Form {
            onSubmit = handleSubmit

            FormField {
                label = "Email"
                type = InputType.email
                value = email
                placeholder = "Enter your email"
                required = true
                onChange = { email = it }
            }

            FormField {
                label = "Password"
                type = InputType.password
                value = password
                placeholder = "Enter your password"
                required = true
                onChange = { password = it }
            }

            error?.let { errorMsg ->
                div {
                    css {
                        color = NamedColor.red
                        fontSize = 14.px
                        marginBottom = 16.px
                    }
                    +errorMsg
                }
            }

            Button {
                type = ButtonType.submit
                disabled = loading
                loading = loading
                fullWidth = true
                text = "Sign In"
            }
        }

        div {
            css {
                textAlign = TextAlign.center
                marginTop = 16.px
                fontSize = 14.px
                color = NamedColor.gray
            }

            +"Don't have an account? "

            button {
                css {
                    background = None.none
                    border = None.none
                    color = NamedColor.blue
                    cursor = Cursor.pointer
                    textDecoration = TextDecoration.underline
                }
                onClick = { props.onSwitchToRegister() }
                +"Sign Up"
            }
        }
    }
}

external interface LoginFormProps : Props {
    var onLogin: (String, String) -> Result<User>
    var onSuccess: (User) -> Unit
    var onSwitchToRegister: () -> Unit
}
```

### 任务管理系统

```kotlin
// shared/src/commonMain/kotlin/usecase/task/CreateTaskUseCase.kt
class CreateTaskUseCase(
    private val taskRepository: TaskRepository,
    private val storageService: StorageService
) {
    suspend operator fun invoke(request: CreateTaskRequest): Result<Task> {
        return try {
            // 验证输入
            validateRequest(request)

            // 创建任务
            val task = Task(
                id = generateId(),
                title = request.title,
                description = request.description,
                categoryId = request.categoryId,
                priority = request.priority,
                status = TaskStatus.TODO,
                dueDate = request.dueDate,
                tags = request.tags,
                createdAt = getCurrentTimeMillis(),
                updatedAt = getCurrentTimeMillis()
            )

            val createdTask = taskRepository.createTask(task)
                .getOrElse { throw TaskCreationException("Failed to create task", it) }

            // 同步到本地存储
            storageService.saveTask(createdTask)

            Result.success(createdTask)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun validateRequest(request: CreateTaskRequest) {
        if (request.title.isBlank()) {
            throw ValidationException("Task title is required")
        }

        if (request.title.length > 200) {
            throw ValidationException("Task title too long (max 200 characters)")
        }

        request.description?.let { desc ->
            if (desc.length > 1000) {
                throw ValidationException("Task description too long (max 1000 characters)")
            }
        }

        request.dueDate?.let { dueDate ->
            if (dueDate < getCurrentTimeMillis()) {
                throw ValidationException("Due date cannot be in the past")
            }
        }
    }

    private fun generateId(): String {
        return "task_${getCurrentTimeMillis()}_${(0..1000).random()}"
    }
}

@Serializable
data class CreateTaskRequest(
    val title: String,
    val description: String? = null,
    val categoryId: String? = null,
    val priority: TaskPriority = TaskPriority.MEDIUM,
    val dueDate: Long? = null,
    val tags: List<String> = emptyList()
)

class TaskCreationException(message: String, cause: Throwable? = null) : Exception(message, cause)

// webApp/src/main/kotlin/components/task/TaskForm.kt
val TaskForm = FC<TaskFormProps> { props ->
    var title by useState(props.task?.title ?: "")
    var description by useState(props.task?.description ?: "")
    var categoryId by useState(props.task?.categoryId ?: "")
    var priority by useState(props.task?.priority ?: TaskPriority.MEDIUM)
    var dueDate by useState(props.task?.dueDate?.let { Date(it.toDouble()) })
    var tags by useState(props.task?.tags?.joinToString(", ") ?: "")
    var loading by useState(false)

    val scope = rememberCoroutineScope()

    val handleSubmit = useCallback(title, description, categoryId, priority, dueDate, tags) { event ->
        event.preventDefault()

        if (title.isBlank()) {
            return@useCallback
        }

        scope.launch {
            loading = true

            val request = CreateTaskRequest(
                title = title,
                description = description.ifBlank { null },
                categoryId = categoryId.ifBlank { null },
                priority = priority,
                dueDate = dueDate?.getTime()?.toLong(),
                tags = tags.split(",").map { it.trim() }.filter { it.isNotBlank() }
            )

            val result = if (props.task != null) {
                props.onUpdate(props.task.id, request)
            } else {
                props.onCreate(request)
            }

            result.onSuccess { task ->
                props.onSuccess(task)
            }
            .onFailure { e ->
                // 显示错误消息
                console.error("Failed to save task:", e)
            }
            .also {
                loading = false
            }
        }
    }

    div {
        css {
            backgroundColor = NamedColor.white
            borderRadius = 8.px
            padding = 24.px
            boxShadow = BoxShadow(0.px, 2.px, 4.px, rgba(0, 0, 0, 0.1))
        }

        h3 {
            css {
                marginBottom = 20.px
                color = NamedColor.black
            }
            +if (props.task != null) "Edit Task" else "New Task"
        }

        Form {
            onSubmit = handleSubmit

            FormField {
                label = "Title"
                type = InputType.text
                value = title
                placeholder = "Enter task title"
                required = true
                onChange = { title = it }
            }

            FormField {
                label = "Description"
                type = InputType.textarea
                value = description
                placeholder = "Enter task description"
                rows = 4
                onChange = { description = it }
            }

            FormField {
                label = "Category"
                type = InputType.select
                value = categoryId
                options = props.categories.map { category ->
                    SelectOption(category.id, category.name)
                }
                onChange = { categoryId = it }
            }

            FormField {
                label = "Priority"
                type = InputType.select
                value = priority.name
                options = TaskPriority.values().map { priority ->
                    SelectOption(priority.name, priority.name.replace("_", " "))
                }
                onChange = { priority = TaskPriority.valueOf(it) }
            }

            FormField {
                label = "Due Date"
                type = InputType.date
                value = dueDate?.let {
                    val year = it.getFullYear()
                    val month = (it.getMonth() + 1).toString().padStart(2, '0')
                    val day = it.getDate().toString().padStart(2, '0')
                    "$year-$month-$day"
                }
                onChange = { dateStr ->
                    dueDate = if (dateStr.isNotBlank()) {
                        Date(dateStr)
                    } else {
                        null
                    }
                }
            }

            FormField {
                label = "Tags"
                type = InputType.text
                value = tags
                placeholder = "Enter tags separated by commas"
                onChange = { tags = it }
            }

            div {
                css {
                    display = Display.flex
                    gap = 12.px
                    marginTop = 24.px
                }

                Button {
                    type = ButtonType.submit
                    disabled = loading
                    loading = loading
                    text = if (props.task != null) "Update Task" else "Create Task"
                }

                if (props.onCancel != null) {
                    Button {
                        type = ButtonType.button
                        variant = ButtonVariant.OUTLINE
                        text = "Cancel"
                        onClick = { props.onCancel?.invoke() }
                    }
                }
            }
        }
    }
}

external interface TaskFormProps : Props {
    var task: Task?
    var categories: List<Category>
    var onCreate: (CreateTaskRequest) -> Result<Task>
    var onUpdate: (String, CreateTaskRequest) -> Result<Task>
    var onSuccess: (Task) -> Unit
    var onCancel: (() -> Unit)?
}
```

### 状态管理

```kotlin
// webApp/src/main/kotlin/state/AppState.kt
data class AppState(
    val authState: AuthState = AuthState(),
    val taskState: TaskState = TaskState(),
    val categoryState: CategoryState = CategoryState(),
    val uiState: UIState = UIState()
)

data class AuthState(
    val user: User? = null,
    val isAuthenticated: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null
)

data class TaskState(
    val tasks: List<Task> = emptyList(),
    val filteredTasks: List<Task> = emptyList(),
    val selectedTask: Task? = null,
    val loading: Boolean = false,
    val error: String? = null,
    val filter: TaskFilter = TaskFilter()
)

data class CategoryState(
    val categories: List<Category> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null
)

data class UIState(
    val theme: Theme = Theme.LIGHT,
    val sidebarOpen: Boolean = false,
    val currentPage: Page = Page.TASKS,
    val notifications: List<Notification> = emptyList()
)

enum class Theme { LIGHT, DARK }
enum class Page { TASKS, CATEGORIES, SETTINGS, PROFILE }

data class TaskFilter(
    val status: TaskStatus? = null,
    val categoryId: String? = null,
    val priority: TaskPriority? = null,
    val searchQuery: String = "",
    val sortBy: TaskSortBy = TaskSortBy.CREATED_AT,
    val sortOrder: SortOrder = SortOrder.DESC
)

enum class TaskSortBy { CREATED_AT, DUE_DATE, PRIORITY, TITLE }
enum class SortOrder { ASC, DESC }

data class Notification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val message: String,
    val timestamp: Long,
    val read: Boolean = false
)

enum class NotificationType { SUCCESS, ERROR, WARNING, INFO }

// webApp/src/main/kotlin/state/StateManager.kt
class StateManager {
    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    fun updateAuthState(newState: AuthState) {
        _state.update { it.copy(authState = newState) }
    }

    fun updateTaskState(newState: TaskState) {
        _state.update { it.copy(taskState = newState) }
    }

    fun updateCategoryState(newState: CategoryState) {
        _state.update { it.copy(categoryState = newState) }
    }

    fun updateUIState(newState: UIState) {
        _state.update { it.copy(uiState = newState) }
    }

    fun addNotification(notification: Notification) {
        _state.update { currentState ->
            currentState.copy(
                uiState = currentState.uiState.copy(
                    notifications = currentState.uiState.notifications + notification
                )
            )
        }
    }

    fun markNotificationAsRead(notificationId: String) {
        _state.update { currentState ->
            currentState.copy(
                uiState = currentState.uiState.copy(
                    notifications = currentState.uiState.notifications.map { notification ->
                        if (notification.id == notificationId) {
                            notification.copy(read = true)
                        } else {
                            notification
                        }
                    }
                )
            )
        }
    }

    fun clearNotifications() {
        _state.update { currentState ->
            currentState.copy(
                uiState = currentState.uiState.copy(notifications = emptyList())
            )
        }
    }
}
```

## 高级功能实现

### 实时数据同步

```kotlin
// webApp/src/main/kotlin/services/RealtimeService.kt
class RealtimeService(
    private val stateManager: StateManager
) {
    private var websocket: WebSocket? = null
    private val reconnectAttempts = mutableMapOf<String, Int>()
    private val maxReconnectAttempts = 5

    fun connect(userId: String) {
        try {
            websocket = WebSocket("wss://api.example.com/ws?userId=$userId")

            websocket?.onopen = {
                console.log("WebSocket connected")
                reconnectAttempts.clear()

                // 发送连接确认
                sendWebSocketMessage(
                    WebSocketMessage(type = "connect", data = mapOf("userId" to userId))
                )
            }

            websocket?.onmessage = { event ->
                handleWebSocketMessage(event.data.toString())
            }

            websocket?.onclose = { event ->
                console.log("WebSocket disconnected: ${event.code}")
                handleReconnect(userId)
            }

            websocket?.onerror = { error ->
                console.error("WebSocket error:", error)
            }

        } catch (e: Exception) {
            console.error("Failed to connect WebSocket:", e)
        }
    }

    private fun handleWebSocketMessage(message: String) {
        try {
            val webSocketMessage = JSON.parse<WebSocketMessage>(message)

            when (webSocketMessage.type) {
                "task_created" -> handleTaskCreated(webSocketMessage.data)
                "task_updated" -> handleTaskUpdated(webSocketMessage.data)
                "task_deleted" -> handleTaskDeleted(webSocketMessage.data)
                "category_updated" -> handleCategoryUpdated(webSocketMessage.data)
            }
        } catch (e: Exception) {
            console.error("Failed to handle WebSocket message:", e)
        }
    }

    private fun handleTaskCreated(data: dynamic) {
        val task = JSON.parse<Task>(JSON.stringify(data))

        stateManager.updateTaskState(
            stateManager.state.value.taskState.copy(
                tasks = stateManager.state.value.taskState.tasks + task
            )
        )

        stateManager.addNotification(
            Notification(
                id = generateId(),
                type = NotificationType.SUCCESS,
                title = "New Task",
                message = "Task '${task.title}' was created",
                timestamp = getCurrentTimeMillis()
            )
        )
    }

    private fun handleTaskUpdated(data: dynamic) {
        val task = JSON.parse<Task>(JSON.stringify(data))

        stateManager.updateTaskState(
            stateManager.state.value.taskState.copy(
                tasks = stateManager.state.value.taskState.tasks.map {
                    if (it.id == task.id) task else it
                }
            )
        )
    }

    private fun handleTaskDeleted(data: dynamic) {
        val taskId = data.id as String

        stateManager.updateTaskState(
            stateManager.state.value.taskState.copy(
                tasks = stateManager.state.value.taskState.tasks.filter { it.id != taskId }
            )
        )
    }

    private fun handleCategoryUpdated(data: dynamic) {
        val category = JSON.parse<Category>(JSON.stringify(data))

        stateManager.updateCategoryState(
            stateManager.state.value.categoryState.copy(
                categories = stateManager.state.value.categoryState.categories.map {
                    if (it.id == category.id) category else it
                }
            )
        )
    }

    private fun handleReconnect(userId: String) {
        val attempts = reconnectAttempts.getOrDefault(userId, 0) + 1
        reconnectAttempts[userId] = attempts

        if (attempts <= maxReconnectAttempts) {
            val delay = minOf(attempts * 1000, 30000) // 指数退避，最大30秒

            window.setTimeout({
                console.log("Attempting to reconnect WebSocket (attempt $attempts)")
                connect(userId)
            }, delay)
        } else {
            console.error("Max reconnection attempts reached")
        }
    }

    private fun sendWebSocketMessage(message: WebSocketMessage) {
        try {
            websocket?.send(JSON.stringify(message))
        } catch (e: Exception) {
            console.error("Failed to send WebSocket message:", e)
        }
    }

    fun disconnect() {
        websocket?.close()
        websocket = null
        reconnectAttempts.clear()
    }

    private fun generateId(): String {
        return "notif_${getCurrentTimeMillis()}_${(0..1000).random()}"
    }
}

@Serializable
data class WebSocketMessage(
    val type: String,
    val data: dynamic
)
```

### 离线支持

```kotlin
// webApp/src/main/kotlin/services/OfflineService.kt
class OfflineService(
    private val storageService: StorageService,
    private val stateManager: StateManager
) {
    private val pendingOperations = mutableListOf<OfflineOperation>()

    init {
        loadPendingOperations()
    }

    suspend fun syncWhenOnline() {
        if (navigator.onLine) {
            val operations = pendingOperations.toList()
            pendingOperations.clear()

            for (operation in operations) {
                try {
                    when (operation.type) {
                        OfflineOperationType.CREATE_TASK -> {
                            val task = JSON.parse<Task>(operation.data)
                            // 同步到服务器
                            // taskRepository.createTask(task)
                        }
                        OfflineOperationType.UPDATE_TASK -> {
                            val taskData = JSON.parse<dynamic>(operation.data)
                            // 同步到服务器
                            // taskRepository.updateTask(taskData.id, taskData)
                        }
                        OfflineOperationType.DELETE_TASK -> {
                            val taskId = operation.data
                            // 同步到服务器
                            // taskRepository.deleteTask(taskId)
                        }
                    }
                } catch (e: Exception) {
                    console.error("Failed to sync operation:", e)
                    // 重新添加到待处理列表
                    pendingOperations.add(operation)
                }
            }

            savePendingOperations()
        }
    }

    fun addPendingOperation(operation: OfflineOperation) {
        pendingOperations.add(operation)
        savePendingOperations()
    }

    private fun loadPendingOperations() {
        try {
            val operationsJson = storageService.getPendingOperations()
            if (operationsJson.isNotBlank()) {
                val operations = JSON.parse<Array<OfflineOperation>>(operationsJson)
                pendingOperations.addAll(operations)
            }
        } catch (e: Exception) {
            console.error("Failed to load pending operations:", e)
        }
    }

    private fun savePendingOperations() {
        try {
            val operationsJson = JSON.stringify(pendingOperations.toTypedArray())
            storageService.savePendingOperations(operationsJson)
        } catch (e: Exception) {
            console.error("Failed to save pending operations:", e)
        }
    }

    fun clearPendingOperations() {
        pendingOperations.clear()
        savePendingOperations()
    }
}

@Serializable
data class OfflineOperation(
    val id: String,
    val type: OfflineOperationType,
    val data: String,
    val timestamp: Long
)

enum class OfflineOperationType {
    CREATE_TASK, UPDATE_TASK, DELETE_TASK, CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY
}
```

## 部署与优化

### 生产环境配置

```kotlin
// webApp/build.gradle.kts
kotlin {
    js {
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }

                // 生产环境优化
                config {
                    optimization = js("""
                        {
                            minimize: true,
                            splitChunks: {
                                chunks: 'all',
                                cacheGroups: {
                                    vendor: {
                                        test: /[\\\\/]node_modules[\\\\/]/,
                                        name: 'vendors',
                                        chunks: 'all',
                                        priority: 10
                                    },
                                    common: {
                                        name: 'common',
                                        minChunks: 2,
                                        chunks: 'all',
                                        priority: 5,
                                        reuseExistingChunk: true
                                    }
                                }
                            },
                            runtimeChunk: {
                                name: 'runtime'
                            }
                        }
                    """.trimIndent())
                }
            }

            webpackTask {
                mode = "production"
                output.library = "TaskManager"
                output.libraryTarget = "umd"
            }
        }
        binaries.executable()
    }
}

// 构建任务
tasks.register("buildProduction") {
    dependsOn("jsBrowserProductionWebpack")

    doLast {
        // 生成版本信息
        val versionInfo = mapOf(
            "version" to project.version,
            "buildTime" to Date().toISOString(),
            "gitCommit" to getGitCommit()
        )

        file("build/dist/js/productionExecutable/version.json")
            .writeText(JSON.stringify(versionInfo, null, 2))

        // 压缩静态资源
        compressStaticAssets()
    }
}

fun getGitCommit(): String {
    return try {
        val process = ProcessBuilder("git", "rev-parse", "HEAD").start()
        process.inputStream.bufferedReader().readText().trim()
    } catch (e: Exception) {
        "unknown"
    }
}

fun compressStaticAssets() {
    // 压缩CSS文件
    fileTree("build/dist/js/productionExecutable").visit { file ->
        if (file.name.endsWith(".css")) {
            val compressed = compressCss(file.readText())
            file.writeText(compressed)
        }
    }
}

fun compressCss(css: String): String {
    // 简单的CSS压缩实现
    return css
        .replace("\\s+".toRegex(), " ")
        .replace("/\\*[^*]*\\*/".toRegex(), "")
        .replace(";\\s*}".toRegex(), "}")
        .replace(";\\s*".toRegex(), ";")
        .replace("\\s*\\{\\s*".toRegex(), "{")
        .replace("\\s*;\\s*".toRegex(), ";")
        .trim()
}
```

### CI/CD 流水线

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
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

      - name: Run tests
        run: ./gradlew test

      - name: Run JS tests
        run: ./gradlew jsBrowserTest --continue

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./shared/build/reports/jacoco/test/jacocoTestReport.xml

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

      - name: Build for production
        run: ./gradlew buildProduction

      - name: Run E2E tests
        run: |
          npm install -g playwright
          npx playwright install
          ./gradlew jsBrowserProductionWebpack
          npx playwright test

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: production-build
          path: webApp/build/dist/js/productionExecutable/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: production-build
          path: build/

      - name: Deploy to staging
        run: |
          # 部署到测试环境
          aws s3 sync build/ s3://staging.taskmanager.com --delete
          aws cloudfront create-invalidation --distribution-id E123456789 --paths "/*"

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: production-build
          path: build/

      - name: Deploy to production
        run: |
          # 部署到生产环境
          aws s3 sync build/ s3://taskmanager.com --delete
          aws cloudfront create-invalidation --distribution-id E987654321 --paths "/*"

          # 发送部署通知
          curl -X POST "https://hooks.slack.com/services/xxx/yyy/zzz" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"Task Manager deployed to production!\"}"
```

## 最佳实践总结

### 1. 代码组织

```kotlin
// 使用包结构组织代码
package com.taskmanager.components.common

// 组件命名规范
class TaskCardComponent
class UserAvatarComponent
class LoadingSpinnerComponent

// 使用工厂模式创建组件
object ComponentFactory {
    fun createTaskCard(task: Task): ReactElement {
        return TaskCard {
            this.task = task
            // 其他属性
        }
    }
}
```

### 2. 错误处理

```kotlin
// 统一错误处理
class ErrorHandler {
    companion object {
        fun handleError(error: Throwable, context: String) {
            when (error) {
                is NetworkException -> {
                    showUserError("Network error. Please check your connection.")
                    logError(error, context)
                }
                is ValidationException -> {
                    showUserError(error.message ?: "Invalid input")
                    logError(error, context)
                }
                else -> {
                    showUserError("An unexpected error occurred.")
                    logError(error, context)
                    sendErrorReport(error, context)
                }
            }
        }

        private fun showUserError(message: String) {
            // 显示用户友好的错误消息
        }

        private fun logError(error: Throwable, context: String) {
            console.error("[$context] ${error.message}", error)
        }

        private fun sendErrorReport(error: Throwable, context: String) {
            // 发送错误报告到监控服务
        }
    }
}
```

### 3. 性能优化

```kotlin
// 使用React.memo优化组件
val TaskItem = FC<TaskItemProps> { props ->
    // 组件实现
}.memo { prevProps, nextProps ->
    prevProps.task.id == nextProps.task.id &&
    prevProps.task.updatedAt == nextProps.task.updatedAt
}

// 使用useMemo缓存计算结果
val TaskList = FC<TaskListProps> { props ->
    val filteredTasks = useMemo(props.tasks, props.filter) {
        applyTaskFilter(it, props.filter)
    }

    // 渲染任务列表
}

// 使用useCallback缓存函数
val TaskForm = FC<TaskFormProps> { props ->
    val handleSubmit = useCallback(props.task) { task ->
        // 处理提交逻辑
    }

    // 表单实现
}
```

### 4. 测试策略

```kotlin
// 组件测试
class TaskCardTest {
    @Test
    fun testTaskCardRendersCorrectly() {
        val task = Task(
            id = "1",
            title = "Test Task",
            description = "Test Description",
            status = TaskStatus.TODO,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        render(TaskCard) {
            this.task = task
            onEdit = { }
            onDelete = { }
        }

        screen.getByText("Test Task").assertExists()
        screen.getByText("Test Description").assertExists()
    }

    @Test
    fun testTaskCardHandlesEditClick() {
        var editedTask: Task? = null

        val task = Task(
            id = "1",
            title = "Test Task",
            status = TaskStatus.TODO,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )

        render(TaskCard) {
            this.task = task
            onEdit = { editedTask = it }
            onDelete = { }
        }

        screen.getByText("Edit").click()

        assertEquals(task, editedTask)
    }
}

// 集成测试
class TaskIntegrationTest {
    @Test
    fun testCreateTaskFlow() = runTest {
        val taskRepository = MockTaskRepository()
        val createTaskUseCase = CreateTaskUseCase(taskRepository, MockStorageService())

        val request = CreateTaskRequest(
            title = "New Task",
            description = "Task Description"
        )

        val result = createTaskUseCase(request)

        assertTrue(result.isSuccess)

        val createdTask = result.getOrNull()
        assertNotNull(createdTask)
        assertEquals("New Task", createdTask?.title)
        assertEquals("Task Description", createdTask?.description)

        // 验证任务被保存到仓库
        assertEquals(1, taskRepository.tasks.size)
    }
}
```

## 总结

通过这个完整的任务管理应用，我们展示了 Kotlin/JS 在实际项目中的强大能力。从项目架构设计到功能实现，从性能优化到部署策略，这个项目涵盖了现代 Web 应用开发的各个方面。

Kotlin/JS 为 Web 开发带来了类型安全、现代语言特性和优秀的开发体验。结合 React、协程和 Multiplatform 技术，我们可以构建出高质量、可维护的跨平台应用程序。

希望这个系列文章能够帮助你掌握 Kotlin/JS 开发，并在实际项目中应用这些技术和最佳实践。祝你开发愉快！
