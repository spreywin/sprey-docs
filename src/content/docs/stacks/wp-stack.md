---
title: Sprey WP Stack
description: Sprey's ready-made WordPress and WooCommerce stack for online commerce, integrated with Sprey Processing.
---

**Sprey WP Stack** is Sprey's ready-made WordPress and WooCommerce implementation for **online commerce**. It packages the storefront layer needed to run a merchant site and connect WooCommerce to BTCPay Server.

It is deliberately **not the boundary of Sprey Processing**.

Sprey Processing at `pay.sprey.win` is the broader non-custodial crypto payment infrastructure and acquiring model. It is intended to support online stores, in-person Point of Sale flows, QR payments, Payment Requests, Payment Buttons and donations, crowdfunding, and API/custom integrations. WP Stack is one prepared online-store path into that broader Processing product.

```text
Sprey WP Stack
WordPress + WooCommerce
        |
        | BTCPay integration
        v
Sprey Processing
pay.sprey.win
```

## Why Sprey WP Stack exists

Earlier BTCPay Server deployment tooling exposed optional add-on services, including a self-hosted WooCommerce deployment with the BTCPay Server plugin pre-installed. The current BTCPay Server Configurator focuses its standard deployment wizard on BTCPay infrastructure and no longer exposes WooCommerce as a normal wizard choice. The underlying `btcpayserver-docker` project still retains the optional `opt-add-woocommerce` fragment, so this is a change in the standard configuration experience rather than the removal of WooCommerce support itself.

Sprey WP Stack fills the practical gap with a dedicated, reproducible WordPress + WooCommerce stack designed to integrate with BTCPay Server while keeping the storefront and payment infrastructure separated.

That separation is intentional. It reduces coupling and allows the storefront and BTCPay Server to be secured, updated, backed up, scaled, recovered, or replaced independently. It also keeps WordPress and its larger application surface away from the payment server itself.

Sprey WP Stack adds a prepared commerce layer around that model: Docker Compose deployment, Caddy and TLS, WooCommerce, the BTCPay integration, MariaDB, locally bound maintenance tooling, and documentation for reproducing and operating the stack without a control panel.

## Responsibility boundary

The storefront and payment infrastructure remain separate:

```text
WooCommerce
  |- products/catalog
  |- cart/checkout
  `- orders
       |
       `- asks BTCPay to create and track an invoice

Customer
  |
  `- pays independently
       |
       v
merchant-controlled wallet/payment destination
       ^
       |
BTCPay observes the configured payment network
  |
  `- determines invoice state
       |
       v
WooCommerce receives the payment state
```

The payment itself happens independently of Sprey. Sprey does not initiate, route, receive, hold, or forward merchant funds.

## Stack components

The current stack is intentionally small and panel-free:

- Caddy as the public web server and TLS endpoint.
- WordPress with Apache and PHP.
- WooCommerce for products, cart, checkout, and orders.
- BTCPay Server WooCommerce integration for invoice creation and payment-state exchange.
- MariaDB for WordPress data.
- phpMyAdmin bound locally for maintenance rather than exposed publicly.

The stack is intended to be reproducible with Docker Compose and understandable without a control panel.

## Product relationship

Use WP Stack when the merchant needs a complete WordPress/WooCommerce storefront.

Do **not** require WP Stack when a merchant only needs another Sprey Processing flow such as Point of Sale, QR-based in-person acceptance, a Payment Request, Payment Button, donation flow, crowdfunding application, or a direct API integration.

This separation is intentional: the storefront can evolve independently while `pay.sprey.win` remains the shared payment infrastructure.

## Verification rule

WP Stack capabilities are documented as verified only after the actual WordPress/WooCommerce deployment and BTCPay integration have been tested end to end. Upstream BTCPay capabilities outside WooCommerce belong to the Sprey Processing product scope and are verified separately on `pay.sprey.win`.

The operating rule is:

> **Build it. Verify it. Document it.**
