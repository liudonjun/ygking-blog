---
title: 部署一个node应用
date: 2022/8/03
tags:
  - Node
categories:
  - 进阶
---

### 工具的基本使用与选择 forever 和 pm2

forever 则可以在或连接断开时,让项目一直运行,而且可以在项目崩溃时自动重启 cmd

```powershell
安装 npm install -g forever
forever的帮助手册 forever --help
使用启动项目 foreverforever start app.js
使用停止项目 foreverforever stop app.js
列出所有通过管理的项目 foreverforever list
监视项目中的文件,当文件有变动时重启项目 forever -w start app.js
```

pm2 功能较为丰富

```powershell
运行pm2 start app.js
查看运行状态 pm2 list
追踪资源运行情况 pm2 monit
查看日志 pm2 logs
重启应用 pm2 restart appId
停止应用 pm2 stop app.js
开启访问 apipm2 web
```
