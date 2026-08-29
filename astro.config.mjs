import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.sprey.win',
  integrations: [
    starlight({
      title: 'Sprey Docs',
      description: 'Canonical technical documentation for Sprey products, deployable stacks, integrations, architecture, and operations.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/spreywin' },
      ],
      head: [
        {
          tag: 'script',
          content: "window.gtranslateSettings={default_language:'en',native_language_names:true,wrapper_selector:'.gtranslate_wrapper',flag_size:24,flag_style:'3d'};",
        },
        {
          tag: 'script',
          attrs: {
            src: 'https://cdn.gtranslate.net/widgets/latest/popup.js',
            defer: true,
          },
        },
      ],
      components: {
        SocialIcons: './src/components/GTranslateSocial.astro',
      },
      editLink: {
        baseUrl: 'https://github.com/spreywin/sprey-docs/edit/main/',
      },
      sidebar: [
        { label: 'Architecture', items: [{ autogenerate: { directory: 'architecture' } }] },
        { label: 'Products', items: [{ autogenerate: { directory: 'products' } }] },
        { label: 'Stacks', items: [{ autogenerate: { directory: 'stacks' } }] },
        { label: 'Integrations', items: [{ autogenerate: { directory: 'integrations' } }] },
        { label: 'Operations', items: [{ autogenerate: { directory: 'operations' } }] },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
