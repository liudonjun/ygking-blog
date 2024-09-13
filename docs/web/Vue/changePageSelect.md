---
title: Vue 中使用 a-table 实现跨页勾选
date: 2022/11/24
tags:
  - Vue
  - Js
categories:
  - 进阶
---

## 场景介绍

需要跨页统计数据金额，前端请求一页 10 条，并区分是支出还是收入，使用 ant-design-vue 组件库的 table 组件
查看组件 api 有看见所需钩子函数

| **onSelect**    | 用户手动选择/取消选择某列的回调   | Function(record, selected, selectedRows, nativeEvent) |
| --------------- | --------------------------------- | ----------------------------------------------------- |
| **onSelectAll** | 用户手动选择/取消选择所有列的回调 | Function(selected, selectedRows, changeRows)          |

### 根据钩子函数分析所需条件

- 勾选还是取消勾选
- 一键全选还是一键全部取消
- 区分收入还是支出
- 单条勾选或取消的下标

### template

```vue
<template>
  <a-table
    :loading="tableLoading"
    :row-selection="{
        selectedRowKeys: selectedRowKeys,
        onSelectAll: onSelectAll,
        onSelect: onSelectItemChange,
        onChange: onSelectChange
    }"
    :columns="columns"
    :data-source="data"
    :pagination="false"
    bordered
    rowKey="id"
    />
</tempalte>
```

### script

```js
data(){
  return{
    // 跨页勾选所需
    tableSelectArray: [],
    // 勾选还是取消勾选
    hasTableSelect: true,
  }
},
// 计算属性
computed:{
	// 勾选数据总金额
    tickPrice() {
      return this.tableSelectArray.reduce((prev, next) => {
        let str = next.financeType === 'pay' ? '-' : '+'
        return prev + parseFloat(str + next.amount)
      }, 0)
    },
}
```

```js
// 用户手动选择取消选择某列的回调
// 用户手动选择取消选择某列的回调
onSelectItemChange(item, flag) {
  if (this.hasTableSelect) {
    this.tableSelectArray.push(item)
  } else {
    let index = this.tableSelectArray.findIndex(arr => arr.id === item.id)
    this.tableSelectArray.splice(index, 1)
  }
},
// 用户手动选择取消选择所有列的回调
onSelectAll(selected, selectedRows, changeRows) {
  if (this.hasTableSelect) {
    this.tableSelectArray.push(...selectedRows)
    // unique 去重函数  根据id去重
    this.tableSelectArray = unique(this.tableSelectArray, 'id')
  } else {
    changeRows.forEach(item => {
      let index = this.tableSelectArray.findIndex(arr => arr.id === item.id)
      this.tableSelectArray.splice(index, 1)
    })
  }
},
```

### utils

```javascript
/**
 * 数组对象根据指定key 去重
 * @param {*} list
 * @param {*} key
 * @returns
 */
export function unique(list, key = "companyCode") {
  let obj = {};
  let result = list.reduce((cur, next) => {
    obj[next[key]] ? "" : (obj[next[key]] = true && cur.push(next));
    return cur;
  }, []);
  return result;
}
```


