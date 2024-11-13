---
title: Flutter WebSocket 实现详解
description: 详细介绍 Flutter 中使用 WebSocket 进行实时通信的方法和最佳实践。
tag:
 - Flutter
 - 网络
sidebar: true
---

# Flutter WebSocket 实现详解

## 简介

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。Flutter 提供了 WebSocket 支持,可以实现实时通信功能。

## 基本使用

### 创建连接
```dart
WebSocket? socket;

Future<void> connect() async {
  try {
    socket = await WebSocket.connect('ws://example.com/ws');
    print('Connected to WebSocket server');
    
    // 监听消息
    socket?.listen(
      (data) {
        print('Received: $data');
      },
      onError: (error) {
        print('Error: $error');
      },
      onDone: () {
        print('Connection closed');
      },
    );
  } catch (e) {
    print('Error connecting to WebSocket server: $e');
  }
}
```

### 发送消息
```dart
void sendMessage(String message) {
  if (socket != null && socket!.readyState == WebSocket.open) {
    socket!.add(message);
  } else {
    print('WebSocket is not connected');
  }
}
```

## 完整实现

```dart
class WebSocketClient {
  static final WebSocketClient _instance = WebSocketClient._internal();
  factory WebSocketClient() => _instance;
  
  WebSocket? _socket;
  bool _isConnected = false;
  final _messageController = StreamController<dynamic>.broadcast();
  
  WebSocketClient._internal();
  
  bool get isConnected => _isConnected;
  Stream get messageStream => _messageController.stream;
  
  Future<void> connect(String url) async {
    if (_isConnected) return;
    
    try {
      _socket = await WebSocket.connect(url);
      _isConnected = true;
      
      _socket!.listen(
        (data) {
          _messageController.add(data);
        },
        onError: (error) {
          print('WebSocket error: $error');
          _handleError(error);
        },
        onDone: () {
          print('WebSocket connection closed');
          _handleDisconnect();
        },
        cancelOnError: true,
      );
      
      print('Connected to WebSocket server');
    } catch (e) {
      print('Error connecting to WebSocket server: $e');
      _handleError(e);
    }
  }
  
  void send(dynamic data) {
    if (!_isConnected) {
      print('WebSocket is not connected');
      return;
    }
    
    try {
      _socket!.add(data);
    } catch (e) {
      print('Error sending message: $e');
      _handleError(e);
    }
  }
  
  Future<void> disconnect() async {
    if (!_isConnected) return;
    
    try {
      await _socket!.close();
      _handleDisconnect();
    } catch (e) {
      print('Error closing WebSocket connection: $e');
    }
  }
  
  void _handleDisconnect() {
    _isConnected = false;
    _socket = null;
  }
  
  void _handleError(dynamic error) {
    _isConnected = false;
    _socket = null;
  }
  
  void dispose() {
    disconnect();
    _messageController.close();
  }
}

// 使用示例
class ChatPage extends StatefulWidget {
  @override
  _ChatPageState createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _client = WebSocketClient();
  final _messageController = TextEditingController();
  final List<String> _messages = [];
  
  @override
  void initState() {
    super.initState();
    _connectToServer();
    
    // 监听消息
    _client.messageStream.listen((message) {
      setState(() {
        _messages.add('Received: $message');
      });
    });
  }
  
  Future<void> _connectToServer() async {
    await _client.connect('ws://example.com/ws');
  }
  
  void _sendMessage() {
    if (_messageController.text.isNotEmpty) {
      _client.send(_messageController.text);
      setState(() {
        _messages.add('Sent: ${_messageController.text}');
      });
      _messageController.clear();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('WebSocket Chat'),
        actions: [
          IconButton(
            icon: Icon(
              _client.isConnected ? Icons.cloud_done : Icons.cloud_off,
            ),
            onPressed: _client.isConnected
                ? _client.disconnect
                : _connectToServer,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                return ListTile(
                  title: Text(_messages[index]),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Enter message',
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _client.dispose();
    _messageController.dispose();
    super.dispose();
  }
}
```

## 心跳机制

```dart
class HeartbeatWebSocket {
  final Duration pingInterval;
  final WebSocketClient client;
  Timer? _heartbeatTimer;
  
  HeartbeatWebSocket({
    this.pingInterval = const Duration(seconds: 30),
    required this.client,
  });
  
  void startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(pingInterval, (timer) {
      if (client.isConnected) {
        client.send('ping');
      } else {
        stopHeartbeat();
      }
    });
  }
  
  void stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }
  
  void dispose() {
    stopHeartbeat();
  }
}
```

## 最佳实践

1. 实现重连机制
2. 使用心跳保持连接
3. 处理断线重连
4. 合理管理连接状态
5. 实现消息队列

## 注意事项

1. 处理网络异常
2. 管理连接生命周期
3. 注意内存泄漏
4. 处理并发问题
5. 注意性能影响

## 总结

WebSocket 为 Flutter 应用提供了实时通信能力。通过合理实现连接管理、心跳机制和错误处理,可以构建稳定可靠的实时通信功能。 