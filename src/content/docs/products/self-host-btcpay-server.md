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
| OS | Ubuntu 26.04.1 LTS |
| CPU | 4 vCPU |
| Memory | 8 GB RAM |
| Disk | 80 GB SSD |
| Swap | 2 GB |
| Public firewall | Hetzner Cloud Firewall |
| Allowed inbound | 22/tcp and ICMP |
| Host UFW | Inactive |
| Automatic security updates | Enabled with `unattended-upgrades` |
| Automatic reboot | Not enabled |
| Public BTCPay endpoint | `pay.sprey.win` |
| Administrative endpoint | `adminpay.sprey.win` behind Cloudflare Access |
| Web ingress | Cloudflare Tunnel |
| BTCPay Server | v2.4.3 |
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
SSH + updates + swap
   |
   v
Docker + BTCPay Server
   |
   v
Cloudflare Tunnel + DNS
   |
   v
public endpoint + protected admin endpoint
   |
   v
external origin firewall
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
observed invoice state
   |
   v
backup and recovery test
```

## 1. Provision the VPS

The Sprey reference server was provisioned on Hetzner Cloud with Ubuntu 26.04 LTS, 4 vCPU, 8 GB RAM, and an 80 GB SSD.

Before using these values as sizing guidance for another deployment, account for Bitcoin pruning policy, enabled payment methods, plugins, expected merchant count, traffic, monitoring, and backup strategy.

**Verification:** the host boots normally and remote administrative access is available.

## 2. Establish the Ubuntu baseline

The verified reference host has:

- hostname `sprey-btcpay`;
- 2 GB swap;
- IPv4 and IPv6 available;
- `unattended-upgrades` enabled and running;
- APT daily and daily-upgrade timers enabled;
- automatic reboot not enabled.

At the latest maintenance checkpoint all available APT updates were installed, no packages remained upgradable, and `/var/run/reboot-required` was absent.

The exact clean-server command sequence is **pending reproduction and verification**. It will be added rather than reconstructed from memory.

## 3. Deploy Docker and BTCPay Server

BTCPay Server is running on the reference host using the official Docker-based deployment stack. The verified BTCPay version at this checkpoint is v2.4.3.

The active stack includes BTCPay Server, NBXplorer, Bitcoin Core, PostgreSQL, nginx, Tor support containers, and the BTCPay-managed Cloudflare Tunnel container.

The reference environment includes these verified settings:

```text
BTCPAY_HOST=pay.sprey.win
BTCPAY_ADDITIONAL_HOSTS=adminpay.sprey.win
BTCPAYGEN_CRYPTO1=btc
BTCPAYGEN_LIGHTNING=none
BTCPAYGEN_REVERSEPROXY=nginx
BTCPAYGEN_ADDITIONAL_FRAGMENTS=opt-save-storage-xs;opt-add-cloudflared
BTCPAYGEN_EXCLUDE_FRAGMENTS=nginx-https
NBITCOIN_NETWORK=mainnet
```

Secrets such as the Cloudflare Tunnel token are intentionally omitted.

The exact clean installation sequence is still **pending reproduction and verification**. Existing installations should use the official BTCPay update mechanism rather than manually replacing generated containers or individual images.

## 4. Configure Cloudflare Tunnel and DNS

The Sprey reference deployment uses a Cloudflare Tunnel named `sprey-btcpay`. The tunnel is established outbound from the server by the BTCPay-managed `cloudflared` container.

Two published application routes are configured:

```text
pay.sprey.win      -> http://nginx
adminpay.sprey.win -> http://nginx
```

The public hostname is therefore not routed to the server IP with a conventional public web-origin A record. Cloudflare provides the public HTTPS edge and sends traffic through the Tunnel to nginx.

The generated BTCPay deployment excludes the `nginx-https` fragment. At the verified checkpoint the host publishes nginx on port 80 for the internal Tunnel target, while port 443 is not publicly bound by Docker.

**Verification:**

- the Cloudflare Tunnel reports healthy;
- `pay.sprey.win` opens the BTCPay service over HTTPS;
- `adminpay.sprey.win` reaches the same BTCPay deployment after Access authentication;
- the BTCPay login methods continue to work after the edge configuration is applied.

## 5. Protect the administrative hostname with Cloudflare Access

`pay.sprey.win` remains public. Do not place the public Processing hostname behind an interactive Access login: invoices, merchant integrations, APIs, webhooks, and customer traffic need to reach BTCPay normally.

`adminpay.sprey.win` is the protected administrative hostname. It is configured as an additional BTCPay host and as a Cloudflare Access self-hosted application.

The verified Access policy uses:

```text
Action: Allow
Include: Emails -> <specific administrative email>
```

Use the `Emails` selector for a specific address. Do not confuse it with `Emails ending in`, which matches an email domain. The actual administrative email is private and is not recorded in this public runbook.

**Verification:** open `adminpay.sprey.win` in a private/incognito browser session. Cloudflare Access must appear before BTCPay, the authorized address must be able to complete authentication, and `pay.sprey.win` must remain publicly reachable without the Access challenge.

## 6. Disable Rocket Loader for BTCPay hostnames

On the reference deployment Cloudflare Rocket Loader broke BTCPay login JavaScript under BTCPay's Content Security Policy. Browser diagnostics showed Rocket Loader involvement, and disabling Rocket Loader restored the affected BTCPay login-code flow.

The verified solution is a Cloudflare Configuration Rule named:

```text
BTCPay - Disable Rocket Loader
```

It matches either BTCPay hostname:

```text
(http.host eq "pay.sprey.win" or http.host eq "adminpay.sprey.win")
```

and applies only:

```text
Rocket Loader: Off
```

Global Rocket Loader remains enabled for the rest of the `sprey.win` zone.

**Verification:** after deploying the Configuration Rule and re-enabling global Rocket Loader, the BTCPay login-code flow on `pay.sprey.win` and the Cloudflare Access plus BTCPay login flow on `adminpay.sprey.win` were both tested successfully.

Do not disable unrelated Cloudflare features in this rule. Its purpose is deliberately narrow: one compatibility exception for the two BTCPay hostnames.

## 7. Close direct web access to the origin

The reference host publishes Docker nginx on `0.0.0.0:80` and `[::]:80`. UFW is inactive, the host INPUT policy was observed as ACCEPT, and the `DOCKER-USER` chain contained no custom filtering rules.

Because Docker-published ports require special care with host firewall rules, the Sprey reference deployment uses an external Hetzner Cloud Firewall as the public perimeter.

Verified inbound rules are:

| Protocol | Port | Source |
| --- | --- | --- |
| TCP | 22 | Any IPv4 and Any IPv6 |
| ICMP | — | Any IPv4 and Any IPv6 |

No inbound rule allows ports 80 or 443. Hetzner therefore drops unsolicited inbound web traffic before it reaches the server, while the outbound Cloudflare Tunnel remains operational. No outbound firewall rules are configured at this checkpoint.

After applying the firewall, verify all of the following before closing the existing SSH session:

1. The existing SSH session remains connected.
2. A new SSH connection can be established.
3. `pay.sprey.win` still works through the Tunnel.
4. `adminpay.sprey.win` still presents Cloudflare Access and reaches BTCPay after authentication.
5. Direct access to the server IP on port 80 no longer succeeds externally.

This is the verified origin-protection boundary for the current reference deployment.

## 8. Bitcoin and NBXplorer

The reference deployment uses Bitcoin mainnet with a pruned Bitcoin node. BTCPay and NBXplorer are running as part of the payment infrastructure.

The node has been synchronizing before merchant wallet configuration. The final synchronization state and the exact pruning configuration must be verified on the running host before they are recorded as canonical values.

**Pending verification:**

- Bitcoin synchronization complete;
- NBXplorer synchronized and healthy;
- effective pruning configuration confirmed;
- storage usage checked after synchronization.

## 9. Lightning

Lightning is intentionally not part of the initial reference payment path.

Sprey Processing is designed to support merchant-controlled external Lightning infrastructure rather than making a Sprey-operated Lightning node a prerequisite for the core service. Customer-specific node deployment may be treated separately from the base Processing service.

The first production verification therefore uses Bitcoin on-chain.

## 10. Configure SMTP

SMTP is configured on the current BTCPay/Processing deployment.

The exact provider settings, sender identities, ports, TLS mode, and secrets must not be copied into public documentation. A future verified procedure should document the required fields, safe secret handling, and a test-email verification step without exposing credentials.

## 11. Enable infrastructure backups

Hetzner Backups are enabled for `sprey-btcpay`, providing a provider-level recovery layer for the VPS.

Provider backups are not a substitute for understanding application-level consistency and recovery. The production backup design should ultimately document both infrastructure recovery and BTCPay/PostgreSQL application recovery, followed by an actual restore test.

**Pending verification:**

- define application/database backup procedure;
- define retention expectations;
- document restore order;
- perform and record a recovery test.

## 12. Connect a merchant-controlled wallet

This is the next product milestone for the reference store.

The merchant payment destination must remain under merchant control. Sprey does not receive, hold, or forward merchant funds.

The exact wallet setup procedure will be documented while it is performed on the reference store.

## 13. Create and pay the first invoice

After wallet configuration:

1. Create an invoice in the Sprey Processing store.
2. Send the payment independently to the merchant-controlled payment destination.
3. Observe the Bitcoin transaction from the payment side.
4. Confirm that BTCPay observes the blockchain and determines the invoice state from network data.
5. Confirm that the BTCPay invoice reaches the expected state.

This test is the boundary between "the server is online" and "the Bitcoin payment path has been verified."

## 14. Verify integrations

Storefront and API integrations are verified only after the underlying payment path works independently.

For WooCommerce, products and orders stay in WooCommerce. The BTCPay integration creates/tracks the invoice, BTCPay observes the relevant payment network, and the resulting invoice state is reported back to WooCommerce. See [BTCPay + WooCommerce](/integrations/btcpay-woocommerce/).

Additional networks, tokens, plugins, or conversion integrations should be enabled and documented one at a time.

## 15. Updates, diagnostics, and recovery

### Ubuntu updates

The reference server uses `unattended-upgrades` for routine OS updates. The service is enabled and running, and the APT daily timers are active. Automatic reboot is not enabled; a required reboot should be treated as a controlled maintenance action.

Useful checks are:

```bash
apt list --upgradable

