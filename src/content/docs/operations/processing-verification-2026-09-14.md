---
title: Sprey Processing verification — 2026-09-14
description: Real BTC and USDt payment verification, hosted-subscription onboarding fix, wallet confirmation, and Processing/Labs split.
---

This checkpoint records behavior directly verified on 2026-09-14 on the live `Sprey Processing` deployment.

## Backup checkpoint

Before continuing the hosted-access and email/onboarding changes, a fresh Hetzner backup was created for `sprey-btcpay` and reached `Available` status.

This backup is the immediate rollback point for the configuration changes recorded below.

## Bitcoin on-chain E2E

A real invoice was created in the `Sprey Processing` Store for:

```text
Amount: 8.10 USD
Invoice ID: 59eMfkorwybs34GKbcbuU54
Item description: BTC E2E test
BTC amount due: 0.00010436 BTC
BTC/USD rate at invoice creation: 77,618.30 USD
```

The invoice used the BTCPay-generated Bitcoin on-chain destination:

```text
bc1q40xhmuk6pfel8zyg8n5ssk4dxfzmlh7szgez4x
```

The payment was sent from OKX over Bitcoin mainnet. OKX charged a withdrawal fee of `0.000015 BTC`, while the invoice destination received the exact requested amount of `0.00010436 BTC`.

The observed BTCPay lifecycle was:

```text
10:00  invoice created
10:15  invoice expired
10:19  payment received
10:19  status: Expired (paid late)
10:19  invoice_paidAfterExpiration
10:20  1 / 1 confirmation
10:20  invoice_paymentSettled
```

Verified events included:

- `invoice_receivedPayment (1002)`;
- `invoice_paidAfterExpiration (1009)`;
- `invoice_paymentSettled (1014)`.

The on-chain payment record showed:

```text
Payment method: BTC-CHAIN
Paid:           0.00010436 BTC
Confirmations:  1 / 1
```

This verifies the real payment path:

```text
OKX
  -> Bitcoin mainnet
  -> BTCPay / Sprey Processing invoice
  -> exact amount detected
  -> required confirmation reached
  -> payment settled
```

The payment arrived after the original invoice expiry, but BTCPay correctly associated it with the invoice, marked it as paid late, and settled it after the required confirmation.

### Invoice-expiry adjustment

The test demonstrated that the previous `15 minutes` invoice expiry can be too short for real exchange withdrawals. The Store invoice expiry was therefore changed to:

```text
45 minutes
```

The following related settings were left unchanged:

```text
Underpayment tolerance: 0%
Minimum acceptable BOLT11 expiration time for refunds: 30 days
Payment invalid if confirmation fails after invoice expiration: 1440 minutes
Settlement requirement: at least 1 confirmation
```

**BTC on-chain E2E: VERIFIED.**

## Hosted subscription E2E — USDt on TRON

A real Starter subscription checkout was paid with USDt on TRON.

Verified behavior:

- BTCPay received the exact USDt amount;
- TRON payment confirmations were observed;
- the invoice reached `Settled` and completed;
- a subscriber was created;
- the hosted-access subscription became active.

This closed the first real Tether USDt settlement path for the reference deployment.

**USDt on TRON E2E: VERIFIED.**

## USDt on Ethereum E2E

A second real hosted-subscription payment was completed with **USDt on Ethereum**.

The test was intentionally combined with a second clean hosted-user onboarding flow so that one payment verified both the Ethereum payment rail and corrected account setup behavior.

Verified behavior:

- checkout exposed `USDT-ETHEREUM`;
- the exact invoice amount was received;
- BTCPay produced a successful payment receipt showing `USDT-ETHEREUM`;
- the hosted subscription became active;
- the new server user was created;
- the user completed email confirmation, password setup, login, and Store creation successfully;
- the same user subsequently completed the normal password-reset flow successfully.

After testing, the Starter Plan price was returned to the production value of **$18.99 per month**.

**USDt on Ethereum E2E: VERIFIED.**

## USDt on Polygon E2E

A separate real invoice was paid with **USDt on Polygon**.

Verified behavior:

- checkout exposed `USDT-POLYGON`;
- the exact invoice amount was received;
- BTCPay displayed the successful payment receipt with payment method `USDT-POLYGON`.

With this checkpoint, the installed Tether USDt plugin has real paid-invoice verification on all three currently exposed Sprey networks:

- TRON;
- Ethereum;
- Polygon.

**USDt on Polygon E2E: VERIFIED.**

## Merchant-controlled wallet balance confirmation

After the BTCPay payment tests, balances were checked independently through the merchant-controlled Tether WDK CLI wallet.

The observed balances matched the real test payments exactly:

```text
Bitcoin   index 4   0.00010436 BTC
TRON      index 0   9.99 USDT
Ethereum  index 0   1.89 USDT
Polygon   index 0   1.17 USDT0
```

For Polygon, the current WDK CLI token registry exposes Tether as `usdt0` / `USDT0`; both token spellings returned the same `1.17 USDT0` balance.

