---
title: Cloudflare Worker failover
description: Configure free request-time failover from the Sprey WordPress VPS to the static Cloudflare Pages outage site.
---

The Sprey v1 website uses a Cloudflare Worker instead of paid Cloudflare Load Balancing:

```text
visitor -> sprey.win -> Cloudflare Worker -> primary WordPress VPS
                                      \-> sprey-outage.pages.dev on failure
```

The Worker attempts primary for every request. A network failure, five-second timeout, or selected upstream `502`, `503`, `504`, or `521` causes that request to receive the static outage page. Every later request tries primary again, so the site returns automatically after the VPS recovers.

This is **request-time failover**. It does not run periodic probes, share health state between requests, or discover an outage before a visitor arrives. The static page is only an outage notice. It cannot preserve or provide WooCommerce cart, checkout, accounts, orders, sessions, or payment flows.

## Prerequisites

- `sprey.win` is an active Cloudflare zone and its WordPress DNS record is proxied.
- The primary VPS already serves valid HTTPS through Caddy.
- Cloudflare SSL/TLS mode is **Full (strict)**.
- `sprey-outage.pages.dev` serves the approved static outage page.
- Cloudflare cache rules bypass dynamic WordPress and WooCommerce traffic.
- The current Workers Free request and CPU limits cover expected traffic.

Use a **Workers Route** when the Worker runs before the external WordPress application server. A Custom Domain would make the Worker itself the origin and is not the deployment model here.

## Worker implementation

The canonical source is <a href="https://github.com/spreywin/sprey-wp-stack/blob/main/cloudflare/failover-worker.js" target="_blank" rel="noopener noreferrer">`cloudflare/failover-worker.js` in Sprey WP Stack</a>. It follows these rules:

- preserve the original request method, body, path, query, headers, and cookies when calling primary;
- make exactly one primary attempt, including for non-idempotent requests;
- fail over only for network errors, the explicit timeout, and `502/503/504/521`;
- cancel an unused failed-origin response body before fetching fallback;
- fetch only the root static outage document with `GET` or `HEAD`;
- return fallback as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and an `X-Sprey-Failover` diagnostic header;
- return a small plain-text `503` if both primary and fallback fail.

Do not add every `500` response to the failover set without reviewing the application behavior. A WordPress or WooCommerce error page may contain information the operator or customer needs, and broad failover can hide application defects.

## Create the Worker

1. Open **Workers & Pages** in the Cloudflare dashboard.
2. Create a Worker named `sprey-store-failover`.
3. Replace the starter source with the canonical Worker source and deploy it.
4. Do not attach `sprey.win/*` until the Worker source has been reviewed.

## Test on a separate hostname

When the production storefront must remain uninterrupted, use a temporary hostname such as `failover-test.sprey.win`:

1. Add a proxied DNS record for the test hostname that resolves to the same WordPress VPS.
2. Configure Caddy to accept the test hostname and verify its certificate before adding the Worker route.
3. In the Worker's **Domains & Routes**, add `failover-test.sprey.win/*` in the `sprey.win` zone.
4. Through that hostname, inspect the home page, products, assets, redirects, cookies, login, cart, and checkout. Do not place a real order.
5. Confirm healthy responses do not contain `X-Sprey-Failover`.
6. During a controlled maintenance window, make only the test hostname or path return a handled failure.
7. Confirm the Worker returns the static page with HTTP `503` and `X-Sprey-Failover: static-outage-page`.
8. Restore primary and confirm the next request returns WordPress without a DNS change.

Remove the temporary Caddy hostname and DNS record after the test if they are not intended to remain. The example hostname is documentation, not a statement that it is currently deployed.

## Enable production

1. Recheck the deployed source, failure statuses, timeout, and fallback response.
2. Add the `sprey.win/*` Workers Route to `sprey-store-failover`.
3. Keep the existing proxied DNS record pointing to the WordPress VPS. `fetch(request)` from a Route continues to the application server defined by Cloudflare DNS.
4. Set the route failure mode to **Fail open (proceed)** so a Worker execution failure does not block a healthy origin.
5. Validate the home page, product pages, assets, cart, checkout, account, and WordPress administration.
6. Review Worker logs and analytics for exceptions, timeouts, fallback responses, and Free-plan usage.

## Verified production behavior

The production route has been verified directly on `sprey.win`.

- Healthy origin traffic returned HTTP `200` through Caddy with no `X-Sprey-Failover` header.
- Stopping Caddy produced Cloudflare `521`; handling `521` in the Worker returned the static outage page as HTTP `503` with `Cache-Control: no-store`, `Retry-After: 60`, and `X-Sprey-Failover: static-outage-page`.
- Starting Caddy restored the next request to normal WordPress service without a DNS change.
- The same failover-and-recovery behavior was also verified during a normal VPS reboot and a VPS hard reboot.

These tests verify the full-origin outage path as well as automatic recovery after the server returns.

## Cache boundaries

Failover does not make dynamic commerce content safe to cache. Bypass cache for at least:

- `/cart*`, `/checkout*`, and `/my-account*`;
- `/wp-admin*` and `/wp-login.php*`;
- WooCommerce Store API, REST API, AJAX, and webhook endpoints as applicable;
- authenticated requests and requests with WordPress or WooCommerce cart/session cookies.

Verify the final rule order because later matching Cloudflare Cache Rules can override earlier eligibility settings.

## Validate and roll back

```bash
curl -sS -D - -o /dev/null https://sprey.win/
```

Normal WordPress responses have no `X-Sprey-Failover` header. Controlled failover returns HTTP `503` and either `static-outage-page` or `fallback-unavailable` in that header.

To roll back, remove or disable only the `sprey.win/*` Workers Route. Do not change DNS. With the proxied origin record untouched, Cloudflare sends requests directly to the WordPress VPS again.

For operational diagnosis and incident handling, use [WP Stack failover operations](/operations/wp-stack-failover/).

## References

- <a href="https://developers.cloudflare.com/workers/configuration/routing/routes/" target="_blank" rel="noopener noreferrer">Cloudflare Workers Routes</a>
- <a href="https://developers.cloudflare.com/workers/platform/limits/" target="_blank" rel="noopener noreferrer">Cloudflare Workers limits</a>
- <a href="https://developers.cloudflare.com/cache/how-to/cache-rules/" target="_blank" rel="noopener noreferrer">Cloudflare Cache Rules</a>
- <a href="https://developers.cloudflare.com/pages/configuration/serving-pages/" target="_blank" rel="noopener noreferrer">Cloudflare Pages serving behavior</a>
