---
title: Architecture Overview
description: High-level Sprey architecture and product boundaries.
---

Sprey is organized around a small number of independent product and infrastructure layers. The central payment product is **Sprey Processing**, available through `pay.sprey.win`.

## Products

### Sprey Processing

**Live / active.** Sprey Processing is Sprey's non-custodial crypto payment infrastructure and the reference implementation of its **non-custodial crypto acquiring** model. The product is broader than any single storefront integration and is intended to serve online commerce, in-person Point of Sale and QR flows, Payment Requests, Payment Buttons and donations, crowdfunding, and API/custom integrations through `pay.sprey.win`.

Merchant payments go directly to merchant-controlled wallets or payment destinations. Sprey provides invoice, payment-state observation, and integration infrastructure; it does not initiate, route, receive, hold, or forward merchant funds.

### Sprey WP Stack

**Live stack / online-commerce implementation.** WordPress + WooCommerce with the BTCPay integration required to connect a storefront to Sprey Processing. It is one ready-made implementation of the broader Processing product, not the boundary of `pay.sprey.win`.

### Sprey Wallet

**Planned.** A non-custodial wallet companion for Sprey Processing. Compatible external merchant-controlled wallets remain supported; Sprey Wallet is not intended to become a requirement for Processing.

See [Sprey Wallet](/products/sprey-wallet/) for the established product direction.

### Sprey RPC

**Planned.** Independent RPC/eRPC infrastructure for TRON and EVM networks with provider aggregation, health checks, API access, and plan-based billing.

### Sprey VPN

**Planned.** Privacy-oriented VPN service with isolated traffic nodes and automated crypto billing. Traffic nodes remain separate from payment and web infrastructure.

## Sprey Processing boundary

Sprey Processing is the reference implementation of Sprey's **non-custodial crypto acquiring** model: merchants accept crypto payments directly to merchant-controlled wallets or payment destinations while Sprey provides invoice, payment-state observation, and integration infrastructure.

The product boundary is broader than WooCommerce. `pay.sprey.win` is intended to support the standard BTCPay merchant use cases across online and in-person payment flows:

```text
                         SPREY PROCESSING
                         pay.sprey.win
                               |
          +--------------------+--------------------+
          |                    |                    |
       ONLINE              IN PERSON             DIRECT
          |                    |                    |
    WooCommerce              POS              Payment Requests
    other stores              QR              Payment Buttons
    integrations        phone/tablet/PC        Donations
                                               Crowdfunding
          |                    |                    |
          +--------------------+--------------------+
                               |
                          BTCPay Store
                               |
                               v
                        payment network
                               |
                               v
                  merchant-controlled wallet
```

API and custom integrations can connect merchant systems directly to the Processing layer without requiring WordPress or WooCommerce.

## Sprey WP Stack boundary

`Sprey WP Stack` is one ready-made **online-commerce implementation** connected to Sprey Processing:

```text
Sprey WP Stack
WordPress + WooCommerce
        |
        | BTCPay integration
        v
Sprey Processing
pay.sprey.win
```

WP Stack owns the WordPress/WooCommerce storefront layer. It is not required for Point of Sale, QR payment flows, Payment Requests, Payment Buttons, donations, crowdfunding, or direct API integrations.

## Payment ownership

The payment itself happens independently of Sprey.

```text
Merchant sale / order / payment request
  |
  `- asks BTCPay to create or track an invoice

Customer
  |
  `- pays independently
       |
       v
merchant-controlled wallet/payment destination
       ^
       |
BTCPay observes the Bitcoin blockchain or another configured payment network
  |
  `- determines invoice state
       |
       v
merchant-facing integration receives status
```

Sprey does not initiate, route, receive, hold, or forward merchant funds.

## Verification boundary

Sprey distinguishes between **upstream capability** and **verified Sprey capability**.

A feature documented by BTCPay Server can be part of the intended Sprey Processing product scope before Sprey has configured it. It becomes a verified Sprey capability only after it is configured and tested on the reference deployment.

This preserves a clear operational rule:

> **Build it. Verify it. Document it.**

## Current reference deployment

The current Processing reference deployment is `pay.sprey.win`, with administrative access through `adminpay.sprey.win` behind Cloudflare Access. BTCPay Server runs on the dedicated `sprey-btcpay` host, with a synchronized pruned Bitcoin Core node and no local Lightning node in the initial reference configuration.

The initial merchant verification path is:

```text
Bitcoin Core [verified]
        |
        v
BTCPay Store
        |
        v
merchant-controlled wallet
        |
        v
invoice
        |
        v
real customer payment
        |
        v
BTCPay network observation
        |
        v
invoice state verified
```

Internal components such as NBXplorer remain part of the BTCPay implementation, but they are not treated as separate merchant-facing product milestones unless troubleshooting requires component-level inspection.

## Separation of concerns

Sprey components should remain loosely coupled where practical:

- **Sprey Processing** — payment infrastructure and merchant payment flows.
- **Sprey WP Stack** — WordPress/WooCommerce storefront implementation.
- **Sprey Wallet** — wallet guidance and merchant custody boundary.
- **Sprey RPC** — future independent RPC/API infrastructure.
- **sprey.win** — public product and application layer.
- **docs.sprey.win** — canonical operational documentation.
- **status.sprey.win** — planned public service status layer.

A new component should be added to another product's host only when there is a concrete operational reason. Shared branding does not require shared runtime infrastructure.

## Engineering rule

Architecture changes should follow the smallest-correct-change principle. Prefer native product capabilities and provider-level controls before adding custom middleware, panels, monitoring stacks, or tightly coupled services.

See [Engineering Principles](/architecture/engineering-principles/) for the canonical Sprey engineering rules.

## v1 roadmap

1. Complete the merchant verification path on the live Sprey Processing reference deployment: Store -> merchant-controlled wallet -> Invoice -> real Bitcoin payment -> verified invoice state.
2. Document each Processing capability only after it is configured and verified on `pay.sprey.win`, expanding from the initial on-chain Bitcoin flow to the standard BTCPay merchant use cases in a controlled sequence.
3. Validate Sprey WP Stack against Sprey Processing as the ready-made WordPress/WooCommerce online-commerce implementation, including order-status synchronization and the non-custodial payment boundary.
4. Finalize reproducible backup, restore, update, monitoring, and recovery procedures for the Processing reference deployment.
5. Finalize the `sprey.win` public product/application layer and its request-time Cloudflare failover path without coupling it to payment infrastructure.
6. Define the Sprey Wallet architecture and MVP as an optional non-custodial companion to Processing.
7. Add `status.sprey.win` and the external Processing watchdog when the monitoring layer is implemented and verified.
8. Add Sprey RPC and VPN stacks as those products move from **Planned** to implementation.

This document should be updated when an architectural decision changes, not merely when marketing copy changes.
