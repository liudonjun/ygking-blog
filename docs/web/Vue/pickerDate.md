---
title: Vue 中使用 a-range-picker 限制时间跨度
date: 2023/01/06
tags:
  - Vue
  - Js
  - Ant Design Vue
categories:
  - 进阶
---

## 应用场景 需要限制所选的时间跨度 区间

[DatePicker 日期选择框](https://1x.antdv.com/components/date-picker-cn/)组件

所需函数

| **calendarChange** | 待选日期发生变化的回调 | function(dates: [moment, moment]                   | [string, string], dateStrings: [string, string]) |
| ------------------ | ---------------------- | -------------------------------------------------- | ------------------------------------------------ |
| **disabledTime**   | 不可选择的时间         | function(dates: [moment, moment], partial: 'start' | 'end')                                           |

## 逻辑梳理

先获取第一个时间区间的第一个值，待选日期发生变化的回调 calendarChange，可以拿到第一个选择的时间，再根据时间去禁用剔除出去的区间
disabledTime，这里需要用到[moment](http://momentjs.cn/)库

## 业务代码

```html
<a-range-picker
  v-model="createTime"
  :disabled-date="disabledDate"
  @calendarChange="onCalendarChange"
  :show-time="{
    format: 'HH:mm:ss',
    defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')]
    }"
  format="YYYY-MM-DD HH:mm:ss"
  :placeholder="['Start Time', 'End Time']"
  @change="createChange"
/>
```

```js

onCalendarChange(obtain) {
    // 获取手动选择的时间段起始值
    this.disabledCurrentTime = obtain[0]
},
// 限制时间跨度 三个月 以及当天之后的日期
disabledDate(current) {
    return (
    current > moment('23:59:59', 'HH:mm:ss') ||
    current <
        moment(this.disabledCurrentTime)
        .subtract(3, 'M')
        .startOf('day') ||
    current >
        moment(this.disabledCurrentTime)
        .add(3, 'M')
        .endOf('day')
    )
},
```

