---
title: 校验一个字符串是不是正则表达式
date: 2023/01/02
tags:
  - Js
categories:
  - 进阶
---

## 简述
 
？？校验文本是不是正则表达式？可能有人会这么写

```js
//通过原型来判断
function checkReg(v){
    return Object.prototype.toString.call(v) === '[object RegExp]'
}

// 很显然这样是行不通的，文本的构造函数不是string吗，
// string
checkReg('/[0-9a-zA-Z]+/g')
//false

// RegExp
checkReg(/[0-9a-zA-Z]+/g)
//true

```
之后查阅资料，有个很巧妙的思路，转成表达式调用正则，调用RegExp对象函数，报错说明就不是正则了

## eval 

eval有利有弊，eval() 函数会将传入的字符串当做 JavaScript 代码进行执行。

```js
/**
 * 校验是否是正则表达式
 * @param {*} val 表达式
 * @returns 
 */
export function checkReg(v) {
  try {
    eval(v).test()
    return true
  } catch {
    return false
  }
}

```

文章关联知识点：[eval](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/eval)、[RegExp](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
