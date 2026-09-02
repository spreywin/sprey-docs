---
title: Processing Verification Checkpoint
description: Current verified state and next merchant-flow milestone for the Sprey Processing reference deployment.
---

This page records the current checkpoint for the live Sprey Processing reference deployment at `pay.sprey.win`.

## Verified now

- BTCPay Server is online on the reference deployment.
- Bitcoin Core is on mainnet and synchronized.
- `initialblockdownload` is false.
- Automatic pruning is enabled with a 25 GiB target.
- Bitcoin Core reported no warnings at the verified checkpoint.
- The public health path `https://pay.sprey.win/api/v1/health` returns `{"synchronized":true}`.
- A local legacy BTCPay application backup completed and the Docker stack restarted successfully.
- After that restart, the public BTCPay health path again returned `{"synchronized":true}`.

## Not yet verified

- Merchant-controlled Bitcoin wallet connection for the reference store.
- First real invoice.
- First real on-chain merchant payment.
- Correct invoice state after network observation.
- Application restore from backup.
- Long-term canonical BTCPay application backup/restore workflow.
- Additional payment capabilities such as POS, Payment Requests, Payment Buttons, donations, crowdfunding, and custom integrations.

## Canonical merchant verification path

```text
Bitcoin Core [verified]
        |
        v
Store
        |
        v
merchant-controlled wallet
        |
        v
Invoice
        |
        v
real BTC payment
        |
        v
BTCPay observes network state
        |
        v
invoice state verified
```

A standalone NBXplorer health check is not a merchant-facing milestone in this path. NBXplorer remains an internal BTCPay component and should be inspected when component-level troubleshooting requires it.

The next checkpoint is **Store configuration**, followed by the merchant-controlled wallet connection.
