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

For a Sprey deployment, the recommended hosted endpoint is <a href="https://pay.sprey.win/" target="_blank" rel="noopener noreferrer">pay.sprey.win</a>. Create or use your BTCPay account and store there, configure that store with a **merchant-controlled wallet or payment destination**, and then connect the BTCPay store to WooCommerce.

:::note
`pay.sprey.win` provides payment-processing infrastructure and payment-state verification. It is not a custodial wallet. Merchant funds must remain under merchant control rather than being deposited into a Sprey-owned wallet.
:::

If you only want to evaluate BTCPay Server before choosing a production host, the BTCPay Server project provides official public demo instances:

- <a href="https://mainnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">Mainnet demo</a> — real Bitcoin network; testing only, with no uptime guarantee.
- <a href="https://testnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">Testnet demo</a> — suitable for tests using testnet coins.

:::caution
The official demo servers are for evaluation and testing. Do not treat them as production infrastructure or rely on their availability.
:::

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
- <a href="https://github.com/btcpayserver/woocommerce-greenfield-plugin" target="_blank" rel="noopener noreferrer">BTCPay for WooCommerce V2 source</a>
