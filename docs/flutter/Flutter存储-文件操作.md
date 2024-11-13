---
title: Flutter 文件操作详解
description: 详细介绍 Flutter 中的文件操作方法和最佳实践。
tag:
 - Flutter
 - 存储
sidebar: true
---

# Flutter 文件操作详解

## 简介

Flutter 提供了完整的文件操作 API,可以实现文件的读写、复制、移动、删除等操作。本文详细介绍文件操作的各种用法。

## 基本配置

### 添加依赖
```yaml
dependencies:
  path_provider: ^2.1.1
```

### 获取路径
```dart
// 获取应用文档目录
final directory = await getApplicationDocumentsDirectory();

// 获取临时目录
final tempDir = await getTemporaryDirectory();

// 获取外部存储目录(仅 Android)
final extDir = await getExternalStorageDirectory();
```

## 基本操作

### 文件读写
```dart
Future<void> writeFile(String content) async {
  final directory = await getApplicationDocumentsDirectory();
  final file = File('${directory.path}/my_file.txt');
  
  try {
    await file.writeAsString(content);
    print('File written successfully');
  } catch (e) {
    print('Error writing file: $e');
  }
}

Future<String> readFile() async {
  final directory = await getApplicationDocumentsDirectory();
  final file = File('${directory.path}/my_file.txt');
  
  try {
    String contents = await file.readAsString();
    return contents;
  } catch (e) {
    print('Error reading file: $e');
    return '';
  }
}
```

### 二进制操作
```dart
Future<void> writeBinaryFile(List<int> bytes) async {
  final directory = await getApplicationDocumentsDirectory();
  final file = File('${directory.path}/binary_file');
  
  try {
    await file.writeAsBytes(bytes);
    print('Binary file written successfully');
  } catch (e) {
    print('Error writing binary file: $e');
  }
}

Future<List<int>> readBinaryFile() async {
  final directory = await getApplicationDocumentsDirectory();
  final file = File('${directory.path}/binary_file');
  
  try {
    List<int> bytes = await file.readAsBytes();
    return bytes;
  } catch (e) {
    print('Error reading binary file: $e');
    return [];
  }
}
```

## 完整示例

```dart
class FileManager {
  static final FileManager _instance = FileManager._internal();
  factory FileManager() => _instance;
  
  FileManager._internal();
  
  Future<String> get _localPath async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }
  
  Future<File> _localFile(String filename) async {
    final path = await _localPath;
    return File('$path/$filename');
  }
  
  // 写入文本文件
  Future<void> writeTextFile(
    String filename,
    String content,
  ) async {
    try {
      final file = await _localFile(filename);
      await file.writeAsString(content);
    } catch (e) {
      throw Exception('Could not write file: $e');
    }
  }
  
  // 读取文本文件
  Future<String> readTextFile(String filename) async {
    try {
      final file = await _localFile(filename);
      return await file.readAsString();
    } catch (e) {
      throw Exception('Could not read file: $e');
    }
  }
  
  // 写入二进制文件
  Future<void> writeBinaryFile(
    String filename,
    List<int> bytes,
  ) async {
    try {
      final file = await _localFile(filename);
      await file.writeAsBytes(bytes);
    } catch (e) {
      throw Exception('Could not write binary file: $e');
    }
  }
  
  // 读取二进制文件
  Future<List<int>> readBinaryFile(String filename) async {
    try {
      final file = await _localFile(filename);
      return await file.readAsBytes();
    } catch (e) {
      throw Exception('Could not read binary file: $e');
    }
  }
  
  // 检查文件是否存在
  Future<bool> exists(String filename) async {
    try {
      final file = await _localFile(filename);
      return await file.exists();
    } catch (e) {
      return false;
    }
  }
  
  // 删��文件
  Future<void> deleteFile(String filename) async {
    try {
      final file = await _localFile(filename);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e) {
      throw Exception('Could not delete file: $e');
    }
  }
  
  // 复制文件
  Future<void> copyFile(
    String sourceFilename,
    String targetFilename,
  ) async {
    try {
      final sourceFile = await _localFile(sourceFilename);
      final targetFile = await _localFile(targetFilename);
      await sourceFile.copy(targetFile.path);
    } catch (e) {
      throw Exception('Could not copy file: $e');
    }
  }
  
  // 获取文件大小
  Future<int> getFileSize(String filename) async {
    try {
      final file = await _localFile(filename);
      return await file.length();
    } catch (e) {
      throw Exception('Could not get file size: $e');
    }
  }
}

// 使用示例
class FileOperationDemo extends StatefulWidget {
  @override
  _FileOperationDemoState createState() => _FileOperationDemoState();
}

class _FileOperationDemoState extends State<FileOperationDemo> {
  final fileManager = FileManager();
  final textController = TextEditingController();
  String _content = '';
  
  Future<void> _saveContent() async {
    if (textController.text.isEmpty) return;
    
    try {
      await fileManager.writeTextFile(
        'notes.txt',
        textController.text,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Content saved successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error saving content: $e')),
      );
    }
  }
  
  Future<void> _loadContent() async {
    try {
      final content = await fileManager.readTextFile('notes.txt');
      setState(() {
        _content = content;
        textController.text = content;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading content: $e')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('File Operations')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: textController,
              maxLines: 5,
              decoration: InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Enter content to save',
              ),
            ),
            SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: _saveContent,
                  child: Text('Save'),
                ),
                ElevatedButton(
                  onPressed: _loadContent,
                  child: Text('Load'),
                ),
              ],
            ),
            SizedBox(height: 16),
            Text('Loaded content:'),
            SizedBox(height: 8),
            Text(_content),
          ],
        ),
      ),
    );
  }
  
  @override
  void dispose() {
    textController.dispose();
    super.dispose();
  }
}
```

## 最佳实践

1. 使用适当的存储目录
2. 处理文件操作异常
3. 异步操作处理
4. 及时释放资源
5. 文件命名规范

## 注意事项

1. 权限处理
2. 存储空间管理
3. 大文件操作优化
4. 并发访问处理
5. 平台差异处理

## 总结

Flutter 提供了完整的文件操作 API,通过合理使用这些 API,可以实现各种文件存储需求。在使用时需要注意异常处理和性能优化。 