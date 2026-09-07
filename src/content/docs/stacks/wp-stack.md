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

The network boundary is deliberate: Caddy uses `edge` + `app`, WordPress uses `edge` + `app`, phpMyAdmin uses `edge` + `app` when enabled, and MariaDB stays on the internal `app` network only. This gives WordPress outbound access for updates, WordPress.org, WooCommerce, BTCPay API calls, and loopback checks while MariaDB remains isolated from the Internet. phpMyAdmin publishes only to `127.0.0.1:8081` for SSH-tunneled maintenance access.

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
- the created swap remained active after a normal VPS reboot, confirming persistence through `/etc/fstab`;
- Caddy, WordPress, and MariaDB started successfully;
- MariaDB became healthy;
- all three stack services returned automatically after the normal reboot;
- WordPress had working outbound DNS and HTTPS through `edge`;
- MariaDB remained isolated on `app`;
- WordPress Site Health reported **Good** after setup, with only search-engine indexing intentionally disabled while the store remained private;
- current stable WooCommerce and BTCPay for WooCommerce V2 were bundled into the clean build;
- the automatic installer cleanup ran in the fresh deployment and left Docker builder cache at `0 B`.

On the verified 10 GB test VPS, the completed installation used about 71% of the root filesystem and left about 2.8 GB free. This confirms that a 10 GB disk is practical for testing but leaves limited production headroom.

## Verified manual ARM64 deployment

The manual Compose path has now also been verified end to end on a separate clean ARM64 host running Ubuntu 26.04.1 LTS.

The verified host used `aarch64`, 2 OCPU, approximately 12 GB RAM, a 99 GB boot volume, Docker `29.1.3`, and Docker Compose `2.40.3`. No swap was configured for this manual test.

The host prerequisites were prepared manually before running the repository Compose sequence: OS updates, firewall rules, Docker Engine, Docker Compose, and DNS were configured first. The manual Compose path itself was then run from a fresh clone of current `main`.

Verified manual-path behavior:

- `.env` created from `.env.example` and `docker compose config --quiet` returned exit code `0`;
- Caddy, MariaDB, and the custom WordPress image pulled/built successfully as `linux/arm64`;
- the WordPress image built successfully on ARM64;
- Caddy, WordPress, and MariaDB started successfully and MariaDB became healthy;
- HTTP redirected to HTTPS and Caddy obtained a valid Let's Encrypt certificate;
- HTTP/1.1, HTTP/2, and the HTTP/3 listener were enabled;
- WordPress completed normal installation and final Site Health had no critical issues;
- WooCommerce `11.1.0` and BTCPay For WooCommerce V2 `2.8.2` were present and activated successfully;
- expected WooCommerce tables were created successfully;
- phpMyAdmin `latest` pulled as `linux/arm64`, started from the `admin` profile, remained localhost-only on `127.0.0.1:8081`, and returned HTTP `200` locally;
- after a normal host reboot, Caddy, WordPress, and MariaDB returned automatically, MariaDB was healthy, the public site returned HTTP `200`, and WordPress/database state persisted.

The complete verification record is maintained in [WP Stack verification — 2026-09-07](/operations/wp-stack-verification-2026-09-07/).

Current verification boundary:

- **Automatic clean deployment — VERIFIED.**
- **Manual Compose deployment on ARM64 — VERIFIED.**
- **Swap creation when absent — VERIFIED.**
- **Swap persistence after reboot — VERIFIED.**
- **Automatic service recovery after normal reboot — VERIFIED.**
- **WordPress outbound/loopback network model — VERIFIED.**
- **WooCommerce + BTCPay plugin activation — VERIFIED.**
- **Plugin-file persistence across WordPress image rebuild/recreate — VERIFIED.**
- **Automatic post-build cleanup in a complete fresh run — VERIFIED.**
- **Cloudflare 525 failover and recovery — VERIFIED.**
- **phpMyAdmin localhost + SSH tunnel + root login path — VERIFIED.**
- **phpMyAdmin stop/start lifecycle — VERIFIED.**
- **phpMyAdmin ARM64 image/start/local HTTP path — VERIFIED.**
- **phpMyAdmin-active reboot behavior — pending verification.**
- **Cloudflare 526 failover — configured, not yet explicitly verified.**
- **BTCPay payment integration — not yet verified.**

## Diagnostics and resource visibility

The bundled `./status.sh` helper reports both a static host profile and current resource state.

