---
description: 本文通过一个完整的社交媒体应用开发案例，深入浅出地讲解Riverpod状态管理方案的核心概念、高级特性和最佳实践，帮助开发者掌握现代化的Flutter状态管理技术。
tag:
  - Flutter
  - Riverpod
  - 状态管理
  - 实战指南
  - 依赖注入
  - 响应式编程
sticky: 1
sidebar: true
---

# Flutter 状态管理-Riverpod 实战指南

## 故事开始：小张的社交媒体创业梦

小张是一位充满激情的 Flutter 开发者，他梦想开发一个属于自己的社交媒体应用。这个应用需要处理用户认证、动态发布、评论互动、实时消息等复杂状态。在评估了多种状态管理方案后，小张选择了 Riverpod。

"Riverpod 结合了 Provider 的简洁性和 BLOC 的强大功能，而且提供了编译时安全，这正是我需要的。"小张兴奋地说道。

## 第一章：Riverpod 基础概念

### 1.1 什么是 Riverpod？

Riverpod（Provider 的反向拼写）是由 Provider 作者开发的现代化状态管理库，它解决了 Provider 的一些限制，提供了更强大、更灵活的功能。

**Riverpod 的核心优势：**

- 编译时安全，避免运行时错误
- 不依赖 BuildContext，可以在任何地方访问状态
- 支持自动依赖注入
- 强大的测试支持
- 更好的性能优化

### 1.2 环境搭建

首先，我们需要在项目中添加 Riverpod 依赖：

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.7
  riverpod_generator: ^2.3.9
  custom_lint: ^0.5.7
  riverpod_lint: ^2.3.7
```

然后在应用入口处包裹 ProviderScope：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: '小张的社交',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: AuthWrapper(),
    );
  }
}
```

### 1.3 基本 Provider 类型

Riverpod 提供了多种 Provider 类型，每种都有特定的用途：

```dart
// 1. Provider - 提供不可变值
final configProvider = Provider<AppConfig>((ref) {
  return AppConfig(
    apiBaseUrl: 'https://api.xiaozhang.social',
    appVersion: '1.0.0',
    enableDebugMode: kDebugMode,
  );
});

// 2. StateProvider - 提供可变状态
final counterProvider = StateProvider<int>((ref) => 0);

// 3. StateNotifierProvider - 提供复杂状态管理
final userProvider = StateNotifierProvider<UserNotifier, UserState>((ref) {
  return UserNotifier(ref.watch(authRepositoryProvider));
});

// 4. FutureProvider - 处理异步操作
final postsProvider = FutureProvider<List<Post>>((ref) async {
  final repository = ref.watch(postRepositoryProvider);
  return repository.fetchPosts();
});

// 5. StreamProvider - 处理数据流
final chatMessagesProvider = StreamProvider<List<ChatMessage>>((ref) {
  final repository = ref.watch(chatRepositoryProvider);
  return repository.watchMessages();
});

// 6. AsyncNotifierProvider - 异步状态管理
final authProvider = AsyncNotifierProvider<AuthNotifier, User?>((ref) {
  return AuthNotifier();
});
```

## 第二章：用户认证系统

### 2.1 认证状态管理

小张首先实现了用户认证系统，这是社交应用的核心功能：

