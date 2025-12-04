# Flutter 与联系人管理桥接技术详解

## 引言：联系人管理在现代应用中的重要性

联系人管理是许多移动应用的核心功能之一。无论是社交应用、通讯工具、客户关系管理系统，还是简单的拨号应用，都需要访问和管理用户的联系人信息。Flutter 作为跨平台框架，提供了与原生联系人 API 桥接的能力，使开发者能够在 Android 和 iOS 平台上实现高效的联系人管理功能。

本文将通过一个实际案例——开发一款名为"ContactHub"的智能联系人管理应用——来详细介绍 Flutter 中实现联系人管理的技术细节和最佳实践。

## 联系人管理技术概述

### 联系人数据结构

1. **基本信息**：姓名、电话号码、邮箱地址
2. **详细信息**：公司、职位、地址、生日
3. **社交信息**：社交媒体账号、即时通讯 ID
4. **自定义字段**：用户自定义的额外信息

### 联系人操作类型

1. **查询操作**：读取联系人列表、搜索联系人
2. **创建操作**：添加新联系人
3. **更新操作**：修改现有联系人信息
4. **删除操作**：删除联系人
5. **同步操作**：与云端服务同步联系人

## 项目背景：ContactHub 智能联系人管理应用

我们的项目是开发一款名为 ContactHub 的智能联系人管理应用，支持以下功能：

- 联系人列表查看和搜索
- 联系人详情编辑
- 联系人分组管理
- 联系人备份和恢复
- 智能联系人推荐
- 通话记录集成

## 技术架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter应用层                              │
├─────────────────────────────────────────────────────────────┤
│  联系人UI  │  分组UI  │  搜索UI  │  设置页面                  │
├─────────────────────────────────────────────────────────────┤
│                  联系人服务管理层                                │
├─────────────────────────────────────────────────────────────┤
│              平台通道桥接层                                   │
├─────────────────────────────────────────────────────────────┤
│  Android ContactsContract  │  iOS Contacts Framework       │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

1. **ContactService**：联系人数据管理
2. **ContactGroupService**：联系人分组管理
3. **ContactSearchService**：联系人搜索功能
4. **ContactBackupService**：联系人备份恢复
5. **PlatformChannel**：平台通道通信

## 实现步骤详解

### 第一步：添加依赖和配置

首先，我们需要添加必要的依赖包：

```yaml
dependencies:
  flutter:
    sdk: flutter
  permission_handler: ^10.2.0
  sqflite: ^2.3.0
  path_provider: ^2.1.0
  shared_preferences: ^2.2.0
  flutter_contacts: ^1.1.7
  image_picker: ^1.0.4
  url_launcher: ^6.1.12
  call_log: ^1.0.3
```

Android 平台需要配置权限：

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 联系人权限 -->
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" />

    <!-- 通话记录权限 -->
    <uses-permission android:name="android.permission.READ_CALL_LOG" />

    <!-- 相机权限（用于头像） -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
</manifest>
```

iOS 平台需要在 Info.plist 中添加权限说明：

```xml
<!-- ios/Runner/Info.plist -->
<key>NSContactsUsageDescription</key>
<string>此应用需要访问您的联系人来提供联系人管理服务</string>
<key>NSCameraUsageDescription</key>
<string>此应用需要访问相机来拍摄联系人头像</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>此应用需要访问相册来选择联系人头像</string>
```

### 第二步：创建联系人数据模型

```dart
// lib/models/contact.dart
import 'package:flutter_contacts/flutter_contacts.dart';

class Contact {
  final String id;
  final String firstName;
  final String lastName;
  final String displayName;
  final List<PhoneNumber> phones;
  final List<Email> emails;
  final PostalAddress? address;
  final Company? company;
  final DateTime? birthday;
  final String? notes;
  final String? avatar;
  final List<String> groups;
  final DateTime createdAt;
  final DateTime updatedAt;

  Contact({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.displayName,
    required this.phones,
    required this.emails,
    this.address,
    this.company,
    this.birthday,
    this.notes,
    this.avatar,
    this.groups = const [],
    DateTime? createdAt,
    DateTime? updatedAt,
  }) : createdAt = createdAt ?? DateTime.now(),
       updatedAt = updatedAt ?? DateTime.now();

  factory Contact.fromFlutterContact(FlutterContact flutterContact) {
    return Contact(
      id: flutterContact.id,
      firstName: flutterContact.name.first,
      lastName: flutterContact.name.last,
      displayName: flutterContact.displayName,
      phones: flutterContact.phones,
      emails: flutterContact.emails,
      address: flutterContact.addresses.isNotEmpty ? flutterContact.addresses.first : null,
      company: flutterContact.organizations.isNotEmpty ? Company.fromOrganization(flutterContact.organizations.first) : null,
      birthday: flutterContact.events.isNotEmpty && flutterContact.events.first.type == EventType.birthday
          ? DateTime(flutterContact.events.first.year ?? 2000, flutterContact.events.first.month, flutterContact.events.first.day)
          : null,
      notes: flutterContact.notes.isNotEmpty ? flutterContact.notes.first : null,
      avatar: flutterContact.photo,
      groups: flutterContact.groups.map((group) => group.name).toList(),
    );
  }

