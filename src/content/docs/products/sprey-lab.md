---
title: Sprey Lab
description: Experimental BTCPay applications and plugin-based payment flows tested separately from the core Sprey Processing offer.
---

**Sprey Lab** is the experimental product area built on the BTCPay Store at [pay.sprey.win](https://pay.sprey.win/). It lets Sprey explore and test useful crypto-payment applications and plugins without confusing experimental workflows with the core commercial Sprey Processing offer.

**Public overview:** [www.sprey.win](https://www.sprey.win/)  
**Lab / BTCPay Store:** [pay.sprey.win](https://pay.sprey.win/)  
**Core product:** [Sprey Processing](/products/sprey-processing/)

## Verification record

The following scenarios were reported as practically tested in the Sprey Lab Store on **2026-10-13**. This record reflects the reported test results; it is not an independent rerun by the documentation author.

| Scenario | Status | Verification boundary |
| --- | --- | --- |
| QR payment | **Verified in Lab** | The reported QR payment flow worked in the Lab test context. |
| Crowdfunding | **Verified in Lab** | The reported crowdfunding flow worked. |
| Point of Sale / payment terminal | **Verified in Lab** | The reported terminal flow worked. |
| Payment Button | **Verified in Lab** | The reported button-based payment flow worked. |
| Swap application/plugin | **Verified in Lab; details to capture** | Swap was reported working through a plugin. Exact plugin identifier, version, and tested route still need to be recorded from the live configuration. |
| Lightning through OpenReceive with Rizful | **Configured / test invoices prepared** | Wallet connection, invoice creation, available payment methods, and test invoice/donation preparation were reported complete. Do not infer that every Lightning payment route or edge case has been tested. |

## Lab versus Processing

Lab test results and Processing product verification are related, but they are not interchangeable.

- **Verified in Lab** means the specific experimental flow was reported working in the Lab Store.
- **Verified in Processing** means the complete merchant-facing flow has been configured and tested against the Processing reference deployment for its intended commercial use.
- A Lab result does not by itself prove production readiness, coverage of failure cases, refunds, all supported networks, or compatibility with every merchant configuration.

The Processing capability table therefore keeps the QR, Point of Sale, Payment Button, and crowdfunding rows separate until the corresponding commercial Processing flows are explicitly verified. See [Sprey Processing](/products/sprey-processing/).

## Next documentation checks

- Record the exact Swap plugin/app name, version, configuration source, and the specific successful test route.
- Record any plugin dependencies and update/backup considerations before changing the production Store.
- Keep secrets, private keys, seed phrases, access tokens, and credentials out of this repository.
- Link to the relevant operational procedure only after its commands and recovery steps have been checked against the live configuration.

Sprey Lab is an experimental area, not a promise that every upstream BTCPay application is supported as a commercial Sprey Processing feature.
