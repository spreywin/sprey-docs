---
title: WP Stack failover operations
description: Validate, monitor, troubleshoot, and roll back the Cloudflare Worker outage path.
---

Use this runbook after the [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/) integration is deployed.

## Expected behavior

| Primary result | Visitor result |
| --- | --- |
| Any response outside the configured failure set | Original WordPress response |
| Network error or five-second timeout | Static outage page, HTTP `503` |
| `502`, `503`, `504`, `520`, `521`, `522`, `523`, `524`, `525`, or `526` | Static outage page, HTTP `503` |
| Primary and fallback both fail | Plain-text HTTP `503` |
| Primary recovers | Next request returns WordPress automatically |

The Worker does not run scheduled health checks. No traffic means no probe, and a fallback response describes that request only. It does not prove that MariaDB, the whole VPS, or every WordPress route is unavailable.

## Routine checks

1. Request a public page and confirm there is no `X-Sprey-Failover` response header.
2. Review Worker logs and analytics for exceptions, timeouts, fallback responses, and Free-plan usage.
3. On the VPS, run `./status.sh`. The host profile reports hostname, OS, kernel, architecture, virtualization, vCPU count, CPU model, total RAM, total swap, root device, and root filesystem size; the remaining sections report current load, disk/inode use, memory/swap use, Compose state, container resources, and Docker storage.
4. Run `docker compose ps` and inspect recent Caddy and WordPress logs when a service-level issue is suspected.
5. Confirm `sprey-outage.pages.dev` still renders independently and contains no cart, checkout, login, account, order, or payment controls.
6. Re-run a controlled test after material Worker, Cloudflare, DNS, Caddy, VPS, TLS, or outage-page changes.

## Incident response

When fallback responses increase:

1. Preserve Worker and origin timestamps and request identifiers.
2. Check whether failures are network errors, timeouts, or one of the configured origin statuses: `502`, `503`, `504`, `520`, `521`, `522`, `523`, `524`, `525`, `526`.
3. Compare multiple public paths. A single failing application route is not necessarily an origin-wide outage.
4. Check VPS host profile and current load, disk, inodes, memory/swap, containers, Caddy, WordPress, and MariaDB.
5. Check the fallback itself. `X-Sprey-Failover: fallback-unavailable` means both fetch paths failed.
6. Restore the primary service. Do not switch DNS back manually; the next successful request returns to WordPress.
7. Verify public pages and dynamic WooCommerce flows after recovery.

Do not treat the static page as a degraded store mode. WooCommerce sessions and transactions must fail closed while primary is unavailable.

## Controlled failover test

When the production storefront must remain uninterrupted, use a dedicated proxied test hostname and the same Worker route logic.

Verified failure simulations include:

- stopping and starting Caddy;
- a normal VPS reboot;
- a VPS hard reboot;
- controlled `525` TLS-handshake failure;
- controlled `526` invalid-origin-certificate failure under Cloudflare **Full (strict)**.

The controlled `526` test used a temporary self-signed TLS certificate on the isolated origin. The direct origin connection established TLS, Cloudflare rejected the invalid certificate, and the Worker served the static outage page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`. Restoring Caddy returned the next proxied request to WordPress as HTTP `200` without the failover header.

## Emergency rollback

Disable or remove the relevant Workers Route. Leave the proxied DNS record unchanged. Traffic then bypasses the Worker and reaches the WordPress VPS directly through Cloudflare.

Rollback removes automatic outage-page failover. Record why it was needed and repeat a controlled validation before re-enabling the route.
