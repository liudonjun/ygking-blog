import { defineConfig } from 'vitepress'
import { La51Plugin } from 'vitepress-plugin-51la'
// 导入主题的配置
import { blogTheme } from './blog-theme'

// 如果使用 GitHub/Gitee Pages 等公共平台部署
// 通常需要修改 base 路径，通常为“/仓库名/”
// 如果项目名已经为 name.github.io 域名，则不需要修改！
// const base = process.env.GITHUB_ACTIONS === 'true'
//   ? '/vitepress-blog-sugar-template/'
//   : '/'

// Vitepress 默认配置
// 详见文档：https://vitepress.dev/reference/site-config
export default defineConfig({
  // 继承博客主题(@sugarat/theme)
  extends: blogTheme,
  // base,
  lang: 'zh-cn',
  title: 'YGKing',
  description: '一个专注于Flutter、Dart和前端技术分享的个人博客',
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'baidu-site-verification', content: 'codeva-2BEYQl0Izf' }],
    ['meta', { name: 'msvalidate.01', content: '94C3F93FA347A05C86B2F46328D8F1A4' }],
    ['meta', { 'http-equiv': 'Content-Type', content: 'text/html;charset=gb2312' }],
    ['meta', { name: 'sogou_site_verification', content: 'EFlcWp0ITr' }],
    ['meta', { name: 'shenma-site-verification', content: '6dbb8595e0cf10ac2b313c2729ed8f16_1742351733' }],
    ['meta', { name: 'bytedance-verification-code', content: '3CuOfmNim2orEW8D6w1C' }],
    ['meta', { name: '360-site-verification', content: 'd6d1d97c9ea6c907c0007bf42e6d1577' }],
    ['meta', { name: 'keywords', content: 'Flutter,Dart,前端开发,技术博客,YGKing,移动应用开发,跨平台开发,软件工程' }],
    ['meta', { name: 'author', content: 'YGKing' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['link', { rel: 'canonical', href: 'https://ygking.cn' }],
    ['meta', { property: 'og:title', content: 'YGKing的个人博客' }],
    ['meta', { property: 'og:description', content: '一个专注于Flutter、Dart和前端技术分享的个人博客，提供移动应用开发、跨平台开发等技术分享' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://ygking.cn' }],
    ['meta', { property: 'og:image', content: '/logo.jpg' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'YGKing的个人博客' }],
    ['meta', { name: 'twitter:description', content: '一个专注于Flutter、Dart和前端技术分享的个人博客，提供移动应用开发、跨平台开发等技术分享' }],
    ['meta', { name: 'twitter:image', content: '/logo.jpg' }],
    ['script', {
      async: 'async',
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9698370041410113',
      crossorigin: 'anonymous'
    }],
    ['script', { type: 'application/ld+json' }, `{
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "YGKing的个人博客",
      "description": "一个专注于Flutter、Dart和前端技术分享的个人博客",
      "url": "https://ygking.cn",
      "author": {
        "@type": "Person",
        "name": "YGKing"
      }
    }`]
  ],
  vite: {
    plugins: [
      La51Plugin({
        id: '3JzYYf32HFpoNV8h',
        ck: '3JzYYf32HFpoNV8h'
      })
    ]
  },
  themeConfig: {
    // 展示 2,3 级标题在目录中
    outline: {
      level: [2, 3],
      label: '目录'
    },
    // 默认文案修改
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '相关文章',
    lastUpdatedText: '上次更新于',

    // 设置logo
    logo: '/logo.jpg',
    editLink: {
      pattern:
        'https://github.com/liudonjun/ygking-blog/tree/master/docs/:path',
      text: '去 GitHub 上编辑内容'
    },
    nav: [
      { text: '首页', link: '/' },
      {
        text: '工具',
        items: [
          {
            text: 'pub.dev',
            link: 'https://pub.dev/'
          },
          {
            text: 'tinify',
            link: 'https://tinify.cn/'
          },
          {
            text: 'remove bg',
            link: 'https://www.remove.bg/zh'
          },
          {
            text: 'uupoop',
            link: 'https://www.uupoop.com/#/'
          }
        ]
      },
      {
        text: '作品', items: [
          {
            text: 'wallpaper',
            link: 'http://wallpaper.ygking.cn/'
          },
          {
            text: 'json to dart',
            link: 'https://model.ygking.cn/'
          },
        ]
      },
      { text: '网站地图', link: '/sitemap' },
      { text: '留言板', link: '/msgboard' },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/liudonjun'
      }
    ]
  },
})
