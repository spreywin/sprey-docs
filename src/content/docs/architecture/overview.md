---
title: Sprey Architecture v1
description: Canonical platform map, service boundaries, domains, stacks, and roadmap for Sprey.
---

This page is the canonical map of the Sprey platform. It separates customer-facing **products** from deployable **stacks** and from shared infrastructure.

## Core principles

- Services are separated by responsibility rather than placed on one monolithic server.
- Documentation is static and independent from production VPS infrastructure.
- Public websites, payment infrastructure, RPC infrastructure, VPN traffic nodes, monitoring, and documentation are separate concerns.
- Sprey Processing is non-custodial: merchant funds go to merchant-controlled wallets or payment destinations; Sprey does not receive, hold, or forward them.
- BTCPay Server creates and observes invoice/payment state, while WooCommerce owns products and orders and updates order status from BTCPay events.
- Lightning integrations use customer-controlled external nodes; operating a customer-specific node may be offered as a separate deployment service.
- Planned components are documented as **Planned** until they exist in production.

## Products

### Sprey Processing

Crypto payment infrastructure built around BTCPay Server and automation. BTCPay remains separate from the WordPress storefront stack.

The core payment path is deliberately non-custodial:

```text
WooCommerce order -> BTCPay invoice -> merchant-controlled wallet / payment destination
                         |
                         +-> verified invoice/payment state -> WooCommerce order status
```

WooCommerce stores the catalog, cart, checkout, and order data. BTCPay verifies whether the invoice has been paid and reports that state back to the storefront. Sprey Processing is not the destination or intermediary for merchant funds.

**Current / active service:** [pay.sprey.win](https://pay.sprey.win/)

### Sprey RPC

**Planned.** RPC/eRPC gateway for TRON and EVM networks with provider aggregation, health checks, API keys, and plan-based billing.

**Planned host:** `rpc.sprey.win`

### Sprey VPN

**Planned.** Privacy-oriented VPN service with isolated traffic nodes and automated crypto billing. Traffic nodes remain separate from payment and web infrastructure.

## Public service map

| Host | Role | Status |
| --- | --- | --- |
| `sprey.win` | Public website and WooCommerce store | Planned |
| [pay.sprey.win](https://pay.sprey.win/) | Non-custodial BTCPay processing and payment-state verification | **Live** |
| `btcpay.sprey.win` | Additional BTCPay host / alias where required | Planned |
| [wp-stack.sprey.win](https://wp-stack.sprey.win/) | Sprey WP Stack product landing | **Live** |
| `app.sprey.win` | Customer application / control plane | Planned |
| `rpc.sprey.win` | RPC/eRPC gateway | Planned |
| `status.sprey.win` | Public service status | Planned |
| [docs.sprey.win](https://docs.sprey.win/) | Canonical documentation portal on GitHub Pages | **Live** |

## Deployable stacks

### Sprey WP Stack

WordPress + WooCommerce + BTCPay for WooCommerce V2 + Caddy + MariaDB in Docker Compose, with an optional local-only phpMyAdmin profile. WooCommerce and the BTCPay V2 plugin are bundled into the WordPress application image; BTCPay Server itself remains separate payment infrastructure. Products and orders stay in WooCommerce, while payment settlement stays with the merchant-controlled wallet or payment destination.

Repository: <a class="github-repository-badge" href="https://github.com/spreywin/sprey-wp-stack" target="_blank" rel="noopener noreferrer">spreywin/sprey-wp-stack</a>

### BTCPay Stack

Payment-server deployment and operating conventions for Sprey Processing. It remains separate from the WordPress application server and must preserve the non-custodial boundary: merchant funds are not held by Sprey.

**Documentation status:** Planned.

### RPC Stack

Gateway, provider aggregation, health checks, API access, and billing components for Sprey RPC.

**Documentation status:** Planned.

### VPN Node Stack

Repeatable deployment for isolated VPN traffic nodes. Control-plane and traffic-node responsibilities remain separate.

**Documentation status:** Planned.

## Edge and availability

Cloudflare sits in front of `sprey.win` for DNS, TLS, edge protection, request-time failover, and caching rules appropriate for WordPress and WooCommerce.

The v1 availability path is:

```text
visitor -> Cloudflare Worker -> primary WordPress VPS
                            \-> sprey-outage.pages.dev on failure
```

The Worker is attached to `sprey.win/*` as a Workers Route. It attempts the primary origin for every visitor request. A network error, bounded timeout, or selected upstream `502`, `503`, or `504` response switches that request to the static Cloudflare Pages outage site. The next request tries primary again, so recovery is automatic once WordPress responds successfully.

This free design replaces Cloudflare Load Balancing as the primary v1 failover mechanism. It is **request-time failover, not an independent periodic health monitor**: no background probe detects an outage before traffic arrives. The fallback is informational only and cannot provide WooCommerce cart, account, checkout, order, session, or payment functionality.

Implementation and rollout: [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/). Incident checks: [WP Stack failover operations](/operations/wp-stack-failover/).

## Documentation architecture

The documentation source lives in <a class="github-repository-badge" href="https://github.com/spreywin/sprey-docs" target="_blank" rel="noopener noreferrer">spreywin/sprey-docs</a>, is built with Astro Starlight using GitHub Actions, and is served by GitHub Pages. No Sprey VPS is required to keep documentation online.

Canonical public host: [docs.sprey.win](https://docs.sprey.win/)

## v1 roadmap

1. Establish the independent documentation portal.
2. Finalize Sprey WP Stack v1 and production hardening.
3. Validate the bundled WooCommerce and BTCPay for WooCommerce V2 integration against Sprey Processing, including direct merchant settlement and order-status synchronization.
4. Operate and validate the Cloudflare Worker request-time failover configuration.
5. Document backup, update, monitoring, and recovery procedures.
6. Expand Processing automation and the future customer application.
7. Add RPC and VPN stacks as those products move from Planned to implementation.

This document should be updated when an architectural decision changes, not merely when marketing copy changes.
