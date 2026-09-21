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
| Payment Requests | Shareable merchant payment requests independent of a cart | **Verified on the reference deployment** |
| Payment Buttons | Direct payment entry points embedded in merchant content | Product scope; verification pending |
| Donations | Direct donation flows using BTCPay applications and buttons | Product scope; verification pending |
| Crowdfunding | BTCPay crowdfunding applications and campaigns | Product scope; verification pending |
| API/custom integrations | Direct merchant-system integration with BTCPay | Product scope; verification pending |
| Multilingual interface | BTCPay language packs selectable by users | Installed on the reference deployment; sample language switching verified |
| Hosted subscriptions | Paid access to the shared BTCPay instance | Trial, expiry, portal recovery, Lightning payment, invoice settlement, return to Active, and next-billing recalculation verified |
| USDt | TRON, Ethereum and Polygon through the installed Tether USDt plugin | **Real paid-invoice E2E verified on TRON, Ethereum and Polygon; merchant-controlled address pools confirmed independently through WDK** |

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
| BTCPay Server | v2.4.4, live |
| Bitcoin | Mainnet, synchronized pruned node; automatic pruning enabled with a 25 GiB target; Store wallet is watch-only |
| Merchant BTC spending wallet | Sparrow desktop wallet; signing authority remains outside BTCPay |
| Lightning | External client-controlled Lightning verified via direct Rizful NWC through the BTCPay Nostr plugin; LNURL disabled for the verified configuration |
| USDt | Tether USDt v0.6.1.0; 10-address merchant pools configured for TRON, Ethereum and Polygon; real paid-invoice E2E verified on all three networks |
| USDt merchant wallet tooling | Tether WDK CLI; TRON and EVM address derivation verified; seed/private keys remain outside BTCPay |
| SMTP | Server SMTP verified by real delivery; Stores inherit server SMTP by default and may override it |
| Multilingual UI | Stable language packs installed; English default; sample public login switching verified |
| Monetization | `Sprey Processing Access` offering configured with monthly, quarterly, yearly and limited Lifetime plans |
| VPS backups | Hetzner Backups enabled; fresh manual pre-plugin checkpoint created and available |
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

## Hosted access and Store defaults

The public Processing instance is being prepared as a paid hosted BTCPay service.

The verified server baseline currently includes:

- public registration enabled;
- up to **3 Stores per non-admin user**;
- a configured default Store template;
- non-admin access to the shared internal Lightning node disabled;
- non-admin hot-wallet creation disabled;
- non-admin cold-wallet creation disabled;
- non-admin User Creation API access disabled;
- server SMTP available to Stores by default, with Store-level override supported.

The active monetization offering is **Sprey Processing Access**. Four plan periods are configured: monthly, quarterly, yearly, and a limited/temporary Lifetime option.

An expired unpaid plan invoice was tested. The invoice correctly expired and no active subscriber was created, although the subsequent default redirect displayed a misleading generic `Payment Successful` page. The backend access state was correct; the redirect behavior remains an upstream UX issue to investigate.

The hosted subscription lifecycle was later completed with the internal `QA Lifecycle Test — DO NOT BUY!` plan. The plan-level `Renewable` setting was found disabled and was enabled; `Optimistic activation` remained disabled. From an `Inactive / Access expired` state, the subscriber portal successfully created a new `$0.18` Lightning payment request. The resulting `213 sat` payment settled automatically through the verified Rizful/NWC path, the plan returned to `Active`, and the next billing date recalculated to `2026-10-21`. The subscriber view retained a `$0.18` credit balance after the payment. This closes the base expiry/recovery lifecycle checkpoint and also provides another successful low-value Lightning payment test.

## Multilingual interface

All stable language packs visible in the current BTCPay translation catalog were installed on the reference deployment. English remains the default language.

Public login switching was directly checked in English, Russian, Dutch, and Portuguese (Brazil).

This is documented as a **multilingual BTCPay interface**. It does not imply that every third-party plugin, custom email, documentation page, or support channel is translated into every installed language.

## Bitcoin wallet boundary

The reference Store uses a **watch-only Bitcoin wallet** in BTCPay. Spending authority remains in a separate merchant-controlled Sparrow wallet.

This preserves the intended ownership boundary:

```text
customer payment
      |
      v
merchant Bitcoin destination
      ^
      |
BTCPay watch-only observation

private signing keys -> merchant-controlled Sparrow wallet
```

BTCPay can derive receiving addresses and observe payment state without holding the merchant's Bitcoin private keys.

## USDt direction

The installed Tether USDt plugin currently exposes:

- USDt on TRON;
- USDt on Ethereum;
- USDt on Polygon.

The reference Store now has **10 merchant-controlled public addresses configured for each supported USDt network**. TRON uses a dedicated 10-address `T...` pool; Ethereum and Polygon use the same 10-address EVM pool derived from the merchant-controlled WDK wallet.

The node/balance layer has been verified on all three networks:

- TRON uses `https://tron-evm-rpc.publicnode.com` and returns balances for all configured addresses;
- Ethereum returns balances for all configured addresses;
- Polygon uses `https://polygon-bor-rpc.publicnode.com` and returns balances for all configured addresses.

All three USDt payment methods show healthy/green state in the live Store. Seed phrases and private keys remain outside BTCPay; only public addresses are provided to the payment plugin.

