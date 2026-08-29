import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://spreywin.github.io',
  base: '/sprey-docs',
  integrations: [
    starlight({
      title: 'Sprey Docs',
      description: 'Canonical technical documentation for Sprey products, deployable stacks, integrations, architecture, and operations.',
      locales: {
        root: { label: 'English', lang: 'en' },
        ru: { label: 'Русский', lang: 'ru' },
        kk: { label: 'Қазақша', lang: 'kk' },
        de: { label: 'Deutsch', lang: 'de' },
        es: { label: 'Español', lang: 'es' },
        fr: { label: 'Français', lang: 'fr' },
        pt: { label: 'Português', lang: 'pt' },
        tr: { label: 'Türkçe', lang: 'tr' },
        'zh-cn': { label: '简体中文', lang: 'zh-CN' },
        ja: { label: '日本語', lang: 'ja' },
        ko: { label: '한국어', lang: 'ko' },
        ar: { label: 'العربية', lang: 'ar', dir: 'rtl' },
      },
      social: {
        github: 'https://github.com/spreywin',
      },
      editLink: {
        baseUrl: 'https://github.com/spreywin/sprey-docs/edit/main/',
      },
      sidebar: [
        { label: 'Architecture', autogenerate: { directory: 'architecture' } },
        { label: 'Products', autogenerate: { directory: 'products' } },
        { label: 'Stacks', autogenerate: { directory: 'stacks' } },
        { label: 'Integrations', autogenerate: { directory: 'integrations' } },
        { label: 'Operations', autogenerate: { directory: 'operations' } },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
