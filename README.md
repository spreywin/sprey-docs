# Sprey Docs

[![Documentation](https://img.shields.io/badge/docs-docs.sprey.win-0b1120)](https://docs.sprey.win)
[![GitHub Pages](https://img.shields.io/badge/hosting-GitHub%20Pages-222)](https://pages.github.com/)
[![Astro Starlight](https://img.shields.io/badge/framework-Astro%20Starlight-BC52EE)](https://starlight.astro.build/)

**Sprey Docs** is the canonical technical documentation portal for Sprey products, deployable stacks, integrations, architecture, and operations.

The documentation is designed to be fully static and hosted on GitHub Pages. No dedicated documentation server, database, or control panel is required.

## Scope

The portal is structured around five long-lived areas:

- **Architecture** — platform map, domains, service boundaries, and roadmap.
- **Products** — Sprey Processing, Sprey RPC, Sprey VPN, and future services.
- **Stacks** — reproducible deployment stacks such as Sprey WP Stack and future BTCPay, RPC, and VPN stacks.
- **Integrations** — BTCPay + WooCommerce, Cloudflare, webhooks, and related integrations.
- **Operations** — deployment, security, backups, updates, monitoring, and recovery.

## Platform principles

- Documentation source and publishing stay on GitHub.
- GitHub Actions builds the static site and GitHub Pages serves it.
- `docs.sprey.win` is the canonical public hostname.
- English is the canonical source language; additional locales are supported through Starlight i18n.
- Light, dark, and automatic system themes are supported.
- The portal must remain responsive across desktop, tablet, and mobile devices.
- Planned functionality is explicitly marked as planned and is never presented as already deployed.
- Product documentation is separated from stack implementation repositories.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Repository relationship

This repository owns the shared Sprey documentation portal. Individual stack repositories remain focused on their implementation and link back to the corresponding section in this portal.

Example:

- [`spreywin/sprey-wp-stack`](https://github.com/spreywin/sprey-wp-stack) → `docs.sprey.win/stacks/wp-stack/`

Public WP Stack landing: [wp-stack.sprey.win](https://wp-stack.sprey.win/)

Follow Sprey on [X](https://x.com/SpreyWin) and [Telegram](https://t.me/SpreyWin).

## Status

Initial portal migration and Starlight setup are in progress.

---

© 2026 Sprey
