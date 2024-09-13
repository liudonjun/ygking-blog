---
title: 图片懒加载实现原理
date: 2022/11/06
tags:
  - Js
  - Vue
categories:
  - 进阶
---

## 原理

一张图片就是一个 img 标签，浏览器是否发起请求图片是根据 img 的 src 属性，所以实现懒加载的关键就是，在图片没有进入可视区域时，先不给 img src 赋值，这样浏览器就不会发送请求了，等到图片进入可视区域再给 src 赋值。

## 旧的解决方案

检测元素的可视状态或者两个元素的相对可视状态都不是容易的事情，大部分解决办法并不是完全可靠的，实现方式非常的丑陋，也极易拖慢整个网站的性能

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>图片懒加载</title>
    <style>
      .box {
        margin-top: 1000px;
        display: flex;
        flex-direction: column;
      }
      img {
        width: 200px;
        height: 200px;
        margin-bottom: 100px;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <img
        class="loadImg"
        data-img="https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4wqGK?ver=47a4"
        alt=""
      />
      <img
        class="loadImg"
        data-img="https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4wqGK?ver=47a4"
        alt=""
      />
      <img
        class="loadImg"
        data-img="https://ts1.cn.mm.bing.net/th?id=ORMS.a9bab2d2c4d0d7eef2a7962c5683cce1&pid=Wdp&w=612&h=304&qlt=90&c=1&rs=1&dpr=1.25&p=0"
        alt=""
      />
    </div>

    <script>
      let index = 0;
      const imgList = document.querySelectorAll(".loadImg");

      // 懒加载函数
      function lazyload() {
        // 获取可视区域高度
        const viewPortHeight =
          window.innerHeight || document.documentElement.clientHeight;

        for (let i = 0; i < imgList.length; i++) {
          // 可视区域高度减去 图片距离可视区域的高度
          const distance =
            viewPortHeight - imgList[i].getBoundingClientRect().top;
          // 如果大于0说明图片已经出现在可视区域当中
          if (distance >= 0) {
            // 给图片赋予真实的值
            imgList[i].src = imgList[i].dataset.img;
            index = i + 1;
          }
        }
      }

      // 节流函数||防抖函数
      function debounce(fn, delay = 500) {
        let timer = null;
        return function (...args) {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            fn.apply(this, args);
          }, delay);
        };
      }

      window.addEventListener("scroll", debounce(lazyload, 600));

      window.addEventListener("resize", debounce(lazyload, 600));
    </script>
  </body>
</html>
```

## 更好的解决方案

IntersectionObserver 接口（从属于 Intersection Observer API）提供了一种异步观察目标元素与其祖先元素或顶级文档视口（viewport）交叉状态的方法。其祖先元素或视口被称为根（root）。 但是存在一些[浏览器兼容性](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7)问题

[https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>图片懒加载2</title>
    <style>
      .box {
        margin-top: 1000px;
        display: flex;
        flex-direction: column;
      }
      img {
        width: 200px;
        height: 200px;
        margin-bottom: 100px;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <img
        class="loadImg"
        data-img="https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4wqGK?ver=47a4"
        alt=""
      />
      <img
        class="loadImg"
        data-img="https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4wqGK?ver=47a4"
        alt=""
      />
      <img
        class="loadImg"
        data-img="https://ts1.cn.mm.bing.net/th?id=ORMS.a9bab2d2c4d0d7eef2a7962c5683cce1&pid=Wdp&w=612&h=304&qlt=90&c=1&rs=1&dpr=1.25&p=0"
        alt=""
      />
    </div>

    <script>
      function Observer() {
        //得到所有的图片
        const imgList = document.querySelectorAll(".loadImg");
        // 创建一个新的 IntersectionObserver 对象，当其监听到目标元素的可见部分（的比例）超过了一个或多个阈值（threshold）时，会执行指定的回调函数。
        let observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((item) => {
              // 返回一个布尔值，如果目标元素与交叉区域观察者对象 (intersection observer) 的根相交
              if (item.isIntersecting) {
                //加载图片,把data-img的值放到src
                item.target.src = item.target.dataset.img;
                // 停止监听已经开始加载的图片
                observer.unobserve(item.target);
              }
            });
          },
          {
            rootMargin: "0px 0px -100px 0px", //交叉视图超过 100px 才开始派发事件
          }
        );
        imgList.forEach((item) => observer.observe(item));
      }

      Observer();
    </script>
  </body>
</html>
```

## 实现懒加载自定义指令 v-lazy

需要了解[自定义指令](https://v2.cn.vuejs.org/v2/guide/custom-directive.html)的知识 ,第一个参数为之定义指令的名称，不需要带 v-。下面是勾子函数的简单介绍

```js
Vue.directive('指令名',{
   bind(){},//只调用一次，指令第一次绑定到HTML元素时调用。在这里可以进行一次性的初始化设置。
   inserted(){},//当指令绑定的元素插入到父节点中的时候触发。
   update(){},//当指令绑定的元素状态/样式、内容(这里指元素绑定的 vue 数据) 发生改变时触发。
   componentUpdated(){},//当 update() 执行完毕之后触发。
   unbind()//只调用一次，指令与元素解绑时调用。
})
```

了解之后让我们简单实现一下这个自定义指令 v-lazy

```js
Vue.directive("lazy", {
  inserted(el, binding) {
    //定义一个观察器，entries为状态改变元素的数组
    let observer = new IntersectionObserver((entries) => {
      // 遍历
      for (let i of entries) {
        // 如果改元素处于可视区
        if (i.isIntersecting > 0) {
          // 获取该元素
          let img = i.target;
          // 重新设置src值
          img.src = binding.value;
          //取消对该元素的观察
          observer.unobserve(img);
        }
      }
    });
    // 为 img 标签添加一个观察
    observer.observe(el);
  },
});
```
