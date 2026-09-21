---
title: Sprey Processing verification — 2026-09-15
description: Starter trial onboarding, subscription email lifecycle, Lightning/NWC verification, and OpenReceive compatibility checkpoint.
---

This checkpoint records behavior directly verified on 2026-09-15 on the live `Sprey Processing` deployment.

## Starter trial configuration

The Starter Plan now uses a short free trial while the other production plans remain without a trial:

```text
Starter Plan    3-day trial
Quarterly Plan  0-day trial
Yearly Plan     0-day trial
Lifetime Plan   0-day trial
```

The production Starter price remains `$18.99/month`.

The Starter Plan keeps a `3-day` grace period after a paid period expires. Trial and grace remain distinct lifecycle phases.

The customer-facing Starter description was updated to reflect the actual flow: registration begins with free trial access and no upfront payment, while monthly, quarterly, yearly, or lifetime access can be selected later from the authenticated account.

The public trial CTA is now shown by BTCPay as `Proceed to free trial`.

## Trial onboarding verification

A new clean user was registered through the Starter trial flow.

Verified behavior:

- the user received the server `Confirm your email address` message;
- email confirmation opened the expected initial password-creation screen;
- after password creation, account creation completed successfully;
- the user was immediately taken to first-Store creation;
- the first Store was created successfully;
- the user could access the subscription portal after login;
- the subscription was shown as `Starter Plan`, `Trial`, and `Active`;
- the portal displayed the trial expiry date and a `Pay Now` action;
- no upfront payment was required before account creation and Store access during the trial.

This confirms that the current trial flow places payment after verified account access rather than before email confirmation.

A mistyped or inaccessible email address cannot complete email confirmation and therefore cannot complete account setup and reach the authenticated subscription payment flow. The system may still contain an unconfirmed trial/user record until cleanup, but the user cannot complete the authenticated customer journey without access to the mailbox.

BTCPay also exposes a `Mark as a test account` control for subscribers. This is useful for future internal/test-account separation, but the current trial users are intentionally left in their natural lifecycle for reminder/expiry verification.

## Payment reminder configuration and verification

The payment-reminder lead time was changed to:

```text
1 day before expiration
```

An earlier `2-day` trial test was run while the reminder lead time was still `3 days before expiration`. Because the calculated reminder date was already in the past at trial creation, the reminder was sent immediately alongside the email-confirmation message.

Observed emails during that test:

- `Confirm your email address`;
- `Payment reminder for your subscription`.

That behavior verified that the Payment Reminder email rule itself works and links correctly to the subscription portal.

After the trial was finalized at `3 days`, the reminder timing was finalized at `1 day before expiration` so the customer receives the reminder during the trial rather than immediately at signup.

The reminder copy was also revised for clearer customer UX. The current intent is:

```text
Your Sprey Processing access will expire soon.
Please renew your subscription to keep your access active.
```

The subscription-portal button remains the customer action target.

The current trial users are being left untouched so the `1-day` reminder can be observed naturally rather than by manually moving dates.

## Expired-phase email configuration

The `Subscriber phase changed` Store email rule is configured to send only when:

```text
Subscriber.Phase == "Expired"
```

This prevents the email from firing on every subscription phase transition.

The expired-access copy was revised to clearly state that access has ended and that renewal restores access. The subscription portal remains the recovery/payment destination.

The natural `Trial -> Expired` transition and resulting account lockout are intentionally left pending so they can be observed in real time on the current trial user rather than simulated by date manipulation.

## Receipt-email follow-up deferred

BTCPay's built-in successful-payment receipt page remains verified, but the server `Email confirmation` rule exposes only user/server/confirmation-link placeholders and does not expose an invoice or receipt URL in that event context.

Therefore, embedding the payment receipt directly into the initial email-confirmation/password-setup message is deferred rather than adding custom code solely for that purpose.

## Sprey Labs direction

`Sprey Labs` remains the dedicated merchant-app/plugin test Store and is planned to become a live public demo environment exposed from `sprey.win`.

The current intended split is:

```text
Sprey Processing
  production/reference Store
  -> monetization
  -> ordinary invoices
  -> verified BTC / USDt payment rails
  -> verified external Lightning via NWC
  -> onboarding / email lifecycle

Sprey Labs
  live demo / merchant-app Store
  -> Pay Button
  -> Point of Sale
  -> Crowdfund
  -> Payment Requests
  -> Satoshi Tickets
  -> optional plugin experiments

Internal user Stores
  customer-regression layer
  -> non-admin UX
  -> client permissions / limits
  -> customer Store configuration
```

The public `sprey.win` site is now a dependency for presenting these Labs functions as live demos rather than leaving them as internal configuration-only experiments.

For future Labs settlement isolation, the current direction is to keep Labs payment destinations distinct from Processing:

- separate USDt receive-address ranges for TRON / Ethereum / Polygon;
- a separate Bitcoin BIP84 account/xpub for Labs rather than reusing the exact Processing account xpub;
- no second master seed is required solely for this separation.

## Direct Rizful / NWC Lightning verification

A working external Lightning path was verified without OpenReceive by connecting Rizful directly to BTCPay through the installed Nostr plugin as a custom NWC Lightning backend.

Working connection shape:

```text
BTCPay Store
  -> Lightning custom node
  -> Nostr Wallet Connect (NWC)
  -> Rizful
```

The NWC connection negotiates `Nip44V2` successfully and BTCPay starts its Lightning listener against the Rizful NWC relay.

An initial real payment from OKX reached Rizful, and BTCPay could see the resulting Lightning balance, but the related BTCPay invoice was not settled automatically. Restarting BTCPay did not reconcile that invoice.

The Rizful BTCPay guidance notes that, when connection/payment handling problems occur, `Enable LNURL` should be disabled in BTCPay Lightning settings. After disabling the top-level `Enable LNURL` switch, a clean second test was run using a separate Rizful wallet as payer, removing OKX from the test path.

Verified E2E test:

```text
Rizful test wallet
  -> Lightning payment
  -> Sprey Processing / BTCPay invoice
  -> Rizful merchant wallet via NWC
```

Test amount:

```text
99 sats
```

Observed behavior:

- BTCPay created a fresh Lightning-only invoice successfully;
- the second Rizful wallet parsed and sent the BOLT11 invoice immediately;
- Rizful reported payment attempt started, payment received, and payment attempt succeeded;
- payment arrived almost immediately;
- the BTCPay checkout changed to `Invoice paid` automatically;
- the BTCPay invoice state changed to `Settled` automatically;
- the built-in receipt page showed the payment method as `BTC-LN` and the full paid amount;
- no manual invoice-state change or recovery action was required.

The sender-side transaction view showed very small fees for this test:

```text
Platform fee: 1 sat
Routing fee:  1 sat
```

This was dramatically cheaper and faster than the earlier OKX Lightning withdrawal path used for testing.

Current operational conclusion:

```text
External Lightning backend: working
Backend provider: Rizful
Connection: direct NWC through BTCPay Nostr plugin
LNURL: disabled
Automatic invoice settlement: verified
Receipt generation: verified
```

This direct Rizful/NWC path is accepted as the current working Lightning option for Sprey Processing and as a supported client pattern while a future native Sprey/WDK Spark integration is developed and verified.

The preferred security direction remains least privilege. Where the backend/provider permits it, receive-oriented NWC permissions should be preferred over unnecessary spend authority.

## OpenReceive / receive-only NWC test

OpenReceive `0.4.7.0` was initially installed and tested on BTCPay Server `2.4.4` using a receive-only Rizful NWC connection.

The NWC preflight succeeded. OpenReceive negotiated `nip44_v2` and detected the expected receive-oriented methods:

```text
get_balance
get_info
list_transactions
lookup_invoice
make_invoice
```

However, when `0.4.7.0` attempted to save itself as the Store Lightning backend, BTCPay threw:

```text
System.MissingMethodException:
Method not found: PaymentMethodConfigValidationContext..ctor(...)
```

The failure occurred inside `OpenReceiveSettingsService.UseAsLightningNodeAsync(...)` after successful NWC preflight. The issue was reported upstream with the exact stack trace.

