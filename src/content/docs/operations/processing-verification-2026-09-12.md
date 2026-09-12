---
title: Sprey Processing verification — 2026-09-12
description: Verified WDK Spark/BTC derivation and BTCPay watch-only Bitcoin replacement.
---

This checkpoint records behavior directly verified on 2026-09-12.

## WDK wallet

The existing WDK wallet `sprey-processing` was confirmed to derive public destinations for TRON, EVM, Spark, and Bitcoin. The wallet recovery material remains outside BTCPay Server.

## Spark

Spark address derivation succeeded for account indices `0` and `1` through the WDK CLI. Both returned valid `spark1...` addresses.

No end-to-end Lightning payment is claimed here. Flint remains the currently configured BTCPay Lightning backend while the long-term WDK Spark integration model is still under evaluation.

## Bitcoin

After upgrading the WDK CLI from beta.3 to beta.4, Bitcoin derivation initially failed because of an `@noble/hashes/hmac` package-export dependency conflict. Updating the WDK and BTC module dependencies inside the local CLI installation resolved the error.

The standard WDK command then derived Bitcoin index `0` successfully.

Verified Bitcoin first receive address:

```text
bc1qjthy0ur438kdyzunyy2u00ftaswvqg2j7gu4v5
```

The Bitcoin account uses Native SegWit BIP84 with account path:

```text
m/84'/0'/0'
```

## Sparrow

A Sparrow wallet named `Sprey Processing WDK BTC` was created from the same `sprey-processing` wallet recovery material using Native SegWit/BIP84.

Its first receive address matched the WDK Bitcoin index-0 address exactly.

## BTCPay watch-only replacement

The Sprey Processing Store Bitcoin wallet was replaced with the account xpub from `Sprey Processing WDK BTC`.

Before confirmation, BTCPay displayed address `0/0` as the same verified address shown by WDK and Sparrow.

Configured BTCPay metadata:

```text
Label:              Sprey Processing WDK BTC
Master fingerprint: ad7e60ab
Account key path:   m/84'/0'/0'
```

The resulting ownership boundary is:

```text
sprey-processing
├── WDK BTC account
├── Sparrow spending wallet
└── BTCPay account xpub only (watch-only)
```

BTCPay does not receive Bitcoin signing authority.

## End-of-day status

Verified:

- WDK Spark derivation at indices `0` and `1`;
- WDK Bitcoin Native SegWit derivation;
- BIP84 account path `m/84'/0'/0'`;
- identical Bitcoin first receive address in WDK, Sparrow, and BTCPay;
- replacement of the BTCPay Bitcoin wallet with the WDK-derived watch-only account;
- Sparrow retains merchant-side Bitcoin spending authority.

Pending:

- small real BTC invoice/payment verification using the new watch-only account;
- end-to-end Lightning payment verification;
- final long-term Flint versus direct WDK Spark integration decision;
- real USDt settlement tests;
- hosted subscription paid-flow verification.
