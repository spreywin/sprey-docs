---
title: Sprey WP Stack
description: Production-oriented WordPress and WooCommerce stack for a modest VPS.
---

# Sprey WP Stack

Sprey WP Stack is a compact Docker Compose deployment for WordPress and WooCommerce. It is intentionally a **website stack, not a server control panel**.

Repository: [`spreywin/sprey-wp-stack`](https://github.com/spreywin/sprey-wp-stack)

## Components

- Caddy as the only public web service.
- WordPress with Apache and PHP 8.4.
- WooCommerce-ready application layer.
- MariaDB LTS on a private Docker network.
- Optional phpMyAdmin profile bound to localhost only.
- UFW configured by the installer for SSH, HTTP, HTTPS, and HTTP/3.

## Quick start

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

## Architecture

```text
Internet
   │
   ▼
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

Cloudflare production settings and static outage failover are part of the v1 documentation scope. Dynamic WooCommerce routes must not be treated as static cache content, and the outage page is informational rather than a live store replacement.

## Operations

Common commands:

```bash
docker compose ps
docker compose logs -f caddy
docker compose pull && docker compose up -d
```

Back up MariaDB and WordPress uploads before upgrades. Never run `docker compose down -v` on a production deployment unless permanent volume deletion is explicitly intended.
