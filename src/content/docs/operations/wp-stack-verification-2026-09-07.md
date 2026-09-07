---
title: WP Stack verification — 2026-09-07
description: Clean-install and manual ARM64 verification record for Sprey WP Stack before the v1.0 release review.
---

This page records the final clean-install verification pass and the separate manual ARM64 deployment test performed against the current `main` branch before release review.

## Automatic-install test host

- Ubuntu 26.04.1 LTS
- kernel `7.0.0-31-generic`
- 1 vCPU
- approximately 1 GB RAM
- 10 GB root filesystem
- fresh host started with no swap

Four Ubuntu package upgrades remained deferred by phased rollout after the OS update; the normal upgrade path itself was complete.

## Automatic installer — verified

The current installer was run from a fresh clone of `main` and completed successfully.

Verified behavior:

- prerequisites and Docker / Docker Compose were installed as required;
- a persistent 1 GiB `/swapfile` was created because no active swap existed;
- `/swapfile` was added to `/etc/fstab`;
- UFW defaulted to deny incoming / allow outgoing;
- only the active SSH port, TCP 80, TCP 443, and UDP 443 were allowed;
- `edge` and `app` networks were created;
- Caddy, WordPress, and MariaDB started successfully;
- MariaDB became healthy;
- phpMyAdmin remained off by default because it is in the optional `admin` profile;
- the installer completed its post-build cleanup;
- Docker build cache was `0 B` after installation;
- the completed 10 GB test deployment used about 71% of the root filesystem and left about 2.8 GB free.

## Automatic-install reboot — verified

After a normal VPS reboot:

- the 1 GiB swap file returned active;
- Caddy returned automatically;
- WordPress returned automatically;
- MariaDB returned automatically and was healthy;
- root filesystem usage remained about 71%;
- public HTTPS through Cloudflare and Caddy worked normally.

## WordPress and storefront plugins — verified

A fresh WordPress installation completed successfully.

Before plugin activation, Site Health reported **Good** with only ordinary recommendations for inactive plugins/themes and intentionally disabled search-engine indexing.

The bundled plugins were present in the fresh build:

- WooCommerce `11.1.0`
- BTCPay For WooCommerce V2 `2.8.2`

WooCommerce was activated first, followed by BTCPay For WooCommerce V2. Both activated successfully. The BTCPay notice that the plugin was not configured yet was expected at this stage.

After both plugins were activated, Site Health had no critical issues. The final check showed only ordinary recommendations for inactive themes and intentionally discouraged search-engine indexing. No REST API, loopback, DNS, or outbound HTTPS regression remained.

## phpMyAdmin — verified

The phpMyAdmin path was tested from current `main`.

Verified behavior:

- `docker compose --profile admin up -d phpmyadmin` pulled and started the current image;
- phpMyAdmin published only as `127.0.0.1:8081->80/tcp`;
- the VPS-local HTTP check returned `200 OK`;
- the UI opened through an SSH tunnel at `http://localhost:8081`;
- MariaDB root login with the generated `MYSQL_ROOT_PASSWORD` succeeded;
- the `wordpress` database was visible;
- stop/start lifecycle was verified;
- on the ARM64 host, `phpmyadmin:latest` pulled as `linux/arm64` and returned local HTTP `200`;
- with phpMyAdmin left running, a normal host reboot was performed;
- after reboot, phpMyAdmin returned automatically, remained bound only to `127.0.0.1:8081`, and again returned local HTTP `200`; Caddy, WordPress, and MariaDB also returned and MariaDB was healthy.

This verifies phpMyAdmin-active reboot behavior in addition to the previously verified localhost, SSH-tunnel, login, stop/start, and ARM64 paths.

## Plugin persistence across rebuild/recreate — verified

The persistent WordPress volume was tested explicitly.

Baseline plugin versions:

- WooCommerce `11.1.0`
- BTCPay For WooCommerce V2 `2.8.2`

Baseline SHA-256 values:

```text
99c8762e9ddc6ee5580d079ecf2bd5ed2d18c48ae1f3b793777de16729c948c1  woocommerce/woocommerce.php
5560d28afe322282a9cdd3d831c61c47acc040e2695357376bbea45c5cdf40f2  btcpay-greenfield-for-woocommerce/btcpay-greenfield-for-woocommerce.php
```

A temporary marker was created inside the WooCommerce directory in the persistent `wordpress_data` volume. The WordPress image was then rebuilt and the WordPress container was force-recreated.

After recreate:

- the temporary marker was still present;
- both plugin SHA-256 values were unchanged;
- MariaDB remained healthy;
- the public site returned HTTP `200`;
- Site Health remained **Good**.

