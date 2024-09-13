---
title: 关于七牛云下载的文件没有后缀
date: 2022/12/03
tags:
  - Vue
  - Js
  - qiniu
categories:
  - 进阶
---

## 应用场景

文件名称默认以传入的 key 来命名，但我命名的时候是使用 uuid 填进去的。用链接下载下来的文件名就是一串没有后缀的字符串，打不开。

有两种解决方式：

- 在上传时指定带后缀的 key 。
- 在下载时 url 后拼接 ?attname= 后跟希望得到的文件名。

## 下载时拼接

```js
/**
 * 文件直接下载
 * @param {*} url 下载地址
 * @param {*} fileName 文件名
 * @param {*} tag 是否需要转换七牛云地址
 */
export function BaseDownloadFile(url, fileName, tag) {
  let link = document.createElement("a");
  link.style.display = "none";
  if (tag) {
    link.href = url + `?attname=${fileName}`;
  } else {
    link.href = url;
  }
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); //下载完成移除元素
  window.URL.revokeObjectURL(url); //释放掉blob对象
}
```

文章关联知识点：[qiniu JavaScript SDK](https://developer.qiniu.com/kodo/1283/javascript)
