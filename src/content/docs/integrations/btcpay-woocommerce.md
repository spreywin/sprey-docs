---
title: BTCPay for WooCommerce
sidebar:
  order: 1
description: Connect a Sprey WP Stack storefront to BTCPay Server using the official WooCommerce V2 plugin.
---

Sprey WP Stack bundles **WooCommerce** and the official **BTCPay for WooCommerce V2** plugin in its WordPress image. BTCPay Server itself remains separate from the website stack.

## Choose a BTCPay Server

For a Sprey deployment, the recommended hosted endpoint is <a href="https://pay.sprey.win/" target="_blank" rel="noopener noreferrer">pay.sprey.win</a>. Create or use your BTCPay account and store there, then connect that store to WooCommerce.

If you only want to evaluate BTCPay Server before choosing a production host, the BTCPay Server project provides official public demo instances:

- <a href="https://mainnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">Mainnet demo</a> — real Bitcoin network; testing only, with no uptime guarantee.
- <a href="https://testnet.demo.btcpayserver.org/" target="_blank" rel="noopener noreferrer">Testnet demo</a> — suitable for tests using testnet coins.

:::caution
The official demo servers are for evaluation and testing. Do not treat them as production infrastructure or rely on their availability.
:::

## Prepare the storefront

1. Deploy [Sprey WP Stack](/stacks/wp-stack/) and complete the WordPress installer.
2. In WordPress Admin, activate **WooCommerce** and complete its initial store setup.
3. Activate **BTCPay for WooCommerce V2**. The plugin is already bundled by Sprey WP Stack; a separate download is not required for a new deployment.

## Connect WooCommerce to BTCPay

1. Open the BTCPay settings in WooCommerce.
2. Enter the full HTTPS URL of the BTCPay Server instance. For Sprey, use `https://pay.sprey.win`.
3. Use the plugin's API-key authorization flow to sign in to BTCPay Server and select the intended store.
4. Authorize the application for that store and return to WordPress.
5. Confirm that the BTCPay connection and payment gateway are enabled.

The API-key authorization flow is preferred over manually copying broad credentials because BTCPay can grant the integration the permissions it needs for the selected store.

:::caution
Never commit BTCPay API keys, webhook secrets, wallet seeds, or other payment credentials to Git. Keep credentials in the systems that need them and restrict access to the intended store.
:::

## Test checkout

Before accepting production orders:

1. Create a low-value test product.
2. Place an order through the normal WooCommerce checkout.
3. Confirm that WooCommerce creates a BTCPay invoice and redirects or displays checkout as configured.
4. Complete the payment on the appropriate network.
5. Verify that the BTCPay invoice and WooCommerce order reach the expected paid state.

For non-production testing, prefer the official BTCPay testnet demo so no real bitcoin is required.

## Official references

- <a href="https://docs.btcpayserver.org/WooCommerce/" target="_blank" rel="noopener noreferrer">BTCPay Server — WooCommerce integration</a>
- <a href="https://docs.btcpayserver.org/TryItOut/" target="_blank" rel="noopener noreferrer">BTCPay Server — Try it out</a>
- <a href="https://github.com/btcpayserver/woocommerce-greenfield-plugin" target="_blank" rel="noopener noreferrer">BTCPay for WooCommerce V2 source</a>