```dart
// 用户模型
class User {
  final String id;
  final String username;
  final String email;
  final String avatar;
  final String bio;
  final int followersCount;
  final int followingCount;
  final DateTime createdAt;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.avatar,
    this.bio = '',
    this.followersCount = 0,
    this.followingCount = 0,
    required this.createdAt,
  });

  User copyWith({
    String? id,
    String? username,
    String? email,
    String? avatar,
    String? bio,
    int? followersCount,
    int? followingCount,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      bio: bio ?? this.bio,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'avatar': avatar,
      'bio': bio,
      'followersCount': followersCount,
      'followingCount': followingCount,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      avatar: json['avatar'],
      bio: json['bio'] ?? '',
      followersCount: json['followersCount'] ?? 0,
      followingCount: json['followingCount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

// 认证状态
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

// 认证仓库
abstract class AuthRepository {
  Future<User> signIn(String email, String password);
  Future<User> signUp(String username, String email, String password);
  Future<void> signOut();
  Future<User> signInWithGoogle();
  Future<User> signInWithApple();
  Future<void> resetPassword(String email);
  Stream<User?> authStateChanges();
}

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;
  final StorageService _storageService;

  AuthRepositoryImpl(this._apiClient, this._storageService);

  @override
  Future<User> signIn(String email, String password) async {
    try {
      final response = await _apiClient.post('/auth/signin', {
        'email': email,
        'password': password,
      });

      final user = User.fromJson(response['user']);
      final token = response['token'];

      await _storageService.saveToken(token);
      await _storageService.saveUser(user);

      return user;
    } catch (e) {
      throw AuthException('登录失败：${e.toString()}');
    }
  }

  @override
  Future<User> signUp(String username, String email, String password) async {
    try {
      final response = await _apiClient.post('/auth/signup', {
        'username': username,
        'email': email,
        'password': password,
      });

      final user = User.fromJson(response['user']);
      final token = response['token'];

      await _storageService.saveToken(token);
      await _storageService.saveUser(user);

      return user;
    } catch (e) {
      throw AuthException('注册失败：${e.toString()}');
    }
  }

  @override
  Future<void> signOut() async {
    await _storageService.clearToken();
    await _storageService.clearUser();
  }

  @override
  Future<User> signInWithGoogle() async {
    try {
      // 集成Google Sign-In SDK
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) {
        throw AuthException('Google登录取消');
      }

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final response = await _apiClient.post('/auth/google', {
        'token': credential.idToken,
      });

      final user = User.fromJson(response['user']);
      final token = response['token'];

      await _storageService.saveToken(token);
      await _storageService.saveUser(user);

      return user;
    } catch (e) {
      throw AuthException('Google登录失败：${e.toString()}');
    }
  }

  @override
  Future<User> signInWithApple() async {
    try {
      // 集成Apple Sign-In SDK
      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final response = await _apiClient.post('/auth/apple', {
        'token': appleCredential.identityToken,
      });

      final user = User.fromJson(response['user']);
      final token = response['token'];

      await _storageService.saveToken(token);
      await _storageService.saveUser(user);

      return user;
    } catch (e) {
      throw AuthException('Apple登录失败：${e.toString()}');
    }
  }

  @override
  Future<void> resetPassword(String email) async {
    await _apiClient.post('/auth/reset-password', {'email': email});
  }

  @override
  Stream<User?> authStateChanges() {
    return _storageService.userChanges();
  }
}

// 认证仓库Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    ref.watch(apiClientProvider),
    ref.watch(storageServiceProvider),
  );
});

// 认证状态管理器
class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  AuthNotifier(this._authRepository) : super(const AsyncValue.loading()) {
    _init();
  }

  final AuthRepository _authRepository;

  void _init() {
    state = const AsyncValue.loading();
    _authRepository.authStateChanges().listen(
      (user) {
        state = AsyncValue.data(user);
      },
      onError: (error, stackTrace) {
        state = AsyncValue.error(error, stackTrace);
      },
    );
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authRepository.signIn(email, password);
      state = AsyncValue.data(user);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> signUp(String username, String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authRepository.signUp(username, email, password);
      state = AsyncValue.data(user);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> signInWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final user = await _authRepository.signInWithGoogle();
      state = AsyncValue.data(user);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> signInWithApple() async {
    state = const AsyncValue.loading();
    try {
      final user = await _authRepository.signInWithApple();
      state = AsyncValue.data(user);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> signOut() async {
    state = const AsyncValue.loading();
    try {
      await _authRepository.signOut();
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      await _authRepository.resetPassword(email);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

// 认证Provider
final authProvider = AsyncNotifierProvider<AuthNotifier, User?>(() {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});
```

### 2.2 认证 UI 实现

```dart
// 认证包装器
class AuthWrapper extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      data: (user) {
        if (user != null) {
          return MainNavigation();
        } else {
          return LoginPage();
        }
      },
      loading: () => const SplashScreen(),
      error: (error, stackTrace) => ErrorScreen(
        error: error.toString(),
        onRetry: () => ref.refresh(authProvider),
      ),
    );
  }
}

// 登录页面
class LoginPage extends ConsumerStatefulWidget {
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('登录'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 48),
                Text(
                  '欢迎回来',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8),
                Text(
                  '登录以继续使用小张的社交',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 48),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: '邮箱',
                    prefixIcon: Icon(Icons.email_outlined),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return '请输入邮箱';
                    }
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                      return '请输入有效的邮箱地址';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: '密码',
                    prefixIcon: Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return '请输入密码';
                    }
                    if (value.length < 6) {
                      return '密码至少6位';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 24),
                authState.isLoading
                    ? Center(child: CircularProgressIndicator())
                    : ElevatedButton(
                        onPressed: () => _handleSignIn(),
                        child: Text('登录'),
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                SizedBox(height: 16),
                TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => RegisterPage()),
                  ),
                  child: Text('还没有账号？立即注册'),
                ),
                SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(child: Divider()),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: Text('或'),
                    ),
                    Expanded(child: Divider()),
                  ],
                ),
                SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _handleGoogleSignIn(),
                        icon: Icon(Icons.g_mobiledata),
                        label: Text('Google'),
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 16),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _handleAppleSignIn(),
                        icon: Icon(Icons.apple),
                        label: Text('Apple'),
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleSignIn() async {
    if (_formKey.currentState!.validate()) {
      await ref.read(authProvider.notifier).signIn(
            _emailController.text,
            _passwordController.text,
          );
    }
  }

  Future<void> _handleGoogleSignIn() async {
    await ref.read(authProvider.notifier).signInWithGoogle();
  }

  Future<void> _handleAppleSignIn() async {
    await ref.read(authProvider.notifier).signInWithApple();
  }
}
```

## 第三章：动态发布系统

### 3.1 动态数据模型

