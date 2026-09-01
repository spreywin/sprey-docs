---
title: Sprey Architecture v1
description: Canonical platform map, service boundaries, domains, stacks, and roadmap for Sprey.
---

This page is the canonical map of the Sprey platform. It separates customer-facing **products** from deployable **stacks** and from shared infrastructure.

## Core principles

- Services are separated by responsibility rather than placed on one monolithic server.
- Documentation is static and independent from production VPS infrastructure.
- Public websites, payment infrastructure, RPC infrastructure, VPN traffic nodes, monitoring, and documentation are separate concerns.
- Sprey Processing is non-custodial: merchant funds go to merchant-controlled wallets or payment destinations; Sprey does not initiate, route, receive, hold, or forward them.
- The payment itself happens independently of Sprey. BTCPay observes the configured payment network, determines invoice state from network data, and reports that state to connected integrations.
- WooCommerce owns products and orders; BTCPay remains separate payment infrastructure.
- Lightning integrations use customer-controlled external nodes; operating a customer-specific node may be offered as a separate deployment service.
- Planned components are documented as **Planned** until they exist in production.

The rules used to evolve this architecture are documented separately in [Engineering Principles](/architecture/engineering-principles/).

## Products

### Sprey Processing

Non-custodial payment infrastructure built around BTCPay Server. BTCPay remains separate from the WordPress storefront stack.

The payment path is deliberately non-custodial:

```text
WooCommerce order
      |
      v
BTCPay invoice
      |
      | customer pays independently
      v
merchant-controlled wallet / payment destination

payment network -> BTCPay observes network state -> invoice state -> WooCommerce order status
```

WooCommerce stores the catalog, cart, checkout, and order data. The customer payment happens independently of Sprey to the merchant-controlled destination. BTCPay observes the relevant payment network, determines invoice state from network data, and reports that state back to the storefront. Sprey Processing is not the destination or intermediary for merchant funds.

**Current / active service:** [pay.sprey.win](https://pay.sprey.win/)

The reference deployment uses Cloudflare Tunnel for web ingress. `pay.sprey.win` is the public Processing endpoint; `adminpay.sprey.win` is an additional BTCPay hostname protected by Cloudflare Access. Direct inbound web access to the origin is blocked by a Hetzner Cloud Firewall.

### Sprey Wallet

**Planned.** A non-custodial wallet companion for Sprey Processing. The merchant remains in control of wallet keys and funds, while Sprey Processing remains responsible only for observing and reporting payment state. Compatible external wallets remain supported; Sprey Wallet is not intended to become a requirement for Processing.

See [Sprey Wallet](/products/sprey-wallet/) for the established product direction. Detailed functionality will be defined in its dedicated product track.

### Sprey RPC

**Planned.** RPC/eRPC gateway for TRON and EVM networks with provider aggregation, health checks, API keys, and plan-based billing.

**Planned host:** `rpc.sprey.win`

### Sprey VPN

**Planned.** Privacy-oriented VPN service with isolated traffic nodes and automated crypto billing. Traffic nodes remain separate from payment and web infrastructure.

## Public service map

| Host | Role | Status |
| --- | --- | --- |
| `sprey.win` | Public website and WooCommerce store | Planned |
| [pay.sprey.win](https://pay.sprey.win/) | Public Sprey Processing / BTCPay endpoint | **Live** |
| `adminpay.sprey.win` | Access-protected BTCPay administrative endpoint | **Live** |
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

The live reference deployment uses Cloudflare Tunnel, a public Processing hostname, an Access-protected administrative hostname, and an external origin firewall. See [Self-host BTCPay Server](/products/self-host-btcpay-server/) for the progressively verified runbook.

### RPC Stack

Gateway, provider aggregation, health checks, API access, and billing components for Sprey RPC.

**Documentation status:** Planned.

### VPN Node Stack

Repeatable deployment for isolated VPN traffic nodes. Control-plane and traffic-node responsibilities remain separate.

**Documentation status:** Planned.

## Edge and availability

Cloudflare is used selectively according to each service boundary.

For the future `sprey.win` WordPress storefront, the v1 availability path is:

```text
visitor -> Cloudflare Worker -> primary WordPress VPS
                            \-> sprey-outage.pages.dev on failure
```

The Worker is attached to `sprey.win/*` as a Workers Route. It attempts the primary origin for every visitor request. A network error, bounded timeout, or selected upstream `502`, `503`, or `504` response switches that request to the static Cloudflare Pages outage site. The next request tries primary again, so recovery is automatic once WordPress responds successfully.

This free design replaces Cloudflare Load Balancing as the primary v1 failover mechanism. It is **request-time failover, not an independent periodic health monitor**: no background probe detects an outage before traffic arrives. The fallback is informational only and cannot provide WooCommerce cart, account, checkout, order, session, or payment functionality.

For Sprey Processing, Cloudflare Tunnel is the verified web-ingress path. Cloudflare Access protects only the administrative BTCPay hostname; the public Processing hostname remains reachable without interactive Access authentication.

Implementation and rollout for the storefront: [Cloudflare Worker failover](/integrations/cloudflare-worker-failover/). Incident checks: [WP Stack failover operations](/operations/wp-stack-failover/).

## Documentation architecture

The documentation source lives in <a class="github-repository-badge" href="https://github.com/spreywin/sprey-docs" target="_blank" rel="noopener noreferrer">spreywin/sprey-docs</a>, is built with Astro Starlight using GitHub Actions, and is served by GitHub Pages. No Sprey VPS is required to keep documentation online.

Canonical public host: [docs.sprey.win](https://docs.sprey.win/)

## v1 roadmap

1. Establish the independent documentation portal.
2. Finalize Sprey WP Stack v1 and production hardening.
3. Validate the bundled WooCommerce and BTCPay for WooCommerce V2 integration against Sprey Processing, including direct merchant settlement and order-status synchronization.
4. Operate and validate the Cloudflare Worker request-time failover configuration.
5. Document backup, update, monitoring, and recovery procedures.
6. Expand Processing operations and the future customer application without changing the non-custodial payment boundary.
7. Define the Sprey Wallet architecture and MVP as a non-custodial companion to Processing.
8. Add RPC and VPN stacks as those products move from Planned to implementation.

This document should be updated when an architectural decision changes, not merely when marketing copy changes.