This provides an independent wallet-side confirmation that the merchant-controlled destinations received the funds observed by BTCPay. The Bitcoin result also confirms that the WDK-derived BIP84 account used by BTCPay watch-only observation contains the exact real test payment at derived address index `4`.

### Sparrow confirmation

The merchant-side Sparrow wallet `Sprey Processing WDK BTC` was then allowed to load its transaction history. Sparrow independently found the same confirmed Bitcoin payment:

```text
Balance:      10,436 sats
Mempool:      0 sats
Transactions: 1
```

The incoming transaction value was `10,436 sats`, exactly equal to `0.00010436 BTC` reported by WDK at index `4` and by BTCPay for the settled invoice.

The first Sparrow view showed `0 sats` because its network/backend connection was disabled. After enabling the connection and allowing history loading to finish, Sparrow displayed the confirmed transaction and correct balance. This was a connectivity state, not a wallet/xpub/derivation mismatch.

The Bitcoin payment is therefore independently consistent across all three layers:

```text
BTCPay settled invoice
        =
WDK BTC index 4 balance
        =
Sparrow confirmed balance / UTXO
        =
0.00010436 BTC / 10,436 sats
```

On Windows, successful WDK balance output was followed by this process-shutdown assertion on several commands:

```text
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94
```

The assertion occurred after the requested balances had already been returned. It is recorded as a CLI/runtime issue to track separately and did not prevent the observed balance checks from completing.

## Hosted-user onboarding root cause and fix

The first paid hosted user was created successfully by Monetization but did not receive a usable account-setup path. The user existed, the subscription was active, and SMTP delivery worked, but the account had no password and the expected onboarding message did not arrive.

The relevant BTCPay Server 2.4.4 flow was reviewed. The important behavior is:

- Monetization creates the new server user without a password;
- this flow is not an administrator invitation, so the `User: Invitation` server email rule is not the normal trigger;
- when `Email confirmation required` is disabled, this passwordless Monetization user has no automatic confirmation/setup step;
- the normal forgot-password flow is not a substitute for the initial passwordless account setup.

The verified server policy is therefore:

```text
Enable public user registration                  ON
Email confirmation required                      ON
Admin must approve new users                     OFF
Store owners can add users without invitation    OFF
Non-admins can access the User Creation API      OFF
Register page redirect URL                       /monetization/new-user
Maximum Stores per non-admin user                3
Non-admins can use Internal Lightning Node       OFF
Non-admins can create Hot Wallets                OFF
Non-admins can create Cold Wallets               OFF
```

With `Email confirmation required = ON`, the second clean user followed the expected flow:

```text
subscription checkout
        |
        v
payment settles
        |
        v
subscriber + server user created
        |
        v
Confirm your email address
        |
        v
set password
        |
        v
login
        |
        v
create Store
```

The second user then successfully used the standard password-reset email as well.

## Email rules

Server SMTP was re-tested by sending a real test email to the hosted-user mailbox. Delivery succeeded, confirming that the earlier onboarding problem was not SMTP transport or mailbox delivery.

The custom Store-level `WH-SubscriberActivated` welcome email was removed after the corrected server confirmation flow was verified. Sending both messages immediately after checkout duplicated onboarding and risked unnecessary email noise.

The current responsibility split is:

- **server email** handles account confirmation and password establishment;
- **subscription email rules** are reserved for actual subscription lifecycle information such as reminders or expiry state.

## Internal test users

Two hosted test users are intentionally retained:

1. the original control user created before email confirmation was required; its password was set manually and its email remains unconfirmed;
2. the clean reference user created after the corrected email-confirmation policy was enabled; its email is confirmed.

Both now have:

```text
Bypass monetization for this user = ON
```

They therefore remain available for regression and customer-journey testing without requiring repeated paid subscriptions or fake commercial Lifetime plans.

Keeping the users different is intentional: the first preserves the pre-fix control case, while the second is the clean reference for the corrected onboarding flow.

## Store website and invoice redirect

The `Sprey Processing` Store Website setting was changed from:

```text
https://sprey.win/
```

to:

```text
https://pay.sprey.win/
```

A newly created invoice immediately showed:

```text
Redirect Url: https://pay.sprey.win/
```

This confirms that ordinary Store invoices inherit the customer return destination from the Store Website setting. The customer-facing return action now returns to Sprey Processing rather than the general marketing site.

## Checkout payment-timing notice

A customer-facing timing note was added to the `Sprey Processing` checkout footer after the real late-BTC-payment test and the invoice-expiry adjustment.

The current English text is:

> Your exchange rate is locked for 45 minutes. Late payments are monitored for up to 24 hours and processed once confirmed.

The notice intentionally reflects the Store's current operational settings:

```text
Invoice expiry / rate-lock window: 45 minutes
Post-expiry monitoring/invalid window: 1440 minutes (24 hours)
Settlement requirement: at least 1 confirmation
```

The wording is informational rather than a guarantee that every late payment can be accepted under all conditions. Its purpose is to make the configured timing behavior visible to the customer before leaving the checkout page.