```dart
// 动态模型
class Post {
  final String id;
  final String userId;
  final String username;
  final String userAvatar;
  final String content;
  final List<String> images;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final DateTime createdAt;
  final bool isLiked;
  final List<String> tags;

  Post({
    required this.id,
    required this.userId,
    required this.username,
    required this.userAvatar,
    required this.content,
    this.images = const [],
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    required this.createdAt,
    this.isLiked = false,
    this.tags = const [],
  });

  Post copyWith({
    String? id,
    String? userId,
    String? username,
    String? userAvatar,
    String? content,
    List<String>? images,
    int? likesCount,
    int? commentsCount,
    int? sharesCount,
    DateTime? createdAt,
    bool? isLiked,
    List<String>? tags,
  }) {
    return Post(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      userAvatar: userAvatar ?? this.userAvatar,
      content: content ?? this.content,
      images: images ?? this.images,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      sharesCount: sharesCount ?? this.sharesCount,
      createdAt: createdAt ?? this.createdAt,
      isLiked: isLiked ?? this.isLiked,
      tags: tags ?? this.tags,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'username': username,
      'userAvatar': userAvatar,
      'content': content,
      'images': images,
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'sharesCount': sharesCount,
      'createdAt': createdAt.toIso8601String(),
      'isLiked': isLiked,
      'tags': tags,
    };
  }

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'],
      userId: json['userId'],
      username: json['username'],
      userAvatar: json['userAvatar'],
      content: json['content'],
      images: List<String>.from(json['images'] ?? []),
      likesCount: json['likesCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? 0,
      sharesCount: json['sharesCount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      isLiked: json['isLiked'] ?? false,
      tags: List<String>.from(json['tags'] ?? []),
    );
  }
}

// 动态仓库
abstract class PostRepository {
  Future<List<Post>> fetchPosts({int page = 1, int limit = 20});
  Future<Post> createPost({
    required String content,
    List<String> images = const [],
    List<String> tags = const [],
  });
  Future<void> likePost(String postId);
  Future<void> unlikePost(String postId);
  Future<void> deletePost(String postId);
  Future<List<Post>> fetchUserPosts(String userId);
  Stream<List<Post>> watchPosts();
}

class PostRepositoryImpl implements PostRepository {
  final ApiClient _apiClient;
  final StorageService _storageService;

  PostRepositoryImpl(this._apiClient, this._storageService);

  @override
  Future<List<Post>> fetchPosts({int page = 1, int limit = 20}) async {
    try {
      final response = await _apiClient.get('/posts', queryParameters: {
        'page': page,
        'limit': limit,
      });

      final postsJson = response['posts'] as List;
      return postsJson.map((json) => Post.fromJson(json)).toList();
    } catch (e) {
      throw PostException('获取动态失败：${e.toString()}');
    }
  }

  @override
  Future<Post> createPost({
    required String content,
    List<String> images = const [],
    List<String> tags = const [],
  }) async {
    try {
      final response = await _apiClient.post('/posts', {
        'content': content,
        'images': images,
        'tags': tags,
      });

      return Post.fromJson(response['post']);
    } catch (e) {
      throw PostException('发布动态失败：${e.toString()}');
    }
  }

  @override
  Future<void> likePost(String postId) async {
    try {
      await _apiClient.post('/posts/$postId/like');
    } catch (e) {
      throw PostException('点赞失败：${e.toString()}');
    }
  }

  @override
  Future<void> unlikePost(String postId) async {
    try {
      await _apiClient.delete('/posts/$postId/like');
    } catch (e) {
      throw PostException('取消点赞失败：${e.toString()}');
    }
  }

  @override
  Future<void> deletePost(String postId) async {
    try {
      await _apiClient.delete('/posts/$postId');
    } catch (e) {
      throw PostException('删除动态失败：${e.toString()}');
    }
  }

  @override
  Future<List<Post>> fetchUserPosts(String userId) async {
    try {
      final response = await _apiClient.get('/users/$userId/posts');

      final postsJson = response['posts'] as List;
      return postsJson.map((json) => Post.fromJson(json)).toList();
    } catch (e) {
      throw PostException('获取用户动态失败：${e.toString()}');
    }
  }

  @override
  Stream<List<Post>> watchPosts() {
    // 这里应该使用WebSocket或Firebase Realtime Database
    // 为了演示，我们使用定时器模拟实时更新
    return Stream.periodic(Duration(seconds: 30), (_) async {
      return await fetchPosts();
    }).asyncMap((future) => future);
  }
}

// 动态仓库Provider
final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepositoryImpl(
    ref.watch(apiClientProvider),
    ref.watch(storageServiceProvider),
  );
});
```

### 3.2 动态状态管理

