---
title: Sprey Processing verification — 2026-09-28
description: USDt on BSC end-to-end verification, historical eth_getLogs RPC requirement, and paid-late recovery checkpoint.
---

This checkpoint records behavior directly verified on 2026-09-28 on the live `Sprey Processing` deployment.

## USDt on BSC activation

After updating the installed Tether USDt plugin, `USDT-BSC` became available as a Store payment method.

The BSC configuration used:

- the plugin's BSC mainnet integration;
- the same merchant-controlled 10-address EVM pool already used by Ethereum and Polygon;
- EIP-681 token-transfer URI as the recommended payment link format;
- no merchant seed or private key stored in BTCPay.

A new invoice for `5.49 USD` was created with `USDT-BSC` available at checkout. BTCPay allocated one address from the configured EVM pool and displayed the expected BSC payment option and QR flow.

## Real payment test

A real `5.49 USDt` payment was sent over BNB Smart Chain to the destination assigned by the invoice.

The Store's BSC address view showed the full `5.49 USDt` balance on the assigned address, confirming that the transfer reached the merchant-controlled destination.

The invoice did not immediately update because the BSC listener stopped advancing while attempting to read historical Transfer logs.

## RPC failure diagnosis

The default BSC RPC endpoint allowed basic chain/balance access but failed the listener's historical log query with:

```text
Nethereum.JsonRpc.Client.RpcResponseException:
limit exceeded: eth_getLogs
```

The listener remained pinned to one block while the BSC chain head continued advancing.

A second public endpoint was also unsuitable for the backlog because historical requests required a personal token.

Operational requirement:

> The BSC RPC endpoint used by Sprey Processing must support historical `eth_getLogs` requests required by the USDt listener.

A keyed BSC RPC endpoint was configured without storing its credential in documentation or source control.

After the RPC change, the listener resumed indexing from the previously blocked height and continued advancing block by block.

## Late-payment recovery verification

Because payment detection was delayed by the RPC failure, the 45-minute invoice window expired before the listener reached the payment.

After indexing resumed, BTCPay discovered the previously received BSC transfer and matched it to the original invoice.

Observed result:

- payment method: `USDT-BSC`;
- amount due: `5.49 USDt`;
- amount recorded as paid: `5.49 USDt`;
- invoice status: `Expired (paid late)`;
- notification: invoice was paid after expiration;
- no manual marking of the invoice as paid was required.

This verifies not only BSC payment detection but also the plugin's monitored-expired-invoice behavior on the reference deployment.

## Current conclusion

```text
USDt on BSC: verified E2E
Merchant-controlled EVM destination: verified
Real payment amount: 5.49 USDt
Historical eth_getLogs requirement: verified operational dependency
Listener catch-up after RPC replacement: verified
Paid-late detection after invoice expiry: verified
Manual invoice override: not required
```

The verified USDt set for Sprey Processing is now:

- TRON;
- Ethereum;
- Polygon;
- BSC.

The product rule remains unchanged:

> **Build it. Verify it. Document it.**