Real paid-invoice testing is complete on all three currently exposed networks:

- **TRON:** hosted-subscription payment received, confirmations observed, invoice settled, and subscription activated;
- **Ethereum:** exact hosted-subscription amount received, successful `USDT-ETHEREUM` receipt produced, and subscription activated;
- **Polygon:** exact invoice amount received and successful `USDT-POLYGON` receipt produced.

The merchant-controlled WDK wallet independently showed the received balances from the real tests, confirming that settlement reached the merchant-controlled destinations rather than a Sprey-custodied wallet.

**USDt on TRON, Ethereum and Polygon is verified end to end on the reference deployment.**

See [WDK CLI wallet operations](/operations/wdk-cli-wallet/) for the merchant-wallet command reference.

## Current product state

The BTCPay Server instance is online and the **Sprey Processing** Store exists. The public and administrative ingress paths, origin network perimeter, Bitcoin Core synchronization and pruning state, public BTCPay health endpoint, server SMTP delivery, multilingual interface baseline, hosted monetization configuration, subscription expiry/recovery lifecycle, watch-only Bitcoin wallet model, external Lightning/NWC settlement path, Payment Requests, and real USDt settlement on TRON, Ethereum and Polygon have been verified to their stated checkpoints.

A payment method is not considered operational merely because its configuration page is available. It becomes part of the verified Sprey Processing reference only after the complete merchant flow has been tested: merchant destination configured, invoice created, customer payment sent independently, network state observed by BTCPay, and invoice state reported correctly.

For the detailed operational records, see:

- [Sprey Processing verification — 2026-09-10](/operations/processing-verification-2026-09-10/);
- [Sprey Processing verification — 2026-09-11](/operations/processing-verification-2026-09-11/);
- [Sprey Processing verification — 2026-09-14](/operations/processing-verification-2026-09-14/), including real BTC and USDt E2E tests;
- [Sprey Processing verification — 2026-09-15](/operations/processing-verification-2026-09-15/), including Lightning/NWC and the 2026-09-21 subscription lifecycle follow-up.

## Product verification path

The canonical initial product verification path follows the merchant journey:

1. **Bitcoin Core — verified.** Mainnet synchronization, out-of-IBD state, pruning configuration, and absence of warnings are confirmed.
2. **Store — verified baseline.** The `Sprey Processing` Store and hosted defaults are configured and exercised by real customer/subscriber flows.
3. **Merchant-controlled wallets — verified.** BTC uses watch-only observation with external signing authority; USDt uses merchant-controlled WDK-derived address pools without exposing private keys to BTCPay.
4. **Invoices and Payment Requests — verified.** Real invoice/request creation and customer payment entry points have been exercised on the reference deployment.
5. **Real payments — verified.** BTC on-chain, USDt on TRON/Ethereum/Polygon, and external Lightning/NWC have all completed real payment tests.
6. **Network observation — verified.** BTCPay observed the relevant payment networks and determined payment state correctly in the verified tests.
7. **Invoice settlement — verified.** Paid invoice lifecycle and merchant-facing settlement state have been confirmed on the verified payment rails.
8. **Hosted subscription lifecycle — verified.** Trial, expiry, recovery payment, return to `Active`, and next-billing recalculation are confirmed.
9. **Continue merchant-app verification.** Point of Sale, QR-specific merchant flows, Payment Buttons, Crowdfunding, Satoshi Tickets, and API/custom integration should move to verified status one flow at a time.

NBXplorer remains an internal BTCPay component and can be inspected when troubleshooting requires it, but a standalone NBXplorer health check is no longer the first merchant product milestone.

Lightning remains separate from the on-chain Bitcoin path, but the preferred client-controlled model is now verified: the reference deployment uses direct Nostr Wallet Connect (NWC) to an external Rizful wallet/backend, with automatic invoice settlement confirmed. A shared Sprey custodial Lightning wallet or shared internal Lightning node is not required for hosted tenants.

## Backup checkpoint

The reference host currently has two distinct backup layers:

1. **Hetzner Backups** provide the provider-level VPS backup layer. A fresh manual backup was also created before the translation/plugin changes and reached `Available` status.
2. A local BTCPay application backup was produced by the deployment's existing legacy `backup.sh`, which dumped PostgreSQL, stopped the BTCPay Docker stack, archived the selected application data, restarted the stack, and completed successfully.

After that application-backup restart, `https://pay.sprey.win/api/v1/health` again returned `{"synchronized":true}`.

This does **not** close the application backup work. Restore has not yet been tested, and the canonical long-term BTCPay backup/restore workflow has not yet been selected and verified. Until restore testing succeeds, the local archive is evidence of a successful backup run, not a verified disaster-recovery procedure.

## Self-host BTCPay Server

Sprey also documents the path for operators who prefer to run their own BTCPay Server instead of using `pay.sprey.win`.

See [Self-host BTCPay Server](/products/self-host-btcpay-server/).

## Documentation rule

The operational rule for Sprey Processing is:

> **Build it. Verify it. Document it.**

A configuration becomes canonical documentation only after it is understood and verified on the real deployment. Where upstream BTCPay documentation offers multiple valid approaches, Sprey documentation should distinguish the upstream choices from the configuration actually used and tested by Sprey.