The OpenReceive developer released `0.4.8.0` with a compatibility fix. That version was then installed and tested against the same BTCPay Server `2.4.4` deployment and the previously failing setup path worked successfully.

After verification, OpenReceive was removed again because the simpler direct Nostr-plugin + Rizful NWC path is already fully verified and is the preferred production/reference configuration.

Current conclusion:

```text
OpenReceive/NWC architecture: verified
OpenReceive 0.4.7.0 on BTCPay 2.4.4: incompatible
OpenReceive 0.4.8.0 on BTCPay 2.4.4: compatibility fix verified
Production/reference Lightning path: direct Nostr plugin + Rizful NWC
OpenReceive current status: removed / not required for core Lightning
```

OpenReceive remains relevant as an optional future component where its receive-only model or swap features provide value, but it is not needed in the current minimal Lightning stack.

## Current verified state

Verified on the live reference deployment:

- Starter trial onboarding works without upfront payment;
- email confirmation remains required before password setup and authenticated access;
- first-Store creation works during trial;
- subscription portal correctly exposes trial status, expiry and payment action;
- Starter trial finalized at `3 days`;
- Starter grace period remains `3 days`;
- Payment Reminder email rule works;
- reminder timing finalized at `1 day before expiration`;
- Expired-phase email rule is constrained to `Subscriber.Phase == "Expired"`;
- receipt-in-confirmation-email customization is deferred;
- direct Rizful NWC through the Nostr plugin is verified for real Lightning receive and automatic settlement;
- BTCPay `Enable LNURL` is disabled for the verified Rizful/NWC configuration;
- a separate Rizful payer successfully paid a 99-sat invoice and BTCPay automatically marked it `Settled`;
- built-in Lightning receipt generation is verified;
- OpenReceive `0.4.8.0` compatibility with BTCPay `2.4.4` was verified after the upstream fix, then OpenReceive was removed in favor of the simpler direct Nostr/Rizful path;
- `Sprey Labs` remains the future live-demo Store and `sprey.win` is the planned public demo surface.

## Subscription lifecycle follow-up — 2026-09-21

A dedicated internal plan, `QA Lifecycle Test — DO NOT BUY!`, was used to complete the expiry and recovery portion of the hosted-subscription lifecycle test.

The test exposed one important configuration dependency: the plan-level `Renewable` option had been disabled. With `Renewable` disabled, the plan could expire but was not configured for the intended renewal flow. `Renewable` was enabled and `Optimistic activation` was intentionally left disabled for the test.

Observed expired state before recovery:

- the subscription showed `Inactive`;
- the portal displayed `Access expired`;
- the account exposed a `Pay Now` recovery action;
- the plan price was `$0.18`;
- an existing `$0.18` credit balance was recognized and shown as applied;
- `Auto renewal` was enabled in the subscriber portal.

A new `$0.18` payment was then initiated from the subscription portal. BTCPay created a Lightning invoice for `213 sats`, which was paid through the already verified external Rizful/NWC Lightning path.

Observed recovery behavior:

- the Lightning payment completed successfully;
- BTCPay reported the invoice as `settled`;
- the subscription portal displayed `The plan has been started.`;
- the subscription returned to `Active`;
- the next billing date became `2026-10-21`;
- the subscriber retained a `$0.18` credit balance after the payment;
- the admin subscriber view showed the recovered subscriber as `Normal / Active`;
- at the checkpoint, the offering showed `2` active subscribers and `$0.36` monthly revenue.

This test also repeated the real-world Lightning micropayment path at a very small value. The `213 sat` / `$0.18` payment was delivered and settled quickly, reinforcing the earlier 99-sat verification that the direct Rizful/NWC path is suitable for low-value Lightning payments.

Current lifecycle conclusion:

```text
Expired access state: verified
Plan-level Renewable dependency: verified
Manual recovery from subscriber portal: verified
Lightning payment for recovery: verified
Automatic invoice settlement: verified
Return to Active after payment: verified
Next billing recalculation: verified
Low-value Lightning payments: repeatedly verified
```

The expiry/recovery QA checkpoint is therefore closed. Any future subscription work should be treated as product refinement or regression testing rather than as a blocker for the base Sprey Processing lifecycle.
