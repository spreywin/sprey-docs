---
title: Sprey WP Stack
description: Sprey's ready-made WordPress and WooCommerce stack for online commerce, integrated with Sprey Processing.
---

**Sprey WP Stack** is Sprey's ready-made WordPress and WooCommerce implementation for **online commerce**. It packages the storefront layer needed to run a merchant site and connect WooCommerce to BTCPay Server.

It is deliberately **not the boundary of Sprey Processing**.

Sprey Processing at `pay.sprey.win` is the broader non-custodial crypto payment infrastructure and acquiring model. It is intended to support online stores, in-person Point of Sale flows, QR payments, Payment Requests, Payment Buttons and donations, crowdfunding, and API/custom integrations. WP Stack is one prepared online-store path into that broader Processing product.

```text
Sprey WP Stack
WordPress + WooCommerce
        |
        | BTCPay integration
        v
Sprey Processing
pay.sprey.win
```

## Why Sprey WP Stack exists

Earlier BTCPay Server deployment tooling exposed optional add-on services, including a self-hosted WooCommerce deployment with the BTCPay Server plugin pre-installed. The current BTCPay Server Configurator focuses its standard deployment wizard on BTCPay infrastructure and no longer exposes WooCommerce as a normal wizard choice. The underlying `btcpayserver-docker` project still retains the optional `opt-add-woocommerce` fragment, so this is a change in the standard configuration experience rather than the removal of WooCommerce support itself.

Sprey WP Stack fills the practical gap with a dedicated, reproducible WordPress + WooCommerce stack designed to integrate with BTCPay Server while keeping the storefront and payment infrastructure separated.

That separation is intentional. It reduces coupling and allows the storefront and BTCPay Server to be secured, updated, backed up, scaled, recovered, or replaced independently. It also keeps WordPress and its larger application surface away from the payment server itself.

Sprey WP Stack adds a prepared commerce layer around that model: Docker Compose deployment, Caddy and TLS, WooCommerce, the BTCPay integration, MariaDB, locally bound maintenance tooling, and documentation for reproducing and operating the stack without a control panel.

## Responsibility boundary

The storefront and payment infrastructure remain separate:

```text
WooCommerce
  |- products/catalog
  |- cart/checkout
  `- orders
       |
       `- asks BTCPay to create and track an invoice

Customer
  |
  `- pays independently
       |
       v
merchant-controlled wallet/payment destination
       ^
       |
BTCPay observes the configured payment network
  |
  `- determines invoice state
       |
       v
WooCommerce receives the payment state
```

The payment itself happens independently of Sprey. Sprey does not initiate, route, receive, hold, or forward merchant funds.

## Stack components

The current stack is intentionally small and panel-free:

- Caddy as the public web server and TLS endpoint.
- WordPress with Apache and PHP.
- WooCommerce for products, cart, checkout, and orders.
- BTCPay Server WooCommerce integration for invoice creation and payment-state exchange.
- MariaDB for WordPress data.
- phpMyAdmin bound locally for maintenance rather than exposed publicly.

The stack is intended to be reproducible with Docker Compose and understandable without a control panel.

## Before installation

Deploy the stack on a current, fully patched operating system. On a fresh Ubuntu or Debian VPS, update installed packages before cloning and running Sprey WP Stack:

```bash
sudo apt update
sudo apt upgrade -y
```

If the upgrade installs a new kernel or `/var/run/reboot-required` exists, reboot the VPS and reconnect before starting the stack installation:

```bash
test -f /var/run/reboot-required && sudo reboot
```

This keeps the deployment baseline current before Docker, UFW, Caddy, WordPress, and the rest of the stack are installed.

## Installation

Point the domain to the VPS first, then clone the Sprey WP Stack repository and run the installer with the production hostname and an administrative email address:

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

Replace `example.com` and `admin@example.com` with the real deployment values.

The installer:

- installs Docker Engine and Docker Compose when they are not already present;
- configures UFW while preserving the active SSH port;
- allows HTTP, HTTPS, and HTTP/3 traffic;
- creates the private `.env` file and generates strong database passwords;
- builds the WordPress image with the tested WooCommerce and BTCPay for WooCommerce V2 plugin versions;
- enables the bundled resource status helper;
- starts the Docker Compose stack.

