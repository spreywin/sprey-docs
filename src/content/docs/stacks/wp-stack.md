---
title: Sprey WP Stack
description: Production-oriented WordPress and WooCommerce stack for a modest VPS.
---

Sprey WP Stack is a compact Docker Compose deployment for WordPress and WooCommerce. It is intentionally a **website stack, not a server control panel**.

Repository: <a class="github-repository-badge" href="https://github.com/spreywin/sprey-wp-stack" target="_blank" rel="noopener noreferrer">spreywin/sprey-wp-stack</a>

## Components

- Caddy as the only public web service.
- WordPress with Apache and PHP 8.4.
- WooCommerce-ready application layer.
- MariaDB LTS on a private Docker network.
- Optional phpMyAdmin profile bound to localhost only.
- UFW configured by the installer for SSH, HTTP, HTTPS, and HTTP/3.

## Quick start

<div class="quick-start-terminal">
<div class="quick-start-terminal-bar" aria-hidden="true"><span></span><span></span><span></span></div>

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

</div>

## Architecture

```text
Internet
   │
   ▼
Cloudflare Worker
   ├── failure ──> sprey-outage.pages.dev
   │
   ▼ healthy
Caddy :80/:443
   │
   ▼
WordPress + WooCommerce
   │
   ▼
MariaDB LTS
```

WordPress and MariaDB remain behind Docker networking. phpMyAdmin is disabled by default and is intended for temporary local access over an SSH tunnel.

## BTCPay

BTCPay Server is **not** part of the WordPress stack. WooCommerce connects to separate BTCPay infrastructure using the current BTCPay for WooCommerce V2 integration.

A reproducible integration guide will live under **Integrations**, so it can be reused by any Sprey storefront stack without coupling BTCPay Server to WordPress.

## Cloudflare

Cloudflare production settings and static outage failover are part of v1. A Workers Route on `sprey.win/*` places the Cloudflare Worker before the primary WordPress VPS. The Worker forwards every request to primary and uses `sprey-outage.pages.dev` after a network error, bounded timeout, or selected `502/503/504`. It tries primary again on every new request, so recovery does not require a DNS change.

This is request-time failover on the Workers Free plan, not Cloudflare Load Balancing or an independent periodic health monitor. Dynamic WooCommerce routes must not be treated as static cache content. The outage page is an informational `503` response, not a live store: cart, checkout, accounts, orders, sessions, and payments require WordPress.

Follow [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/) for a test-hostname-first rollout. Use [WP Stack failover operations](/operations/wp-stack-failover/) for validation, incident response, and rollback.

## Operations

Common commands:

```bash
docker compose ps
docker compose logs -f caddy
docker compose pull && docker compose up -d
```

Back up MariaDB and WordPress uploads before upgrades. Never run `docker compose down -v` on a production deployment unless permanent volume deletion is explicitly intended.

For the edge path, monitor Worker exceptions, timeouts, fallback response counts, and Free-plan usage. A fallback response reports a failed request to primary; it is not by itself proof that every service on the VPS is down.
