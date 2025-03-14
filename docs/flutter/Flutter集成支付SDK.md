---
description: 本文详细介绍如何在Flutter项目中集成支付宝和微信支付SDK，包括配置步骤、接口调用和支付流程处理。
tag:
  - Flutter
  - 第三方插件
  - 支付功能
sticky: 1
sidebar: true
---

# Flutter集成支付SDK

## 简介

移动支付是现代应用不可或缺的功能，本文将详细介绍如何在Flutter应用中集成支付宝和微信支付功能，实现安全、便捷的支付体验。

## 支付宝集成

### 1. 准备工作

1. 注册[支付宝开放平台](https://open.alipay.com/)账号
2. 创建应用并获取必要参数：
   - APPID
   - 商户私钥
   - 支付宝公钥

### 2. 添加依赖

在`pubspec.yaml`文件中添加依赖：

```yaml
dependencies:
  tobias: ^3.4.0  # 支付宝支付插件
```

### 3. 平台配置

#### Android配置

在`android/app/build.gradle`中添加：

```gradle
android {
    defaultConfig {
        manifestPlaceholders = [
            ALIPAY_SCHEME: "alipay$APPID"
        ]
    }
}
```

#### iOS配置

在`ios/Runner/Info.plist`中添加：

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>alipay</string>
</array>
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>alipay$APPID</string>
        </array>
    </dict>
</array>
```

### 4. 实现支付

```dart
import 'package:tobias/tobias.dart';

class AlipayService {
  static Future<Map<String, dynamic>> pay(String orderInfo) async {
    try {
      // 调用支付接口
      final result = await aliPay(orderInfo);
      
      // 解析支付结果
      if (result['resultStatus'] == '9000') {
        return {
          'success': true,
          'message': '支付成功',
          'data': result
        };
      } else {
        return {
          'success': false,
          'message': _getErrorMessage(result['resultStatus']),
          'data': result
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': '支付异常：$e',
        'data': null
      };
    }
  }

  static String _getErrorMessage(String code) {
    switch (code) {
      case '4000':
        return '订单支付失败';
      case '6001':
        return '用户中途取消';
      case '6002':
        return '网络连接出错';
      default:
        return '其他支付错误';
    }
  }
}
```

## 微信支付集成

### 1. 准备工作

1. 注册[微信支付商户平台](https://pay.weixin.qq.com/)账号
2. 获取必要参数：
   - AppID
   - 商户号
   - API密钥

### 2. 添加依赖

```yaml
dependencies:
  fluwx: ^3.13.1
```

### 3. 初始化配置

```dart
import 'package:fluwx/fluwx.dart';

class WeChatPayConfig {
  static Future<void> initWxApi() async {
    await registerWxApi(
      appId: "your_app_id",
      universalLink: "your_universal_link",  // iOS Universal Links
    );
  }
}
```

### 4. 实现支付

```dart
class WeChatPayService {
  static Future<Map<String, dynamic>> pay({
    required String partnerId,
    required String prepayId,
    required String packageValue,
    required String nonceStr,
    required String timeStamp,
    required String sign,
  }) async {
    try {
      final result = await payWithWeChat(
        appId: "your_app_id",
        partnerId: partnerId,
        prepayId: prepayId,
        packageValue: packageValue,
        nonceStr: nonceStr,
        timeStamp: timeStamp,
        sign: sign,
      );

      return {
        'success': result.errCode == 0,
        'message': _getErrorMessage(result.errCode),
        'data': result
      };
    } catch (e) {
      return {
        'success': false,
        'message': '支付异常：$e',
        'data': null
      };
    }
  }

  static String _getErrorMessage(int? code) {
    switch (code) {
      case 0:
        return '支付成功';
      case -1:
        return '支付错误';
      case -2:
        return '用户取消';
      default:
        return '未知错误';
    }
  }

  // 处理支付回调
  static void handlePaymentCallback() {
    weChatResponseEventHandler.listen((res) {
      if (res is WeChatPaymentResponse) {
        print("支付结果：${res.errCode}");
      }
    });
  }
}
```

## 统一支付服务

### 1. 支付方式枚举

```dart
enum PaymentMethod {
  alipay,
  wechat,
}
```

### 2. 统一支付接口

```dart
class PaymentService {
  static Future<Map<String, dynamic>> pay({
    required PaymentMethod method,
    required String orderId,
    required double amount,
  }) async {
    switch (method) {
      case PaymentMethod.alipay:
        // 构建支付宝订单信息
        final orderInfo = await _generateAlipayOrder(orderId, amount);
        return await AlipayService.pay(orderInfo);
        
      case PaymentMethod.wechat:
        // 构建微信支付参数
        final params = await _generateWeChatPayParams(orderId, amount);
        return await WeChatPayService.pay(
          partnerId: params['partnerId'],
          prepayId: params['prepayId'],
          packageValue: params['package'],
          nonceStr: params['nonceStr'],
          timeStamp: params['timeStamp'],
          sign: params['sign'],
        );
    }
  }

  // 生成支付宝订单信息
  static Future<String> _generateAlipayOrder(
    String orderId,
    double amount,
  ) async {
    // 调用服务端接口生成订单信息
    // 返回加签后的订单字符串
    return '';
  }

  // 生成微信支付参数
  static Future<Map<String, String>> _generateWeChatPayParams(
    String orderId,
    double amount,
  ) async {
    // 调用服务端接口获取支付参数
    return {};
  }
}
```

### 3. 使用示例

```dart
class PaymentPage extends StatelessWidget {
  final String orderId;
  final double amount;

  const PaymentPage({
    Key? key,
    required this.orderId,
    required this.amount,
  }) : super(key: key);

  Future<void> _handlePayment(PaymentMethod method) async {
    try {
      final result = await PaymentService.pay(
        method: method,
        orderId: orderId,
        amount: amount,
      );

      if (result['success']) {
        print('支付成功');
        // 处理支付成功逻辑
      } else {
        print('支付失败：${result['message']}');
        // 处理支付失败逻辑
      }
    } catch (e) {
      print('支付异常：$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('支付')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('订单金额：￥$amount'),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => _handlePayment(PaymentMethod.alipay),
              child: Text('支付宝支付'),
            ),
            ElevatedButton(
              onPressed: () => _handlePayment(PaymentMethod.wechat),
              child: Text('微信支付'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 安全考虑

### 1. 签名验证

```dart
class PaymentSecurity {
  static String generateSign(Map<String, dynamic> params, String key) {
    // 按参数名ASCII码从小到大排序
    final sortedParams = Map.fromEntries(
      params.entries.toList()..sort((a, b) => a.key.compareTo(b.key))
    );

    // 拼接字符串
    final stringA = sortedParams.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&');

    // 拼接商户密钥
    final stringSignTemp = '$stringA&key=$key';

    // MD5加密
    return md5.convert(utf8.encode(stringSignTemp)).toString().toUpperCase();
  }

  static bool verifySign(Map<String, dynamic> params, String sign, String key) {
    final generatedSign = generateSign(params, key);
    return generatedSign == sign;
  }
}
```

### 2. 敏感信息加密

```dart
class PaymentEncryption {
  static String encryptRSA(String content, String publicKey) {
    // RSA加密实现
    return '';
  }

  static String decryptRSA(String content, String privateKey) {
    // RSA解密实现
    return '';
  }
}
```

## 注意事项

1. **安全性**：
   - 敏感信息加密传输
   - 签名验证必不可少
   - 密钥安全存储

2. **合规性**：
   - 遵守支付平台规范
   - 实现必要的用户提示
   - 保护用户支付信息

3. **用户体验**：
   - 清晰的支付流程
   - 合理的超时处理
   - 完善的错误提示

4. **测试验证**：
   - 充分的沙箱测试
   - 各种异常场景测试
   - 支付结果验证

## 总结

支付SDK集成为应用提供了完整的支付解决方案：

1. 支持主流支付方式
2. 统一的支付接口
3. 安全的支付流程
4. 良好的用户体验

合理使用这些功能，可以：

- 提供便捷的支付方式
- 提高交易成功率
- 保障支付安全
- 优化用户体验