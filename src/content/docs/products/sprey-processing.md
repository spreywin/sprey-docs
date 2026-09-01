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
| Administrative endpoint | `adminpay.sprey.win` behind Cloudflare Access |
| Server hostname | `sprey-btcpay` |
| Hosting | Hetzner Cloud |
| Operating system | Ubuntu 26.04.1 LTS |
| Compute | 4 vCPU / 8 GB RAM |
| Disk | 80 GB SSD |
| Swap | 2 GB |
| Network perimeter | Hetzner Cloud Firewall; inbound 22/tcp and ICMP only |
| Web ingress | Cloudflare Tunnel to the BTCPay nginx service |
| Automatic OS updates | `unattended-upgrades` enabled; automatic reboot not enabled |
| BTCPay Server | v2.4.3, live |
| Bitcoin | Mainnet, pruned node |
| Lightning | Not configured in the reference store |
| SMTP | Configured for server and Processing email delivery |
| VPS backups | Hetzner Backups enabled |

The reference deployment is intentionally documented from observed and verified state. Configuration details that have not yet been reproduced or verified are not presented here as canonical instructions.

## Verified public and administrative ingress

The reference deployment separates the public Processing endpoint from the protected administrative endpoint:

```text
Internet
   |
   v
Cloudflare
   |
   v
Cloudflare Tunnel
   |
   +--> pay.sprey.win ----------------------> nginx -> BTCPay
   |
   +--> adminpay.sprey.win -> Access ------> nginx -> BTCPay
```

`pay.sprey.win` remains public because merchant, customer, API, webhook, and invoice traffic must reach BTCPay without an interactive Access login.

`adminpay.sprey.win` is configured as an additional BTCPay host and is protected by Cloudflare Access. The current Access policy allows a specific administrative email address rather than an entire email domain. The address itself is intentionally not published.

The Cloudflare Tunnel connects to the internal nginx service over HTTP. Public HTTPS terminates at Cloudflare; the reference origin does not publish port 443.

A Hetzner Cloud Firewall is attached to `sprey-btcpay`. Its verified inbound policy allows SSH on TCP port 22 and ICMP. Port 80 is still published by the Docker nginx container on the host, but unsolicited inbound web traffic is dropped by the external Hetzner firewall. This prevents the server IP from acting as a public bypass around the Cloudflare Tunnel. No outbound firewall rules are configured, so the host can establish the outbound connection required by `cloudflared`.

The host UFW service is currently inactive. The reference deployment deliberately relies on the Hetzner Cloud Firewall for the public perimeter rather than claiming UFW protection that is not active.

### Cloudflare compatibility note

Cloudflare Rocket Loader caused BTCPay login JavaScript to fail under BTCPay's Content Security Policy. The failure was reproduced on the reference deployment and disappeared when Rocket Loader was disabled.

The intended configuration is to keep Rocket Loader disabled for the BTCPay hostnames (`pay.sprey.win` and `adminpay.sprey.win`). At the current verified checkpoint Rocket Loader is disabled globally for the zone; replacing that with hostname-specific Cloudflare Configuration Rules remains a follow-up hardening task and is not yet documented as verified state.

## Current product state

The BTCPay Server instance is online and the **Sprey Processing** store exists. The public and administrative ingress paths and the origin network perimeter have been verified. Bitcoin wallet setup and the first end-to-end production payment are the next product verification milestones.

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
