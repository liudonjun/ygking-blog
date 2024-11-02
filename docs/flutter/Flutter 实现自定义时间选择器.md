---
title: Flutter 实现自定义时间选择器
description: 在 Flutter 中，时间选择器是应用程序中常见的组件之一。尽管 Flutter 提供了内置的时间选择器，但有时我们需要实现一个更加个性化的自定义时间选择器。在这篇文章中，我们将使用 ListWheelScrollView 组件来实现一个自定义的时间选择器。
tag:
 - Dart
 - Flutter
# top: 1
sidebar: true
---

# Flutter 实现自定义时间选择器

在 Flutter 中，时间选择器是应用程序中常见的组件之一。尽管 Flutter 提供了内置的时间选择器，但有时我们需要实现一个更加个性化的自定义时间选择器。在这篇文章中，我们将使用 ListWheelScrollView 组件来实现一个自定义的时间选择器。


## 效果

<img src="/gif/CustomTimePickerBottomSheet.gif" style="margin: 0 0;" alt="描述"  />


## ListWheelScrollView

`ListWheelScrollView` 是一个用于创建滚动列表的组件，具有旋转效果，适合用于选择器、转盘等场景。通过 `ListWheelScrollView`，我们可以轻松实现一个既美观又实用的自定义时间选择器。

``` dart
/// 构造函数
ListWheelScrollView ListWheelScrollView({
  Key? key,
  ScrollController? controller, // 控制器
  ScrollPhysics? physics, // 滚动物理效果
  double diameterRatio = RenderListWheelViewport.defaultDiameterRatio, // 直径比例
  double perspective = RenderListWheelViewport.defaultPerspective, // 透视比例
  double offAxisFraction = 0.0, // 偏移量
  bool useMagnifier = false, // 是否使用放大镜
  double magnification = 1.0, // 放大倍数
  double overAndUnderCenterOpacity = 1.0, // 中心透明度
  required double itemExtent, // 每个子项的宽度
  double squeeze = 1.0, // 挤压比例
  void Function(int)? onSelectedItemChanged, // 选中项改变回调
  bool renderChildrenOutsideViewport = false, // 是否渲染超出视图的子项
  Clip clipBehavior = Clip.hardEdge, // 裁剪行为
  String? restorationId,
  ScrollBehavior? scrollBehavior,
  required List<Widget> children,
})


/// 使用useDelegate 构建
ListWheelScrollView.useDelegate(
  controller: controller, // 控制器
  perspective: 0.01, // 透视比例
  itemExtent: 50, // 每个子项的宽度
  onSelectedItemChanged: onSelectedItemChanged, // 选中项改变回调
  physics: const FixedExtentScrollPhysics(), // 滚动物理效果
  childDelegate: ListWheelChildBuilderDelegate(
    builder: itemBuilder,
    childCount: itemCount,
  ),
)
```

## useDelegate 构建的 ListWheelScrollView 的子项

`ListWheelChildBuilderDelegate` 是一个用于构建 `ListWheelScrollView` 子项的委托类。通过 `ListWheelChildBuilderDelegate`，我们可以灵活地定义每个子项的内容，从而实现更加复杂和个性化的选择器。


子项通过container 来构建

```dart
/// 构建子项  
Widget _buildItem(String value, bool isSelected) {
  return Container(
    alignment: Alignment.center,
    child: Text(
      value,
      style: TextStyle(
        color: isSelected
            ? const Color.fromRGBO(28, 7, 57, 0.80)
            : const Color.fromRGBO(28, 7, 57, 0.50),
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    ),
  );
}
```


生成时间

```dart
/// 生成年
List<int> generateYears() {
  return List.generate(100, (index) => DateTime.now().year - index);
}

/// 生成月
List<int> generateMonths() {
  return List.generate(12, (index) => index + 1);
}

/// 生成天  
List<int> generateDays() {
  int daysInMonth = DateTime(selectedYear, selectedMonth + 1, 0).day;
  return List.generate(daysInMonth, (index) => index + 1);
}
```


``` dart
/// 构造函数
ListWheelChildBuilderDelegate ListWheelChildBuilderDelegate({
  required Widget Function(BuildContext, int) builder, // 构建函数
  int? childCount, // 子项数量
})

final yearController = FixedExtentScrollController(); // 年控制器 
final monthController = FixedExtentScrollController(); // 月控制器
final dayController = FixedExtentScrollController(); // 天控制器

/// 生成天
Widget _buildDayPicker() {
  return _buildPicker(
    controller: controller.dayController,
    itemCount: controller.generateDays().length,
    itemBuilder: (context, index) {
      final day = controller.generateDays()[index];
      return _buildItem(day.toString(), day == controller.selectedDay);
    },
    onSelectedItemChanged: (index) {
      controller.selectedDay = controller.generateDays()[index];
      controller.onDateChanged();
    },
  );
}

/// 生成年
Widget _buildYearPicker() {
  return _buildPicker(
    controller: controller.yearController,
    itemCount: controller.generateYears().length,
  );
}


/// 生成边框
Widget _buildPickerBorder({double? top, double? bottom}) {
return Positioned(
  top: top,
  bottom: bottom,
  left: 0,
  right: 0,
  child: Container(
    height: .5.w,
    color: const Color.fromRGBO(202, 177, 255, 1),
  ),
);
```
## 关键布局代码

```dart
  Widget _buildDatePicker() {
    return SizedBox(
      height: 130,
      child: Stack(
        children: [
          _buildPickerBorder(top: 40),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(child: _buildYearPicker()),
              Expanded(child: _buildMonthPicker()),
              Expanded(child: _buildDayPicker()),
            ],
          ),
          _buildPickerBorder(bottom: 40),
        ],
      ),
    );
  }
```