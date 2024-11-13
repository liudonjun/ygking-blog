---
title: Flutter 国际化实现详解
description: 详细介绍 Flutter 中实现应用国际化的方法和最佳实践。
tag:
 - Flutter
 - 实战
sidebar: true
---

# Flutter 国际化实现详解

## 简介

国际化(i18n)是应用程序适配不同语言和地区的过程。Flutter 提供了完整的国际化支持,可以轻松实现多语言切换。

## 基本配置

### 添加依赖
```yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.1
```

### 配置 MaterialApp
```dart
MaterialApp(
  localizationsDelegates: [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    AppLocalizations.delegate,
  ],
  supportedLocales: [
    Locale('en', ''), // English
    Locale('zh', ''), // Chinese
    Locale('es', ''), // Spanish
  ],
  locale: _currentLocale, // 当前语言
)
```

## 实现本地化

### 定义翻译
```dart
class AppLocalizations {
  final Locale locale;
  
  AppLocalizations(this.locale);
  
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(
      context,
      AppLocalizations,
    )!;
  }
  
  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();
      
  static Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'title': 'My App',
      'hello': 'Hello',
      'settings': 'Settings',
      'language': 'Language',
      'theme': 'Theme',
    },
    'zh': {
      'title': '我的应用',
      'hello': '你好',
      'settings': '设置',
      'language': '语言',
      'theme': '主题',
    },
    'es': {
      'title': 'Mi Aplicación',
      'hello': 'Hola',
      'settings': 'Ajustes',
      'language': 'Idioma',
      'theme': 'Tema',
    },
  };
  
  String get title => _localizedValues[locale.languageCode]!['title']!;
  String get hello => _localizedValues[locale.languageCode]!['hello']!;
  String get settings => _localizedValues[locale.languageCode]!['settings']!;
  String get language => _localizedValues[locale.languageCode]!['language']!;
  String get theme => _localizedValues[locale.languageCode]!['theme']!;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'zh', 'es'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
```

## 语言切换

### 语言管理
```dart
class LanguageProvider extends ChangeNotifier {
  Locale _locale = Locale('en');
  
  Locale get locale => _locale;
  
  void setLocale(Locale locale) {
    if (!AppLocalizations.delegate.isSupported(locale)) return;
    _locale = locale;
    notifyListeners();
  }
  
  // 获取当前语言名称
  String getCurrentLanguageName() {
    switch (_locale.languageCode) {
      case 'en':
        return 'English';
      case 'zh':
        return '中文';
      case 'es':
        return 'Español';
      default:
        return 'English';
    }
  }
}
```

### 语言持久化
```dart
class LanguagePreferences {
  static const String key = 'language_code';
  
  static Future<void> setLanguageCode(String code) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, code);
  }
  
  static Future<String> getLanguageCode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(key) ?? 'en';
  }
}
```

## 完整示例

```dart
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => LanguageProvider(),
      child: Consumer<LanguageProvider>(
        builder: (context, languageProvider, child) {
          return MaterialApp(
            localizationsDelegates: [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
              AppLocalizations.delegate,
            ],
            supportedLocales: [
              Locale('en', ''),
              Locale('zh', ''),
              Locale('es', ''),
            ],
            locale: languageProvider.locale,
            home: HomePage(),
          );
        },
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context);
    final languageProvider = Provider.of<LanguageProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.title),
      ),
      body: ListView(
        children: [
          ListTile(
            title: Text(localizations.language),
            subtitle: Text(languageProvider.getCurrentLanguageName()),
            onTap: () => _showLanguageDialog(context),
          ),
          Divider(),
          ListTile(
            title: Text(localizations.hello),
          ),
        ],
      ),
    );
  }
  
  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(AppLocalizations.of(context).language),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text('English'),
                onTap: () {
                  Provider.of<LanguageProvider>(context, listen: false)
                      .setLocale(Locale('en'));
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: Text('中文'),
                onTap: () {
                  Provider.of<LanguageProvider>(context, listen: false)
                      .setLocale(Locale('zh'));
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: Text('Español'),
                onTap: () {
                  Provider.of<LanguageProvider>(context, listen: false)
                      .setLocale(Locale('es'));
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
```

## 最佳实践

1. 使用统一的翻译管理
2. 实现语言持久化
3. 支持系统语言
4. 提供语言切换UI
5. 处理RTL布局

## 注意事项

1. 翻译文本的完整性
2. 文本长度适配
3. 日期时间格式
4. 数字格式化
5. RTL布局支持

## 总结

通过合理使用 Flutter 的国际化支持,可以轻松实现应用的多语言支持。注意在实现过程中要考虑文本适配和布局问题。 