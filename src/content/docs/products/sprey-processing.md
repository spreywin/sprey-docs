---
title: Sprey Processing
description: Sprey's live non-custodial payment infrastructure and the reference deployment behind pay.sprey.win.
---

**Sprey Processing** is the first live Sprey product. The current reference deployment is available at [pay.sprey.win](https://pay.sprey.win/).

The product is built around BTCPay Server and is designed so that merchant funds go directly to merchant-controlled wallets or payment destinations. Sprey does not initiate, route, receive, hold, or forward merchant funds.

## Payment model

The payment itself happens independently of Sprey. BTCPay observes the Bitcoin blockchain or another configured payment network, determines invoice state from network data, and reports that state to the connected storefront or integration.

For WooCommerce, products, cart, checkout, and orders remain in WooCommerce. BTCPay is separate payment infrastructure.

See [BTCPay + WooCommerce](/integrations/btcpay-woocommerce/) for the integration model.

## Reference deployment

The current Sprey reference deployment uses:

| Component | Current state |
| --- | --- |
| Public endpoint | `pay.sprey.win` |
| Server hostname | `sprey-btcpay` |
| Hosting | Hetzner Cloud |
| Operating system | Ubuntu 26.04 LTS |
| Compute | 4 vCPU / 8 GB RAM |
| Disk | 80 GB SSD |
| Swap | 2 GB |
| Host firewall | UFW enabled; public 22, 80, and 443 |
| Automatic OS updates | `unattended-upgrades` enabled |
| BTCPay Server | Live |
| Bitcoin | Mainnet, pruned node |
| Lightning | Not configured in the reference store |
| SMTP | Configured for server and Processing email delivery |
| VPS backups | Hetzner Backups enabled |

The reference deployment is intentionally documented from observed and verified state. Configuration details that have not yet been reproduced or verified are not presented here as canonical instructions.

## Current product state

The BTCPay Server instance is online and the **Sprey Processing** store exists. Bitcoin wallet setup and the first end-to-end production payment are the next verification milestones.

A payment method is not considered operational merely because its configuration page is available. It becomes part of the verified Sprey Processing reference only after the complete flow has been tested: merchant destination configured, invoice created, customer payment sent independently, network state observed by BTCPay, and invoice state reported correctly.

## Product verification path

1. Complete Bitcoin node synchronization and verify BTCPay/NBXplorer health.
2. Connect a merchant-controlled Bitcoin wallet to the reference store.
3. Create an invoice.
4. Send a real on-chain payment to the merchant-controlled destination.
5. Verify that BTCPay observes the blockchain and determines the correct invoice state.
6. Verify invoice lifecycle and notifications.
7. Document the verified configuration and recovery implications.
8. Add other payment networks and integrations one at a time, only after their behavior is verified.

Lightning remains optional and separate from the initial on-chain Bitcoin verification path.

## Self-host BTCPay Server

Sprey also documents the path for operators who prefer to run their own BTCPay Server instead of using `pay.sprey.win`.

The self-host guide follows the same deployment that is being used for the Sprey reference server. It is built progressively from verified operational knowledge rather than reconstructed from memory.

See [Self-host BTCPay Server](/products/self-host-btcpay-server/).

## Documentation rule

The operational rule for Sprey Processing is:

> **Build it. Verify it. Document it.**

A configuration becomes canonical documentation only after it is understood and verified on the real deployment. Where upstream BTCPay documentation offers multiple valid approaches, Sprey documentation should distinguish the upstream choices from the configuration actually used and tested by Sprey.
