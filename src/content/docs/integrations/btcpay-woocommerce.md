---
title: BTCPay for WooCommerce
sidebar:
  order: 1
description: Connect a Sprey WP Stack storefront to BTCPay Server using the official WooCommerce V2 plugin.
---

Sprey WP Stack bundles **WooCommerce** and the official **BTCPay for WooCommerce V2** plugin in its WordPress image. BTCPay Server itself remains separate from the website stack.

The responsibilities are intentionally separated: **WooCommerce owns products and orders; the merchant owns the payment destination; BTCPay verifies payment state and reports it back to WooCommerce.** Sprey Processing does not receive, hold, or forward merchant funds.

## Payment flow

```text
Customer
   │
   ▼
WooCommerce order
   │
   ▼
BTCPay invoice ──────────────> Merchant-controlled wallet / payment destination
   │                                      │
   └──── payment status <─────────────────┘
   │
   ▼
WooCommerce order status
```

A product exists in WooCommerce, not in BTCPay Server. At checkout, the BTCPay plugin creates an invoice for the WooCommerce order. The customer pays the payment destination configured by the merchant. BTCPay observes the payment and invoice state, then the plugin updates the WooCommerce order accordingly.

## Choose a BTCPay Server

There are four practical paths depending on whether you want a ready hosted service, a temporary test environment, or full infrastructure ownership.

### 1. Sprey Processing — recommended

For a Sprey deployment, the recommended hosted endpoint is <a href="https://pay.sprey.win/" target="_blank" rel="noopener noreferrer">pay.sprey.win</a>. Create or use your BTCPay account and store there, configure that store with a **merchant-controlled wallet or payment destination**, and then connect the BTCPay store to WooCommerce.

Sprey Processing is designed as a ready-to-use non-custodial payment layer: the merchant keeps control of funds while Sprey operates the payment-processing infrastructure. In addition to direct Bitcoin payments, the Sprey deployment can expose additional payment methods through installed and configured BTCPay integrations and plugins, including supported USDt networks, opt-in altcoins, and exchange/payment integrations where enabled. Availability depends on the payment methods and integrations configured for the Sprey service.

This gives a merchant a broader integration surface without requiring them to deploy, synchronize, secure, update, and monitor their own BTCPay Server and supporting infrastructure.

:::note
`pay.sprey.win` provides payment-processing infrastructure and payment-state verification. It is not a custodial wallet. Merchant funds must remain under merchant control rather than being deposited into a Sprey-owned wallet.
:::

### 2. Official mainnet demo

The BTCPay Server project provides a public <a href="https://mainnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">mainnet demo</a> using the real Bitcoin network. It is useful for evaluation, but it is not production infrastructure and carries no uptime guarantee.

### 3. Official testnet demo

The official <a href="https://testnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">testnet demo</a> is suitable for testing the integration with testnet coins before using real funds.

:::caution
The official demo servers are for evaluation and testing. Do not treat them as production infrastructure or rely on their availability.
:::

### 4. Self-host BTCPay Server

Merchants who want full control of the payment-server infrastructure can deploy their own BTCPay Server. The project officially supports several deployment approaches, including hosted/web deployment options, Docker deployment on a VPS, deployment on supported hardware, and advanced manual installation. For production self-hosting, BTCPay recommends its supported deployment methods rather than a manual build.

Start with the official <a href="https://docs.btcpayserver.org/Deployment/" target="_blank" rel="noopener noreferrer">BTCPay Server deployment guide</a>. Technical users deploying to a VPS can also use the official <a href="https://docs.btcpayserver.org/Docker/" target="_blank" rel="noopener noreferrer">Docker deployment</a>, while the <a href="https://docs.btcpayserver.org/Configurator/" target="_blank" rel="noopener noreferrer">BTCPay Server Configurator</a> can prepare or deploy a Docker configuration over SSH.

Self-hosting gives the merchant control of the BTCPay application and node infrastructure, but also makes the merchant responsible for server security, blockchain/node resources, updates, monitoring, backups, availability, and recovery.

## Prepare the storefront

1. Deploy [Sprey WP Stack](/stacks/wp-stack/) and complete the WordPress installer.
2. In WordPress Admin, activate **WooCommerce** and complete its initial store setup. Products, prices, stock, carts, checkout, and orders remain in WooCommerce.
3. Activate **BTCPay for WooCommerce V2**. The plugin is already bundled by Sprey WP Stack; a separate download is not required for a new deployment.

## Prepare the BTCPay store

1. Create or select the BTCPay store that will serve the WooCommerce storefront.
2. Configure the store's supported payment method with the merchant-controlled wallet, account, or external payment destination appropriate to that payment method.
3. Confirm that the destination belongs to the merchant and that Sprey does not hold the spending keys or customer funds.
4. Keep recovery material and spending credentials outside the Sprey-hosted server.

:::caution
For Sprey-hosted BTCPay, do not import wallet seeds or private spending keys into `pay.sprey.win`. Keep custody with the merchant and use a supported external or watch-only configuration where appropriate for the payment method.
:::

## Connect WooCommerce to BTCPay

1. Open the BTCPay settings in WooCommerce.
2. Enter the full HTTPS URL of the BTCPay Server instance. For Sprey, use `https://pay.sprey.win`.
3. Use the plugin's API-key authorization flow to sign in to BTCPay Server and select the intended store.
4. Authorize the application for that store and return to WordPress.
5. Confirm that the BTCPay connection and payment gateway are enabled.

The API-key authorization flow connects WooCommerce to the BTCPay store for invoice creation and status synchronization. It does **not** make BTCPay or Sprey the owner of the merchant's funds.

:::caution
Never commit BTCPay API keys, webhook secrets, wallet seeds, private keys, or other payment credentials to Git. Keep credentials only in the systems that need them and restrict access to the intended store.
:::

## Test checkout

Before accepting production orders:

1. Create a low-value test product in WooCommerce.
2. Place an order through the normal WooCommerce checkout.
3. Confirm that WooCommerce creates a BTCPay invoice and redirects or displays checkout as configured.
4. Complete the payment to the merchant-controlled payment destination on the appropriate network.
5. Verify that BTCPay detects the payment and moves the invoice to the expected state.
6. Verify that WooCommerce receives the status update and moves the order to the expected paid/processing state.
7. Confirm independently that the funds arrived at the merchant-controlled wallet or payment destination, not at a Sprey-owned wallet.

For non-production testing, prefer the official BTCPay testnet demo so no real bitcoin is required.

## Official references

- <a href="https://docs.btcpayserver.org/WooCommerce/" target="_blank" rel="noopener noreferrer">BTCPay Server — WooCommerce integration</a>
- <a href="https://docs.btcpayserver.org/TryItOut/" target="_blank" rel="noopener noreferrer">BTCPay Server — Try it out</a>
- <a href="https://docs.btcpayserver.org/Deployment/" target="_blank" rel="noopener noreferrer">BTCPay Server — deployment methods</a>
- <a href="https://docs.btcpayserver.org/Docker/" target="_blank" rel="noopener noreferrer">BTCPay Server — Docker deployment</a>
- <a href="https://docs.btcpayserver.org/Configurator/" target="_blank" rel="noopener noreferrer">BTCPay Server Configurator</a>
- <a href="https://github.com/btcpayserver/woocommerce-greenfield-plugin" target="_blank" rel="noopener noreferrer">BTCPay for WooCommerce V2 source</a>
