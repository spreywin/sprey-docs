---
title: Sprey WP Stack
description: Sprey's ready-made WordPress and WooCommerce stack for online commerce, integrated with Sprey Processing.
---

**Sprey WP Stack** is Sprey's ready-made WordPress and WooCommerce implementation for **online commerce**. It packages the storefront layer needed to run a merchant site and connect WooCommerce to BTCPay Server.

It is deliberately **not the boundary of Sprey Processing**. Sprey Processing at `pay.sprey.win` is the broader non-custodial crypto payment infrastructure; WP Stack is one prepared online-store path into it.

```text
Sprey WP Stack
WordPress + WooCommerce
        |
        | BTCPay integration
        v
Sprey Processing
pay.sprey.win
```

## Stack components

The current stack is intentionally small and panel-free:

- Caddy as the public web server and TLS endpoint.
- WordPress with Apache and PHP.
- current stable WooCommerce bundled into each new WordPress image build.
- current stable BTCPay for WooCommerce V2 bundled into each new WordPress image build.
- MariaDB for persistent WordPress data.
- optional phpMyAdmin bound to localhost and disabled by default.

The network boundary is deliberate: Caddy uses `edge` + `app`, WordPress uses `edge` + `app`, and MariaDB stays on the internal `app` network only. This gives WordPress outbound access for updates, WordPress.org, WooCommerce, BTCPay API calls, and loopback checks without exposing MariaDB to the Internet.

## Before installation

Use a current, fully patched Ubuntu or Debian VPS:

```bash
sudo apt update
sudo apt upgrade -y
test -f /var/run/reboot-required && sudo reboot
```

Reconnect after a reboot before installing the stack.

## Automatic installation

Point the domain to the VPS first, then run:

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
sudo ./install.sh example.com admin@example.com
```

Replace the example domain and email with the real deployment values.

The installer currently:

- installs Docker Engine and Docker Compose when absent;
- preserves existing active swap;
- creates a persistent 1 GiB swap file when no active swap exists;
- configures UFW while preserving the active SSH port;
- allows HTTP, HTTPS, and HTTP/3;
- creates `.env` and strong database passwords;
- builds the WordPress image with the current stable WooCommerce and BTCPay for WooCommerce V2 releases;
- starts the Compose stack;
- removes unused Docker builder cache after a successful build/start;
- cleans the APT cache/lists;
- enables the bundled resource status helper.

## Verified clean-host deployment

A fresh deployment has been verified on Ubuntu 26.04.1 LTS on a 1 vCPU / approximately 1 GB RAM VPS.

Verified results:

- the host had no swap before installation;
- the installer created and activated 1 GiB swap;
- Caddy, WordPress, and MariaDB started successfully;
- MariaDB became healthy;
- WordPress had working outbound DNS and HTTPS through `edge`;
- MariaDB remained isolated on `app`;
- WordPress Site Health reported **Good** after setup, with only search-engine indexing intentionally disabled while the store remained private;
- current stable WooCommerce and BTCPay for WooCommerce V2 were bundled into the clean build.

The post-build cleanup commands were also validated manually on the same clean host: Docker builder cache dropped from about 1.228 GB to 0 B without removing active images, containers, networks, or volumes. The installer now performs the same cleanup automatically, but one more full fresh-host pass is required before that automatic cleanup step is marked clean-install verified.

Current verification boundary:

- **Automatic clean deployment — VERIFIED.**
- **Swap creation when absent — VERIFIED.**
- **WordPress outbound/loopback network model — VERIFIED.**
- **WooCommerce + BTCPay plugin activation — VERIFIED.**
- **Automatic post-build cleanup in a complete fresh run — pending re-verification.**
- **Manual setup path — not yet re-verified.**
- **phpMyAdmin maintenance flow — not yet re-verified.**
- **BTCPay payment integration — not yet verified.**

## Diagnostics and resource visibility

The bundled `./status.sh` helper reports both a static host profile and current resource state.

It includes hostname, OS, kernel, architecture, virtualization, vCPU count, CPU model, RAM, swap, root device, root filesystem size, load, filesystem/inode usage, RAM/swap usage, Compose service state, container resource usage, Docker disk usage, and the sizes of `/var/lib/containerd` and `/var/lib/docker` when present.

If the root filesystem reaches 80% used, the helper prints a low-disk warning.

The clean test also showed why this matters on small VPS disks: after a current Ubuntu system and the full Dockerized stack are installed, a 10 GB root disk has limited production headroom. On the tested host, containerd image/content data was a major runtime storage consumer while logs and APT cache remained small. Do not delete containerd or Docker runtime directories manually.

## Manual setup — pending verification

The manual Compose path remains available in the repository, but it is **not yet re-verified against the current network, swap, latest-plugin, and storage-cleanup behavior**. It must be tested from a clean VPS before being marked production-verified.

## Availability and failover

WP Stack v1 uses a Cloudflare Worker in front of the proxied `sprey.win` origin. The Worker normally forwards each request to WordPress and serves the independent static outage page when a configured origin failure is detected.

Configured status coverage is currently:

```text
502 503 504 520 521 522 523 524 525 526
```

Verified production behavior currently includes:

- healthy origin returned HTTP `200` through Caddy without `X-Sprey-Failover`;
- stopping Caddy produced `521`, which the Worker converted to the static outage page with HTTP `503`;
- starting Caddy restored the next request to normal WordPress service;
- normal VPS reboot and hard reboot both produced the same failover/recovery behavior;
- no DNS change was required.

A real Cloudflare `525` was observed during a clean VPS reinstall while the origin temporarily had the wrong hostname/TLS state. `525` and `526` are now included in the Worker configuration, but controlled fallback conversion for those TLS statuses is **not yet marked verified**.

Configuration details live in [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/), operational diagnosis and rollback live in [WP Stack failover operations](/operations/wp-stack-failover/), and the canonical Worker source remains in the [WP Stack Cloudflare runbook](https://github.com/spreywin/sprey-wp-stack/blob/main/cloudflare/README.md).

## Optional phpMyAdmin — pending verification

phpMyAdmin remains off by default and localhost-only when started. The intended SSH-tunnel maintenance flow is documented in the repository README, but the current flow still requires a fresh verification pass before it is marked verified.

## Update behavior — pending verification

A new WordPress image build downloads the current stable WooCommerce and BTCPay for WooCommerce V2 releases. WordPress runtime data lives in a persistent volume. Before production use, the rebuild/recreate path must be tested explicitly after updating plugins from WordPress Admin to prove that a later image rebuild does not roll those plugin files back.

## Backup status

Automated WordPress backup and restore workflow is **planned**. It is not yet implemented or verified.

## Product relationship

Use WP Stack when a merchant needs a complete WordPress/WooCommerce storefront. Do not require it for other Sprey Processing flows such as Point of Sale, QR acceptance, Payment Requests, Payment Buttons, donations, crowdfunding, or direct API integrations.

## Verification rule

The operating rule is:

> **Build it. Verify it. Document it.**

Anything not tested end to end remains explicitly marked pending rather than being described as production-verified.
