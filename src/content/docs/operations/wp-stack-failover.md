---
title: WP Stack failover operations
description: Validate, monitor, troubleshoot, and roll back the Cloudflare Worker outage path.
---

Use this runbook after the [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/) integration is deployed.

## Expected behavior

| Primary result | Visitor result |
| --- | --- |
| Any response except `502`, `503`, `504`, or `521` | Original WordPress response |
| Network error or five-second timeout | Static outage page, HTTP `503` |
| `502`, `503`, `504`, or `521` | Static outage page, HTTP `503` |
| Primary and fallback both fail | Plain-text HTTP `503` |
| Primary recovers | Next request returns WordPress automatically |

The Worker does not run scheduled health checks. No traffic means no probe, and a fallback response describes that request only. It does not prove that MariaDB, the whole VPS, or every WordPress route is unavailable.

## Routine checks

1. Request a public page and confirm there is no `X-Sprey-Failover` response header.
2. Review Worker logs and analytics for exceptions, timeouts, fallback responses, and Free-plan usage.
3. On the VPS, run `./status.sh`. The host profile reports hostname, OS, kernel, architecture, virtualization, vCPU count, CPU model, total RAM, total swap, root device, and root filesystem size; the remaining sections report current load, disk/inode use, memory/swap use, Compose state, container resources, and Docker storage.
4. Run `docker compose ps` and inspect recent Caddy and WordPress logs when a service-level issue is suspected.
5. Confirm `sprey-outage.pages.dev` still renders independently and contains no cart, checkout, login, account, order, or payment controls.
6. Re-run a controlled test after material Worker, Cloudflare, DNS, Caddy, VPS, or outage-page changes.

## Incident response

When fallback responses increase:

1. Preserve Worker and origin timestamps and request identifiers.
2. Check whether failures are network errors, timeouts, `502`, `503`, `504`, or `521`.
3. Compare multiple public paths. A single failing application route is not necessarily an origin-wide outage.
4. Check VPS host profile and current load, disk, inodes, memory/swap, containers, Caddy, WordPress, and MariaDB.
5. Check the fallback itself. `X-Sprey-Failover: fallback-unavailable` means both fetch paths failed.
6. Restore the primary service. Do not switch DNS back manually; the next successful request returns to WordPress.
7. Verify public pages and dynamic WooCommerce flows after recovery.

Do not treat the static page as a degraded store mode. WooCommerce sessions and transactions must fail closed while primary is unavailable.

## Controlled failover test

When the production storefront must remain uninterrupted, use a dedicated test hostname or test path and return a temporary failure from only that isolated origin path.

The production route has also been verified during controlled maintenance. Verified failure simulations include:

- stopping and starting Caddy;
- a normal VPS reboot;
- a VPS hard reboot.

In each full-origin interruption, `sprey.win` switched to the independent static outage page while the origin was unavailable and returned automatically to WordPress after the VPS and Caddy recovered, without a DNS change.

## Emergency rollback

Disable or remove the `sprey.win/*` Workers Route. Leave the proxied `sprey.win` DNS record unchanged. Traffic then bypasses the Worker and reaches the WordPress VPS directly through Cloudflare.

Rollback removes automatic outage-page failover. Record why it was needed and repeat a controlled validation before re-enabling the route.