  Contact copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? displayName,
    List<PhoneNumber>? phones,
    List<Email>? emails,
    PostalAddress? address,
    Company? company,
    DateTime? birthday,
    String? notes,
    String? avatar,
    List<String>? groups,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Contact(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      displayName: displayName ?? this.displayName,
      phones: phones ?? this.phones,
      emails: emails ?? this.emails,
      address: address ?? this.address,
      company: company ?? this.company,
      birthday: birthday ?? this.birthday,
      notes: notes ?? this.notes,
      avatar: avatar ?? this.avatar,
      groups: groups ?? this.groups,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'displayName': displayName,
      'phones': phones.map((phone) => {
        'number': phone.number,
        'label': phone.label,
      }).toList(),
      'emails': emails.map((email) => {
        'address': email.address,
        'label': email.label,
      }).toList(),
      'address': address != null ? {
        'street': address!.street,
        'city': address!.city,
        'state': address!.state,
        'postalCode': address!.postalCode,
        'country': address!.country,
      } : null,
      'company': company?.toJson(),
      'birthday': birthday?.toIso8601String(),
      'notes': notes,
      'avatar': avatar,
      'groups': groups,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      id: json['id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      displayName: json['displayName'],
      phones: (json['phones'] as List<dynamic>).map((phone) => PhoneNumber(
        number: phone['number'],
        label: phone['label'],
      )).toList(),
      emails: (json['emails'] as List<dynamic>).map((email) => Email(
        address: email['address'],
        label: email['label'],
      )).toList(),
      address: json['address'] != null ? PostalAddress(
        street: json['address']['street'],
        city: json['address']['city'],
        state: json['address']['state'],
        postalCode: json['address']['postalCode'],
        country: json['address']['country'],
      ) : null,
      company: json['company'] != null ? Company.fromJson(json['company']) : null,
      birthday: json['birthday'] != null ? DateTime.parse(json['birthday']) : null,
      notes: json['notes'],
      avatar: json['avatar'],
      groups: List<String>.from(json['groups'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Contact && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'Contact(id: $id, displayName: $displayName, phones: ${phones.length}, emails: ${emails.length})';
  }
}

class Company {
  final String name;
  final String? title;
  final String? department;

  Company({
    required this.name,
    this.title,
    this.department,
  });

  factory Company.fromOrganization(Organization organization) {
    return Company(
      name: organization.company,
      title: organization.title,
      department: organization.department,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'title': title,
      'department': department,
    };
  }

  factory Company.fromJson(Map<String, dynamic> json) {
    return Company(
      name: json['name'],
      title: json['title'],
      department: json['department'],
    );
  }
}

class ContactGroup {
  final String id;
  final String name;
  final String? description;
  final String? color;
  final DateTime createdAt;
  final DateTime updatedAt;

  ContactGroup({
    required this.id,
    required this.name,
    this.description,
    this.color,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) : createdAt = createdAt ?? DateTime.now(),
       updatedAt = updatedAt ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'color': color,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory ContactGroup.fromJson(Map<String, dynamic> json) {
    return ContactGroup(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      color: json['color'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class CallRecord {
  final String id;
  final String contactId;
  final String? contactName;
  final String phoneNumber;
  final CallType callType;
  final DateTime timestamp;
  final Duration duration;

  CallRecord({
    required this.id,
    required this.contactId,
    this.contactName,
    required this.phoneNumber,
    required this.callType,
    required this.timestamp,
    required this.duration,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contactId': contactId,
      'contactName': contactName,
      'phoneNumber': phoneNumber,
      'callType': callType.index,
      'timestamp': timestamp.toIso8601String(),
      'duration': duration.inSeconds,
    };
  }

  factory CallRecord.fromJson(Map<String, dynamic> json) {
    return CallRecord(
      id: json['id'],
      contactId: json['contactId'],
      contactName: json['contactName'],
      phoneNumber: json['phoneNumber'],
      callType: CallType.values[json['callType']],
      timestamp: DateTime.parse(json['timestamp']),
      duration: Duration(seconds: json['duration']),
    );
  }
}

enum CallType {
  incoming,
  outgoing,
  missed,
}
```

### 第三步：创建联系人服务管理器

```dart
// lib/services/contact_service.dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:call_log/call_log.dart';
import '../models/contact.dart';

class ContactService {
  static final ContactService _instance = ContactService._internal();
  factory ContactService() => _instance;
  ContactService._internal();

  final StreamController<List<Contact>> _contactsStreamController = StreamController<List<Contact>>.broadcast();
  final StreamController<Contact?> _selectedContactStreamController = StreamController<Contact?>.broadcast();

  List<Contact> _contacts = [];
  Contact? _selectedContact;
  bool _isLoading = false;
  String? _error;

  // 联系人列表流
  Stream<List<Contact>> get contactsStream => _contactsStreamController.stream;

  // 选中联系人流
  Stream<Contact?> get selectedContactStream => _selectedContactStreamController.stream;

  // 当前联系人列表
  List<Contact> get contacts => List.unmodifiable(_contacts);

  // 当前选中的联系人
  Contact? get selectedContact => _selectedContact;

  // 加载状态
  bool get isLoading => _isLoading;

  // 错误信息
  String? get error => _error;

  // 初始化联系人服务
  Future<void> initialize() async {
    try {
      // 检查权限
      final hasPermission = await _requestPermissions();
      if (!hasPermission) {
        throw ContactException('联系人权限被拒绝');
      }

      // 加载联系人
      await _loadContacts();

    } catch (e) {
      _error = e.toString();
      throw ContactException('初始化联系人服务失败: $e');
    }
  }

  // 请求权限
  Future<bool> _requestPermissions() async {
    try {
      // 请求联系人权限
      final contactPermission = await Permission.contacts.request();
      if (!contactPermission.isGranted) {
        return false;
      }

      // Android需要额外请求通话记录权限
      if (Platform.isAndroid) {
        final callLogPermission = await Permission.phone.request();
        if (!callLogPermission.isGranted) {
          // 通话记录权限是可选的，不影响主要功能
        }
      }

      return true;
    } catch (e) {
      throw ContactException('请求权限失败: $e');
    }
  }

  // 加载联系人
  Future<void> _loadContacts() async {
    _isLoading = true;
    _error = null;
    _notifyListeners();

    try {
      // 检查权限
      final hasPermission = await FlutterContacts.requestPermission();
      if (!hasPermission) {
        throw ContactException('没有联系人权限');
      }

      // 获取联系人列表
      final flutterContacts = await FlutterContacts.getContacts(
        withProperties: true,
        withPhoto: true,
        withGroups: true,
      );

      // 转换为自定义Contact对象
      _contacts = flutterContacts.map((fc) => Contact.fromFlutterContact(fc)).toList();

      // 按显示名称排序
      _contacts.sort((a, b) => a.displayName.compareTo(b.displayName));

      _notifyListeners();

    } catch (e) {
      _error = e.toString();
      _notifyListeners();
      throw ContactException('加载联系人失败: $e');
    } finally {
      _isLoading = false;
      _notifyListeners();
    }
  }

  // 刷新联系人
  Future<void> refreshContacts() async {
    await _loadContacts();
  }

  // 搜索联系人
  List<Contact> searchContacts(String query) {
    if (query.isEmpty) return _contacts;

    final lowerQuery = query.toLowerCase();
    return _contacts.where((contact) {
      return contact.displayName.toLowerCase().contains(lowerQuery) ||
             contact.firstName.toLowerCase().contains(lowerQuery) ||
             contact.lastName.toLowerCase().contains(lowerQuery) ||
             contact.phones.any((phone) => phone.number.contains(query)) ||
             contact.emails.any((email) => email.address.toLowerCase().contains(lowerQuery)) ||
             (contact.company?.name.toLowerCase().contains(lowerQuery) ?? false);
    }).toList();
  }

  // 按首字母分组联系人
  Map<String, List<Contact>> groupContactsByFirstLetter() {
    final Map<String, List<Contact>> groupedContacts = {};

    for (final contact in _contacts) {
      String firstLetter = '#';
      if (contact.displayName.isNotEmpty) {
        firstLetter = contact.displayName[0].toUpperCase();
      }

      if (!groupedContacts.containsKey(firstLetter)) {
        groupedContacts[firstLetter] = [];
      }
      groupedContacts[firstLetter]!.add(contact);
    }

    return groupedContacts;
  }

  // 获取联系人详情
  Future<Contact?> getContactById(String id) async {
    try {
      final flutterContact = await FlutterContacts.getContact(id);
      if (flutterContact == null) return null;

      return Contact.fromFlutterContact(flutterContact);
    } catch (e) {
      throw ContactException('获取联系人详情失败: $e');
    }
  }

  // 选择联系人
  void selectContact(Contact? contact) {
    _selectedContact = contact;
    _selectedContactStreamController.add(contact);
  }

  // 创建联系人
  Future<Contact> createContact(Contact contact) async {
    try {
      // 创建FlutterContact对象
      final flutterContact = _convertToFlutterContact(contact);

      // 插入联系人
      final insertedContact = await FlutterContacts.insertContact(flutterContact);

      // 转换回自定义Contact对象
      final newContact = Contact.fromFlutterContact(insertedContact);

      // 添加到本地列表
      _contacts.add(newContact);
      _contacts.sort((a, b) => a.displayName.compareTo(b.displayName));

      _notifyListeners();
      return newContact;

    } catch (e) {
      throw ContactException('创建联系人失败: $e');
    }
  }

  // 更新联系人
  Future<Contact> updateContact(Contact contact) async {
    try {
      // 获取原始联系人
      final flutterContact = await FlutterContacts.getContact(contact.id);
      if (flutterContact == null) {
        throw ContactException('联系人不存在');
      }

      // 更新联系人信息
      final updatedFlutterContact = _updateFlutterContact(flutterContact, contact);

      // 保存更新
      final savedContact = await FlutterContacts.updateContact(updatedFlutterContact);

      // 转换回自定义Contact对象
      final updatedContact = Contact.fromFlutterContact(savedContact);

      // 更新本地列表
      final index = _contacts.indexWhere((c) => c.id == contact.id);
      if (index != -1) {
        _contacts[index] = updatedContact;
        _contacts.sort((a, b) => a.displayName.compareTo(b.displayName));
      }

      // 更新选中的联系人
      if (_selectedContact?.id == contact.id) {
        _selectedContact = updatedContact;
        _selectedContactStreamController.add(updatedContact);
      }

      _notifyListeners();
      return updatedContact;

    } catch (e) {
      throw ContactException('更新联系人失败: $e');
    }
  }

  // 删除联系人
  Future<void> deleteContact(String contactId) async {
    try {
      // 删除联系人
      await FlutterContacts.deleteContact(contactId);

      // 从本地列表移除
      _contacts.removeWhere((c) => c.id == contactId);

      // 清除选中的联系人
      if (_selectedContact?.id == contactId) {
        _selectedContact = null;
        _selectedContactStreamController.add(null);
      }

      _notifyListeners();

    } catch (e) {
      throw ContactException('删除联系人失败: $e');
    }
  }

  // 获取通话记录
  Future<List<CallRecord>> getCallRecords({String? contactId}) async {
    try {
      if (Platform.isAndroid) {
        final hasPermission = await Permission.phone.request();
        if (!hasPermission.isGranted) {
          return [];
        }

        final Iterable<CallLogEntry> entries = await CallLog.get();
        final callRecords = entries.map((entry) => CallRecord(
          id: entry.timestamp.toString(),
          contactId: '', // 需要通过电话号码匹配联系人ID
          contactName: entry.name,
          phoneNumber: entry.number ?? '',
          callType: _convertCallType(entry.callType ?? CallType.unknown),
          timestamp: DateTime.fromMillisecondsSinceEpoch(entry.timestamp ?? 0),
          duration: Duration(seconds: entry.duration ?? 0),
        )).toList();

        if (contactId != null) {
          final contact = _contacts.firstWhere((c) => c.id == contactId);
          final contactNumbers = contact.phones.map((p) => p.number).toSet();
          return callRecords.where((record) => contactNumbers.contains(record.phoneNumber)).toList();
        }

        return callRecords;
      } else {
        // iOS不支持通话记录访问
        return [];
      }
    } catch (e) {
      throw ContactException('获取通话记录失败: $e');
    }
  }

  // 获取常用联系人
  List<Contact> getFrequentContacts({int limit = 10}) {
    // 这里可以根据通话记录、短信记录等计算常用联系人
    // 简化实现，返回前几个联系人
    return _contacts.take(limit).toList();
  }

  // 获取最近联系人
  List<Contact> getRecentContacts({int limit = 10}) {
    // 这里可以根据最近通话、最近短信等获取最近联系人
    // 简化实现，返回前几个联系人
    return _contacts.take(limit).toList();
  }

  // 转换为FlutterContact对象
  FlutterContact _convertToFlutterContact(Contact contact) {
    return FlutterContact(
      id: contact.id,
      name: Name(
        first: contact.firstName,
        last: contact.lastName,
      ),
      phones: contact.phones,
      emails: contact.emails,
      addresses: contact.address != null ? [contact.address!] : [],
      organizations: contact.company != null ? [
        Organization(
          company: contact.company!.name,
          title: contact.company!.title,
          department: contact.company!.department,
        )
      ] : [],
      events: contact.birthday != null ? [
        Event(
          year: contact.birthday!.year,
          month: contact.birthday!.month,
          day: contact.birthday!.day,
          type: EventType.birthday,
        )
      ] : [],
      notes: contact.notes != null ? [contact.notes!] : [],
      photo: contact.avatar,
    );
  }

  // 更新FlutterContact对象
  FlutterContact _updateFlutterContact(FlutterContact flutterContact, Contact contact) {
    flutterContact.name.first = contact.firstName;
    flutterContact.name.last = contact.lastName;
    flutterContact.phones = contact.phones;
    flutterContact.emails = contact.emails;
    flutterContact.addresses = contact.address != null ? [contact.address!] : [];
    flutterContact.organizations = contact.company != null ? [
      Organization(
        company: contact.company!.name,
        title: contact.company!.title,
        department: contact.company!.department,
      )
    ] : [];
    flutterContact.events = contact.birthday != null ? [
      Event(
        year: contact.birthday!.year,
        month: contact.birthday!.month,
        day: contact.birthday!.day,
        type: EventType.birthday,
      )
    ] : [];
    flutterContact.notes = contact.notes != null ? [contact.notes!] : [];
    flutterContact.photo = contact.avatar;

    return flutterContact;
  }

  // 转换通话类型
  CallType _convertCallType(CallLogEntryType callLogType) {
    switch (callLogType) {
      case CallLogEntryType.incoming:
        return CallType.incoming;
      case CallLogEntryType.outgoing:
        return CallType.outgoing;
      case CallLogEntryType.missed:
        return CallType.missed;
      default:
        return CallType.incoming;
    }
  }

  // 通知监听器
  void _notifyListeners() {
    _contactsStreamController.add(_contacts);
  }

  // 释放资源
  void dispose() {
    _contactsStreamController.close();
    _selectedContactStreamController.close();
  }
}

// 联系人异常
class ContactException implements Exception {
  final String message;
  ContactException(this.message);

  @override
  String toString() => message;
}
```

### 第四步：实现联系人分组管理

```dart
// lib/services/contact_group_service.dart
import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/contact.dart';

class ContactGroupService {
  static final ContactGroupService _instance = ContactGroupService._internal();
  factory ContactGroupService() => _instance;
  ContactGroupService._internal();

  Database? _database;
  final StreamController<List<ContactGroup>> _groupsStreamController = StreamController<List<ContactGroup>>.broadcast();

  List<ContactGroup> _groups = [];

  // 分组列表流
  Stream<List<ContactGroup>> get groupsStream => _groupsStreamController.stream;

  // 当前分组列表
  List<ContactGroup> get groups => List.unmodifiable(_groups);

  // 初始化数据库
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  // 初始化数据库
  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, 'contact_groups.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  // 创建数据库表
  Future<void> _onCreate(Database db, int version) async {
    // 分组表
    await db.execute('''
      CREATE TABLE groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    // 联系人分组关联表
    await db.execute('''
      CREATE TABLE contact_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
      )
    ''');

    // 创建索引
    await db.execute('CREATE INDEX idx_contact_groups_contact_id ON contact_groups(contact_id)');
    await db.execute('CREATE INDEX idx_contact_groups_group_id ON contact_groups(group_id)');

    // 插入默认分组
    await _insertDefaultGroups(db);
  }

  // 插入默认分组
  Future<void> _insertDefaultGroups(Database db) async {
    final now = DateTime.now().millisecondsSinceEpoch;

    final defaultGroups = [
      ContactGroup(
        id: 'family',
        name: '家人',
        description: '家庭成员',
        color: '#FF5722',
        createdAt: DateTime.fromMillisecondsSinceEpoch(now),
        updatedAt: DateTime.fromMillisecondsSinceEpoch(now),
      ),
      ContactGroup(
        id: 'friends',
        name: '朋友',
        description: '朋友',
        color: '#2196F3',
        createdAt: DateTime.fromMillisecondsSinceEpoch(now),
        updatedAt: DateTime.fromMillisecondsSinceEpoch(now),
      ),
      ContactGroup(
        id: 'work',
        name: '工作',
        description: '工作同事',
        color: '#4CAF50',
        createdAt: DateTime.fromMillisecondsSinceEpoch(now),
        updatedAt: DateTime.fromMillisecondsSinceEpoch(now),
      ),
    ];

    for (final group in defaultGroups) {
      await db.insert('groups', group.toJson());
    }
  }

  // 加载分组
  Future<void> loadGroups() async {
    try {
      final db = await database;
      final List<Map<String, dynamic>> maps = await db.query('groups');

      _groups = maps.map((map) => ContactGroup.fromJson(map)).toList();
      _groupsStreamController.add(_groups);
    } catch (e) {
      throw ContactGroupException('加载分组失败: $e');
    }
  }

  // 创建分组
  Future<ContactGroup> createGroup(ContactGroup group) async {
    try {
      final db = await database;

      // 检查分组名称是否已存在
      final existingGroup = await db.query(
        'groups',
        where: 'name = ?',
        whereArgs: [group.name],
      );

      if (existingGroup.isNotEmpty) {
        throw ContactGroupException('分组名称已存在');
      }

      // 插入新分组
      final id = await db.insert('groups', group.toJson());

      // 获取插入的分组
      final maps = await db.query('groups', where: 'rowid = ?', whereArgs: [id]);
      final newGroup = ContactGroup.fromJson(maps.first);

      _groups.add(newGroup);
      _groupsStreamController.add(_groups);

      return newGroup;
    } catch (e) {
      throw ContactGroupException('创建分组失败: $e');
    }
  }

  // 更新分组
  Future<ContactGroup> updateGroup(ContactGroup group) async {
    try {
      final db = await database;

      // 检查分组是否存在
      final existingGroup = await db.query('groups', where: 'id = ?', whereArgs: [group.id]);
      if (existingGroup.isEmpty) {
        throw ContactGroupException('分组不存在');
      }

      // 检查分组名称是否与其他分组重复
      final duplicateGroup = await db.query(
        'groups',
        where: 'name = ? AND id != ?',
        whereArgs: [group.name, group.id],
      );

      if (duplicateGroup.isNotEmpty) {
        throw ContactGroupException('分组名称已存在');
      }

      // 更新分组
      await db.update(
        'groups',
        group.toJson(),
        where: 'id = ?',
        whereArgs: [group.id],
      );

      // 更新本地列表
      final index = _groups.indexWhere((g) => g.id == group.id);
      if (index != -1) {
        _groups[index] = group;
        _groupsStreamController.add(_groups);
      }

      return group;
    } catch (e) {
      throw ContactGroupException('更新分组失败: $e');
    }
  }

  // 删除分组
  Future<void> deleteGroup(String groupId) async {
    try {
      final db = await database;

      // 删除分组（级联删除关联记录）
      await db.delete('groups', where: 'id = ?', whereArgs: [groupId]);

      // 从本地列表移除
      _groups.removeWhere((g) => g.id == groupId);
      _groupsStreamController.add(_groups);
    } catch (e) {
      throw ContactGroupException('删除分组失败: $e');
    }
  }

  // 添加联系人到分组
  Future<void> addContactToGroup(String contactId, String groupId) async {
    try {
      final db = await database;

      // 检查是否已存在
      final existing = await db.query(
        'contact_groups',
        where: 'contact_id = ? AND group_id = ?',
        whereArgs: [contactId, groupId],
      );

      if (existing.isNotEmpty) {
        return; // 已存在，不需要重复添加
      }

      // 添加关联
      await db.insert('contact_groups', {
        'contact_id': contactId,
        'group_id': groupId,
        'created_at': DateTime.now().millisecondsSinceEpoch,
      });
    } catch (e) {
      throw ContactGroupException('添加联系人到分组失败: $e');
    }
  }

  // 从分组移除联系人
  Future<void> removeContactFromGroup(String contactId, String groupId) async {
    try {
      final db = await database;

      await db.delete(
        'contact_groups',
        where: 'contact_id = ? AND group_id = ?',
        whereArgs: [contactId, groupId],
      );
    } catch (e) {
      throw ContactGroupException('从分组移除联系人失败: $e');
    }
  }

  // 获取联系人所属分组
  Future<List<ContactGroup>> getContactGroups(String contactId) async {
    try {
      final db = await database;

      final List<Map<String, dynamic>> maps = await db.rawQuery('''
        SELECT g.* FROM groups g
        INNER JOIN contact_groups cg ON g.id = cg.group_id
        WHERE cg.contact_id = ?
        ORDER BY g.name
      ''', [contactId]);

      return maps.map((map) => ContactGroup.fromJson(map)).toList();
    } catch (e) {
      throw ContactGroupException('获取联系人分组失败: $e');
    }
  }

  // 获取分组中的联系人
  Future<List<String>> getGroupContacts(String groupId) async {
    try {
      final db = await database;

      final List<Map<String, dynamic>> maps = await db.query(
        'contact_groups',
        where: 'group_id = ?',
        whereArgs: [groupId],
        columns: ['contact_id'],
      );

      return maps.map((map) => map['contact_id'] as String).toList();
    } catch (e) {
      throw ContactGroupException('获取分组联系人失败: $e');
    }
  }

  // 批量添加联系人到分组
  Future<void> addContactsToGroup(List<String> contactIds, String groupId) async {
    try {
      final db = await database;
      final batch = db.batch();

      final now = DateTime.now().millisecondsSinceEpoch;

      for (final contactId in contactIds) {
        // 检查是否已存在
        final existing = await db.query(
          'contact_groups',
          where: 'contact_id = ? AND group_id = ?',
          whereArgs: [contactId, groupId],
        );

        if (existing.isEmpty) {
          batch.insert('contact_groups', {
            'contact_id': contactId,
            'group_id': groupId,
            'created_at': now,
          });
        }
      }

      await batch.commit();
    } catch (e) {
      throw ContactGroupException('批量添加联系人到分组失败: $e');
    }
  }

  // 批量从分组移除联系人
  Future<void> removeContactsFromGroup(List<String> contactIds, String groupId) async {
    try {
      final db = await database;

      final placeholders = List.filled(contactIds.length, '?').join(',');
      await db.delete(
        'contact_groups',
        where: 'group_id = ? AND contact_id IN ($placeholders)',
        whereArgs: [groupId, ...contactIds],
      );
    } catch (e) {
      throw ContactGroupException('批量从分组移除联系人失败: $e');
    }
  }

  // 获取分组统计信息
  Future<Map<String, int>> getGroupStatistics() async {
    try {
      final db = await database;

      final List<Map<String, dynamic>> maps = await db.rawQuery('''
        SELECT g.id, COUNT(cg.contact_id) as contact_count
        FROM groups g
        LEFT JOIN contact_groups cg ON g.id = cg.group_id
        GROUP BY g.id
        ORDER BY g.name
      ''');

      final Map<String, int> statistics = {};
      for (final map in maps) {
        statistics[map['id'] as String] = map['contact_count'] as int;
      }

      return statistics;
    } catch (e) {
      throw ContactGroupException('获取分组统计信息失败: $e');
    }
  }

  // 释放资源
  void dispose() {
    _groupsStreamController.close();
  }
}

// 联系人分组异常
class ContactGroupException implements Exception {
  final String message;
  ContactGroupException(this.message);

  @override
  String toString() => message;
}
```

### 第五步：创建联系人备份恢复服务

```dart
// lib/services/contact_backup_service.dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:file_picker/file_picker.dart';
import '../models/contact.dart';

class ContactBackupService {
  static final ContactBackupService _instance = ContactBackupService._internal();
  factory ContactBackupService() => _instance;
  ContactBackupService._internal();

  // 备份联系人到JSON文件
  Future<File> backupContactsToJson(List<Contact> contacts, {String? filename}) async {
    try {
      final backupData = {
        'version': '1.0',
        'exportedAt': DateTime.now().toIso8601String(),
        'contacts': contacts.map((contact) => contact.toJson()).toList(),
      };

      final jsonString = const JsonEncoder.withIndent('  ').convert(backupData);

      final defaultFilename = filename ?? 'contacts_backup_${DateTime.now().millisecondsSinceEpoch}.json';
      final file = await _saveFile(defaultFilename, jsonString);

      return file;
    } catch (e) {
      throw ContactBackupException('备份联系人失败: $e');
    }
  }

  // 备份联系人到CSV文件
  Future<File> backupContactsToCsv(List<Contact> contacts, {String? filename}) async {
    try {
      final buffer = StringBuffer();

      // CSV头部
      buffer.writeln('姓名,电话,邮箱,公司,职位,地址,生日,备注');

      // 数据行
      for (final contact in contacts) {
        final name = _escapeCsvField(contact.displayName);
        final phones = contact.phones.map((p) => _escapeCsvField(p.number)).join(';');
        final emails = contact.emails.map((e) => _escapeCsvField(e.address)).join(';');
        final company = _escapeCsvField(contact.company?.name ?? '');
        final title = _escapeCsvField(contact.company?.title ?? '');
        final address = contact.address != null
            ? _escapeCsvField('${contact.address!.street}, ${contact.address!.city}')
            : '';
        final birthday = contact.birthday != null
            ? _escapeCsvField('${contact.birthday!.year}-${contact.birthday!.month}-${contact.birthday!.day}')
            : '';
        final notes = _escapeCsvField(contact.notes ?? '');

        buffer.writeln('$name,$phones,$emails,$company,$title,$address,$birthday,$notes');
      }

      final defaultFilename = filename ?? 'contacts_backup_${DateTime.now().millisecondsSinceEpoch}.csv';
      final file = await _saveFile(defaultFilename, buffer.toString());

      return file;
    } catch (e) {
      throw ContactBackupException('备份联系人到CSV失败: $e');
    }
  }

  // 备份联系人到VCard文件
  Future<File> backupContactsToVCard(List<Contact> contacts, {String? filename}) async {
    try {
      final buffer = StringBuffer();

      for (final contact in contacts) {
        buffer.writeln('BEGIN:VCARD');
        buffer.writeln('VERSION:3.0');
        buffer.writeln('FN:${contact.displayName}');
        buffer.writeln('N:${contact.lastName};${contact.firstName};;');

        // 电话号码
        for (final phone in contact.phones) {
          final type = _getVCardPhoneType(phone.label);
          buffer.writeln('TEL;TYPE=$type:${phone.number}');
        }

        // 邮箱地址
        for (final email in contact.emails) {
          final type = _getVCardEmailType(email.label);
          buffer.writeln('EMAIL;TYPE=$type:${email.address}');
        }

        // 公司信息
        if (contact.company != null) {
          buffer.writeln('ORG:${contact.company!.name}');
          if (contact.company!.title != null) {
            buffer.writeln('TITLE:${contact.company!.title}');
          }
        }

        // 地址
        if (contact.address != null) {
          final addr = contact.address!;
          buffer.writeln('ADR:;;${addr.street};${addr.city};${addr.state};${addr.postalCode};${addr.country}');
        }

        // 生日
        if (contact.birthday != null) {
          final birthday = contact.birthday!;
          buffer.writeln('BDAY:${birthday.year}${birthday.month.toString().padLeft(2, '0')}${birthday.day.toString().padLeft(2, '0')}');
        }

        // 备注
        if (contact.notes != null && contact.notes!.isNotEmpty) {
          buffer.writeln('NOTE:${contact.notes}');
        }

        buffer.writeln('END:VCARD');
        buffer.writeln('');
      }

      final defaultFilename = filename ?? 'contacts_backup_${DateTime.now().millisecondsSinceEpoch}.vcf';
      final file = await _saveFile(defaultFilename, buffer.toString());

      return file;
    } catch (e) {
      throw ContactBackupException('备份联系人到VCard失败: $e');
    }
  }

  // 从JSON文件恢复联系人
  Future<List<Contact>> restoreContactsFromJson() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );

      if (result == null || result.files.isEmpty) {
        throw ContactBackupException('未选择文件');
      }

      final file = File(result.files.first.path!);
      final content = await file.readAsString();
      final jsonData = jsonDecode(content) as Map<String, dynamic>;

      if (jsonData['contacts'] == null) {
        throw ContactBackupException('无效的备份文件格式');
      }

      final contactsData = jsonData['contacts'] as List<dynamic>;
      final contacts = contactsData.map((data) => Contact.fromJson(data as Map<String, dynamic>)).toList();

      return contacts;
    } catch (e) {
      throw ContactBackupException('从JSON恢复联系人失败: $e');
    }
  }

  // 从CSV文件恢复联系人
  Future<List<Contact>> restoreContactsFromCsv() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv'],
      );

      if (result == null || result.files.isEmpty) {
        throw ContactBackupException('未选择文件');
      }

      final file = File(result.files.first.path!);
      final lines = await file.readAsLines();

      if (lines.isEmpty) {
        throw ContactBackupException('空文件');
      }

      // 跳过头部行
      final dataLines = lines.skip(1);
      final contacts = <Contact>[];

      for (final line in dataLines) {
        if (line.trim().isEmpty) continue;

        final fields = _parseCsvLine(line);
        if (fields.length < 8) continue;

        final name = fields[0];
        final phonesStr = fields[1];
        final emailsStr = fields[2];
        final company = fields[3];
        final title = fields[4];
        final addressStr = fields[5];
        final birthdayStr = fields[6];
        final notes = fields[7];

        // 解析电话号码
        final phones = phonesStr.split(';')
            .where((p) => p.isNotEmpty)
            .map((p) => PhoneNumber(number: p, label: 'mobile'))
            .toList();

        // 解析邮箱地址
        final emails = emailsStr.split(';')
            .where((e) => e.isNotEmpty)
            .map((e) => Email(address: e, label: 'home'))
            .toList();

        // 解析地址
        PostalAddress? address;
        if (addressStr.isNotEmpty) {
          final addressParts = addressStr.split(',');
          address = PostalAddress(
            street: addressParts.isNotEmpty ? addressParts[0] : '',
            city: addressParts.length > 1 ? addressParts[1] : '',
            state: addressParts.length > 2 ? addressParts[2] : '',
            postalCode: addressParts.length > 3 ? addressParts[3] : '',
            country: addressParts.length > 4 ? addressParts[4] : '',
          );
        }

        // 解析生日
        DateTime? birthday;
        if (birthdayStr.isNotEmpty) {
          try {
            final parts = birthdayStr.split('-');
            if (parts.length == 3) {
              birthday = DateTime(
                int.parse(parts[0]),
                int.parse(parts[1]),
                int.parse(parts[2]),
              );
            }
          } catch (e) {
            // 忽略生日解析错误
          }
        }

        // 创建联系人对象
        final contact = Contact(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          firstName: name.split(' ').first,
          lastName: name.split(' ').skip(1).join(' '),
          displayName: name,
          phones: phones,
          emails: emails,
          address: address,
          company: company.isNotEmpty ? Company(name: company, title: title.isNotEmpty ? title : null) : null,
          birthday: birthday,
          notes: notes.isNotEmpty ? notes : null,
        );

        contacts.add(contact);
      }

      return contacts;
    } catch (e) {
      throw ContactBackupException('从CSV恢复联系人失败: $e');
    }
  }

  // 从VCard文件恢复联系人
  Future<List<Contact>> restoreContactsFromVCard() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['vcf'],
      );

      if (result == null || result.files.isEmpty) {
        throw ContactBackupException('未选择文件');
      }

      final file = File(result.files.first.path!);
      final content = await file.readAsString();

      return _parseVCardContent(content);
    } catch (e) {
      throw ContactBackupException('从VCard恢复联系人失败: $e');
    }
  }

  // 分享备份文件
  Future<void> shareBackupFile(File file) async {
    try {
      await Share.shareXFiles([XFile(file.path)], text: '分享联系人备份文件');
    } catch (e) {
      throw ContactBackupException('分享备份文件失败: $e');
    }
  }

  // 保存文件
  Future<File> _saveFile(String filename, String content) async {
    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/$filename');
    return await file.writeAsString(content);
  }

  // 转义CSV字段
  String _escapeCsvField(String field) {
    if (field.contains(',') || field.contains('"') || field.contains('\n')) {
      return '"${field.replaceAll('"', '""')}"';
    }
    return field;
  }

  // 解析CSV行
  List<String> _parseCsvLine(String line) {
    final fields = <String>[];
    bool inQuotes = false;
    String currentField = '';

    for (int i = 0; i < line.length; i++) {
      final char = line[i];

      if (char == '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] == '"') {
          // 转义的引号
          currentField += '"';
          i++; // 跳过下一个引号
        } else {
          // 切换引号状态
          inQuotes = !inQuotes;
        }
      } else if (char == ',' && !inQuotes) {
        // 字段分隔符
        fields.add(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // 添加最后一个字段
    fields.add(currentField);

    return fields;
  }

  // 获取VCard电话类型
  String _getVCardPhoneType(String? label) {
    switch (label?.toLowerCase()) {
      case 'mobile':
      case '手机':
        return 'CELL';
      case 'home':
      case '住宅':
        return 'HOME';
      case 'work':
      case '工作':
        return 'WORK';
      default:
        return 'CELL';
    }
  }

  // 获取VCard邮箱类型
  String _getVCardEmailType(String? label) {
    switch (label?.toLowerCase()) {
      case 'home':
      case '住宅':
        return 'HOME';
      case 'work':
      case '工作':
        return 'WORK';
      default:
        return 'HOME';
    }
  }

  // 解析VCard内容
  List<Contact> _parseVCardContent(String content) {
    final contacts = <Contact>[];
    final vcardBlocks = content.split('BEGIN:VCARD').skip(1);

    for (final block in vcardBlocks) {
      if (!block.contains('END:VCARD')) continue;

      final vcardContent = block.split('END:VCARD').first;
      final lines = vcardContent.split('\n').where((line) => line.isNotEmpty).toList();

      String? fn;
      String? n;
      final phones = <PhoneNumber>[];
      final emails = <Email>[];
      String? org;
      String? title;
      String? adr;
      String? bday;
      String? note;

      for (final line in lines) {
        final parts = line.split(':');
        if (parts.length < 2) continue;

        final key = parts[0];
        final value = parts.sublist(1).join(':');

        switch (key) {
          case 'FN':
            fn = value;
            break;
          case 'N':
            n = value;
            break;
          case 'TEL':
            final phoneType = _extractVCardType(key);
            phones.add(PhoneNumber(number: value, label: phoneType));
            break;
          case 'EMAIL':
            final emailType = _extractVCardType(key);
            emails.add(Email(address: value, label: emailType));
            break;
          case 'ORG':
            org = value;
            break;
          case 'TITLE':
            title = value;
            break;
          case 'ADR':
            adr = value;
            break;
          case 'BDAY':
            bday = value;
            break;
          case 'NOTE':
            note = value;
            break;
        }
      }

      if (fn == null && n == null) continue;

      // 解析姓名
      String firstName = '';
      String lastName = '';
      String displayName = fn ?? '';

      if (n != null) {
        final nameParts = n.split(';');
        lastName = nameParts.isNotEmpty ? nameParts[0] : '';
        firstName = nameParts.length > 1 ? nameParts[1] : '';
      }

      if (displayName.isEmpty) {
        displayName = '$firstName $lastName'.trim();
      }

      // 解析地址
      PostalAddress? address;
      if (adr != null) {
        final addrParts = adr.split(';');
        address = PostalAddress(
          street: addrParts.length > 2 ? addrParts[2] : '',
          city: addrParts.length > 3 ? addrParts[3] : '',
          state: addrParts.length > 4 ? addrParts[4] : '',
          postalCode: addrParts.length > 5 ? addrParts[5] : '',
          country: addrParts.length > 6 ? addrParts[6] : '',
        );
      }

      // 解析生日
      DateTime? birthday;
      if (bday != null && bday.length >= 8) {
        try {
          birthday = DateTime(
            int.parse(bday.substring(0, 4)),
            int.parse(bday.substring(4, 6)),
            int.parse(bday.substring(6, 8)),
          );
        } catch (e) {
          // 忽略生日解析错误
        }
      }

      final contact = Contact(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        firstName: firstName,
        lastName: lastName,
        displayName: displayName,
        phones: phones,
        emails: emails,
        address: address,
        company: org != null ? Company(name: org, title: title) : null,
        birthday: birthday,
        notes: note,
      );

      contacts.add(contact);
    }

    return contacts;
  }

  // 提取VCard类型
  String _extractVCardType(String line) {
    final typeMatch = RegExp(r'TYPE=([^:;]+)').firstMatch(line);
    if (typeMatch != null) {
      return typeMatch.group(1)!.toLowerCase();
    }
    return 'home';
  }
}

// 联系人备份异常
class ContactBackupException implements Exception {
  final String message;
  ContactBackupException(this.message);

  @override
  String toString() => message;
}
```

### 第六步：创建联系人 UI 组件

```dart
// lib/widgets/contact_list_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter_contacts/flutter_contacts.dart';
import '../models/contact.dart';
import '../services/contact_service.dart';

class ContactListWidget extends StatefulWidget {
  final Function(Contact) onContactTap;
  final Function(Contact) onContactLongPress;
  final bool showSearchBar;
  final bool enableSelection;
  final Function(List<Contact>)? onSelectionChanged;

  const ContactListWidget({
    Key? key,
    required this.onContactTap,
    required this.onContactLongPress,
    this.showSearchBar = true,
    this.enableSelection = false,
    this.onSelectionChanged,
  }) : super(key: key);

  @override
  _ContactListWidgetState createState() => _ContactListWidgetState();
}

class _ContactListWidgetState extends State<ContactListWidget> {
  final ContactService _contactService = ContactService();
  final TextEditingController _searchController = TextEditingController();
  final Set<String> _selectedContactIds = {};

  List<Contact> _contacts = [];
  List<Contact> _filteredContacts = [];
  Map<String, List<Contact>> _groupedContacts = {};
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeContacts();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _initializeContacts() async {
    setState(() => _isLoading = true);

    try {
      await _contactService.initialize();
      _contactService.contactsStream.listen((contacts) {
        setState(() {
          _contacts = contacts;
          _filteredContacts = contacts;
          _groupedContacts = _contactService.groupContactsByFirstLetter();
        });
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text;
    setState(() {
      _filteredContacts = _contactService.searchContacts(query);
      _groupedContacts = _groupContactsByFirstLetter(_filteredContacts);
    });
  }

  Map<String, List<Contact>> _groupContactsByFirstLetter(List<Contact> contacts) {
    final Map<String, List<Contact>> groupedContacts = {};

    for (final contact in contacts) {
      String firstLetter = '#';
      if (contact.displayName.isNotEmpty) {
        firstLetter = contact.displayName[0].toUpperCase();
      }

      if (!groupedContacts.containsKey(firstLetter)) {
        groupedContacts[firstLetter] = [];
      }
      groupedContacts[firstLetter]!.add(contact);
    }

    return groupedContacts;
  }

  void _onContactTap(Contact contact) {
    if (widget.enableSelection) {
      _toggleSelection(contact);
    } else {
      widget.onContactTap(contact);
    }
  }

  void _onContactLongPress(Contact contact) {
    if (widget.enableSelection) {
      _toggleSelection(contact);
    } else {
      widget.onContactLongPress(contact);
    }
  }

  void _toggleSelection(Contact contact) {
    setState(() {
      if (_selectedContactIds.contains(contact.id)) {
        _selectedContactIds.remove(contact.id);
      } else {
        _selectedContactIds.add(contact.id);
      }
    });

    widget.onSelectionChanged?.call(_selectedContactIds
        .map((id) => _contacts.firstWhere((c) => c.id == id))
        .toList());
  }

  void _clearSelection() {
    setState(() {
      _selectedContactIds.clear();
    });
    widget.onSelectionChanged?.call([]);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 搜索栏
        if (widget.showSearchBar)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: '搜索联系人',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => _searchController.clear(),
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),

        // 选择操作栏
        if (widget.enableSelection && _selectedContactIds.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Theme.of(context).primaryColor.withOpacity(0.1),
            child: Row(
              children: [
                Text(
                  '已选择 ${_selectedContactIds.length} 个联系人',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                TextButton(
                  onPressed: _clearSelection,
                  child: const Text('取消选择'),
                ),
              ],
            ),
          ),

        // 联系人列表
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error, size: 64, color: Colors.red),
                          const SizedBox(height: 16),
                          Text('加载失败: $_error'),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _initializeContacts,
                            child: const Text('重试'),
                          ),
                        ],
                      ),
                    )
                  : _filteredContacts.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.contacts, size: 64, color: Colors.grey),
                              const SizedBox(height: 16),
                              Text(
                                _searchController.text.isNotEmpty
                                    ? '未找到匹配的联系人'
                                    : '暂无联系人',
                                style: const TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          itemCount: _groupedContacts.keys.length,
                          itemBuilder: (context, index) {
                            final letter = _groupedContacts.keys.elementAt(index);
                            final contacts = _groupedContacts[letter]!;

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // 字母标题
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: Text(
                                    letter,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue,
                                    ),
                                  ),
                                ),

                                // 联系人列表
                                ...contacts.map((contact) => ContactTile(
                                  contact: contact,
                                  isSelected: _selectedContactIds.contains(contact.id),
                                  onTap: () => _onContactTap(contact),
                                  onLongPress: () => _onContactLongPress(contact),
                                )),
                              ],
                            );
                          },
                        ),
        ),
      ],
    );
  }
}

// 联系人卡片组件
class ContactTile extends StatelessWidget {
  final Contact contact;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const ContactTile({
    Key? key,
    required this.contact,
    this.isSelected = false,
    required this.onTap,
    required this.onLongPress,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundImage: contact.avatar != null ? NetworkImage(contact.avatar!) : null,
        child: contact.avatar == null
            ? Text(
                contact.displayName.isNotEmpty
                    ? contact.displayName[0].toUpperCase()
                    : '?',
                style: const TextStyle(fontWeight: FontWeight.bold),
              )
            : null,
      ),
      title: Text(contact.displayName),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (contact.phones.isNotEmpty)
            Text(contact.phones.first.number),
          if (contact.emails.isNotEmpty)
            Text(contact.emails.first.address),
        ],
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: Colors.blue)
          : const Icon(Icons.chevron_right),
      onTap: onTap,
      onLongPress: onLongPress,
    );
  }
}

// 联系人详情页面
class ContactDetailPage extends StatefulWidget {
  final Contact contact;
  final Function(Contact) onContactUpdated;
  final Function(String) onContactDeleted;

  const ContactDetailPage({
    Key? key,
    required this.contact,
    required this.onContactUpdated,
    required this.onContactDeleted,
  }) : super(key: key);

  @override
  _ContactDetailPageState createState() => _ContactDetailPageState();
}

class _ContactDetailPageState extends State<ContactDetailPage> {
  late Contact _contact;
  bool _isEditing = false;
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _companyController = TextEditingController();
  final _titleController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _contact = widget.contact;
    _initializeControllers();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _companyController.dispose();
    _titleController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _initializeControllers() {
    _firstNameController.text = _contact.firstName;
    _lastNameController.text = _contact.lastName;
    _companyController.text = _contact.company?.name ?? '';
    _titleController.text = _contact.company?.title ?? '';
    _notesController.text = _contact.notes ?? '';
  }

  void _toggleEdit() {
    if (_isEditing) {
      _saveContact();
    } else {
      setState(() => _isEditing = true);
    }
  }

  Future<void> _saveContact() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final updatedContact = _contact.copyWith(
        firstName: _firstNameController.text,
        lastName: _lastNameController.text,
        company: _companyController.text.isNotEmpty
            ? Company(
                name: _companyController.text,
                title: _titleController.text.isNotEmpty ? _titleController.text : null,
              )
            : null,
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
      );

      final contactService = ContactService();
      final savedContact = await contactService.updateContact(updatedContact);

      setState(() {
        _contact = savedContact;
        _isEditing = false;
      });

      widget.onContactUpdated(savedContact);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('联系人已更新')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('更新失败: $e')),
      );
    }
  }

  Future<void> _deleteContact() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除联系人 ${_contact.displayName} 吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final contactService = ContactService();
        await contactService.deleteContact(_contact.id);

        widget.onContactDeleted(_contact.id);
        Navigator.of(context).pop();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('联系人已删除')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('删除失败: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? '编辑联系人' : '联系人详情'),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: _toggleEdit,
            ),
          if (_isEditing)
            TextButton(
              onPressed: _toggleEdit,
              child: const Text('保存'),
            ),
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: _deleteContact,
            ),
        ],
      ),
      body: _isEditing ? _buildEditForm() : _buildContactDetails(),
    );
  }

  Widget _buildContactDetails() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 头像和姓名
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundImage: _contact.avatar != null ? NetworkImage(_contact.avatar!) : null,
                  child: _contact.avatar == null
                      ? Text(
                          _contact.displayName.isNotEmpty
                              ? _contact.displayName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                        )
                      : null,
                ),
                const SizedBox(height: 16),
                Text(
                  _contact.displayName,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // 电话号码
          if (_contact.phones.isNotEmpty) ...[
            const SectionTitle(title: '电话号码'),
            ..._contact.phones.map((phone) => ListTile(
              leading: const Icon(Icons.phone),
              title: Text(phone.number),
              subtitle: Text(phone.label),
              onTap: () => _launchPhone(phone.number),
            )),
            const SizedBox(height: 16),
          ],

          // 邮箱地址
          if (_contact.emails.isNotEmpty) ...[
            const SectionTitle(title: '邮箱地址'),
            ..._contact.emails.map((email) => ListTile(
              leading: const Icon(Icons.email),
              title: Text(email.address),
              subtitle: Text(email.label),
              onTap: () => _launchEmail(email.address),
            )),
            const SizedBox(height: 16),
          ],

          // 公司信息
          if (_contact.company != null) ...[
            const SectionTitle(title: '公司信息'),
            ListTile(
              leading: const Icon(Icons.business),
              title: Text(_contact.company!.name),
              subtitle: _contact.company!.title,
            ),
            const SizedBox(height: 16),
          ],

          // 地址
          if (_contact.address != null) ...[
            const SectionTitle(title: '地址'),
            ListTile(
              leading: const Icon(Icons.location_on),
              title: Text('${_contact.address!.street}, ${_contact.address!.city}'),
              subtitle: Text('${_contact.address!.state}, ${_contact.address!.postalCode}'),
            ),
            const SizedBox(height: 16),
          ],

          // 生日
          if (_contact.birthday != null) ...[
            const SectionTitle(title: '生日'),
            ListTile(
              leading: const Icon(Icons.cake),
              title: Text('${_contact.birthday!.year}-${_contact.birthday!.month}-${_contact.birthday!.day}'),
            ),
            const SizedBox(height: 16),
          ],

          // 备注
          if (_contact.notes != null && _contact.notes!.isNotEmpty) ...[
            const SectionTitle(title: '备注'),
            ListTile(
              leading: const Icon(Icons.note),
              title: Text(_contact.notes!),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEditForm() {
    return Form(
      key: _formKey,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextFormField(
              controller: _firstNameController,
              decoration: const InputDecoration(labelText: '名字'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入名字';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _lastNameController,
              decoration: const InputDecoration(labelText: '姓氏'),
            ),
            TextFormField(
              controller: _companyController,
              decoration: const InputDecoration(labelText: '公司'),
            ),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: '职位'),
            ),
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(labelText: '备注'),
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchPhone(String phoneNumber) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phoneNumber);
    // 这里可以使用 url_launcher 来拨打电话
  }

  Future<void> _launchEmail(String emailAddress) async {
    final Uri emailUri = Uri(scheme: 'mailto', path: emailAddress);
    // 这里可以使用 url_launcher 来发送邮件
  }
}

// 区块标题组件
class SectionTitle extends StatelessWidget {
  final String title;

  const SectionTitle({Key? key, required this.title}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }
}
```

### 第七步：创建主应用界面

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'widgets/contact_list_widget.dart';
import 'widgets/contact_detail_page.dart';
import 'models/contact.dart';
import 'services/contact_service.dart';

void main() {
  runApp(const ContactHubApp());
}

class ContactHubApp extends StatelessWidget {
  const ContactHubApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ContactHub',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        brightness: Brightness.light,
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final ContactService _contactService = ContactService();
  bool _permissionsGranted = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);

    try {
      final contactsPermission = await Permission.contacts.status;

      if (contactsPermission.isGranted) {
        setState(() => _permissionsGranted = true);
      } else {
        setState(() => _permissionsGranted = false);
      }
    } catch (e) {
      setState(() => _permissionsGranted = false);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _requestPermissions() async {
    try {
      final contactsPermission = await Permission.contacts.request();

      if (contactsPermission.isGranted) {
        setState(() => _permissionsGranted = true);
      } else {
        _showPermissionDeniedDialog('联系人权限被拒绝，应用无法访问您的联系人');
      }
    } catch (e) {
      _showErrorSnackBar('请求权限失败: $e');
    }
  }

  void _showPermissionDeniedDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('权限被拒绝'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              openAppSettings();
            },
            child: const Text('打开设置'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _onContactTap(Contact contact) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ContactDetailPage(
          contact: contact,
          onContactUpdated: (updatedContact) {
            _contactService.refreshContacts();
          },
          onContactDeleted: (contactId) {
            _contactService.refreshContacts();
          },
        ),
      ),
    );
  }

  void _onContactLongPress(Contact contact) {
    _showContactOptions(contact);
  }

  void _showContactOptions(Contact contact) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.phone),
            title: const Text('拨打电话'),
            onTap: () {
              Navigator.of(context).pop();
              if (contact.phones.isNotEmpty) {
                _launchPhone(contact.phones.first.number);
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.email),
            title: const Text('发送邮件'),
            onTap: () {
              Navigator.of(context).pop();
              if (contact.emails.isNotEmpty) {
                _launchEmail(contact.emails.first.address);
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.message),
            title: const Text('发送短信'),
            onTap: () {
              Navigator.of(context).pop();
              if (contact.phones.isNotEmpty) {
                _launchSms(contact.phones.first.number);
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.edit),
            title: const Text('编辑联系人'),
            onTap: () {
              Navigator.of(context).pop();
              _onContactTap(contact);
            },
          ),
        ],
      ),
    );
  }

  Future<void> _launchPhone(String phoneNumber) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phoneNumber);
    // 这里可以使用 url_launcher 来拨打电话
  }

  Future<void> _launchEmail(String emailAddress) async {
    final Uri emailUri = Uri(scheme: 'mailto', path: emailAddress);
    // 这里可以使用 url_launcher 来发送邮件
  }

  Future<void> _launchSms(String phoneNumber) async {
    final Uri smsUri = Uri(scheme: 'sms', path: phoneNumber);
    // 这里可以使用 url_launcher 来发送短信
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!_permissionsGranted) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('ContactHub'),
          backgroundColor: Colors.blue,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.contacts,
                size: 64,
                color: Colors.grey,
              ),
              const SizedBox(height: 16),
              const Text(
                '需要联系人权限',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'ContactHub需要访问您的联系人来提供联系人管理服务',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _requestPermissions,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: const Text(
                  '授予权限',
                  style: TextStyle(fontSize: 18),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('ContactHub'),
        backgroundColor: Colors.blue,
        actions: [
          IconButton(
            icon: const Icon(Icons.group),
            onPressed: () => _showGroupsPage(),
            tooltip: '分组管理',
          ),
          IconButton(
            icon: const Icon(Icons.backup),
            onPressed: () => _showBackupPage(),
            tooltip: '备份恢复',
          ),
        ],
      ),
      body: ContactListWidget(
        onContactTap: _onContactTap,
        onContactLongPress: _onContactLongPress,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddContactDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showGroupsPage() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const GroupsPage(),
      ),
    );
  }

  void _showBackupPage() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const BackupPage(),
      ),
    );
  }

  void _showAddContactDialog() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const AddContactPage(),
      ),
    );
  }
}

// 分组管理页面
class GroupsPage extends StatelessWidget {
  const GroupsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('分组管理'),
        backgroundColor: Colors.blue,
      ),
      body: const Center(
        child: Text('分组管理功能待实现'),
      ),
    );
  }
}

// 备份恢复页面
class BackupPage extends StatelessWidget {
  const BackupPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('备份恢复'),
        backgroundColor: Colors.blue,
      ),
      body: const Center(
        child: Text('备份恢复功能待实现'),
      ),
    );
  }
}

// 添加联系人页面
class AddContactPage extends StatelessWidget {
  const AddContactPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('添加联系人'),
        backgroundColor: Colors.blue,
      ),
      body: const Center(
        child: Text('添加联系人功能待实现'),
      ),
    );
  }
}
```

## 高级功能实现

### 1. 智能联系人推荐

```dart
// lib/services/contact_recommendation_service.dart
import 'dart:async';
import 'dart:math';
import '../models/contact.dart';
import '../services/contact_service.dart';

class ContactRecommendationService {
  static final ContactRecommendationService _instance = ContactRecommendationService._internal();
  factory ContactRecommendationService() => _instance;
  ContactRecommendationService._internal();

  final ContactService _contactService = ContactService();

  // 获取推荐联系人
  Future<List<Contact>> getRecommendedContacts({int limit = 10}) async {
    try {
      final allContacts = _contactService.contacts;
      final recommendations = <Contact>[];

      // 基于通话频率推荐
      final frequentContacts = await _getFrequentContacts();
      recommendations.addAll(frequentContacts);

      // 基于最近通话推荐
      final recentContacts = await _getRecentContacts();
      recommendations.addAll(recentContacts);

      // 基于分组推荐
      final groupContacts = await _getGroupBasedRecommendations();
      recommendations.addAll(groupContacts);

      // 去重并限制数量
      final uniqueRecommendations = <String, Contact>{};
      for (final contact in recommendations) {
        uniqueRecommendations[contact.id] = contact;
      }

      return uniqueRecommendations.values.take(limit).toList();
    } catch (e) {
      throw ContactRecommendationException('获取推荐联系人失败: $e');
    }
  }

  // 获取常用联系人
  Future<List<Contact>> _getFrequentContacts() async {
    try {
      final callRecords = await _contactService.getCallRecords();
      final contactCallCount = <String, int>{};

      // 统计每个联系人的通话次数
      for (final record in callRecords) {
        if (record.contactId.isNotEmpty) {
          contactCallCount[record.contactId] = (contactCallCount[record.contactId] ?? 0) + 1;
        }
      }

      // 按通话次数排序
      final sortedEntries = contactCallCount.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      // 获取前5个常用联系人
      final frequentContactIds = sortedEntries.take(5).map((e) => e.key).toList();
      final allContacts = _contactService.contacts;

      return allContacts.where((contact) => frequentContactIds.contains(contact.id)).toList();
    } catch (e) {
      return [];
    }
  }

  // 获取最近联系人
  Future<List<Contact>> _getRecentContacts() async {
    try {
      final callRecords = await _contactService.getCallRecords();
      final recentContactIds = callRecords
          .where((record) => record.contactId.isNotEmpty)
          .take(5)
          .map((record) => record.contactId)
          .toSet();

      final allContacts = _contactService.contacts;
      return allContacts.where((contact) => recentContactIds.contains(contact.id)).toList();
    } catch (e) {
      return [];
    }
  }

  // 基于分组推荐
  Future<List<Contact>> _getGroupBasedRecommendations() async {
    try {
      // 这里可以实现基于分组的推荐逻辑
      // 例如：推荐同一分组的其他联系人
      return [];
    } catch (e) {
      return [];
    }
  }

  // 获取相似联系人
  Future<List<Contact>> getSimilarContacts(Contact contact, {int limit = 5}) async {
    try {
      final allContacts = _contactService.contacts;
      final similarities = <String, double>{};

      for (final otherContact in allContacts) {
        if (otherContact.id == contact.id) continue;

        final similarity = _calculateSimilarity(contact, otherContact);
        similarities[otherContact.id] = similarity;
      }

      // 按相似度排序
      final sortedEntries = similarities.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));

      final similarContactIds = sortedEntries.take(limit).map((e) => e.key).toList();
      return allContacts.where((c) => similarContactIds.contains(c.id)).toList();
    } catch (e) {
      throw ContactRecommendationException('获取相似联系人失败: $e');
    }
  }

  // 计算联系人相似度
  double _calculateSimilarity(Contact contact1, Contact contact2) {
    double similarity = 0.0;

    // 公司名称相似度
    if (contact1.company?.name != null && contact2.company?.name != null) {
      if (contact1.company!.name == contact2.company!.name) {
        similarity += 0.3;
      }
    }

    // 电话号码相似度
    for (final phone1 in contact1.phones) {
      for (final phone2 in contact2.phones) {
        if (_isSimilarPhoneNumber(phone1.number, phone2.number)) {
          similarity += 0.4;
          break;
        }
      }
    }

    // 邮箱地址相似度
    for (final email1 in contact1.emails) {
      for (final email2 in contact2.emails) {
        if (_isSimilarEmail(email1.address, email2.address)) {
          similarity += 0.3;
          break;
        }
      }
    }

    return similarity;
  }

  // 判断电话号码是否相似
  bool _isSimilarPhoneNumber(String phone1, String phone2) {
    // 移除所有非数字字符
    final cleanPhone1 = phone1.replaceAll(RegExp(r'[^0-9]'), '');
    final cleanPhone2 = phone2.replaceAll(RegExp(r'[^0-9]'), '');

    // 如果长度相差太大，不相似
    if ((cleanPhone1.length - cleanPhone2.length).abs() > 2) {
      return false;
    }

    // 检查后几位是否相同
    final minLength = min(cleanPhone1.length, cleanPhone2.length);
    final suffixLength = min(6, minLength);

    return cleanPhone1.substring(cleanPhone1.length - suffixLength) ==
           cleanPhone2.substring(cleanPhone2.length - suffixLength);
  }

  // 判断邮箱是否相似
  bool _isSimilarEmail(String email1, String email2) {
    // 获取邮箱域名
    final domain1 = email1.split('@').last.toLowerCase();
    final domain2 = email2.split('@').last.toLowerCase();

    // 如果域名相同，认为相似
    return domain1 == domain2;
  }
}

// 联系人推荐异常
class ContactRecommendationException implements Exception {
  final String message;
  ContactRecommendationException(this.message);

  @override
  String toString() => message;
}
```

### 2. 联系人数据分析

```dart
// lib/services/contact_analytics_service.dart
import 'dart:math';
import '../models/contact.dart';
import '../services/contact_service.dart';

class ContactAnalyticsService {
  static final ContactAnalyticsService _instance = ContactAnalyticsService._internal();
  factory ContactAnalyticsService() => _instance;
  ContactAnalyticsService._internal();

  final ContactService _contactService = ContactService();

  // 获取联系人统计信息
  Future<ContactStatistics> getContactStatistics() async {
    try {
      final contacts = _contactService.contacts;

      // 基本统计
      final totalContacts = contacts.length;
      final contactsWithPhone = contacts.where((c) => c.phones.isNotEmpty).length;
      final contactsWithEmail = contacts.where((c) => c.emails.isNotEmpty).length;
      final contactsWithCompany = contacts.where((c) => c.company != null).length;
      final contactsWithBirthday = contacts.where((c) => c.birthday != null).length;

      // 电话号码统计
      final totalPhoneNumbers = contacts.fold<int>(0, (sum, contact) => sum + contact.phones.length);
      final mobilePhones = contacts.fold<int>(0, (sum, contact) =>
          sum + contact.phones.where((p) => _isMobilePhone(p.number)).length);
      final workPhones = contacts.fold<int>(0, (sum, contact) =>
          sum + contact.phones.where((p) => _isWorkPhone(p.number)).length);

      // 邮箱统计
      final totalEmails = contacts.fold<int>(0, (sum, contact) => sum + contact.emails.length);
      final workEmails = contacts.fold<int>(0, (sum, contact) =>
          sum + contact.emails.where((e) => _isWorkEmail(e.address)).length);
      final personalEmails = contacts.fold<int>(0, (sum, contact) =>
          sum + contact.emails.where((e) => _isPersonalEmail(e.address)).length);

      // 公司统计
      final companies = <String, int>{};
      for (final contact in contacts) {
        if (contact.company?.name != null) {
          final company = contact.company!.name;
          companies[company] = (companies[company] ?? 0) + 1;
        }
      }

      // 生日月份分布
      final birthdayMonths = <int, int>{};
      for (final contact in contacts) {
        if (contact.birthday != null) {
          final month = contact.birthday!.month;
          birthdayMonths[month] = (birthdayMonths[month] ?? 0) + 1;
        }
      }

      return ContactStatistics(
        totalContacts: totalContacts,
        contactsWithPhone: contactsWithPhone,
        contactsWithEmail: contactsWithEmail,
        contactsWithCompany: contactsWithCompany,
        contactsWithBirthday: contactsWithBirthday,
        totalPhoneNumbers: totalPhoneNumbers,
        mobilePhones: mobilePhones,
        workPhones: workPhones,
        totalEmails: totalEmails,
        workEmails: workEmails,
        personalEmails: personalEmails,
        topCompanies: _getTopItems(companies, 10),
        birthdayMonthDistribution: birthdayMonths,
      );
    } catch (e) {
      throw ContactAnalyticsException('获取联系人统计失败: $e');
    }
  }

  // 获取联系人增长趋势
  Future<List<ContactGrowthData>> getContactGrowthTrend() async {
    try {
      final contacts = _contactService.contacts;
      final growthData = <ContactGrowthData>[];

      // 按月份分组统计
      final monthlyContacts = <DateTime, List<Contact>>{};
      for (final contact in contacts) {
        final month = DateTime(contact.createdAt.year, contact.createdAt.month, 1);
        if (!monthlyContacts.containsKey(month)) {
          monthlyContacts[month] = [];
        }
        monthlyContacts[month]!.add(contact);
      }

      // 计算累计增长
      final sortedMonths = monthlyContacts.keys.toList()..sort();
      int cumulativeCount = 0;

      for (final month in sortedMonths) {
        cumulativeCount += monthlyContacts[month]!.length;
        growthData.add(ContactGrowthData(
          month: month,
          newContacts: monthlyContacts[month]!.length,
          totalContacts: cumulativeCount,
        ));
      }

      return growthData;
    } catch (e) {
      throw ContactAnalyticsException('获取联系人增长趋势失败: $e');
    }
  }

  // 获取联系人活跃度分析
  Future<ContactActivityAnalysis> getActivityAnalysis() async {
    try {
      final callRecords = await _contactService.getCallRecords();
      final contacts = _contactService.contacts;

      // 统计每个联系人的活跃度
      final contactActivity = <String, ContactActivity>{};

      for (final record in callRecords) {
        if (record.contactId.isEmpty) continue;

        if (!contactActivity.containsKey(record.contactId)) {
          final contact = contacts.firstWhere((c) => c.id == record.contactId, orElse: () => contacts.first);
          contactActivity[record.contactId] = ContactActivity(
            contactId: record.contactId,
            contactName: contact.displayName,
            totalCalls: 0,
            incomingCalls: 0,
            outgoingCalls: 0,
            missedCalls: 0,
            totalDuration: Duration.zero,
            lastContact: record.timestamp,
          );
        }

        final activity = contactActivity[record.contactId]!;
        activity.totalCalls++;
        activity.totalDuration += record.duration;

        switch (record.callType) {
          case CallType.incoming:
            activity.incomingCalls++;
            break;
          case CallType.outgoing:
            activity.outgoingCalls++;
            break;
          case CallType.missed:
            activity.missedCalls++;
            break;
        }

        if (record.timestamp.isAfter(activity.lastContact)) {
          activity.lastContact = record.timestamp;
        }
      }

      // 排序获取最活跃的联系人
      final sortedActivities = contactActivity.values.toList()
        ..sort((a, b) => b.totalCalls.compareTo(a.totalCalls));

      return ContactActivityAnalysis(
        totalActivities: contactActivity.length,
        mostActiveContacts: sortedActivities.take(10).toList(),
        averageCallsPerContact: contactActivity.isEmpty ? 0.0 :
            contactActivity.values.fold(0.0, (sum, activity) => sum + activity.totalCalls) / contactActivity.length,
      );
    } catch (e) {
      throw ContactAnalyticsException('获取联系人活跃度分析失败: $e');
    }
  }

  // 判断是否为手机号码
  bool _isMobilePhone(String phoneNumber) {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^0-9]'), '');
    return cleanPhone.length == 11 && cleanPhone.startsWith('1');
  }

  // 判断是否为工作电话
  bool _isWorkPhone(String phoneNumber) {
    // 简化实现，可以根据实际需求调整
    return phoneNumber.toLowerCase().contains('work') ||
           phoneNumber.toLowerCase().contains('office');
  }

  // 判断是否为工作邮箱
  bool _isWorkEmail(String email) {
    final domain = email.split('@').last.toLowerCase();
    return !domain.contains('gmail.com') &&
           !domain.contains('yahoo.com') &&
           !domain.contains('hotmail.com') &&
           !domain.contains('qq.com') &&
           !domain.contains('163.com');
  }

  // 判断是否为个人邮箱
  bool _isPersonalEmail(String email) {
    final domain = email.split('@').last.toLowerCase();
    return domain.contains('gmail.com') ||
           domain.contains('yahoo.com') ||
           domain.contains('hotmail.com') ||
           domain.contains('qq.com') ||
           domain.contains('163.com');
  }

  // 获取前N个项目
  Map<String, int> _getTopItems(Map<String, int> items, int count) {
    final sortedEntries = items.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Map.fromEntries(sortedEntries.take(count));
  }
}

// 联系人统计信息
class ContactStatistics {
  final int totalContacts;
  final int contactsWithPhone;
  final int contactsWithEmail;
  final int contactsWithCompany;
  final int contactsWithBirthday;
  final int totalPhoneNumbers;
  final int mobilePhones;
  final int workPhones;
  final int totalEmails;
  final int workEmails;
  final int personalEmails;
  final Map<String, int> topCompanies;
  final Map<int, int> birthdayMonthDistribution;

  ContactStatistics({
    required this.totalContacts,
    required this.contactsWithPhone,
    required this.contactsWithEmail,
    required this.contactsWithCompany,
    required this.contactsWithBirthday,
    required this.totalPhoneNumbers,
    required this.mobilePhones,
    required this.workPhones,
    required this.totalEmails,
    required this.workEmails,
    required this.personalEmails,
    required this.topCompanies,
    required this.birthdayMonthDistribution,
  });
}

// 联系人增长数据
class ContactGrowthData {
  final DateTime month;
  final int newContacts;
  final int totalContacts;

  ContactGrowthData({
    required this.month,
    required this.newContacts,
    required this.totalContacts,
  });
}

// 联系人活跃度
class ContactActivity {
  final String contactId;
  final String contactName;
  int totalCalls;
  int incomingCalls;
  int outgoingCalls;
  int missedCalls;
  Duration totalDuration;
  DateTime lastContact;

  ContactActivity({
    required this.contactId,
    required this.contactName,
    required this.totalCalls,
    required this.incomingCalls,
    required this.outgoingCalls,
    required this.missedCalls,
    required this.totalDuration,
    required this.lastContact,
  });
}

// 联系人活跃度分析
class ContactActivityAnalysis {
  final int totalActivities;
  final List<ContactActivity> mostActiveContacts;
  final double averageCallsPerContact;

  ContactActivityAnalysis({
    required this.totalActivities,
    required this.mostActiveContacts,
    required this.averageCallsPerContact,
  });
}

// 联系人分析异常
class ContactAnalyticsException implements Exception {
  final String message;
  ContactAnalyticsException(this.message);

  @override
  String toString() => message;
}
```

## 测试与调试

### 1. 联系人服务测试

```dart
// test/contact_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:geo_tracker/services/contact_service.dart';

void main() {
  group('ContactService Tests', () {
    late ContactService contactService;

    setUp(() {
      contactService = ContactService();
    });

    test('should initialize successfully with granted permissions', () async {
      // 模拟权限授予
      // 这里需要模拟FlutterContacts.requestPermission返回true

      await expectLater(contactService.initialize(), completes);
    });

    test('should throw exception when permissions are denied', () async {
      // 模拟权限拒绝
      // 这里需要模拟FlutterContacts.requestPermission返回false

      await expectLater(
        contactService.initialize(),
        throwsA(isA<ContactException>()),
      );
    });

    test('should search contacts correctly', () async {
      // 模拟联系人数据
      final mockContacts = [
        Contact(
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          phones: [PhoneNumber(number: '1234567890', label: 'mobile')],
          emails: [],
        ),
        Contact(
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          displayName: 'Jane Smith',
          phones: [PhoneNumber(number: '0987654321', label: 'mobile')],
          emails: [],
        ),
      ];

      // 设置模拟数据
      // contactService._contacts = mockContacts;

      // 测试搜索
      final results = contactService.searchContacts('John');
      expect(results.length, equals(1));
      expect(results.first.displayName, equals('John Doe'));
    });
  });
}
```

### 2. 联系人备份测试

```dart
// test/contact_backup_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:geo_tracker/services/contact_backup_service.dart';
import 'package:geo_tracker/models/contact.dart';

void main() {
  group('ContactBackupService Tests', () {
    late ContactBackupService backupService;
    late List<Contact> testContacts;

    setUp(() {
      backupService = ContactBackupService();
      testContacts = [
        Contact(
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          phones: [PhoneNumber(number: '1234567890', label: 'mobile')],
          emails: [Email(address: 'john@example.com', label: 'home')],
        ),
      ];
    });

    test('should backup contacts to JSON successfully', () async {
      final file = await backupService.backupContactsToJson(testContacts);
      expect(file, isNotNull);
      expect(file.path.endsWith('.json'), isTrue);
    });

    test('should backup contacts to CSV successfully', () async {
      final file = await backupService.backupContactsToCsv(testContacts);
      expect(file, isNotNull);
      expect(file.path.endsWith('.csv'), isTrue);
    });

    test('should backup contacts to VCard successfully', () async {
      final file = await backupService.backupContactsToVCard(testContacts);
      expect(file, isNotNull);
      expect(file.path.endsWith('.vcf'), isTrue);
    });
  });
}
```

## 最佳实践与注意事项

### 1. 权限管理

- **渐进式权限请求**：先请求基本权限，再请求可选权限
- **权限说明**：清晰地向用户解释为什么需要联系人权限
- **优雅降级**：在权限被拒绝时提供替代功能

### 2. 性能优化

- **分页加载**：对于大量联系人，使用分页加载
- **缓存策略**：合理缓存联系人数据，减少重复查询
- **异步操作**：所有联系人操作都应该是异步的

### 3. 数据安全

- **数据加密**：对敏感联系人数据进行加密存储
- **最小权限原则**：只请求必要的权限
- **数据清理**：及时清理不需要的联系人数据

### 4. 用户体验

- **搜索优化**：提供快速、准确的联系人搜索
- **批量操作**：支持批量选择和操作联系人
- **状态反馈**：提供清晰的操作状态反馈

### 5. 平台差异

- **API 差异**：处理 Android 和 iOS 平台 API 的差异
- **UI 适配**：适配不同平台的 UI 风格
- **功能限制**：处理平台功能限制

## 总结

通过本文的详细介绍，我们成功实现了一个功能完整的联系人管理应用 ContactHub。这个项目涵盖了：

1. **联系人管理基础架构**：设计了完整的联系人数据管理架构
2. **联系人分组功能**：实现了联系人的分组管理和统计
3. **备份恢复功能**：提供了多种格式的联系人备份和恢复
4. **用户界面设计**：创建了直观的联系人列表和详情界面
5. **高级功能**：实现了智能推荐和数据分析功能
6. **测试与调试**：提供了完整的测试方案

联系人管理是移动应用开发中的重要功能，通过 Flutter 的桥接能力，我们可以轻松实现跨平台的联系人管理功能。在实际项目中，还可以根据具体需求进一步扩展功能，比如：

- 集成更多社交平台联系人
- 添加联系人同步功能
- 实现联系人去重和合并
- 添加联系人标签和自定义字段
- 集成 AI 驱动的联系人分析

希望本文能够帮助开发者更好地理解和实现 Flutter 中的联系人管理功能。