It includes hostname, OS, kernel, architecture, virtualization, vCPU count, CPU model, RAM, swap, root device, root filesystem size, load, filesystem/inode usage, RAM/swap usage, Compose service state, container resource usage, Docker disk usage, and the sizes of `/var/lib/containerd` and `/var/lib/docker` when present.

If the root filesystem reaches 80% used, the helper prints a low-disk warning.

The clean test also showed why this matters on small VPS disks: after a current Ubuntu system and the full Dockerized stack are installed, a 10 GB root disk has limited production headroom. On the tested host, containerd image/content data was a major runtime storage consumer while logs and APT cache remained small. Do not delete containerd or Docker runtime directories manually.

## Manual setup

Prepare the host first: update the OS, install Docker Engine and Docker Compose v2, configure the host firewall to allow the active SSH port plus TCP 80, TCP 443, and UDP 443, and point the deployment hostname to the server.

Then run:

```bash
git clone https://github.com/spreywin/sprey-wp-stack.git
cd sprey-wp-stack
cp .env.example .env
chmod 600 .env
# Edit DOMAIN, ACME_EMAIL and all password fields in .env.
docker compose config --quiet
docker compose pull --ignore-buildable
docker compose build wordpress
docker compose up -d
docker compose ps
```

Open `https://YOUR_DOMAIN` and complete the standard WordPress setup.

This manual Compose path is verified on Ubuntu 26.04.1 LTS ARM64. The commands above do not provision host prerequisites automatically; use the automatic installer when you want the repository to handle host preparation.

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
- a controlled TLS-handshake failure verified the `525` path end to end: the Worker returned the static outage page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`;
- after restoring Caddy, the next request returned normal WordPress as HTTP `200` without the failover header;
- no DNS change was required for failover or recovery.

`526` remains included in the configured failure set but has not yet been explicitly verified end to end.

Configuration details live in [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/), operational diagnosis and rollback live in [WP Stack failover operations](/operations/wp-stack-failover/), and the canonical Worker source remains in the [WP Stack Cloudflare runbook](https://github.com/spreywin/sprey-wp-stack/blob/main/cloudflare/README.md).

## Optional phpMyAdmin

The localhost-only access path is verified. phpMyAdmin starts from the `admin` Compose profile, publishes only to `127.0.0.1:8081`, opens successfully through an SSH tunnel, and can authenticate to MariaDB with credentials generated in the deployment `.env` file.

The stop/start lifecycle is also verified: stopping phpMyAdmin removes the localhost listener, and starting it again restores `127.0.0.1:8081` with a successful local HTTP response.

ARM64 behavior is also verified: `phpmyadmin:latest` pulled as `linux/arm64`, started successfully, and returned local HTTP `200` while MariaDB remained healthy.

For the exact start command, SSH tunnel, password retrieval commands, login choices, stop/start steps, and security notes, use [WP Stack phpMyAdmin access](/operations/wp-stack-phpmyadmin/).

phpMyAdmin-active reboot behavior remains pending until tested explicitly. In the verified ARM64 host reboot test, phpMyAdmin was intentionally stopped/removed before reboot because it is an optional maintenance service.

## Update behavior

A new WordPress image build downloads the current stable WooCommerce and BTCPay for WooCommerce V2 releases. WordPress runtime data lives in the persistent `wordpress_data` volume.

The rebuild/recreate path has been explicitly verified with existing plugin files in that persistent volume: a marker and the SHA-256 values of WooCommerce `11.1.0` and BTCPay For WooCommerce V2 `2.8.2` remained unchanged after rebuilding the WordPress image and force-recreating the WordPress container. MariaDB remained healthy and the public site returned HTTP `200`.

This verifies persistence of existing plugin files across rebuild/recreate. It does not claim a rollback test after an in-admin upgrade to a newer upstream plugin version, because no newer plugin release was available during that test.

## Backup status

Automated WordPress backup and restore workflow is **planned**. It is not yet implemented or verified.

## Product relationship

Use WP Stack when a merchant needs a complete WordPress/WooCommerce storefront. Do not require it for other Sprey Processing flows such as Point of Sale, QR acceptance, Payment Requests, Payment Buttons, donations, crowdfunding, or direct API integrations.

## Verification rule

The operating rule is:

> **Build it. Verify it. Document it.**

Anything not tested end to end remains explicitly marked pending rather than being described as production-verified.
