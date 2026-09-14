---
title: Sprey Processing verification — 2026-09-14
description: Real BTC and USDt payment verification, hosted-subscription onboarding fix, and Processing redirect checkpoint.
---

This checkpoint records behavior directly verified on 2026-09-14 on the live `Sprey Processing` Store.

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

1. the original control user created before email confirmation was required; its password was set manually;
2. the clean reference user created after the corrected email-confirmation policy was enabled.

Both are useful for regression comparisons. The intended long-term internal-test treatment is to use the per-user **Bypass monetization** flag rather than assigning fake commercial Lifetime subscriptions or repeatedly paying Sprey itself.

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

## Receipt follow-up

BTCPay's built-in successful-payment receipt page was verified during the Ethereum and Polygon tests. It includes the amount paid, payment method, payment destination, date, and a printable receipt view.

A remaining UX task is to determine the cleanest upstream-compatible way to deliver or link this receipt to the customer automatically without duplicating unnecessary email traffic.

## Lightning status

Lightning is **not** marked production-verified by this checkpoint.

Verified/observed changes during evaluation:

- Flint was removed from the Store after the test wallet was confirmed empty;
- the server-side-seed model used by Flint is not the preferred long-term Sprey ownership boundary;
- Boltz was installed as a SamRock dependency, but the reference host and an external client both timed out reaching `api.boltz.exchange:443` during testing;
- Boltz's Lightning-to-Liquid mode therefore was not completed or selected as the primary Sprey Lightning path;
- SamRock Protocol remains installed as an optional client-controlled integration path;
- Nostr support is installed as an optional merchant feature.

The product direction remains that hosted users should control their own Lightning destination and liquidity rather than relying on a shared Sprey custodial wallet or shared internal Lightning node.

## End-of-day verified state

Verified on the live reference deployment:

- real BTC on-chain payment observation and settlement;
- 45-minute invoice expiry;
- real USDt settlement on TRON;
- real USDt settlement on Ethereum;
- real USDt settlement on Polygon;
- independent WDK wallet-side confirmation of the exact BTC, TRON USDt, Ethereum USDt, and Polygon USDt balances received during the real tests;
- real paid hosted-subscription activation;
- email-confirmation onboarding for passwordless Monetization users;
- password setup, login, Store creation, and password reset for the clean hosted test user;
- server SMTP delivery;
- production Starter price restored to `$18.99/month`;
- Store Website and new-invoice redirect set to `https://pay.sprey.win/`;
- two internal regression users retained for future comparison.

Still pending before the admin/reference Store is considered finished:

- customer receipt delivery/linking UX;
- final Lightning integration policy and verified Lightning E2E;
- verification of the remaining built-in BTCPay merchant entry points and integrations one flow at a time.
