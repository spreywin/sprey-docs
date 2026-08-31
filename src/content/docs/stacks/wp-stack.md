---
title: Sprey WP Stack
description: Production-oriented WordPress and WooCommerce stack for a modest VPS.
---

Sprey WP Stack is a compact Docker Compose deployment for WordPress and WooCommerce with the BTCPay payment integration bundled into the WordPress application image. It is intentionally a **website stack, not a server control panel**.

Repository: <a class="github-repository-badge" href="https://github.com/spreywin/sprey-wp-stack" target="_blank" rel="noopener noreferrer">spreywin/sprey-wp-stack</a>

## Requirements

- A Linux VPS with Docker Engine and Docker Compose v2.
- A domain with `A` and, if used, `AAAA` records pointing to the VPS.
- Firewall access for TCP `80`, TCP `443`, and UDP `443`; SSH should be restricted to your own IP or VPN where practical.

## Components

- Caddy as the only public web service, with automatic HTTPS and HTTP/3.
- WordPress with Apache and PHP 8.4.
- WooCommerce bundled in the WordPress image.
- BTCPay for WooCommerce V2 bundled in the WordPress image.
- MariaDB LTS on a private Docker network.
- Optional phpMyAdmin profile bound to localhost only and disabled by default.
- UFW configured by the installer for SSH, HTTP, HTTPS, and HTTP/3.
- Bounded Docker container logs and the bundled `status.sh` resource overview.

## Quick start

Point DNS to the VPS first, then run on a new Ubuntu/Debian server:

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

The installer installs Docker when needed, creates strong database passwords in `.env`, configures UFW without closing the active SSH port, builds the Sprey WordPress image with the tested WooCommerce and BTCPay plugin versions, and starts the stack. It refuses to replace an existing `.env` or run on an unsupported system.

After the stack starts, open `https://YOUR_DOMAIN` and complete the WordPress installer. WooCommerce and BTCPay for WooCommerce V2 are then available to activate from WordPress Admin without downloading them separately.

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
   + BTCPay for WooCommerce V2
   │
   ▼
MariaDB LTS
```

WooCommerce and BTCPay for WooCommerce V2 are part of the WordPress application layer. The plugin connects outward to separate BTCPay Server infrastructure; BTCPay Server itself does not run in this stack. WordPress and MariaDB remain behind Docker networking. phpMyAdmin is disabled by default and is intended for temporary local access over an SSH tunnel.

## BTCPay

BTCPay Server is **not** part of the WordPress stack. The official BTCPay for WooCommerce V2 plugin is bundled with the Sprey WordPress image and connects WooCommerce to separate BTCPay infrastructure.

Recommended deployment flow:

1. Deploy Sprey WP Stack and complete WordPress setup.
2. Activate the bundled WooCommerce plugin and complete its initial store setup.
3. Activate the bundled BTCPay for WooCommerce V2 plugin.
4. Connect it to a BTCPay Server store. For Sprey deployments, <a href="https://pay.sprey.win/" target="_blank" rel="noopener noreferrer">pay.sprey.win</a> is the recommended hosted endpoint; follow [BTCPay for WooCommerce](/integrations/btcpay-woocommerce/) for the connection and testing procedure.
5. Run a test payment before accepting production orders.

For evaluation without a production BTCPay host, the BTCPay Server project provides official <a href="https://mainnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">mainnet</a> and <a href="https://testnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">testnet</a> demo servers. They are for testing and do not carry an uptime guarantee.

:::caution
Do not store BTCPay Server secrets, API keys, wallet seeds, or payment credentials in the repository.
:::

## Cloudflare

Cloudflare production settings and static outage failover are part of v1. A Workers Route on `sprey.win/*` places the Cloudflare Worker before the primary WordPress VPS. The Worker forwards every request to primary and uses `sprey-outage.pages.dev` after a network error, bounded timeout, or selected `502/503/504`. It tries primary again on every new request, so recovery does not require a DNS change.

:::note
This is request-time failover on the Workers Free plan, not Cloudflare Load Balancing or an independent periodic health monitor. The outage page is an informational `503` response, not a live store: cart, checkout, accounts, orders, sessions, and payments require WordPress.
:::

Dynamic WooCommerce routes must not be treated as static cache content. Follow [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/) for a test-hostname-first rollout. Use [WP Stack failover operations](/operations/wp-stack-failover/) for validation, incident response, and rollback.

## Operations

For a quick VPS health snapshot:

```bash
./status.sh
```

Common stack commands:

```bash
docker compose config --quiet
docker compose ps
docker compose logs -f caddy
docker compose pull --ignore-buildable
docker compose build wordpress
docker compose up -d
```

Review WordPress, WooCommerce, BTCPay plugin, and container release notes before upgrades. Back up both the MariaDB database and WordPress uploads before rebuilding or recreating production containers.

:::danger
Never run `docker compose down -v` on a production deployment unless permanent volume deletion is explicitly intended. It removes the named volumes containing the site, database, and Caddy certificates.
:::

For the edge path, monitor Worker exceptions, timeouts, fallback response counts, and Free-plan usage. A fallback response reports a failed request to primary; it is not by itself proof that every service on the VPS is down.

## Optional phpMyAdmin

phpMyAdmin is intentionally off by default. Prefer SSH and the MariaDB CLI for routine database work.

Start it only when needed:

```bash
docker compose --profile admin up -d phpmyadmin
```

From your own computer, create the local SSH tunnel and then open `http://localhost:8081`:

```bash
ssh -L 8081:127.0.0.1:8081 root@YOUR_SERVER
```

Stop phpMyAdmin when finished:

```bash
docker compose --profile admin stop phpmyadmin
```
