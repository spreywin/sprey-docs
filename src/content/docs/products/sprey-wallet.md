---
title: Sprey Wallet
description: Planned non-custodial wallet companion for Sprey Processing.
---

**Sprey Wallet** is a planned non-custodial wallet product intended to complement [Sprey Processing](/products/sprey-processing/).

:::note[Status]
Planned. The product architecture and implementation have not yet been finalized. This page records only the product direction that is already established.
:::

## Purpose

Sprey Processing is designed so that merchant funds settle directly to a merchant-controlled wallet or payment destination. Sprey Wallet is intended to provide a natural wallet endpoint for that model without making Sprey the custodian of merchant funds.

The core boundary is simple:

```text
Sprey Processing -> observes payment state
Sprey Wallet     -> merchant-controlled payment destination
Merchant         -> controls wallet keys and funds
```

Sprey Wallet should not be required in order to use Sprey Processing. Merchants must remain able to use compatible external wallets and payment destinations.

## Established principles

The current product direction is based on these principles:

- **Non-custodial by design.** Sprey must not hold the user's private keys or take custody of wallet funds.
- **Merchant control.** The merchant controls the wallet, payment destinations, and funds.
- **Processing companion.** The wallet should integrate naturally with Sprey Processing rather than exist only as another general-purpose wallet.
- **External-wallet compatibility.** Sprey Processing must remain usable without Sprey Wallet.
- **Multi-network direction.** The wallet is expected to support the payment networks that become part of the verified Sprey Processing ecosystem, but the exact initial network set is not yet canonical.
- **Verified functionality only.** Detailed features will be documented when the wallet architecture and MVP are designed and tested.

## Why Sprey needs its own wallet

A Sprey wallet can make the non-custodial payment model easier to use end to end: Processing can observe payment state while the merchant retains direct control of the destination that actually receives the funds.

This also gives Sprey a controlled integration target for future merchant workflows without changing the fundamental custody boundary.

The goal is therefore not simply to create another cryptocurrency wallet. The product should exist where it provides a clear advantage to merchants using Sprey Processing.

## Planned product work

The dedicated Sprey Wallet product track will define and verify:

- supported networks and assets for the first release;
- wallet and address model;
- backup and recovery model;
- safe connection to Sprey Processing without exposing private keys;
- merchant payment and transaction workflows;
- security boundaries;
- platform and distribution strategy.

Until those decisions are made, they remain product-design questions rather than documented implementation promises.