## Receipt follow-up

BTCPay's built-in successful-payment receipt page was verified during the Ethereum and Polygon tests. It includes the amount paid, payment method, payment destination, date, and a printable receipt view.

A remaining UX task is to determine the cleanest upstream-compatible way to deliver or link this receipt to the customer automatically without duplicating unnecessary email traffic.

## Lightning status and plugin cleanup

Lightning is **not** marked production-verified by this checkpoint.

The evaluation produced the following decisions:

- Flint was removed from the Store after the test wallet was confirmed empty;
- the server-side-seed model used by Flint is not the preferred long-term Sprey ownership boundary;
- Boltz was tested indirectly through the SamRock dependency, but `api.boltz.exchange:443` timed out from both the reference host and an external client;
- Boltz/Liquid was not selected as the primary Sprey Lightning path;
- SamRock Protocol was evaluated but was not selected as the target integration for WDK Spark or hosted-client Lightning;
- SamRock Protocol and Boltz were uninstalled after evaluation;
- Nostr remains installed for NIP-05, zaps and future Nostr Wallet Connect use cases;
- Tether USDt remains installed as the verified stablecoin payment plugin.

Current installed-plugin baseline after cleanup:

```text
Nostr        1.1.21.0
Tether USDt  0.6.1.0
```

The product direction remains **external/client-controlled Lightning** rather than a shared Sprey custodial wallet or shared internal Lightning node. NWC is a preferred standards-based direction for compatible external wallets. Direct WDK Spark integration remains future adapter/integration work rather than a currently verified BTCPay backend.

## Sprey Processing / Sprey Labs Store separation

A separate Store named **`Sprey Labs`** was created to keep experimental merchant apps, plugins and UX checks out of the production/reference Store.

The Store-role split is now:

```text
Sprey Processing
  production/reference Store
  -> monetization
  -> ordinary invoices
  -> verified payment rails
  -> email / receipt / redirect behavior
  -> API / webhooks and core Processing behavior

Sprey Labs
  feature and plugin test bench
  -> Pay Button
  -> Crowdfund
  -> Point of Sale
  -> Satoshi Tickets
  -> Nostr and other optional merchant apps
  -> future plugin/app experiments

Internal user Stores
  customer-regression layer
  -> non-admin UX
  -> client-visible permissions and limits
  -> customer Store creation/configuration behavior
```

`Sprey Labs` was created without wallets configured initially. The rule is to avoid attaching real payment destinations unless a specific end-to-end test requires them. Configuration-only behavior should be verified without unnecessary payment-wallet coupling; real settlement should be added only for the exact flow being tested.

This separation also reflects BTCPay's own warning that Pay Button is intended for tips/donations rather than general e-commerce and should preferably be isolated from a commercial Store.

## Merchant-app exploration status

The following merchant entry points/apps are now explicitly in the verification queue, primarily under `Sprey Labs` unless the test is specifically about customer/non-admin behavior:

- Pay Button;
- Point of Sale;
- Crowdfund;
- Payment Requests;
- Satoshi Tickets.

Pay Button configuration was opened and its available modes were confirmed, including fixed/custom/slider amount options, email notifications, browser redirect, IPN, generated embed code, shareable link and LNURL. It is not yet marked end-to-end verified.

Satoshi Tickets was installed and its event-creation flow was inspected. It exposes virtual-event configuration, description, event URL/location, post-purchase redirect, image, dates, currency and optional reminder email/template fields. No ticket-purchase E2E is claimed yet.

## End-of-day verified state

Verified on the live reference deployment:

- real BTC on-chain payment observation and settlement;
- 45-minute invoice expiry;
- real USDt settlement on TRON;
- real USDt settlement on Ethereum;
- real USDt settlement on Polygon;
- independent WDK wallet-side confirmation of the exact BTC, TRON USDt, Ethereum USDt, and Polygon USDt balances received during the real tests;
- independent Sparrow confirmation of the same `10,436 sats` Bitcoin payment;
- real paid hosted-subscription activation;
- email-confirmation onboarding for passwordless Monetization users;
- password setup, login, Store creation, and password reset for the clean hosted test user;
- server SMTP delivery;
- production Starter price restored to `$18.99/month`;
- Store Website and new-invoice redirect set to `https://pay.sprey.win/`;
- customer-facing checkout timing notice added for the 45-minute rate-lock and 24-hour late-payment monitoring behavior;
- both internal regression users set to bypass monetization;
- Lightning experiment cleanup completed: SamRock and Boltz removed, Nostr retained;
- `Sprey Labs` created as a separate merchant-app/plugin test bench.

Still pending before the admin/reference Processing setup is considered finished:

- customer receipt delivery/linking UX;
- remaining subscription lifecycle email checks;
- final external-Lightning/NWC policy and a future verified Lightning E2E when a suitable client-controlled backend is selected;
- verification of Pay Button, Point of Sale, Crowdfund, Payment Requests and Satoshi Tickets one flow at a time;
- final consolidation into `products/sprey-processing.md` after configuration and verification work is complete.
