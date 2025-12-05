// 主题独有配置
import { getThemeConfig } from '@sugarat/theme/node'

// 开启RSS支持（RSS配置）
// import type { Theme } from '@sugarat/theme'

// const baseUrl = 'https://ygking.cn'
// const RSS: Theme.RSSOptions = {
//   title: 'YGKing',
//   baseUrl,
//   copyright: 'Copyright (c) 2018-present, YGKing',
//   description: '一个专注于Flutter、Dart和前端技术分享的个人博客',
//   language: 'zh-cn',
//   image: 'https://ygking.cn/logo.jpg',
//   favicon: 'https://ygking.cn/favicon.ico',
// }

// 所有配置项，详见文档: https://theme.sugarat.top/
const blogTheme = getThemeConfig({
  // 开启RSS支持
  // RSS,

  // 搜索
  // 默认开启pagefind离线的全文搜索支持（如使用其它的可以设置为false）
  // search: false,

  // markdown 图表支持（会增加一定的构建耗时）
  // mermaid: true
  // 是否开启深色模式过渡动画
  darkTransition: true,

  // 页脚
  footer: {
    version: false,
    // message 字段支持配置为HTML内容，配置多条可以配置为数组
    // message: '下面 的内容和图标都是可以修改的噢（当然本条内容也是可以隐藏的）',
    message: [  // 使用数组实现多条消息轮播或展示
      `<div style="text-align:center;">
         🎉 感谢您的访问！ 欢迎订阅我的最新内容。
       </div>`
    ],
    copyright: `Copyright YGJoon 2022 - ${new Date().getFullYear()}`,
    icpRecord: {
      name: '湘ICP备2020023751号-1',
      link: 'https://beian.miit.gov.cn/'
    },
    // securityRecord: {
    //   name: '公网安备xxxxx',
    //   link: 'https://www.beian.gov.cn/portal/index.do'
    // },
  },

  // 主题色修改
  themeColor: 'el-blue',

  // 文章默认作者
  author: 'YGKing',

  // 友链
  friend: [
    // {
    //   nickname: 'Mrack',
    //   des: "Mrack's Blog",
    //   avatar:
    //     'https://blog.mrack.cn/img/tx.jpg',
    //   url: 'https://blog.mrack.cn/',
    // },
    {
      nickname: '随风',
      des: "随风's Blog",
      avatar:
        'https://blog.suifeng1.cn/logo.png',
      url: 'https://blog.suifeng1.cn/',
    },
    // {
    //   nickname: 'Vitepress',
    //   des: 'Vite & Vue Powered Static Site Generator',
    //   avatar:
    //     'https://vitepress.dev/vitepress-logo-large.webp',
    //   url: 'https://vitepress.dev/',
    // },
  ],

  buttonAfterArticle: {
    openTitle: '投"币"支持',
    closeTitle: '下次一定',
    content: '<img src="https://ldjun-nest.oss-cn-shenzhen.aliyuncs.com/pay.jpg">',
    icon: 'wechatPay'
  },

  comment: {
    repo: 'liudonjun/ygking-blog',
    repoId: 'R_kgDOMxPqFg',
    category: 'Announcements',
    categoryId: 'DIC_kwDOMxPqFs4CjVuR',
    inputPosition: 'top',
  },

  // 公告
  popover: {
    title: '公告',
    body: [
      { type: 'text', content: '👇欢迎大家关注公众号&私信交流👇' },
      {
        type: 'image',
        src: '/mini-geek.png'
      },
      // {
      //   type: 'text',
      //   content: '欢迎大家关注公众号&私信交流'
      // },
      // {
      //   type: 'text',
      //   content: '文章首/文尾有群二维码',
      //   style: 'padding-top:0'
      // },
      // {
      //   type: 'button',
      //   content: '作者博客',
      //   link: 'https://sugarat.top'
      // },
      // {
      //   type: 'button',
      //   content: '加群交流',
      //   props: {
      //     type: 'success'
      //   },
      //   link: 'https://theme.sugarat.top/group.html',
      // }
    ],
    duration: 0
  },
})

export { blogTheme }
