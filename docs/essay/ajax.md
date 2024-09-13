---
title: 实现ajax
date: 2022/04/25
tags:
  - ajax
categories:
  - 基础
---

## XMLHttpRequest 介绍

[mdn web docs](https://developer.mozilla.org/zh-CN)中有写到 XMLHttpRequest[XMLHttpRequest](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest)（XHR）对象用于与服务器交互。通过 XMLHttpRequest 可以在不刷新页面的情况下请求特定 URL，获取数据。这允许网页在不影响用户操作的情况下，更新页面的局部内容。XMLHttpRequest 在 AJAX 编程中被大量使用，对 Ajax 就是基于 XMLHttpRequest 实现的

### 原生实现

基本实现步骤

- 创建 XMLHttpRequest 实例
- 发出 HTTP 请求
- 服务器返回 XML 格式的字符串
- JS 解析 XML，并更新局部页面
- 不过随着历史进程的推进，XML 已经被淘汰，取而代之的是 JSON。

```js
function ajax() {
  //实例化，以调用方法
  let xhr = new XMLHttpRequest();
  xhr.open("get", "https://www.liudongjun.cn"); //参数2，url。参数三：异步
  //每当 readyState 属性改变时，就会调用该函数。
  xhr.onreadystatechange = () => {
    //XMLHttpRequest 代理当前所处状态。
    if (xhr.readyState === 4) {
      //200-300请求成功
      if (xhr.status >= 200 && xhr.status < 300) {
        let string = request.responseText;
        //JSON.parse() 方法用来解析JSON字符串，构造由字符串描述的JavaScript值或对象
        let object = JSON.parse(string);
      }
    }
  };
  //用于实际发出 HTTP 请求。不带参数为GET请求
  request.send();
}
```

### Promise 实现

基于 Promise 封装 ajax

- 返回一个新的 Promise 实例
- 创建 HMLHttpRequest 异步对象
- 调用 open 方法，打开 url，与服务器建立链接（发送前的一些处理）
- 监听 Ajax 状态信息
- 如果 xhr.readyState == 4（表示服务器响应完成，可以获取使用服务器的响应了）
  - xhr.status == 200，返回 resolve 状态
  - xhr.status == 404，返回 reject 状态
- xhr.readyState !== 4，把请求主体的信息基于 send 发送给服务器

```js
function ajax(url) {
  // 实例化一个Promise对象
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("get", url);
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        if (xhr.status >= 200 && xhr.status <= 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject("请求出错");
        }
      }
    };
    xhr.send(); //发送hppt请求
  });
}

let url = "/data.json";
ajax(url)
  .then((res) => console.log(res))
  .catch((reason) => console.log(reason));
```

文章关联知识点：[onreadystatechange](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/readystatechange_event)、
[JSON.parse()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)、[Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
