---
title: Sprey Processing
description: Sprey's live non-custodial crypto payment infrastructure and reference deployment behind pay.sprey.win.
---

**Sprey Processing** is Sprey's live non-custodial crypto payment infrastructure and the reference implementation of its **non-custodial crypto acquiring** model. It is intended for businesses accepting crypto payments both **online and in person** through `pay.sprey.win`.

In Sprey terminology, **non-custodial crypto acquiring** means infrastructure that lets a merchant accept crypto payments directly to a merchant-controlled wallet or payment destination while Sprey provides invoice, payment-state observation, and integration infrastructure. Sprey does not initiate, route, receive, hold, or forward merchant funds.

BTCPay Server is the current foundation of Sprey Processing. WooCommerce is one supported storefront integration, not the definition or boundary of the product.

## Product scope

Sprey Processing is designed around the standard BTCPay merchant model. The intended product boundary and current verification status are:

| Capability | Product role | Current Sprey status |
| --- | --- | --- |
| Online stores | WooCommerce and other supported e-commerce integrations | Product scope; WooCommerce is the current prepared stack path |
| Point of Sale | In-person acceptance from connected merchant devices | Product scope; verification pending |
| QR payments | Customer-facing QR payment flows for online or in-person use | Product scope; verification pending |
| Payment Requests | Shareable merchant payment requests independent of a cart | Product scope; verification pending |
| Payment Buttons | Direct payment entry points embedded in merchant content | Product scope; verification pending |
| Donations | Direct donation flows using BTCPay applications and buttons | Product scope; verification pending |
| Crowdfunding | BTCPay crowdfunding applications and campaigns | Product scope; verification pending |
| API/custom integrations | Direct merchant-system integration with BTCPay | Product scope; verification pending |

A capability may belong to the intended product boundary because it is supported by upstream BTCPay Server. It becomes a **verified Sprey Processing capability** only after its complete merchant flow has been configured and tested on the reference deployment.

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
    integrations        merchant devices       Donations
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

`Sprey WP Stack` is therefore a ready-made **online-commerce implementation** of Sprey Processing, not the boundary of Sprey Processing itself:

```text
Sprey WP Stack
WordPress + WooCommerce
        |
        | BTCPay integration
        v
Sprey Processing
pay.sprey.win
```

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
| Swap | 4 GiB `/swapfile`; `vm.swappiness=10` |
| Network perimeter | Hetzner Cloud Firewall; inbound 22/tcp and ICMP only |
| Web ingress | Cloudflare Tunnel to the BTCPay nginx service |
| Application health | `https://pay.sprey.win/api/v1/health`; verified HTTP 200 with `{"synchronized":true}` |
| Monitoring approach | Native provider/component signals first; no additional monitoring stack on the BTCPay host at this checkpoint |
| Planned external watchdog | Run outside `sprey-btcpay`, preferably from the future `sprey.win` application/server layer |
| Automatic OS updates | `unattended-upgrades` enabled; automatic reboot not enabled |
| BTCPay Server | v2.4.3, live |
| Bitcoin | Mainnet, synchronized pruned node; automatic pruning enabled with a 25 GiB target |
| Lightning | Not configured in the reference store |
| SMTP | Configured for server and Processing email delivery |
| VPS backups | Hetzner Backups enabled |
| Application backup | A local legacy `backup.sh` run completed successfully; restore testing and the canonical long-term backup workflow remain pending |

## Verified Bitcoin Core checkpoint

Bitcoin Core was verified with the official deployment helper `bitcoin-cli.sh getblockchaininfo`. At the verified checkpoint:

- the node was on `main`;
- block and header heights matched;
- `initialblockdownload` was `false`;
- automatic pruning was enabled;
- the prune target was `26214400000` bytes (25 GiB);
- there were no Bitcoin Core warnings.

## Verified monitoring baseline

The public application health endpoint was verified through the real production ingress path:

```text
GET https://pay.sprey.win/api/v1/health
HTTP/2 200
{"synchronized":true}
```

This request traverses Cloudflare and the Cloudflare Tunnel before reaching BTCPay, so it verifies the externally reachable Processing application path rather than only a localhost service.

The same health endpoint returned `{"synchronized":true}` after the local application backup run stopped and restarted the BTCPay Docker stack. This verifies that the reference deployment returned to synchronized service after that backup checkpoint.

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

`adminpay.sprey.win` is configured as an additional BTCPay host and is protected by Cloudflare Access.

## Current product state

The BTCPay Server instance is online and the **Sprey Processing** store exists. The public and administrative ingress paths, origin network perimeter, Bitcoin Core synchronization and pruning state, and public BTCPay health endpoint have been verified.

A payment method is not considered operational merely because its configuration page is available. It becomes part of the verified Sprey Processing reference only after the complete merchant flow has been tested: merchant destination configured, invoice created, customer payment sent independently, network state observed by BTCPay, and invoice state reported correctly.

## Product verification path

The canonical initial product verification path follows the merchant journey:

1. **Bitcoin Core — verified.** Confirm mainnet synchronization, out-of-IBD state, pruning configuration, and absence of warnings.
2. **Store.** Verify the `Sprey Processing` BTCPay Store configuration required for the first real payment.
3. **Merchant-controlled wallet.** Connect and verify the merchant-controlled Bitcoin destination without exposing seed words or private keys to Sprey.
4. **Invoice.** Create a real invoice through BTCPay.
5. **Real payment.** Send a small real on-chain Bitcoin payment independently of Sprey.
6. **Network observation.** Verify that BTCPay observes the Bitcoin network and determines the correct invoice state.
7. **Invoice state.** Verify the resulting invoice lifecycle and merchant-facing status.
8. **Document and extend.** Record the verified configuration and recovery implications, then add other payment methods and integrations one at a time.

NBXplorer remains an internal BTCPay component and can be inspected when troubleshooting requires it, but a standalone NBXplorer health check is no longer the first merchant product milestone.

Lightning remains optional and separate from the initial on-chain Bitcoin verification path.

The next product checkpoint is **Store configuration**, followed by the merchant-controlled wallet connection.

## Backup checkpoint

The reference host currently has two distinct backup layers:

1. **Hetzner Backups** provide the provider-level VPS backup layer.
2. A local BTCPay application backup was produced by the deployment's existing legacy `backup.sh`, which dumped PostgreSQL, stopped the BTCPay Docker stack, archived the selected application data, restarted the stack, and completed successfully.

After that restart, `https://pay.sprey.win/api/v1/health` again returned `{"synchronized":true}`.

This does **not** close the application backup work. Restore has not yet been tested, and the canonical long-term BTCPay backup/restore workflow has not yet been selected and verified. Until restore testing succeeds, the local archive is evidence of a successful backup run, not a verified disaster-recovery procedure.

## Self-host BTCPay Server

Sprey also documents the path for operators who prefer to run their own BTCPay Server instead of using `pay.sprey.win`.

See [Self-host BTCPay Server](/products/self-host-btcpay-server/).

## Documentation rule

The operational rule for Sprey Processing is:

> **Build it. Verify it. Document it.**

A configuration becomes canonical documentation only after it is understood and verified on the real deployment. Where upstream BTCPay documentation offers multiple valid approaches, Sprey documentation should distinguish the upstream choices from the configuration actually used and tested by Sprey.
