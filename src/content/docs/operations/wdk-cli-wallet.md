---
title: WDK CLI wallet operations
description: Verified Windows workflow for the Sprey Processing WDK CLI wallet, address derivation, locking, and address-pool management.
---

This page records the **verified local WDK CLI workflow** used for the Sprey Processing merchant-controlled USDt address pools. It is an operational reference, not a place to store seed phrases, wallet passphrases, or private keys.

## Verified environment

The workflow was verified on Windows with:

- PowerShell 7.6.6;
- Node.js v24.19.0;
- npm 11.17.0;
- `@tetherto/wdk-cli` v1.0.0-beta.3.

The installed built-in wallet modules included BTC, EVM, EVM ERC-4337, Solana, Spark, and TRON. The currently relevant mainnet network names verified by `wdk network list` are:

- `bitcoin`;
- `ethereum`;
- `polygon`;
- `bsc`;
- `tron`;
- `spark`.

## Install and inspect

```powershell
npm install -g @tetherto/wdk-cli@1.0.0-beta.3
wdk --version
wdk --help
wdk module list
wdk network list
```

The current CLI is beta software. Keep seed backup independent of the local CLI installation.

## Wallet creation

The Sprey Processing wallet was created with 24 words:

```powershell
wdk wallet create --name sprey-processing --words 24
```

The CLI asks for a local passphrase to encrypt the stored seed phrase.

Operational rules:

- never paste the seed phrase into chat, tickets, documentation, shell history, or screenshots;
- keep an offline seed backup in at least two reliable locations;
- keep the encryption passphrase separate from the seed backup;
- the passphrase protects the local encrypted copy, but the seed is the recovery authority for the wallet itself.

## Wallet status, unlock, and lock

```powershell
wdk wallet list
wdk wallet unlock --name sprey-processing
wdk wallet lock --name sprey-processing
```

The verified CLI unlock session expires automatically after **5 minutes**. If an address command fails with `Wallet 'sprey-processing' is not unlocked`, unlock the wallet again and repeat the command.

Other wallet-management commands are available under:

```powershell
wdk wallet --help
```

This includes `import`, `export`, `delete`, `default`, `rename`, and `change-passphrase`. Before using a destructive or recovery-related command, inspect its exact syntax with `--help` on the installed CLI version.

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
```

For the same account index, Ethereum, Polygon, and BNB Smart Chain produced the **same EVM `0x...` address**. TRON produced a separate `T...` address.

Therefore the current address model is:

```text
index N
├── TRON -> T...
└── EVM  -> 0x...
            ├── Ethereum
            ├── Polygon
            └── BNB Smart Chain
```

## Generate a 10-address pool

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

The EVM pool derived through `ethereum` is reused for Polygon and BNB Smart Chain because the same indices resolve to the same EVM addresses.

The current Sprey Processing Store uses a **10-address pool** for each supported USDt payment network. Ten addresses are a practical starting pool because the BTCPay Tether plugin reserves an address during an active payment/settlement window and can reuse it after release.

## BTCPay boundary

Only **public addresses** are copied into BTCPay. Seed phrases and private keys remain outside BTCPay.

Current use:

- TRON: 10 derived `T...` addresses;
- Ethereum: 10 derived EVM addresses;
- Polygon: the same 10 derived EVM addresses;
- BNB Smart Chain: retained for future use; the currently installed BTCPay Tether plugin exposes TRON, Ethereum, and Polygon only.

This preserves the intended Sprey Processing model: BTCPay observes and matches payments while wallet signing authority stays merchant-controlled.

## Balance and send commands

The CLI exposes `get` and `send` commands. Before using them with funds, inspect the exact syntax installed locally:

```powershell
wdk get --help
wdk send --help
```

For sends, use a dry-run/preview mode first **if the installed command help confirms that option**. Do not rely on remembered syntax across beta releases.

Remember that token transfers normally require the native gas asset on the spending address unless a separately configured gasless/account-abstraction flow is being used:

- TRON -> TRX/resources;
- Ethereum -> ETH;
- Polygon -> POL;
- BNB Smart Chain -> BNB.

GasFree and ERC-4337 are future wallet UX options, not part of the current Processing baseline.

## Recovery rule

A local CLI installation is replaceable. The wallet recovery material is not.

If the local installation is lost, reinstall a compatible WDK CLI and use the documented wallet import flow with the offline seed. Verify the exact `wdk wallet import --help` syntax before recovery.

Never commit seed phrases, passphrases, private keys, or encrypted wallet files to the Sprey repositories.
