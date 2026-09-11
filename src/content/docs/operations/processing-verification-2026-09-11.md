---
title: Sprey Processing verification — 2026-09-11
description: Verified WDK wallet, USDt address pools, and TRON/Ethereum/Polygon node connectivity checkpoint for Sprey Processing.
---

This checkpoint records configuration and behavior directly inspected on the live Sprey Processing deployment on **2026-09-11**. It extends the previous day's server/settings checkpoint without changing the rule that a payment method becomes fully verified only after a real end-to-end payment succeeds.

## WDK merchant wallet checkpoint

Tether WDK CLI was installed on Windows and used as the merchant-controlled wallet tooling for USDt address derivation.

Verified environment:

- PowerShell 7.6.6;
- Node.js v24.19.0;
- npm 11.17.0;
- `@tetherto/wdk-cli` v1.0.0-beta.3.

The wallet `sprey-processing` was created with a 24-word seed and a local encryption passphrase. The seed/private keys remain outside BTCPay and are not stored in Sprey documentation.

The CLI unlock session was observed to expire automatically after 5 minutes.

See [WDK CLI wallet operations](/operations/wdk-cli-wallet/) for the operational command reference.

## Address derivation model

Address derivation was verified for:

- TRON;
- Ethereum;
- Polygon;
- BNB Smart Chain.

For the same account index:

- TRON derives a distinct `T...` address;
- Ethereum, Polygon, and BNB Smart Chain derive the same EVM `0x...` address.

A pool of **10 TRON addresses** and **10 EVM addresses** was generated from indices `0..9`.

The 10 EVM addresses were reused for both Ethereum and Polygon in the current BTCPay Store. The same EVM pool is compatible with BNB Smart Chain at the wallet level, but BSC is not exposed by the currently installed Tether USDt BTCPay plugin.

## Tether USDt plugin address pools

The installed **Tether USDt v0.6.1.0** plugin now has merchant-controlled public address pools configured for:

- USDt on TRON: 10 addresses;
- USDt on Ethereum: 10 addresses;
- USDt on Polygon: 10 addresses.

The plugin reserves an address during an active payment/settlement window. Ten addresses are therefore treated as a practical initial concurrency pool, not as a ten-payment lifetime limit.

`Exclude amount from QR code` remains disabled in the current configuration.

## TRON RPC checkpoint

The plugin's default TRON JSON-RPC endpoint was not available from the live deployment.

The server-level TRON JSON-RPC endpoint was changed to:

```text
https://tron-evm-rpc.publicnode.com
```

Custom HTTP headers were left empty. The configured USDt TRON smart-contract address was not changed.

After saving the endpoint:

- TRON node connectivity recovered;
- the TRON payment method turned green in the BTCPay navigation;
- all ten configured TRON addresses returned `0.00 USDt` rather than `N/A`.

This verifies RPC/node connectivity and balance retrieval, not yet a real USDt payment.

## Ethereum checkpoint

Ethereum node connectivity was already available after the plugin/address-pool configuration.

Verified behavior:

- Ethereum payment method shows healthy/green status;
- all ten configured EVM addresses return `0.00 USDt`;
- address availability indicators are healthy.

This verifies node connectivity and balance retrieval, not yet a real USDt payment.

## Polygon RPC checkpoint

Polygon initially showed unavailable balances (`N/A`) and node-connection errors.

The server-level Polygon RPC endpoint was changed to:

```text
https://polygon-bor-rpc.publicnode.com
```

After saving the endpoint:

- Polygon payment method turned green;
- all ten configured EVM addresses returned `0.00 USDt`;
- address availability indicators were healthy.

This verifies RPC/node connectivity and balance retrieval, not yet a real USDt payment.

## Current USDt status

At the end of this checkpoint the Store navigation shows:

- Bitcoin: healthy;
- USDt parent payment method: healthy;
- TRON: healthy;
- Ethereum: healthy;
- Polygon: healthy;
- Lightning: not configured.

The current USDt architecture is therefore configured through merchant-controlled public address pools with working node/RPC connectivity for all three supported networks.

## Verification boundary

Verified on 2026-09-11:

- WDK CLI installation and wallet creation;
- deterministic TRON/EVM address derivation;
- 10-address TRON and EVM pools;
- BTCPay address-pool configuration for TRON, Ethereum, and Polygon;
- TRON balance retrieval through `tron-evm-rpc.publicnode.com`;
- Ethereum balance retrieval;
- Polygon balance retrieval through `polygon-bor-rpc.publicnode.com`;
- healthy/green BTCPay payment-method state for TRON, Ethereum, and Polygon.

Still pending before USDt is described as production-verified end to end:

- create a real USDt invoice;
- pay the invoice from an independent wallet/source;
- verify correct address reservation;
- verify blockchain observation;
- verify BTCPay invoice state transition;
- verify address release/reuse after settlement;
- perform at least one real test on the priority TRON path, then test Ethereum/Polygon as appropriate.

## Documentation rule

> **Build it. Verify it. Document it.**

Healthy node connectivity and balance retrieval are meaningful verified checkpoints, but they are not substitutes for a complete paid invoice lifecycle.
