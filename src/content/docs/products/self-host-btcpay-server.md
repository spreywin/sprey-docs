---
title: Self-host BTCPay Server
description: Reproducible Sprey runbook for deploying and operating a self-hosted BTCPay Server.
---

This guide documents the self-hosted BTCPay Server path used by the Sprey Processing reference deployment. Its goal is to become a reproducible production runbook: an operator should be able to deploy, verify, maintain, recover, and eventually reproduce the service from a clean VPS without relying on undocumented memory.

The canonical reference deployment is [pay.sprey.win](https://pay.sprey.win/) on the `sprey-btcpay` server.

:::note[Guide status]
This runbook is being documented from a server that is already running. Confirmed state is recorded now; exact installation commands and configuration values are added only when they have been verified. Do not treat a pending section as a complete deployment procedure.
:::

## Reference server

The currently verified host baseline is:

| Item | Reference value |
| --- | --- |
| Provider | Hetzner Cloud |
| Hostname | `sprey-btcpay` |
| OS | Ubuntu 26.04 LTS |
| CPU | 4 vCPU |
| Memory | 8 GB RAM |
| Disk | 80 GB SSD |
| Swap | 2 GB |
| Public firewall | UFW |
| Public ports | 22/tcp, 80/tcp, 443/tcp |
| Automatic security updates | Enabled with `unattended-upgrades` |
| Public BTCPay endpoint | `pay.sprey.win` |
| Bitcoin network | Mainnet |
| Bitcoin node mode | Pruned |
| Lightning | None for the initial reference configuration |
| SMTP | Configured |
| Provider backups | Hetzner Backups enabled |

This table describes the current Sprey server; it is not yet a claim that every value is a minimum BTCPay requirement.

## Deployment path

The runbook is organized around the path used to build and validate a production instance:

```text
clean VPS
   |
   v
Ubuntu baseline
   |
   v
SSH + firewall + updates + swap
   |
   v
DNS
   |
   v
Docker + BTCPay Server
   |
   v
HTTPS endpoint
   |
   v
Bitcoin node + NBXplorer
   |
   v
pruning + synchronization
   |
   v
SMTP + backups
   |
   v
merchant wallet
   |
   v
invoice
   |
   v
real payment
   |
   v
verified invoice state
   |
   v
backup and recovery test
```

## 1. Provision the VPS

The Sprey reference server was provisioned on Hetzner Cloud with Ubuntu 26.04 LTS, 4 vCPU, 8 GB RAM, and an 80 GB SSD.

Before using these values as sizing guidance for another deployment, account for Bitcoin pruning policy, enabled payment methods, plugins, expected merchant count, traffic, monitoring, and backup strategy.

**Verification:** the host boots normally and remote administrative access is available.

## 2. Establish the Ubuntu baseline

The reference server currently has:

- hostname `sprey-btcpay`;
- 2 GB swap;
- UFW enabled;
- inbound ports 22, 80, and 443 allowed;
- `unattended-upgrades` enabled;
- IPv6 available on the host.

The exact clean-server command sequence is **pending reproduction and verification**. It will be added rather than reconstructed from memory.

## 3. Configure DNS

The production endpoint is:

```text
pay.sprey.win
```

DNS must resolve the public hostname to the intended BTCPay host before production TLS and public access are considered verified.

**Verified state:** `pay.sprey.win` is publicly reachable over HTTPS and serves the Sprey BTCPay instance.

The exact DNS records and rollout sequence will be documented when they are verified against the current configuration.

## 4. Deploy Docker and BTCPay Server

BTCPay Server is running on the reference host using its Docker-based deployment stack.

The exact installation command, environment variables, generated compose configuration, and update procedure are **pending configuration audit**. They must be captured from the real host before this section becomes a copy-and-run installation guide.

This is deliberate: a plausible BTCPay command copied from memory is not a Sprey production runbook.

## 5. Bitcoin and NBXplorer

The reference deployment uses Bitcoin mainnet with a pruned Bitcoin node. BTCPay and NBXplorer are running as part of the payment infrastructure.

The node has been synchronizing before merchant wallet configuration. The final synchronization state and the exact pruning configuration must be verified on the running host before they are recorded as canonical values.

**Pending verification:**

- Bitcoin synchronization complete;
- NBXplorer synchronized and healthy;
- effective pruning configuration confirmed;
- storage usage checked after synchronization.

## 6. Lightning

Lightning is intentionally not part of the initial reference payment path.

Sprey Processing is designed to support merchant-controlled external Lightning infrastructure rather than making a Sprey-operated Lightning node a prerequisite for the core service. Customer-specific node deployment may be treated separately from the base Processing service.

The first production verification therefore uses Bitcoin on-chain.

## 7. Configure SMTP

SMTP is configured on the current BTCPay/Processing deployment.

The exact provider settings, sender identities, ports, TLS mode, and secrets must not be copied into public documentation. A future verified procedure should document the required fields, safe secret handling, and a test-email verification step without exposing credentials.

## 8. Enable infrastructure backups

Hetzner Backups are enabled for `sprey-btcpay`, providing a provider-level recovery layer for the VPS.

Provider backups are not a substitute for understanding application-level consistency and recovery. The production backup design should ultimately document both infrastructure recovery and BTCPay/PostgreSQL application recovery, followed by an actual restore test.

**Pending verification:**

- define application/database backup procedure;
- define retention expectations;
- document restore order;
- perform and record a recovery test.

## 9. Connect a merchant-controlled wallet

This is the next product milestone for the reference store.

The merchant payment destination must remain under merchant control. Sprey does not receive, hold, or forward merchant funds.

The exact wallet setup procedure will be documented while it is performed on the reference store.

## 10. Create and pay the first invoice

After wallet configuration:

1. Create an invoice in the Sprey Processing store.
2. Send the payment independently to the merchant-controlled payment destination.
3. Observe the Bitcoin transaction from the payment side.
4. Confirm that BTCPay observes the blockchain and determines the invoice state from network data.
5. Confirm that the BTCPay invoice reaches the expected state.

This test is the boundary between "the server is online" and "the Bitcoin payment path has been verified."

## 11. Verify integrations

Storefront and API integrations are verified only after the underlying payment path works independently.

For WooCommerce, products and orders stay in WooCommerce. The BTCPay integration creates/tracks the invoice, BTCPay observes the relevant payment network, and the resulting invoice state is reported back to WooCommerce. See [BTCPay + WooCommerce](/integrations/btcpay-woocommerce/).

Additional networks, tokens, plugins, or conversion integrations should be enabled and documented one at a time.

## 12. Updates, diagnostics, and recovery

A production runbook is incomplete without routine operations. This section will include verified procedures for:

- checking service/container health;
- checking Bitcoin and NBXplorer synchronization;
- checking disk, memory, and swap pressure;
- inspecting relevant logs;
- updating BTCPay safely;
- validating the service after an update;
- restoring from a known-good backup;
- recovering from a failed update or host loss.

These procedures are **pending verification on the reference deployment**.

## Non-custodial boundary

Self-hosting BTCPay does not change the intended Sprey payment model. In the Sprey reference architecture, customer payment happens independently of Sprey and settles to the merchant-controlled wallet or configured payment destination. BTCPay observes the Bitcoin blockchain or another configured payment network and determines invoice state from network data.

Sprey does not initiate, route, receive, hold, or forward merchant funds.

## Documentation method

Every section of this runbook follows the same rule:

> **Build it. Verify it. Document it.**

When the running system differs from an assumption, the verified system wins. When a command has not been reproduced, it remains pending instead of becoming authoritative documentation by guesswork.