```dart
// 动态状态
class PostState {
  final List<Post> posts;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final bool hasMore;
  final int currentPage;

  PostState({
    this.posts = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
  });

  PostState copyWith({
    List<Post>? posts,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool? hasMore,
    int? currentPage,
  }) {
    return PostState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error ?? this.error,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

// 动态状态管理器
class PostNotifier extends StateNotifier<PostState> {
  PostNotifier(this._postRepository) : super(PostState());

  final PostRepository _postRepository;

  Future<void> fetchPosts({bool refresh = false}) async {
    if (refresh) {
      state = state.copyWith(
        isLoading: true,
        error: null,
        currentPage: 1,
        hasMore: true,
      );
    } else {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final posts = await _postRepository.fetchPosts(
        page: state.currentPage,
        limit: 20,
      );

      if (refresh) {
        state = state.copyWith(
          posts: posts,
          isLoading: false,
          hasMore: posts.length >= 20,
          currentPage: 1,
        );
      } else {
        final allPosts = [...state.posts, ...posts];
        state = state.copyWith(
          posts: allPosts,
          isLoading: false,
          hasMore: posts.length >= 20,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadMorePosts() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.currentPage + 1;
      final posts = await _postRepository.fetchPosts(
        page: nextPage,
        limit: 20,
      );

      final allPosts = [...state.posts, ...posts];
      state = state.copyWith(
        posts: allPosts,
        isLoadingMore: false,
        hasMore: posts.length >= 20,
        currentPage: nextPage,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: e.toString(),
      );
    }
  }

  Future<void> createPost({
    required String content,
    List<String> images = const [],
    List<String> tags = const [],
  }) async {
    try {
      final newPost = await _postRepository.createPost(
        content: content,
        images: images,
        tags: tags,
      );

      state = state.copyWith(
        posts: [newPost, ...state.posts],
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> likePost(String postId) async {
    try {
      await _postRepository.likePost(postId);

      final updatedPosts = state.posts.map((post) {
        if (post.id == postId) {
          return post.copyWith(
            isLiked: true,
            likesCount: post.likesCount + 1,
          );
        }
        return post;
      }).toList();

      state = state.copyWith(posts: updatedPosts);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> unlikePost(String postId) async {
    try {
      await _postRepository.unlikePost(postId);

      final updatedPosts = state.posts.map((post) {
        if (post.id == postId) {
          return post.copyWith(
            isLiked: false,
            likesCount: post.likesCount - 1,
          );
        }
        return post;
      }).toList();

      state = state.copyWith(posts: updatedPosts);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> deletePost(String postId) async {
    try {
      await _postRepository.deletePost(postId);

      final updatedPosts = state.posts.where((post) => post.id != postId).toList();
      state = state.copyWith(posts: updatedPosts);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void refresh() {
    fetchPosts(refresh: true);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// 动态Provider
final postProvider = StateNotifierProvider<PostNotifier, PostState>((ref) {
  return PostNotifier(ref.watch(postRepositoryProvider));
});

// 当前用户动态Provider
final userPostsProvider = FutureProvider.family<List<Post>, String>((ref, userId) async {
  final repository = ref.watch(postRepositoryProvider);
  return repository.fetchUserPosts(userId);
});
```

### 3.3 动态列表 UI

```dart
// 动态列表页面
class PostListPage extends ConsumerStatefulWidget {
  @override
  ConsumerState<PostListPage> createState() => _PostListPageState();
}

class _PostListPageState extends ConsumerState<PostListPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(postProvider.notifier).fetchPosts();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(postProvider.notifier).loadMorePosts();
    }
  }

  @override
  Widget build(BuildContext context) {
    final postState = ref.watch(postProvider);
    final currentUser = ref.watch(authProvider).value;

    return Scaffold(
      appBar: AppBar(
        title: Text('动态'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => ref.read(postProvider.notifier).refresh(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(postProvider.notifier).fetchPosts(refresh: true);
        },
        child: postState.posts.isEmpty && postState.isLoading
            ? Center(child: CircularProgressIndicator())
            : postState.posts.isEmpty && postState.error != null
                ? _buildErrorWidget(postState.error!)
                : postState.posts.isEmpty
                    ? _buildEmptyWidget()
                    : _buildPostList(postState, currentUser),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreatePostDialog(),
        child: Icon(Icons.add),
      ),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(
            '加载失败',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          SizedBox(height: 8),
          Text(error),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.read(postProvider.notifier).refresh(),
            child: Text('重试'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.post_add, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            '暂无动态',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          SizedBox(height: 8),
          Text('发布第一条动态吧！'),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _showCreatePostDialog(),
            child: Text('发布动态'),
          ),
        ],
      ),
    );
  }

  Widget _buildPostList(PostState postState, User? currentUser) {
    return ListView.builder(
      controller: _scrollController,
      padding: EdgeInsets.all(8),
      itemCount: postState.posts.length + (postState.isLoadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == postState.posts.length) {
          return Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          );
        }

        final post = postState.posts[index];
        return PostCard(
          post: post,
          currentUser: currentUser,
          onLike: () => ref.read(postProvider.notifier).likePost(post.id),
          onUnlike: () => ref.read(postProvider.notifier).unlikePost.id),
          onDelete: post.userId == currentUser?.id
              ? () => ref.read(postProvider.notifier).deletePost(post.id)
              : null,
        );
      },
    );
  }

  void _showCreatePostDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => CreatePostSheet(),
    );
  }
}

// 动态卡片
class PostCard extends ConsumerWidget {
  final Post post;
  final User? currentUser;
  final VoidCallback onLike;
  final VoidCallback onUnlike;
  final VoidCallback? onDelete;

  const PostCard({
    required this.post,
    required this.currentUser,
    required this.onLike,
    required this.onUnlike,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundImage: NetworkImage(post.userAvatar),
                  radius: 20,
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.username,
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        _formatDate(post.createdAt),
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                if (onDelete != null)
                  PopupMenuButton(
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'delete',
                        child: Text('删除'),
                      ),
                    ],
                    onSelected: (value) {
                      if (value == 'delete') {
                        _showDeleteConfirmDialog();
                      }
                    },
                  ),
              ],
            ),
            SizedBox(height: 12),
            if (post.content.isNotEmpty)
              Text(
                post.content,
                style: TextStyle(fontSize: 16),
              ),
            if (post.images.isNotEmpty) ...[
              SizedBox(height: 12),
              _buildImageGrid(post.images),
            ],
            if (post.tags.isNotEmpty) ...[
              SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: post.tags.map((tag) {
                  return Chip(
                    label: Text('#$tag'),
                    backgroundColor: Colors.blue.withOpacity(0.1),
                    labelStyle: TextStyle(color: Colors.blue),
                  );
                }).toList(),
              ),
            ],
            SizedBox(height: 12),
            Row(
              children: [
                _buildActionButton(
                  icon: post.isLiked ? Icons.favorite : Icons.favorite_border,
                  label: post.likesCount.toString(),
                  color: post.isLiked ? Colors.red : null,
                  onTap: post.isLiked ? onUnlike : onLike,
                ),
                SizedBox(width: 24),
                _buildActionButton(
                  icon: Icons.comment_outlined,
                  label: post.commentsCount.toString(),
                  onTap: () => _navigateToComments(),
                ),
                SizedBox(width: 24),
                _buildActionButton(
                  icon: Icons.share_outlined,
                  label: post.sharesCount.toString(),
                  onTap: () => _sharePost(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageGrid(List<String> images) {
    if (images.length == 1) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          images[0],
          height: 200,
          width: double.infinity,
          fit: BoxFit.cover,
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: images.length == 2 ? 2 : 3,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: images.length,
      itemBuilder: (context, index) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            images[index],
            fit: BoxFit.cover,
          ),
        );
      },
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    Color? color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: color),
            SizedBox(width: 4),
            Text(label, style: TextStyle(color: color)),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 1) {
      return '刚刚';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}分钟前';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}小时前';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}天前';
    } else {
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    }
  }

  void _showDeleteConfirmDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('删除动态'),
          content: Text('确定要删除这条动态吗？'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                onDelete?.call();
              },
              child: Text('删除'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
              ),
            ),
          ],
        );
      },
    );
  }

  void _navigateToComments() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CommentsPage(postId: post.id),
      ),
    );
  }

  void _sharePost() {
    // 实现分享功能
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('分享功能开发中...')),
    );
  }
}
```