This verifies that existing plugin files in `wordpress_data` are preserved across a WordPress image rebuild and container recreate.

This test did **not** claim an in-admin plugin upgrade to a newer upstream version because no newer plugin version was available during the test. The verified boundary is persistence of the existing plugin files across rebuild/recreate.

## Manual ARM64 deployment — verified

A separate clean manual deployment was completed on an ARM64 host using the manual Compose path from current `main`.

Test host:

- Ubuntu 26.04.1 LTS
- kernel `7.0.0-1010-oracle`
- architecture `aarch64`
- 2 OCPU
- approximately 12 GB RAM
- 99 GB boot volume, approximately 95 GB root filesystem
- no swap configured during this manual test
- Docker `29.1.3`
- Docker Compose `2.40.3`

The deployment used a dedicated test hostname while TLS and application behavior were verified.

Verified manual-path behavior:

- `.env` was created from `.env.example` with the deployment hostname, ACME email, and generated database passwords;
- `docker compose config --quiet` returned exit code `0`;
- Caddy, MariaDB, and the custom WordPress image pulled/built successfully as `linux/arm64`;
- the WordPress image build completed successfully on ARM64;
- `docker compose up -d` created the expected `edge` and `app` networks and persistent volumes;
- MariaDB became healthy;
- Caddy exposed TCP 80, TCP 443, and UDP 443;
- HTTP redirected to HTTPS;
- Caddy obtained a valid Let's Encrypt certificate for the test hostname;
- Caddy enabled HTTP/1.1, HTTP/2, and the HTTP/3 listener;
- the standard WordPress installation completed successfully;
- an initial transient Site Health DNS/loopback warning cleared after DNS/TLS initialization; direct tests from inside the WordPress container then resolved the site hostname and returned HTTP `200` over HTTPS;
- final WordPress Site Health had no critical issues;
- WooCommerce `11.1.0` and BTCPay For WooCommerce V2 `2.8.2` were present and activated successfully;
- WooCommerce created its expected tables, including `wp_woocommerce_attribute_taxonomies`, `wp_wc_orders`, and `wp_actionscheduler_actions`;
- one transient WooCommerce database notice appeared during first activation before the attribute table existed; the table was subsequently created and no continuing database/fatal error remained;
- phpMyAdmin `latest` pulled as `linux/arm64`, started from the optional `admin` profile, remained bound to `127.0.0.1:8081`, and returned local HTTP `200`;
- after a normal host reboot, Caddy, WordPress, MariaDB, and phpMyAdmin returned automatically; MariaDB was healthy; the public site returned HTTP `200`; phpMyAdmin remained localhost-only and returned local HTTP `200`;
- `wp-config.php`, bundled plugin directories, and WordPress/MariaDB data remained present after reboot.

This verifies the current manual Compose deployment path on ARM64. It does not claim that the repository's manual commands provision host prerequisites automatically: the manual test installed/configured the host firewall and Docker before running the Compose sequence.

## Cloudflare failover — verified through 526

The existing production failover behavior remains verified for:

- healthy origin path;
- Caddy stop/start failover and recovery;
- normal VPS reboot failover/recovery;
- hard reboot failover/recovery;
- controlled TLS-handshake failure covering the `525` path.

A separate controlled `526` test was completed on the isolated proxied test hostname with the same failover Worker route and Cloudflare **Full (strict)** mode. Caddy was stopped and a temporary TLS listener with a self-signed certificate was bound to origin port `443`. The direct origin TLS connection succeeded, while Cloudflare rejected the invalid origin certificate. The Worker returned the static outage page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`. After the temporary listener was removed and Caddy was restarted, the next proxied request returned normal WordPress as HTTP `200` with no `X-Sprey-Failover` header.

This verifies the configured `526` failover and recovery path end to end.

## Release-review boundary

Infrastructure/deployment verification gaps targeted for v1.0 are now closed:

- automatic clean deployment — verified;
- manual ARM64 deployment — verified;
- service and data persistence across reboot — verified;
- phpMyAdmin localhost, SSH-tunnel, stop/start, ARM64, and active-reboot behavior — verified;
- Cloudflare failover including controlled `525` and `526` paths — verified;
- plugin-file persistence across WordPress image rebuild/recreate — verified.

Still outside this deployment-verification boundary:

- release notes and GitHub tag/release creation;
- a real BTCPay payment flow, tracked as payment-product integration work;
- an in-admin upgrade-to-newer-plugin-version rollback test, which remains unclaimed because no newer upstream plugin version was available during the persistence test.
