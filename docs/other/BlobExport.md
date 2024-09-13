---
title: blob格式文件对应格式
date: 2022/04/25
tags:
  - Blob
  - Js
categories:
  - 基础
---

## 介绍

**最近在做 blob 流导出相关功能，其中需要导出 excel、csv、word、zip 压缩文件之类的，在导出 excel 和 word 中需要知道对应的 content-type 属性，感觉挺好的就记录一下**

| 后缀  | MIME Type                                                                 |
| ----- | ------------------------------------------------------------------------- |
| .doc  | application/msword                                                        |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document   |
| .xls  | application/vnd.ms-excel                                                  |
| .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet         |
| .ppt  | application/vnd.ms-powerpoint                                             |
| .pptx | application/vnd.openxmlformats-officedocument.presentationml.presentation |

```js
/**
 * 下载模板
 * @param {*} data Excel 对象
 * @returns
 */
export const downLoadTemp = (data, name, type = "xlsx") => {
  if (type == "xlsx") {
    type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else {
    type = "application/vnd.ms-excel";
  }
  if (!data) {
    message.warning("文件下载失败");
    return;
  }
  if (typeof window.navigator.msSaveBlob !== "undefined") {
    window.navigator.msSaveBlob(
      new Blob([data], { type: type }),
      name.toString()
    );
    message.success({ content: "附件下载完成!", duration: 3 });
  } else {
    let url = window.URL.createObjectURL(new Blob([data], { type: type }));
    let link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.setAttribute("download", name.toString());
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); //下载完成移除元素
    window.URL.revokeObjectURL(url); //释放掉blob对象
    message.success({ content: "附件下载完成!", duration: 3 });
  }
};
```

文章关联知识点：[Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)
