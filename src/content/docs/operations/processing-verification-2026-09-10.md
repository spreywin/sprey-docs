---
title: Sprey Processing verification — 2026-09-10
description: Verified Sprey Processing server, merchant, monetization, wallet, translation, backup, and USDt plugin checkpoint from 2026-09-10.
---

This checkpoint records only configuration and behavior that were directly inspected or tested on the live `pay.sprey.win` reference deployment on **2026-09-10**. Items that were only discussed or selected as future architecture remain marked pending.

## BTCPay Server baseline

- BTCPay Server was updated to **v2.4.4**.
- The public endpoint remained `https://pay.sprey.win`.
- The protected administrative endpoint remained `https://adminpay.sprey.win` behind Cloudflare Access.
- A panel-driven BTCPay update temporarily left the application/tunnel stack incomplete and produced Cloudflare Error 1033. Re-running the standard BTCPay setup installer with `. ./btcpay-setup.sh -i` restored the stack. Public and administrative endpoints were then verified reachable again.

## Server settings checkpoint

### Policies

Verified server policy choices include:

- public user registration enabled;
- maximum stores per non-admin user: **3**;
- non-admin use of the internal Lightning node disabled;
- non-admin creation of hot wallets disabled;
- non-admin creation of cold wallets disabled;
- non-admin access to the User Creation API endpoint disabled;
- search-engine indexing disabled;
- GitHub release notifications enabled;
- pre-release plugins disabled;
- a default Store template is configured from the `Sprey Processing` Store.

The Store template is intended to provide sane defaults to newly created Stores while excluding sensitive data such as access tokens, payment-method credentials, and webhooks.

### Users and roles

At this checkpoint the server contains one administrative account, `pay@sprey.win`, with the `ServerAdmin` role and one Store.

The default Store role remains **Owner**. Standard BTCPay Store roles such as Manager, Employee, Guest, Wallet Manager, Multisigner, and Multisigner Guest remain available but are not set as the default.

### SMTP

Server SMTP delivery was tested end to end using Zoho SMTP on port `587`.

Verified behavior:

- the test email was accepted by BTCPay;
- the message arrived successfully in Gmail;
- TLS transport was shown by the receiving mail client;
- TLS certificate security checks remain enabled;
- **Stores inherit the server SMTP configuration by default**;
- a Store owner may override SMTP configuration at the Store level.

This inheritance is intentional for the hosted Sprey Processing model: a new merchant can use email delivery immediately without first configuring a separate SMTP provider.

### Services

The server exposes its standard BTCPay/Bitcoin service information, including Bitcoin full-node P2P/RPC service information and the BTCPay Tor hidden service. No additional service changes were made at this checkpoint.

### Branding

The public server name is **Sprey Processing**.

Verified branding state:

- Base URL: `https://pay.sprey.win`;
- contact URL points to the main Sprey website at this checkpoint;
- the Sprey Processing BTC + USDt logo is configured;
- the default BTCPay theme remains in use; no custom CSS theme was enabled.

### File storage, logs, maintenance

- BTCPay file storage contains the current Processing image assets.
- Server logs are available through Server Settings → Logs.
- Maintenance shows `pay.sprey.win` as the configured domain and exposes the normal Restart, Clean, and Update operations.
- No maintenance action was required after this settings review.

## Multilingual interface

All stable language packs visible in the BTCPay translation catalog were installed on the reference deployment. **English remains the default language.**

Interactive login-page switching was directly tested with:

- English;
- Russian;
- Dutch;
- Portuguese (Brazil).

The tested public login interface changed language correctly.

This should be described publicly as a **multilingual BTCPay interface**, not as a promise that every third-party plugin, custom email, documentation page, or support channel is fully translated.

## Monetization checkpoint

BTCPay Server Monetization is active for the offering **Sprey Processing Access**.

The offering grants the feature:

- `can-access` — Access to Sprey Processing.

Four active plans were configured:

| Plan | Price | Recurrence | Trial | Grace period |
| --- | ---: | --- | ---: | ---: |
| Starter Plan | $18.99 USD | Monthly | 0 days | 3 days |
| Quarterly Plan | $54.99 USD | Quarterly | 0 days | 5 days |
| Yearly Plan | $189.99 USD | Yearly | 0 days | 7 days |
| Lifetime Plan | $949.95 USD | Lifetime | 0 days | 0 days |

The Lifetime Plan is intended as a limited/temporary commercial offer rather than a permanent baseline commitment.

Plan-change behavior was configured so recurring plans can move between payment periods while preserving period-boundary behavior where appropriate. Lifetime is treated as an immediate upgrade path.

## Expired monetization invoice behavior

A Starter Plan checkout was allowed to expire without payment.

Observed behavior:

1. the BTCPay invoice correctly showed that the invoice had expired;
2. returning from the expired invoice opened a generic page displaying **Payment Successful**;
3. the Monetization subscriber list still showed **0 active subscribers** and no subscriber was created.

Therefore the backend did **not** activate access from the expired invoice. The success page is currently treated as a misleading UI/default-redirect behavior, not evidence of a successful payment.

This remains a known UX issue to investigate upstream before public launch.

## Bitcoin wallet checkpoint

The `Sprey Processing` Store uses a **watch-only Bitcoin wallet** in BTCPay.

A dedicated Sparrow desktop wallet was prepared as the merchant-controlled spending wallet. BTCPay retains watch-only information while signing/spending authority remains outside BTCPay.

Verified points:

- Native SegWit (`P2WPKH`) is used;
- BTCPay can derive receiving addresses from the watch-only wallet;
- Sparrow derives matching wallet addresses from the merchant-controlled seed;
- seed words/private keys are not to be entered into support conversations or stored in Sprey documentation.

A first real BTC invoice was created earlier in the merchant-flow verification path. A complete paid on-chain invoice lifecycle is still pending and must not yet be described as verified.

## Lightning direction

Lightning is **not yet configured** on the reference Store.

The preferred client-facing direction under evaluation is a nodeless/self-custodial flow using **SamRock Protocol + Aqua + Boltz** rather than exposing a shared internal Lightning node to hosted tenants.

SamRock Protocol 1.1.1 was inspected and requires `BTCPayServer.Plugins.Boltz >= 2.3.0`. Boltz was not visible in the current public plugin catalog search, so SamRock was not installed at this checkpoint. Manual Boltz installation must be verified before proceeding.

Flint was evaluated and rejected as the default hosted-client Lightning design because its Spark seed is stored on the BTCPay host and the host operator can technically access tenant funds. That conflicts with the intended Sprey hosted custody boundary.

B2P Central was also reviewed. It is considered a possible later conversion/P2P layer **after** a Store already has on-chain or Lightning payment capability; it is not itself a replacement for a Lightning backend.

## USDt plugin checkpoint

The **Tether USDt** plugin **v0.6.1.0** was installed successfully.

The installed plugin exposes payment methods for:

- USDt on **TRON**;
- USDt on **Ethereum**;
- USDt on **Polygon**.

The plugin requires BTCPay Server `>= 2.3.7`; the live BTCPay v2.4.4 deployment satisfies that requirement.

### TRON payment model

The TRON configuration screen accepts one or more **public TRON addresses** and states that each address is reserved for the payment/settlement period.

At this checkpoint:

- the plugin is installed;
- no TRON payment address pool has yet been configured;
- the TRON payment method is therefore not yet enabled or verified end to end;
- `Exclude amount from QR code` remains unnecessary unless wallet compatibility requires it.

The intended custody boundary is that BTCPay receives only public payment addresses. Merchant seed words/private keys remain in the merchant-controlled wallet, while BTCPay observes payment state.

The current wallet candidate for generating a pool of TRON addresses is **TronLink**, to be verified before configuration. The target is a practical pool of multiple addresses so concurrent invoices do not contend for a single reserved destination.

## Backup checkpoint before plugins

Before the mass translation/plugin changes, a fresh **manual Hetzner backup** was created and reached status **Available**. The displayed image size was approximately **32.86 GB**.

Hetzner automated backups were already enabled. This manual backup serves as the immediate pre-plugin/pre-translation rollback checkpoint.

It is a provider-level restore point, not a replacement for a separately verified BTCPay application backup/restore procedure.

## Current verified / pending boundary

Verified on the live deployment:

- BTCPay v2.4.4 server availability after recovery from the interrupted update;
- hosted registration/store policy baseline;
- three-Store limit per non-admin user;
- default Store template present;
- monetization offering and four plan definitions;
- SMTP delivery and server-SMTP inheritance for Stores;
- server branding;
- multilingual language-pack installation and sample language switching;
- provider-level manual backup checkpoint;
- watch-only Bitcoin wallet architecture with external Sparrow spending wallet;
- Tether USDt plugin installation and visibility of TRON/Ethereum/Polygon methods;
- expired monetization invoice does not create an active subscriber.

Still pending before corresponding features are called production-verified:

- complete paid Bitcoin invoice lifecycle;
- TRON address-pool configuration and real USDt payment test;
- Ethereum and Polygon USDt configuration/tests;
- Lightning backend installation and real Lightning payment test;
- upstream investigation of the misleading expired-invoice success page;
- WooCommerce end-to-end order/payment/status test;
- restore testing for the canonical application backup procedure.

## Documentation rule

> **Build it. Verify it. Document it.**

A plugin being installed, a settings page being visible, or a payment method appearing in the navigation is not sufficient to call that payment method operational. Sprey documentation promotes a feature to verified only after its real merchant flow succeeds end to end.
