---
title: Flutter Dio 网络请求详解
description: 详细介绍 Flutter 中使用 Dio 进行网络请求的方法和最佳实践。
tag:
 - Flutter
 - 网络
sidebar: true
---

# Flutter Dio 网络请求详解

## 简介

Dio 是一个强大的 Dart Http 请求库,支持拦截器、全局配置、FormData、请求取消、文件下载、超时等特性。

## 基本配置

### 安装依赖
```yaml
dependencies:
  dio: ^5.3.2
```

### 创建实例
```dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://api.example.com',
  connectTimeout: Duration(seconds: 5),
  receiveTimeout: Duration(seconds: 3),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
));
```

## 基本请求

### GET 请求
```dart
Future<Response> getUser(String id) async {
  try {
    final response = await dio.get('/users/$id');
    return response;
  } catch (e) {
    throw e;
  }
}

// 带查询参数
Future<Response> searchUsers(String query) async {
  try {
    final response = await dio.get(
      '/users',
      queryParameters: {
        'search': query,
        'page': 1,
        'per_page': 20,
      },
    );
    return response;
  } catch (e) {
    throw e;
  }
}
```

### POST 请求
```dart
Future<Response> createUser(Map<String, dynamic> data) async {
  try {
    final response = await dio.post(
      '/users',
      data: data,
    );
    return response;
  } catch (e) {
    throw e;
  }
}
```

## 高级特性

### 拦截器
```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) {
    final token = getToken(); // 获取token的方法
    options.headers['Authorization'] = 'Bearer $token';
    handler.next(options);
  }
  
  @override
  void onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) {
    // 处理响应数据
    handler.next(response);
  }
  
  @override
  void onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) {
    // 处理错误
    if (err.response?.statusCode == 401) {
      // 处理token过期
      refreshToken();
    }
    handler.next(err);
  }
}

// 添加拦截器
dio.interceptors.add(AuthInterceptor());
```

### 文件上传
```dart
Future<Response> uploadFile(File file) async {
  String fileName = file.path.split('/').last;
  FormData formData = FormData.fromMap({
    'file': await MultipartFile.fromFile(
      file.path,
      filename: fileName,
    ),
  });
  
  try {
    final response = await dio.post(
      '/upload',
      data: formData,
      onSendProgress: (sent, total) {
        print('${(sent / total * 100).toStringAsFixed(0)}%');
      },
    );
    return response;
  } catch (e) {
    throw e;
  }
}
```

## 完整示例

```dart
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late final Dio _dio;
  
  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: 'https://api.example.com',
      connectTimeout: Duration(seconds: 5),
      receiveTimeout: Duration(seconds: 3),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(LogInterceptor(
      request: true,
      requestHeader: true,
      requestBody: true,
      responseHeader: true,
      responseBody: true,
      error: true,
    ));
  }
  
  // GET 请求
  Future<T?> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data;
    } on DioException catch (e) {
      _handleError(e);
      return null;
    }
  }
  
  // POST 请求
  Future<T?> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data;
    } on DioException catch (e) {
      _handleError(e);
      return null;
    }
  }
  
  // 错误处理
  void _handleError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        throw TimeoutException('连接超时');
      case DioExceptionType.sendTimeout:
        throw TimeoutException('请求超时');
      case DioExceptionType.receiveTimeout:
        throw TimeoutException('响应超时');
      case DioExceptionType.badResponse:
        throw HttpException(
          '服务器错误: ${e.response?.statusCode}',
        );
      case DioExceptionType.cancel:
        throw CancellationException('请求被取消');
      default:
        throw Exception('网络错误: ${e.message}');
    }
  }
}

// 使用示例
void main() async {
  final api = ApiService();
  
  try {
    // GET 请求
    final user = await api.get<Map<String, dynamic>>(
      '/users/1',
    );
    print('User: $user');
    
    // POST 请求
    final newUser = await api.post<Map<String, dynamic>>(
      '/users',
      data: {
        'name': 'John Doe',
        'email': 'john@example.com',
      },
    );
    print('New user: $newUser');
  } catch (e) {
    print('Error: $e');
  }
}
```

## 最佳实践

1. 使用单例模式管理 Dio 实例
2. 合理配置超时时间
3. 使用拦截器处理通用逻辑
4. 统一错误处理
5. 使用泛型处理响应数据

## 注意事项

1. 处理网络错误
2. 注意内存泄漏
3. 合理使用取消令牌
4. 处理请求超时
5. 注意数据安全

## 总结

Dio 是一个功能强大的 HTTP 客户端,通过合理使用其提供的特性,可以轻松实现各种网络请求需求。掌握 Dio 的使用对于开发高质量的 Flutter 应用至关重要。 