test -f /var/run/reboot-required \
  && echo "REBOOT REQUIRED" \
  || echo "Reboot not required"

systemctl status unattended-upgrades --no-pager
systemctl list-timers apt-daily.timer apt-daily-upgrade.timer
```

### BTCPay updates

Do not configure unattended replacement of the production BTCPay stack. The reference deployment is updated through the BTCPay Docker repository's update script:

```bash
cd ~/btcpayserver-docker
./btcpay-update.sh
```

After any BTCPay update, verify container health, Bitcoin/NBXplorer state, the public endpoint, the Access-protected administrative endpoint, and the payment path before considering the maintenance complete.

### Routine host checks

A compact manual checkpoint is:

```bash
apt list --upgradable

test -f /var/run/reboot-required \
  && echo "REBOOT REQUIRED" \
  || echo "Reboot not required"

df -h /
free -h
docker ps

cd ~/btcpayserver-docker
git status -sb
git log -1 --oneline
```

Application-level BTCPay/PostgreSQL backup, restore testing, and automated monitoring/alerting remain separate pending operational tasks.

## Non-custodial boundary

Self-hosting BTCPay does not change the intended Sprey payment model. In the Sprey reference architecture, customer payment happens independently of Sprey and settles to the merchant-controlled wallet or configured payment destination. BTCPay observes the Bitcoin blockchain or another configured payment network and determines invoice state from network data.

Sprey does not initiate, route, receive, hold, or forward merchant funds.

## Documentation method

Every section of this runbook follows the same rule:

> **Build it. Verify it. Document it.**

When the running system differs from an assumption, the verified system wins. When a command has not been reproduced, it remains pending instead of becoming authoritative documentation by guesswork.
