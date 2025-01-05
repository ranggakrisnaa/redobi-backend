import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { searchPlugin } from '@vuepress/plugin-search'

export default defineUserConfig({
  bundler: viteBundler(),
  theme: defaultTheme({
    navbar: [
      { text: 'Home', link: '/' },
      {
        text: 'Guide',
        children: [
          { text: 'Introduction', link: '/guide/introduction/' },
          { text: 'Getting Started', link: '/guide/getting-started/' },
          { text: 'Advanced', link: '/guide/advanced/' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Guide',
        children: [
          {text: 'introduction',link:'/guide/getting-started' },
        ],
      },
    ],
  }),
  plugins: [
    searchPlugin({
      locales: {
        '/': {
          placeholder: 'Search...',
        },
      },
      maxSuggestions: 10, 
      hotKeys: ['s', '/'],
    }),
  ],
  lang: 'en-US',
  title: 'ReDobi Docs',
  description: 'Just playing around',
})
