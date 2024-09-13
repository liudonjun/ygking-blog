---
title: git 教程
date: 2022/04/25
tags:
  - git
categories:
  - 基础
---

## 介绍

[Git](https://git-scm.com/)是一个开源的分布式版本控制系统，用于敏捷高效地处理任何或小或大的项目。简单来讲就是代码管理工具,安装挺简单的傻瓜式安装，以下介绍常用命令并不是全部命令

## 常用命令以及描述

```bash
# git init  初始化仓库git仓库
git init
# git add . 添加文件到暂存区
git add .
# git add filePath
git add file/index.html
# git status 查看仓库当前的状态，显示有变更的文件。
git status
# git reset  回退版本。 谨慎操作👍
git reset
# git log  查看历史提交记录
git log
# git push 上传远程代码并合并
git push
# git pull 下载远程代码并合并
git pull
```

## 分支

分支(branch)一个分支代表一条独立的开发线。 使用分支意味着你可以从开发主线上分离开来，然后在不影响主线的同时继续工作,下面介绍分支的常用操作

```bash
# git branch 列出你在本地的分支
git branch
# git branch branchName 创建分支
git branch develop
# git checkout branchName 切换分支
git checkout develop
# git push origin branchName 推送本地分支到远程
git push origin develop
# git branch -d branchName 删除分支
git branch -d develop
# git merge branchName 将改分支代码合并到当前所在分支
git merge  develop
```

## 标签

发布一个版本时，我们通常先在版本库中打一个标签（tag），这样就唯一确定了打标签时刻的版本。将来无论什么时候，取某个标签的版本，就是把那个打标签的时刻的历史版本取出来。

```bash
# git tag 列出已有的标签
git tag
# git show tagName 查看标签提交信息
git show v1.0.0
# git tag -a tagName 提交版本号 -m 附注信息  创建标签
git tag -a v1.0.0 -m "正式版本1.0.0"
# git tag -d tagName 删除标签
git tag -d v1.0.0
# git push origin tagName 将指定的标签上传到远程仓库
git push origin v1.0.0
# git push origin --tags 将所有不在远程仓库中的标签上传到远程仓库
git push origin --tags
# git branch newBranchName tagName 根据标签创建分支
git branch develop_01 v1.0.0
```
