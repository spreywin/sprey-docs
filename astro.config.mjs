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
          content: "window.gtranslateSettings={default_language:'en',native_language_names:true,wrapper_selector:'.gtranslate_wrapper',flag_style:'3d',switcher_text_color:'#f3e8ff',switcher_arrow_color:'#c4b5fd',switcher_border_color:'#3b2763',switcher_background_color:'#171022',switcher_background_shadow_color:'#0c0712',switcher_background_hover_color:'#241735',dropdown_text_color:'#f5f3ff',dropdown_hover_color:'#33204c',dropdown_background_color:'#120b1b'};",
        },
        {
          tag: 'script',
          attrs: {
            src: 'https://cdn.gtranslate.net/widgets/latest/dwf.js',
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
