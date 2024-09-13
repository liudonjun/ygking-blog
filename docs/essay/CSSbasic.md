---
title: CSS变量的妙用
date: 2022/11/08
tags:
  - css
categories:
  - 基础
---

## 提出问题

我该如何编写代码，怎么使得这个小球偏移到最后再回来呢，使得这个 translateX 偏移量更优雅呢,如果用大量的 js 去操作将增加我们的代码量

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>

    <style>
      .container {
        width: 80%;
        height: 300px;
        margin: 0 auto;
        border: 1px solid;
        position: relative;
      }

      .item {
        height: 200px;
        width: 200px;
        border-radius: 50%;
        background: rebeccapurple;
        position: absolute;
        top: 100px;
        left: 0;
        animation: move 4s linear infinite;
      }
      @keyframes move {
        50% {
          transform: translateX(300px);
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="item"></div>
    </div>

    <script></script>
  </body>
</html>
```

## CSS 变量

[CSS 变量](https://developer.mozilla.org/zh-CN/docs/Web/CSS/--*)带有--前缀的属性名，表示带有值的自定义属性，下面是它的语法 以及使用,还可以使用 js 来设置 CSS 变量
通过[setProperty()](https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration/setProperty)函数来设置 CSS 变量

```css
--somecolor: #0000ff;

color：var(--somecolor)

/* 通过js的形式设置变量 */


```

```js
style.setProperty(propertyName, value, priority);

// 参数
/**
 * propertyName 是一个 DOMString ，代表被更改的 CSS 属性。
 * value可选 是一个 DOMString ，含有新的属性值。如果没有指定，则当作空字符串。
 * - 注意：value 不能包含 "!important" --那个应该使用 priority 参数。
 * priority可选 是一个 DOMString 允许设置 "important" CSS 优先级。如果没有指定，则当作空字符串。
 */
```

## calc()

[calc()](https://developer.mozilla.org/zh-CN/docs/Web/CSS/calc) 此 CSS 函数允许在声明 CSS 属性值时执行一些计算

```css
/* property: calc(expression) */
width: calc(100% - 80px);
```

好的了解过后让我们实现一下吧,使用 calc 计算外加 CSS 变量的形式，简化了代码，js 部分只执行赋值操作

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>

    <style>
      .container {
        width: 80%;
        height: 300px;
        margin: 0 auto;
        border: 1px solid;
        position: relative;
      }

      .item {
        height: 200px;
        width: 200px;
        border-radius: 50%;
        background: rebeccapurple;
        position: absolute;
        top: 100px;
        left: 0;
        animation: move 4s linear infinite;
      }
      @keyframes move {
        50% {
          transform: translateX(calc(var(--w) - 100%));
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="item"></div>
    </div>

    <script>
      const container = document.querySelector(".container");
      const item = document.querySelector(".item");
      item.style.setProperty("--w", container.clientWidth + "px");
    </script>
  </body>
</html>
```
