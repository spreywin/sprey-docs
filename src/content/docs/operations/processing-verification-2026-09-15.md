---
title: Sprey Processing verification — 2026-09-15
description: Starter trial onboarding, subscription email lifecycle, and OpenReceive compatibility checkpoint.
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

## OpenReceive / receive-only NWC test

OpenReceive `0.4.7.0` was installed and tested on BTCPay Server `2.4.4` using a receive-only Rizful NWC connection.

The NWC preflight succeeded. OpenReceive negotiated `nip44_v2` and detected the expected receive-oriented methods:

```text
get_balance
get_info
list_transactions
lookup_invoice
make_invoice
```

This is important because it validates the intended external/client-controlled NWC direction independently of the later plugin failure.

However, when OpenReceive attempted to save itself as the Store Lightning backend, BTCPay threw:

```text
System.MissingMethodException:
Method not found: PaymentMethodConfigValidationContext..ctor(...)
```

The failure occurs inside `OpenReceiveSettingsService.UseAsLightningNodeAsync(...)` after successful NWC preflight.

The effective compatibility issue is that OpenReceive `0.4.7.0` expects an older `PaymentMethodConfigValidationContext` constructor, while BTCPay Server `2.4.4` now requires the additional Store context argument.

Observed result:

- NWC/Rizful connection itself passes preflight;
- OpenReceive then crashes while registering the Lightning payment method;
- BTCPay automatically disables OpenReceive and restarts;
- the USDt listener cancellation messages during restart are shutdown side effects, not a separate USDt incident;
- after restart, the normal BTC/USDt services recover and continue running.

OpenReceive is therefore intentionally left **disabled** pending an upstream compatibility fix. The exact error summary was sent to the plugin developer.

Current conclusion:

```text
OpenReceive/NWC architecture: promising / validated through preflight
OpenReceive 0.4.7.0 on BTCPay 2.4.4: blocked by plugin API incompatibility
Production Lightning status: not yet verified
```

BTCPay will not be downgraded solely to accommodate this plugin.

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
- OpenReceive receive-only Rizful/NWC preflight succeeds;
- OpenReceive `0.4.7.0` is disabled because of BTCPay `2.4.4` payment-method API incompatibility;
- `Sprey Labs` remains the future live-demo Store and `sprey.win` is the planned public demo surface.

## Pending natural lifecycle verification

The current trial user(s) are intentionally left unchanged so the following can be observed naturally:

1. Payment Reminder email at `1 day before expiration`;
2. `Trial -> Expired` transition;
3. Expired email delivery;
4. actual account/access lockout after unpaid trial expiration;
5. renewal/recovery behavior from the subscription portal.

After these checks, the results should be consolidated into `products/sprey-processing.md` together with the final production/reference configuration.