When the installer finishes, open the configured hostname in a browser and complete the standard WordPress installation. WooCommerce and BTCPay for WooCommerce V2 are already bundled and can then be activated from the WordPress plugin screen.

For the canonical source and current installer implementation, see the [Sprey WP Stack repository](https://github.com/spreywin/sprey-wp-stack).

## Verified clean-host deployment

A clean deployment has been verified on a fresh Ubuntu 26.04 VPS using the documented installation path without manual fixes. The installer completed successfully, Caddy, MariaDB, and WordPress started normally, and the bundled WooCommerce and BTCPay for WooCommerce V2 plugins were successfully activated after the standard WordPress setup.

Current verification boundary:

- **Clean deployment — VERIFIED.**
- **WooCommerce + BTCPay plugin activation — VERIFIED.**
- **BTCPay payment integration — not yet verified.**

The payment integration will be marked verified only after a WooCommerce order creates a BTCPay invoice, a real payment is observed, and the resulting payment state is reflected correctly in WooCommerce.

## Diagnostics and resource visibility

The bundled `./status.sh` helper has been verified on the deployed WP Stack VPS. It reports both a static host profile and current resource state.

The host profile includes hostname, OS, kernel, architecture, virtualization, vCPU count, CPU model, total RAM, total swap, root device, and root filesystem size. Runtime sections report system load, filesystem and inode usage, RAM/swap usage, Compose service state, container CPU/memory/network/block-I/O, and Docker disk usage.

This keeps basic host identity and resource diagnostics available without a control panel or additional monitoring agent.

## Availability and failover

WP Stack v1 uses a Cloudflare Worker in front of the proxied `sprey.win` origin. The Worker normally forwards each request to the WordPress VPS. On a network error, a five-second timeout, or an upstream `502`, `503`, `504`, or `521`, it serves the independent static outage page from `sprey-outage.pages.dev` as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and the `X-Sprey-Failover: static-outage-page` response header.

The production failover path has been verified with multiple controlled origin interruptions:

- healthy origin returned HTTP `200` through Caddy without `X-Sprey-Failover`;
- stopping Caddy produced an origin-unavailable `521`, which the Worker converted to the static outage page with HTTP `503`;
- starting Caddy restored the next request to normal WordPress service with HTTP `200` and no `X-Sprey-Failover` header;
- the same failover-and-recovery behavior was verified during a normal VPS reboot and a VPS hard reboot;
- no DNS change was required for failover or recovery.

This is request-time failover, not an independent periodic health monitor. The outage page is informational only and does not provide WooCommerce cart, checkout, account, order, or payment functionality while the origin is unavailable.

Configuration details live in [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/), operational diagnosis and rollback live in [WP Stack failover operations](/operations/wp-stack-failover/), and the canonical Worker source remains in the [WP Stack Cloudflare runbook](https://github.com/spreywin/sprey-wp-stack/blob/main/cloudflare/README.md).

## Backup status

Automated WordPress backup and restore workflow is **planned**. It is not yet implemented or verified.

Until that workflow is implemented and tested, WP Stack documentation does not claim automated backup or restore capability.

## Product relationship

Use WP Stack when the merchant needs a complete WordPress/WooCommerce storefront.

Do **not** require WP Stack when a merchant only needs another Sprey Processing flow such as Point of Sale, QR-based in-person acceptance, a Payment Request, Payment Button, donation flow, crowdfunding application, or a direct API integration.

This separation is intentional: the storefront can evolve independently while `pay.sprey.win` remains the shared payment infrastructure.

## Verification rule

Deployment, bundled-plugin activation, diagnostics, and failover may be verified independently from payment integration. The BTCPay payment integration is documented as verified only after the actual WooCommerce deployment and BTCPay integration have been tested end to end. Upstream BTCPay capabilities outside WooCommerce belong to the Sprey Processing product scope and are verified separately on `pay.sprey.win`.

The operating rule is:

> **Build it. Verify it. Document it.**