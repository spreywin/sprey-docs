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

After both plugins were activated, Site Health still reported **Good**. No REST API, loopback, DNS, or outbound HTTPS regression appeared.

## phpMyAdmin — verified on fresh current main

The phpMyAdmin network fix was re-tested from the fresh clone of current `main`, not from a locally modified deployment.

Verified behavior:

- `docker compose --profile admin up -d phpmyadmin` pulled and started the current image;
- phpMyAdmin published only as `127.0.0.1:8081->80/tcp`;
- the VPS-local HTTP check returned `200 OK`;
- the UI opened through an SSH tunnel at `http://localhost:8081`;
- MariaDB root login with the generated `MYSQL_ROOT_PASSWORD` succeeded;
- the `wordpress` database was visible;
- stop/start lifecycle had already been verified separately;
- removing the stopped phpMyAdmin container and image on the 10 GB host reclaimed roughly 600 MB by `df`, returning the host from about 78% to about 71% root-filesystem use.

phpMyAdmin reboot behavior remains intentionally unverified. It is not required for normal operation because phpMyAdmin is an optional maintenance service and is expected to be stopped or removed after use on small disks.

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

The deployment used a dedicated test hostname pointed directly at the host while TLS and application behavior were verified.

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
- phpMyAdmin was stopped/removed before the reboot test;
- after a normal host reboot, Caddy, WordPress, and MariaDB returned automatically, MariaDB was healthy, and the public site returned HTTP `200`;
- `wp-config.php`, bundled plugin directories, and WordPress/MariaDB data remained present after reboot.

This verifies the current manual Compose deployment path on ARM64. It does not claim that the repository's manual commands provision host prerequisites automatically: the manual test installed/configured the host firewall and Docker before running the Compose sequence.

## Previously verified availability behavior

The existing Cloudflare failover test record remains valid:

- healthy origin path — verified;
- Caddy stop/start failover and recovery — verified;
- normal VPS reboot failover/recovery — verified;
- hard reboot failover/recovery — verified;
- controlled TLS-handshake failure covering the `525` path — verified;
- `526` remains configured but not explicitly verified end to end.

## Still pending before release review

- release notes and GitHub tag/release review;
- optional explicit `526` test if desired;
- optional phpMyAdmin-active reboot test if desired.

A real BTCPay payment flow is tracked separately as payment-product integration work and does not redefine the verified deployment boundary of the WP Stack itself.