## 第四章：高级 Riverpod 特性

### 4.1 依赖注入与 Provider 组合

Riverpod 的强大之处在于其依赖注入能力，让我们看看如何构建复杂的应用架构：

```dart
// API客户端
class ApiClient {
  final Dio _dio;

  ApiClient(this._dio);

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final response = await _dio.get(path, queryParameters: queryParameters);
    return response.data;
  }

  Future<Map<String, dynamic>> post(String path, dynamic data) async {
    final response = await _dio.post(path, data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> put(String path, dynamic data) async {
    final response = await _dio.put(path, data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await _dio.delete(path);
    return response.data;
  }
}

// API客户端Provider
final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = Dio();
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
  ));

  // 添加认证拦截器
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await ref.read(storageServiceProvider).getToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
  ));

  return ApiClient(dio);
});

// 存储服务
abstract class StorageService {
  Future<String?> getToken();
  Future<void> saveToken(String token);
  Future<void> clearToken();

  Future<User?> getUser();
  Future<void> saveUser(User user);
  Future<void> clearUser();

  Stream<User?> userChanges();
}

class StorageServiceImpl implements StorageService {
  final SharedPreferences _prefs;

  StorageServiceImpl(this._prefs);

  @override
  Future<String?> getToken() async {
    return _prefs.getString('auth_token');
  }

  @override
  Future<void> saveToken(String token) async {
    await _prefs.setString('auth_token', token);
  }

  @override
  Future<void> clearToken() async {
    await _prefs.remove('auth_token');
  }

  @override
  Future<User?> getUser() async {
    final userJson = _prefs.getString('user_data');
    if (userJson != null) {
      return User.fromJson(jsonDecode(userJson));
    }
    return null;
  }

  @override
  Future<void> saveUser(User user) async {
    await _prefs.setString('user_data', jsonEncode(user.toJson()));
  }

  @override
  Future<void> clearUser() async {
    await _prefs.remove('user_data');
  }

  @override
  Stream<User?> userChanges() {
    return _prefs.watch('user_data').map((event) {
      if (event.value != null) {
        return User.fromJson(jsonDecode(event.value as String));
      }
      return null;
    });
  }
}

// 存储服务Provider
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageServiceImpl(ref.watch(sharedPreferencesProvider));
});

// SharedPreferences Provider
final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) async {
  return await SharedPreferences.getInstance();
});

// 应用配置
class AppConfig {
  final String apiBaseUrl;
  final String appVersion;
  final bool enableDebugMode;
  final int maxImageSize;
  final Duration requestTimeout;

  AppConfig({
    required this.apiBaseUrl,
    required this.appVersion,
    required this.enableDebugMode,
    this.maxImageSize = 10 * 1024 * 1024, // 10MB
    this.requestTimeout = const Duration(seconds: 30),
  });
}

// 配置Provider
final configProvider = Provider<AppConfig>((ref) {
  return AppConfig(
    apiBaseUrl: 'https://api.xiaozhang.social',
    appVersion: '1.0.0',
    enableDebugMode: kDebugMode,
  );
});

// 网络状态监控
class NetworkNotifier extends StateNotifier<bool> {
  NetworkNotifier() : super(true) {
    _init();
  }

  void _init() {
    Connectivity().onConnectivityChanged.listen((result) {
      state = result != ConnectivityResult.none;
    });
  }

  bool get isConnected => state;
}

final networkProvider = StateNotifierProvider<NetworkNotifier, bool>((ref) {
  return NetworkNotifier();
});

// 错误处理
class ErrorNotifier extends StateNotifier<String?> {
  ErrorNotifier() : super(null);

  void showError(String error) {
    state = error;
  }

  void clearError() {
    state = null;
  }
}

final errorProvider = StateNotifierProvider<ErrorNotifier, String?>((ref) {
  return ErrorNotifier();
});
```

