---
title: Payment Capabilities
description: Intended Sprey Processing payment channels and their verification status.
---

Sprey Processing uses BTCPay Server as the payment foundation behind `pay.sprey.win`. The product is intentionally broader than a single storefront integration.

## Capability map

The intended Sprey Processing product scope includes:

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

## Verification rule

A capability listed here may be part of the intended product boundary because it is supported by upstream BTCPay Server. That does **not** mean Sprey has already configured and verified it on `pay.sprey.win`.

A capability becomes a verified Sprey Processing capability only after its complete merchant flow has been configured and tested on the reference deployment.

The verification sequence for a new payment capability is:

```text
configure
   |
   v
create a real merchant payment flow
   |
   v
send or receive a real payment where appropriate
   |
   v
observe the payment network
   |
   v
verify BTCPay invoice/application state
   |
   v
document the tested configuration
```

This follows the canonical Sprey rule:

> **Build it. Verify it. Document it.**
