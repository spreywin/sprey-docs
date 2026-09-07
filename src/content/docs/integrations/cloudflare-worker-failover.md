---
title: Cloudflare Worker failover
description: Configure free request-time failover from the Sprey WordPress VPS to the static Cloudflare Pages outage site.
---

The Sprey v1 website uses a Cloudflare Worker instead of paid Cloudflare Load Balancing:

```text
visitor -> sprey.win -> Cloudflare Worker -> primary WordPress VPS
                                      \-> sprey-outage.pages.dev on failure
```

The Worker attempts primary for every request. A network failure, five-second timeout, or configured upstream origin failure causes that request to receive the static outage page. Every later request tries primary again, so the site returns automatically after the VPS recovers.

Configured status coverage is currently:

```text
502 503 504 520 521 522 523 524 525 526
```

This is **request-time failover**. It does not run periodic probes, share health state between requests, or discover an outage before a visitor arrives. The static page is only an outage notice. It cannot preserve or provide WooCommerce cart, checkout, accounts, orders, sessions, or payment flows.

## Prerequisites

- `sprey.win` is an active Cloudflare zone and its WordPress DNS record is proxied.
- The primary VPS already serves valid HTTPS through Caddy.
- Cloudflare SSL/TLS mode is **Full (strict)**.
- `sprey-outage.pages.dev` serves the approved static outage page.
- Cloudflare cache rules bypass dynamic WordPress and WooCommerce traffic.
- The current Workers Free request and CPU limits cover expected traffic.

Use a **Workers Route** when the Worker runs before the external WordPress application server.

## Worker implementation

The canonical source is <a href="https://github.com/spreywin/sprey-wp-stack/blob/main/cloudflare/failover-worker.js" target="_blank" rel="noopener noreferrer">`cloudflare/failover-worker.js` in Sprey WP Stack</a>.

The Worker:

- preserves the original request method, body, path, query, headers, and cookies when calling primary;
- makes exactly one primary attempt;
- fails over only for network errors, the explicit timeout, and the configured failure-status set;
- cancels an unused failed-origin response body before fetching fallback;
- fetches the static outage document with `GET` or `HEAD`;
- returns fallback as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and an `X-Sprey-Failover` diagnostic header;
- returns a small plain-text `503` if both primary and fallback fail.

Do not add arbitrary application-level `500` responses without review. Broad failover can hide useful WordPress or WooCommerce diagnostics.

## Test on a separate hostname

When the production storefront must remain uninterrupted, use a temporary hostname such as `failover-test.sprey.win`:

1. Add a proxied DNS record for the test hostname that resolves to the same WordPress VPS.
2. Configure Caddy to accept the test hostname and verify its certificate.
3. Add `failover-test.sprey.win/*` to the Worker's Domains & Routes.
4. Verify representative pages, assets, redirects, cookies, login, cart, and checkout.
5. Confirm healthy responses do not contain `X-Sprey-Failover`.
6. During a controlled maintenance window, create a handled failure.
7. Confirm the Worker returns the static page with HTTP `503` and `X-Sprey-Failover: static-outage-page`.
8. Restore primary and confirm the next request returns WordPress without a DNS change.

Remove temporary DNS/Caddy configuration after testing if it is not meant to remain deployed.

## Verified production behavior

The production route has been verified directly on `sprey.win` for the full-origin outage path and for a controlled TLS-handshake failure:

- healthy origin traffic returned HTTP `200` through Caddy with no `X-Sprey-Failover` header;
- stopping Caddy produced Cloudflare `521`;
- handling `521` returned the static outage page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`;
- starting Caddy restored the next request to normal WordPress service without a DNS change;
- the same failover-and-recovery behavior was verified during a normal VPS reboot and a VPS hard reboot;
- a controlled TLS-handshake failure was created by stopping Caddy and temporarily binding a non-TLS listener to origin port `443`;
- through the production Worker route, that TLS failure returned the static outage page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`;
- removing the temporary listener and restarting Caddy restored the next request to normal WordPress as HTTP `200` without the failover header.

## TLS-specific 525/526 boundary

The controlled TLS-handshake test verifies the `525` failover path end to end on the production `sprey.win/*` Worker route. The Worker intercepted the TLS-origin failure and served the Sprey static outage page instead of exposing Cloudflare's default TLS error page.

`526` remains included in the configured failure set, but it has not yet been explicitly verified end to end. Documentation therefore marks `525` as verified and keeps `526` as configured-but-pending.

## Cache boundaries

Failover does not make dynamic commerce content safe to cache. Bypass cache for at least:

- `/cart*`, `/checkout*`, and `/my-account*`;
- `/wp-admin*` and `/wp-login.php*`;
- WooCommerce Store API, REST API, AJAX, and webhook endpoints as applicable;
- authenticated requests and requests with WordPress or WooCommerce cart/session cookies.

## Validate and roll back

```bash
curl -sS -D - -o /dev/null https://sprey.win/
```

Normal WordPress responses have no `X-Sprey-Failover` header. Controlled failover returns HTTP `503` and either `static-outage-page` or `fallback-unavailable` in that header.

To roll back, remove or disable only the `sprey.win/*` Workers Route. Do not change DNS.

For operational diagnosis and incident handling, use [WP Stack failover operations](/operations/wp-stack-failover/).

## References

- <a href="https://developers.cloudflare.com/workers/configuration/routing/routes/" target="_blank" rel="noopener noreferrer">Cloudflare Workers Routes</a>
- <a href="https://developers.cloudflare.com/workers/platform/limits/" target="_blank" rel="noopener noreferrer">Cloudflare Workers limits</a>
- <a href="https://developers.cloudflare.com/cache/how-to/cache-rules/" target="_blank" rel="noopener noreferrer">Cloudflare Cache Rules</a>