### 4.2 异步操作与错误处理

```dart
// 异步操作包装器
class AsyncOperation<T> {
  final AsyncValue<T> value;
  final VoidCallback? retry;

  AsyncOperation(this.value, [this.retry]);

  bool get isLoading => value.isLoading;
  bool get hasError => value.hasError;
  bool get hasData => value.hasValue;

  T? get data => value.value;
  Object? get error => value.error;

  Widget when({
    required Widget Function() loading,
    required Widget Function(Object error, StackTrace? stackTrace) error,
    required Widget Function(T data) data,
  }) {
    return value.when(
      loading: loading,
      error: error,
      data: data,
    );
  }

  Widget whenData({
    required Widget Function(T data) data,
    Widget Function()? loading,
    Widget Function(Object error, StackTrace? stackTrace)? error,
  }) {
    return value.when(
      loading: loading ?? () => const SizedBox.shrink(),
      error: error ?? (error, stackTrace) => const SizedBox.shrink(),
      data: data,
    );
  }
}

// 通用异步操作Provider
final asyncOperationProvider = Provider.family<AsyncOperation<T>, Future<T>>((ref, future) {
  final asyncValue = AsyncValue.guard(() => future);
  return AsyncOperation(asyncValue, () => ref.refresh(asyncOperationProvider(future)));
});

// 分页数据管理
class PaginatedData<T> {
  final List<T> items;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;

  PaginatedData({
    this.items = const [],
    this.hasMore = true,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
  });

  PaginatedData<T> copyWith({
    List<T>? items,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
  }) {
    return PaginatedData<T>(
      items: items ?? this.items,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error ?? this.error,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

// 分页数据管理器
class PaginatedNotifier<T> extends StateNotifier<PaginatedData<T>> {
  PaginatedNotifier(this._fetchPage) : super(PaginatedData<T>());

  final Future<List<T>> Function(int page) _fetchPage;

  Future<void> fetchFirstPage() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final items = await _fetchPage(1);
      state = state.copyWith(
        items: items,
        isLoading: false,
        hasMore: items.isNotEmpty,
        currentPage: 1,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> fetchNextPage() async {
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.currentPage + 1;
      final items = await _fetchPage(nextPage);

      state = state.copyWith(
        items: [...state.items, ...items],
        isLoadingMore: false,
        hasMore: items.isNotEmpty,
        currentPage: nextPage,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: e.toString(),
      );
    }
  }

  void refresh() {
    fetchFirstPage();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// 缓存管理
class CacheManager {
  final Map<String, dynamic> _cache = {};
  final Map<String, DateTime> _cacheTimestamps = {};
  final Duration _defaultTtl = Duration(minutes: 5);

  T? get<T>(String key) {
    final timestamp = _cacheTimestamps[key];
    if (timestamp == null || DateTime.now().difference(timestamp) > _defaultTtl) {
      _cache.remove(key);
      _cacheTimestamps.remove(key);
      return null;
    }

    return _cache[key] as T?;
  }

  void set<T>(String key, T value, {Duration? ttl}) {
    _cache[key] = value;
    _cacheTimestamps[key] = DateTime.now();

    if (ttl != null) {
      Future.delayed(ttl, () {
        _cache.remove(key);
        _cacheTimestamps.remove(key);
      });
    }
  }

  void remove(String key) {
    _cache.remove(key);
    _cacheTimestamps.remove(key);
  }

  void clear() {
    _cache.clear();
    _cacheTimestamps.clear();
  }
}

final cacheManagerProvider = Provider<CacheManager>((ref) {
  return CacheManager();
});
```

### 4.3 测试支持

