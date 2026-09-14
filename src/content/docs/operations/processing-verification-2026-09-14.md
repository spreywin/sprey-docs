---
title: Sprey Processing verification — 2026-09-14
description: First successful real BTC on-chain end-to-end payment test and resulting invoice-expiry adjustment.
---

This checkpoint records the first successful real end-to-end Bitcoin on-chain payment through Sprey Processing.

## Test invoice

A real invoice was created in the `Sprey Processing` store for:

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

## Verified lifecycle

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

## Configuration change after test

The test demonstrated that the previous `15 minutes` invoice expiry can be too short for real exchange withdrawals. In this case the invoice expired four minutes before BTCPay received the payment.

The Sprey Processing store invoice expiry was therefore changed to:

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

## UX observation

The invoice redirect URL currently points to:

```text
https://sprey.win/
```

Therefore the checkout return button sends the user to the Sprey homepage. This is not a payment-processing failure, but it is a UX item to revisit when the customer flow is finalized.

## Result

**BTC on-chain E2E: VERIFIED.**

This is the first completed real payment test for Sprey Processing. Other payment methods remain separate verification tasks.
