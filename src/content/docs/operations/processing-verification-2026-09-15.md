---
title: Sprey Processing verification — 2026-09-15
description: Starter trial onboarding verification and subscription reminder behavior.
---

This checkpoint records behavior directly verified on 2026-09-15 on the live `Sprey Processing` deployment.

## Starter trial configuration

The Starter Plan was changed to use a short trial while the other production plans remain without a trial:

```text
Starter Plan    2-day trial
Quarterly Plan  0-day trial
Yearly Plan     0-day trial
Lifetime Plan   0-day trial
```

The production Starter price remains `$18.99/month`.

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

## Payment reminder behavior during a short trial

The current subscription payment-reminder lead time is `3 days before expiration`.

With a `2-day` Starter trial, the calculated reminder date is already in the past at trial creation, so the payment reminder was sent immediately alongside the email-confirmation message.

Observed emails:

- `Confirm your email address`;
- `Payment reminder for your subscription`.

The reminder itself rendered successfully and linked to the subscription portal, so the email rule is functionally verified. However, sending the reminder immediately at signup is not the desired UX for a short trial.

Recommended follow-up: align the reminder lead time with the short Starter trial so the reminder arrives during the trial rather than at signup. A `1-day before expiration` reminder fits the current `2-day` Starter trial cleanly.

## Current verified state

Verified on the live reference deployment:

- Starter can create an active trial subscriber without an upfront payment;
- email confirmation remains required before password creation and authenticated access;
- password setup and first-Store creation work correctly in the trial flow;
- the subscription portal correctly exposes trial state, expiry, and payment action;
- Payment Reminder email delivery is verified;
- current `3-day` reminder timing is too early for the `2-day` trial and should be adjusted before finalizing the customer UX.