```dart
// 测试工具
class TestHelpers {
  static ProviderContainer createContainer({
    User? user,
    List<Post>? posts,
    Map<String, dynamic>? overrides,
  }) {
    return ProviderContainer(
      overrides: [
        if (user != null)
          authRepositoryProvider.overrideWithValue(
            MockAuthRepository(user),
          ),
        if (posts != null)
          postRepositoryProvider.overrideWithValue(
            MockPostRepository(posts),
          ),
        ...overrides?.entries.map((entry) => entry.key.overrideWithValue(entry.value)) ?? [],
      ],
    );
  }
}

// Mock仓库
class MockAuthRepository implements AuthRepository {
  final User? _user;

  MockAuthRepository(this._user);

  @override
  Future<User> signIn(String email, String password) async {
    await Future.delayed(Duration(milliseconds: 500));
    if (_user != null) return _user!;
    throw AuthException('用户不存在');
  }

  @override
  Future<User> signUp(String username, String email, String password) async {
    await Future.delayed(Duration(milliseconds: 500));
    if (_user != null) return _user!;
    throw AuthException('注册失败');
  }

  @override
  Future<void> signOut() async {
    await Future.delayed(Duration(milliseconds: 500));
  }

  @override
  Future<User> signInWithGoogle() async {
    await Future.delayed(Duration(milliseconds: 500));
    if (_user != null) return _user!;
    throw AuthException('Google登录失败');
  }

  @override
  Future<User> signInWithApple() async {
    await Future.delayed(Duration(milliseconds: 500));
    if (_user != null) return _user!;
    throw AuthException('Apple登录失败');
  }

  @override
  Future<void> resetPassword(String email) async {
    await Future.delayed(Duration(milliseconds: 500));
  }

  @override
  Stream<User?> authStateChanges() {
    return Stream.value(_user);
  }
}

class MockPostRepository implements PostRepository {
  final List<Post> _posts;

  MockPostRepository(this._posts);

  @override
  Future<List<Post>> fetchPosts({int page = 1, int limit = 20}) async {
    await Future.delayed(Duration(milliseconds: 500));
    final start = (page - 1) * limit;
    final end = start + limit;
    return _posts.skip(start).take(end).toList();
  }

  @override
  Future<Post> createPost({
    required String content,
    List<String> images = const [],
    List<String> tags = const [],
  }) async {
    await Future.delayed(Duration(milliseconds: 500));
    final newPost = Post(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: 'test_user',
      username: 'Test User',
      userAvatar: 'https://example.com/avatar.jpg',
      content: content,
      images: images,
      tags: tags,
      createdAt: DateTime.now(),
    );
    _posts.insert(0, newPost);
    return newPost;
  }

  @override
  Future<void> likePost(String postId) async {
    await Future.delayed(Duration(milliseconds: 500));
    final index = _posts.indexWhere((post) => post.id == postId);
    if (index != -1) {
      _posts[index] = _posts[index].copyWith(
        isLiked: true,
        likesCount: _posts[index].likesCount + 1,
      );
    }
  }

  @override
  Future<void> unlikePost(String postId) async {
    await Future.delayed(Duration(milliseconds: 500));
    final index = _posts.indexWhere((post) => post.id == postId);
    if (index != -1) {
      _posts[index] = _posts[index].copyWith(
        isLiked: false,
        likesCount: _posts[index].likesCount - 1,
      );
    }
  }

  @override
  Future<void> deletePost(String postId) async {
    await Future.delayed(Duration(milliseconds: 500));
    _posts.removeWhere((post) => post.id == postId);
  }

  @override
  Future<List<Post>> fetchUserPosts(String userId) async {
    await Future.delayed(Duration(milliseconds: 500));
    return _posts.where((post) => post.userId == userId).toList();
  }

  @override
  Stream<List<Post>> watchPosts() {
    return Stream.value(_posts);
  }
}

// 测试示例
void main() {
  group('Authentication Tests', () {
    test('should sign in successfully', () async {
      final user = User(
        id: 'test_user',
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: DateTime.now(),
      );

      final container = TestHelpers.createContainer(user: user);
      final authNotifier = container.read(authProvider.notifier);

      await authNotifier.signIn('test@example.com', 'password');

      final authState = container.read(authProvider);
      expect(authState.value, equals(user));
    });

    test('should handle sign in error', () async {
      final container = TestHelpers.createContainer();
      final authNotifier = container.read(authProvider.notifier);

      await authNotifier.signIn('invalid@example.com', 'wrongpassword');

      final authState = container.read(authProvider);
      expect(authState.hasError, isTrue);
    });
  });

  group('Post Management Tests', () {
    test('should fetch posts successfully', () async {
      final posts = [
        Post(
          id: '1',
          userId: 'user1',
          username: 'User1',
          userAvatar: 'https://example.com/avatar1.jpg',
          content: 'Test post 1',
          createdAt: DateTime.now(),
        ),
        Post(
          id: '2',
          userId: 'user2',
          username: 'User2',
          userAvatar: 'https://example.com/avatar2.jpg',
          content: 'Test post 2',
          createdAt: DateTime.now(),
        ),
      ];

      final container = TestHelpers.createContainer(posts: posts);
      final postNotifier = container.read(postProvider.notifier);

      await postNotifier.fetchPosts();

      final postState = container.read(postProvider);
      expect(postState.posts.length, equals(2));
    });

    test('should create new post', () async {
      final container = TestHelpers.createContainer(posts: []);
      final postNotifier = container.read(postProvider.notifier);

      await postNotifier.createPost(content: 'New test post');

      final postState = container.read(postProvider);
      expect(postState.posts.length, equals(1));
      expect(postState.posts.first.content, equals('New test post'));
    });
  });
}
```

## 第五章：性能优化与最佳实践

### 5.1 性能优化技巧

```dart
// 1. 使用select进行精确监听
class OptimizedWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 只监听用户名，而不是整个用户对象
    final username = ref.watch(authProvider.select((asyncUser) {
      return asyncUser.value?.username ?? '';
    }));

    return Text(username);
  }
}

// 2. 使用autoDispose自动清理资源
final autoDisposeProvider = Provider.autoDispose<MyService>((ref) {
  final service = MyService();

  // 当provider不再被监听时，自动清理资源
  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

// 3. 使用family进行参数化Provider
final userProvider = Provider.family<User, String>((ref, userId) {
  return ref.watch(userRepositoryProvider).getUserById(userId);
});

// 4. 使用keepAlive避免重复创建
final expensiveProvider = Provider<ExpensiveObject>((ref) {
  return ExpensiveObject();
});

// 使用keepAlive避免provider被自动销毁
final cachedExpensiveProvider = Provider<ExpensiveObject>((ref) {
  ref.keepAlive();
  return ExpensiveObject();
});

// 5. 异步操作的取消
class CancellableAsyncNotifier extends AsyncNotifier<String> {
  @override
  Future<String> build() async {
    ref.onDispose(() {
      // 取消异步操作
    });

    return await someAsyncOperation();
  }
}

// 6. 使用FutureProvider处理一次性异步操作
final userProfileProvider = FutureProvider.family<UserProfile, String>((ref, userId) async {
  final repository = ref.watch(userRepositoryProvider);
  return repository.fetchUserProfile(userId);
});
```

