import { defineConfig } from 'vitepress'

export default defineConfig({
  // Site metadata
  title: 'X-Skynet',
  description:
    'Open-source AI agent orchestration framework — from zero to your first running agent in 15 minutes.',
  lang: 'en-US',
  base: '/',

  // Head tags
  head: [
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'X-Skynet Docs' }],
    ['meta', { property: 'og:description', content: 'AI agent orchestration made simple.' }],
  ],

  // Theming
  appearance: 'dark',

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'X-Skynet',

    // ── Top navigation bar ───────────────────────────────────────────────────
    nav: [
      { text: 'Quick Start', link: '/docs/quickstart' },
      { text: 'Demo', link: '/docs/demo' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/core' },
      { text: 'Changelog', link: 'https://github.com/ds0857/x-skynet/releases' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/ds0857/x-skynet/releases' },
          { text: 'Contributing', link: 'https://github.com/ds0857/x-skynet/blob/main/CONTRIBUTING.md' },
        ],
      },
    ],

    // ── Sidebar ───────────────────────────────────────────────────────────────
    sidebar: {
      '/docs/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quick Start (5 steps)', link: '/docs/quickstart' },
            { text: 'Demo Scenarios', link: '/docs/demo' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/concepts' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Plugins',
          items: [
            { text: 'Shell Plugin', link: '/guide/plugins/shell' },
            { text: 'HTTP Plugin', link: '/guide/plugins/http' },
            { text: 'Claude Plugin', link: '/guide/plugins/claude' },
          ],
          collapsed: true,
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: '@xskynet/core', link: '/api/core' },
            { text: '@xskynet/contracts', link: '/api/contracts' },
            { text: '@xskynet/cli', link: '/api/cli' },
          ],
        },
      ],
    },

    // ── Social links ─────────────────────────────────────────────────────────
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ds0857/x-skynet' },
    ],

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2026 X-Skynet Contributors',
    },

    // ── Search ───────────────────────────────────────────────────────────────
    search: {
      provider: 'local',
    },

    // ── Edit link ────────────────────────────────────────────────────────────
    editLink: {
      pattern: 'https://github.com/ds0857/x-skynet/edit/main/docs/site/:path',
      text: 'Edit this page on GitHub',
    },

    // ── Last updated ─────────────────────────────────────────────────────────
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium',
      },
    },

    // ── Doc outline ──────────────────────────────────────────────────────────
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
  },

  // Markdown extensions
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: true,
  },
})
