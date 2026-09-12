---
title: WDK CLI wallet operations
description: Verified Windows workflow for the Sprey Processing WDK wallet, address derivation, locking, BTC/Spark checks, and address-pool management.
---

This page records the **verified local WDK workflow** used for Sprey Processing merchant-controlled wallets and public payment destinations. It is an operational reference, not a place to store seed phrases, wallet passphrases, or private keys.

## Verified environment

The workflow was verified on Windows with:

- PowerShell 7.6.6;
- Node.js v24.19.0;
- npm 11.17.0;
- `@tetherto/wdk-cli` v1.0.0-beta.4.

The relevant mainnet network names verified by the CLI are:

- `bitcoin`;
- `ethereum`;
- `polygon`;
- `bsc`;
- `tron`;
- `spark`.

The CLI remains beta software. Keep seed backup independent of the local CLI installation.

## Wallet creation

The Sprey Processing wallet was created as a 24-word WDK wallet named `sprey-processing`:

```powershell
wdk wallet create --name sprey-processing --words 24
```

The CLI encrypts the locally stored seed with a wallet passphrase.

Operational rules:

- never paste the seed phrase into chat, tickets, documentation, shell history, or screenshots;
- keep an offline seed backup in at least two reliable locations;
- keep the encryption passphrase separate from the seed backup;
- the passphrase protects the local encrypted copy, while the seed remains the recovery authority for the wallet itself.

## Wallet status, unlock, and lock

```powershell
wdk wallet list
wdk wallet unlock --name sprey-processing
wdk wallet lock --name sprey-processing
```

The verified CLI unlock session expires automatically after **5 minutes**. If an address command reports that the wallet is not unlocked, unlock it again and repeat the command.

## Address derivation

The verified syntax is:

```powershell
wdk get address --network <network> --wallet sprey-processing --index <n>
```

Examples:

```powershell
wdk get address --network tron --wallet sprey-processing --index 0
wdk get address --network ethereum --wallet sprey-processing --index 0
wdk get address --network polygon --wallet sprey-processing --index 0
wdk get address --network bsc --wallet sprey-processing --index 0
wdk get address --network spark --wallet sprey-processing --index 0
wdk get address --network bitcoin --wallet sprey-processing --index 0
```

For the same account index, Ethereum, Polygon, and BNB Smart Chain produce the same EVM `0x...` address. TRON produces a separate `T...` address. Spark produces a `spark1...` address. Bitcoin produces a Native SegWit `bc1...` address.

The verified address model is therefore:

```text
sprey-processing seed
├── TRON -> T...
├── EVM  -> 0x...
│           ├── Ethereum
│           ├── Polygon
│           └── BNB Smart Chain
├── Spark -> spark1...
└── BTC   -> bc1... (BIP84 Native SegWit)
```

Spark address derivation was verified for account indices `0` and `1`.

## Bitcoin checkpoint

Bitcoin derivation is verified with **BIP84 Native SegWit**. The account path used by the merchant wallet is:

```text
m/84'/0'/0'
```

The first receive address (`m/84'/0'/0'/0/0`) derived from the `sprey-processing` seed was verified to be identical in three independent places:

1. Tether WDK;
2. Sparrow wallet `Sprey Processing WDK BTC`;
3. BTCPay Server after importing the account xpub as watch-only.

The verified first receive address is:

```text
bc1qjthy0ur438kdyzunyy2u00ftaswvqg2j7gu4v5
```

The BTCPay watch-only wallet metadata is:

```text
Label:              Sprey Processing WDK BTC
Master fingerprint: ad7e60ab
Account key path:   m/84'/0'/0'
```

BTCPay receives only the public account key. Spending authority remains outside BTCPay in the merchant-controlled WDK/Sparrow wallet.

## BTC CLI dependency issue observed on 2026-09-12

After upgrading the global CLI from beta.3 to `@tetherto/wdk-cli` beta.4, `wdk --version` still reported the bundled BTC module as `@tetherto/wdk-wallet-btc` beta.8.

Bitcoin address derivation initially failed with:

```text
Package subpath './hmac' is not defined by "exports" ... @noble/hashes ... wallet-account-btc.js
```

The same wallet continued to derive EVM, TRON, and Spark addresses correctly, which isolated the problem to the BTC module/dependency resolution rather than the seed or wallet data.

The local CLI package directory was then updated with the current WDK and BTC module dependencies:

```powershell
cd $env:APPDATA\npm\node_modules\@tetherto\wdk-cli
npm install @tetherto/wdk@latest @tetherto/wdk-wallet-btc@latest
```

After this dependency update, the ordinary CLI command successfully derived the Bitcoin address:

```powershell
wdk get address --network bitcoin --wallet sprey-processing --index 0
```

This is an operational workaround for the verified local beta CLI environment, not a recommendation to assume future WDK beta releases have the same dependency layout. Re-check the installed versions before reproducing it.

## USDt address pools

The current Sprey Processing Store uses a 10-address pool for each supported USDt payment network.

TRON:

```powershell
foreach ($i in 0..9) {
    wdk get address --network tron --wallet sprey-processing --index $i
}
```

EVM:

```powershell
foreach ($i in 0..9) {
    wdk get address --network ethereum --wallet sprey-processing --index $i
}
```

The EVM pool derived through Ethereum is reused for Polygon because the same indices resolve to the same EVM addresses. The same WDK addresses also map to BNB Smart Chain, retained for future use; the currently installed BTCPay Tether plugin exposes TRON, Ethereum, and Polygon.

## BTCPay boundary

Only public wallet material is provided to BTCPay:

- BTC: account xpub/watch-only data;
- TRON: public address pool;
- Ethereum/Polygon: public EVM address pool.

Seed phrases and private keys remain outside BTCPay.

This preserves the Sprey Processing ownership model: BTCPay observes and matches payments while wallet signing authority stays merchant-controlled.

## Recovery rule

A local CLI installation is replaceable. The wallet recovery material is not.

If the local installation is lost, reinstall a compatible WDK environment and use the documented wallet import flow with the offline seed. Verify the exact CLI syntax on the installed version before recovery.

Never commit seed phrases, passphrases, private keys, or encrypted wallet files to Sprey repositories.