### 5.2 架构最佳实践

```dart
// 1. 分层架构
// 数据层
abstract class DataSource {
  Future<Map<String, dynamic>> fetchData(String id);
}

class RemoteDataSource implements DataSource {
  final ApiClient _apiClient;

  RemoteDataSource(this._apiClient);

  @override
  Future<Map<String, dynamic>> fetchData(String id) async {
    return await _apiClient.get('/data/$id');
  }
}

class LocalDataSource implements DataSource {
  final Database _database;

  LocalDataSource(this._database);

  @override
  Future<Map<String, dynamic>> fetchData(String id) async {
    return await _database.query('data', where: 'id = ?', whereArgs: [id]);
  }
}

// 仓库层
abstract class Repository {
  Future<Data> getData(String id);
  Future<void> saveData(Data data);
}

class RepositoryImpl implements Repository {
  final RemoteDataSource _remoteDataSource;
  final LocalDataSource _localDataSource;
  final CacheManager _cacheManager;

  RepositoryImpl(
    this._remoteDataSource,
    this._localDataSource,
    this._cacheManager,
  );

  @override
  Future<Data> getData(String id) async {
    // 先检查缓存
    final cachedData = _cacheManager.get<Data>(id);
    if (cachedData != null) {
      return cachedData;
    }

    try {
      // 尝试从远程获取
      final remoteData = await _remoteDataSource.fetchData(id);
      final data = Data.fromJson(remoteData);

      // 保存到本地和缓存
      await _localDataSource.saveData(data);
      _cacheManager.set(id, data);

      return data;
    } catch (e) {
      // 远程失败，尝试从本地获取
      final localData = await _localDataSource.fetchData(id);
      return Data.fromJson(localData);
    }
  }

  @override
  Future<void> saveData(Data data) async {
    await _remoteDataSource.saveData(data.toJson());
    await _localDataSource.saveData(data.toJson());
    _cacheManager.set(data.id, data);
  }
}

// 2. 依赖注入
final dataSourceProvider = Provider<DataSource>((ref) {
  final config = ref.watch(configProvider);
  if (config.enableRemoteData) {
    return RemoteDataSource(ref.watch(apiClientProvider));
  } else {
    return LocalDataSource(ref.watch(databaseProvider));
  }
});

final repositoryProvider = Provider<Repository>((ref) {
  return RepositoryImpl(
    ref.watch(remoteDataSourceProvider),
    ref.watch(localDataSourceProvider),
    ref.watch(cacheManagerProvider),
  );
});

// 3. 错误处理
class ErrorHandler {
  static void handle(Object error, StackTrace stackTrace) {
    // 记录错误
    FirebaseCrashlytics.instance.recordError(error, stackTrace);

    // 根据错误类型显示不同的用户提示
    if (error is NetworkException) {
      // 显示网络错误
    } else if (error is AuthException) {
      // 显示认证错误
    } else {
      // 显示通用错误
    }
  }
}

// 4. 日志记录
class Logger {
  static void log(String message, {LogLevel level = LogLevel.info}) {
    if (kDebugMode) {
      print('[$level] $message');
    }

    // 发送到日志服务
    AnalyticsService.log(message, level: level);
  }
}

enum LogLevel { debug, info, warning, error }
```

## 故事结局：小张的成功

经过几个月的开发，小张的社交媒体应用终于上线了！Riverpod 的优秀表现让整个开发过程变得高效而愉快。

"Riverpod 不仅提供了强大的状态管理能力，还让我能够构建出可测试、可维护的代码架构。"小张在他的技术分享中说道，"特别是它的编译时安全特性和依赖注入能力，让大型应用的开发变得更加可控。"

小张的应用获得了用户的喜爱，特别是流畅的用户体验和稳定的性能。他的成功证明了：**选择合适的状态管理方案，并遵循最佳实践，是构建高质量 Flutter 应用的关键。**

## 总结

通过小张的社交媒体应用开发故事，我们全面学习了 Riverpod 状态管理的核心概念和高级特性：

### 核心概念

- **Provider 类型**：Provider、StateProvider、StateNotifierProvider、FutureProvider、StreamProvider 等
- **依赖注入**：自动依赖解析和生命周期管理
- **编译时安全**：避免运行时错误，提高代码质量

### 高级特性

- **异步操作**：FutureProvider 和 AsyncNotifier 的使用
- **缓存管理**：智能缓存策略和性能优化
- **测试支持**：Mock 对象和测试工具

### 最佳实践

- **分层架构**：数据层、仓库层、业务层的清晰分离
- **错误处理**：统一的错误处理机制
- **性能优化**：精确监听、自动清理、资源管理

Riverpod 作为 Flutter 生态中最现代化的状态管理方案，为开发者提供了强大而灵活的工具。掌握 Riverpod，将帮助你构建出更加健壮、可维护的 Flutter 应用！

记住，状态管理的本质是：**管理应用的数据流，确保 UI 与数据的同步**。Riverpod 通过其优雅的设计，让这一过程变得简单而高效。
