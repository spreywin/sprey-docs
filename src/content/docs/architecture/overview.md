---
title: Sprey Architecture v1
description: Canonical platform map, service boundaries, domains, stacks, and roadmap for Sprey.
---

This page is the canonical map of the Sprey platform. It separates customer-facing **products** from deployable **stacks** and from shared infrastructure.

## Core principles

- Services are separated by responsibility rather than placed on one monolithic server.
- Documentation is static and independent from production VPS infrastructure.
- Public websites, payment infrastructure, RPC infrastructure, VPN traffic nodes, monitoring, and documentation are separate concerns.
- Sprey Processing is designed around non-custodial payment infrastructure: customer funds remain under customer control.
- Lightning integrations use customer-controlled external nodes; operating a customer-specific node may be offered as a separate deployment service.
- Planned components are documented as **Planned** until they exist in production.

## Products

### Sprey Processing

Crypto payment infrastructure built around BTCPay Server and automation. BTCPay remains separate from the WordPress storefront stack.

**Current / active direction:** `pay.sprey.win`

### Sprey RPC

**Planned.** RPC/eRPC gateway for TRON and EVM networks with provider aggregation, health checks, API keys, and plan-based billing.

**Planned host:** `rpc.sprey.win`

### Sprey VPN

**Planned.** Privacy-oriented VPN service with isolated traffic nodes and automated crypto billing. Traffic nodes remain separate from payment and web infrastructure.

## Public service map

| Host | Role | Status |
| --- | --- | --- |
| `sprey.win` | Public website and WooCommerce store | Current direction |
| `pay.sprey.win` | BTCPay / payment infrastructure | Current |
| `btcpay.sprey.win` | Additional BTCPay host / alias where required | Current architecture |
| `app.sprey.win` | Customer application / control plane | Planned |
| `rpc.sprey.win` | RPC/eRPC gateway | Planned |
| `status.sprey.win` | Public service status | Planned |
| `docs.sprey.win` | Canonical documentation portal on GitHub Pages | In progress |

## Deployable stacks

### Sprey WP Stack

WordPress + WooCommerce + Caddy + MariaDB in Docker Compose with an optional local-only phpMyAdmin profile.

Repository: [`spreywin/sprey-wp-stack`](https://github.com/spreywin/sprey-wp-stack)

### BTCPay Stack

Payment-server deployment and operating conventions for Sprey Processing. It remains separate from the WordPress application server.

**Documentation status:** Planned.

### RPC Stack

Gateway, provider aggregation, health checks, API access, and billing components for Sprey RPC.

**Documentation status:** Planned.

### VPN Node Stack

Repeatable deployment for isolated VPN traffic nodes. Control-plane and traffic-node responsibilities remain separate.

**Documentation status:** Planned.

## Edge and availability

Cloudflare may sit in front of `sprey.win` for DNS, TLS, edge protection, and caching rules appropriate for WordPress and WooCommerce.

The v1 design includes a **static outage fallback** hosted separately from the WordPress VPS. If the application origin is unavailable, an outage page can be served through Cloudflare infrastructure. The fallback is informational only and does not emulate WooCommerce cart, account, or checkout state.

## Documentation architecture

The documentation source lives in [`spreywin/sprey-docs`](https://github.com/spreywin/sprey-docs), is built with Astro Starlight using GitHub Actions, and is served by GitHub Pages. No Sprey VPS is required to keep documentation online.

Canonical public host: `docs.sprey.win`.

## v1 roadmap

1. Establish the independent documentation portal.
2. Finalize Sprey WP Stack v1 and production hardening.
3. Publish reproducible BTCPay for WooCommerce V2 integration.
4. Publish reproducible Cloudflare production and outage-failover configuration.
5. Document backup, update, monitoring, and recovery procedures.
6. Expand Processing automation and the future customer application.
7. Add RPC and VPN stacks as those products move from Planned to implementation.

This document should be updated when an architectural decision changes, not merely when marketing copy changes.
