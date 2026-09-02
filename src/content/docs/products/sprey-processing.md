---
title: Sprey Processing
description: Sprey's live non-custodial crypto payment infrastructure and reference deployment behind pay.sprey.win.
---

**Sprey Processing** is the first live Sprey product and the reference implementation of Sprey's **non-custodial crypto acquiring** model. It is intended for businesses accepting crypto payments both **online and in person**. The current reference deployment is available at [pay.sprey.win](https://pay.sprey.win/).

In Sprey terminology, **non-custodial crypto acquiring** means infrastructure that lets a merchant accept crypto payments directly to a merchant-controlled wallet or payment destination while Sprey provides invoice, payment-state observation, and integration infrastructure. Sprey does not initiate, route, receive, hold, or forward merchant funds.

BTCPay Server is the current foundation of Sprey Processing. WooCommerce is one supported storefront integration, not the definition or boundary of the product. Sprey Processing is deliberately broader than online commerce alone.

## Product scope

Sprey Processing is designed to expose the standard BTCPay payment model through `pay.sprey.win` across several merchant use cases:

- **Online commerce** — WooCommerce and other supported e-commerce integrations.
- **In-person payments** — BTCPay Point of Sale flows on connected phones, tablets, computers, or merchant terminals.
- **QR payments** — customer-facing payment flows initiated from merchant devices or displayed payment requests.
- **Payment Requests** — shareable requests that can remain open independently of a shopping cart.
- **Payment Buttons and donations** — direct merchant payment entry points without requiring a conventional online store.
- **Crowdfunding** — BTCPay crowdfunding applications and campaigns.
- **API and custom integrations** — merchant systems that integrate directly with BTCPay rather than through WooCommerce.

These capabilities describe the **product boundary and upstream BTCPay model**. A capability becomes a **verified Sprey Processing capability** only after it has been configured and tested on the reference deployment.

The intended product architecture is:

```text
                         SPREY PROCESSING
                         pay.sprey.win
                               |
          +--------------------+--------------------+
          |                    |                    |
       ONLINE              IN PERSON             DIRECT
          |                    |                    |
    WooCommerce              POS              Payment Requests
    other stores              QR              Payment Buttons
    integrations        phone/tablet/PC        Donations
                                               Crowdfunding
          |                    |                    |
          +--------------------+--------------------+
                               |
                          BTCPay Store
                               |
                               v
                        payment network
                               |
                               v
                  merchant-controlled wallet
```

`Sprey WP Stack` is therefore a ready-made **online-commerce implementation** of Sprey Processing, not the boundary of Sprey Processing itself:

```text
Sprey WP Stack
WordPress + WooCommerce
        |
        | BTCPay integration
        v
Sprey Processing
pay.sprey.win
```

## Payment model

The payment itself happens independently of Sprey. BTCPay observes the Bitcoin blockchain or another configured payment network, determines invoice state from network data, and reports that state to the connected storefront or integration.

For WooCommerce, products, cart, checkout, and orders remain in WooCommerce. BTCPay is separate payment infrastructure.

See [BTCPay + WooCommerce](/integrations/btcpay-woocommerce/) for the integration model.

## Reference deployment

The current Sprey reference deployment uses:

| Component | Current state |
| --- | --- |
| Public endpoint | `pay.sprey.win` |
| Administrative endpoint | `adminpay.sprey.win` behind Cloudflare Access |
| Server hostname | `sprey-btcpay` |
| Hosting | Hetzner Cloud |
| Operating system | Ubuntu 26.04.1 LTS |
| Compute | 4 vCPU / 8 GB RAM |
| Disk | 80 GB SSD; root filesystem approximately 75 GiB usable, 57% used at the verified checkpoint |
| Swap | 4 GiB `/swapfile`; `vm.swappiness=10` |
| Network perimeter | Hetzner Cloud Firewall; inbound 22/tcp and ICMP only |
| Web ingress | Cloudflare Tunnel to the BTCPay nginx service |
| Application health | `https://pay.sprey.win/api/v1/health`; verified HTTP 200 with `{"synchronized":true}` |
| Monitoring approach | Native provider/component signals first; no additional monitoring stack on the BTCPay host at this checkpoint |
| Planned external watchdog | Run outside `sprey-btcpay`, preferably from the future `sprey.win` application/server layer |
| Automatic OS updates | `unattended-upgrades` enabled; automatic reboot not enabled |
| BTCPay Server | v2.4.3, live |
| Bitcoin | Mainnet, synchronized pruned node; automatic pruning enabled with a 25 GiB target |
| Lightning | Not configured in the reference store |
| SMTP | Configured for server and Processing email delivery |
| VPS backups | Hetzner Backups enabled |
| Application backup | A local legacy `backup.sh` run completed successfully; restore testing and the canonical long-term backup workflow remain pending |

The reference deployment is intentionally documented from observed and verified state. Configuration details that have not yet been reproduced or verified are not presented here as canonical instructions.

## Verified Bitcoin Core checkpoint

Bitcoin Core was verified with the official deployment helper `bitcoin-cli.sh getblockchaininfo` after initial synchronization. At the verified checkpoint:

- the node was on `main`;
- block and header heights matched;
- `initialblockdownload` was `false`;
- automatic pruning was enabled;
- the prune target was `26214400000` bytes (25 GiB);
- there were no Bitcoin Core warnings.

This is the canonical Bitcoin Core verification checkpoint before merchant store and wallet configuration.

## Verified resource baseline

At the latest verified checkpoint the host had approximately 7.6 GiB of usable RAM, about 1.7 GiB in use, and about 5.9 GiB available. A 4 GiB swap file is enabled as an emergency buffer. `vm.swappiness` is explicitly set to `10` in `/etc/sysctl.d/99-sprey-memory.conf`.

The root filesystem was about 57% used at the recorded baseline. Docker data is dominated by Bitcoin application data rather than unidentified Docker growth. Bitcoin Core is configured for automatic pruning with a 25 GiB target.

## Verified monitoring baseline

The reference deployment deliberately avoids adding a separate monitoring stack to `sprey-btcpay` unless a concrete operational gap requires one. Monitoring starts with signals already provided by the infrastructure and application components:

```text
Hetzner Cloud
  -> host/infrastructure metrics and server state

Cloudflare
  -> edge, Access, and Tunnel state

BTCPay Server
  -> /api/v1/health
```

The public application health endpoint was verified through the real production ingress path:

```text
GET https://pay.sprey.win/api/v1/health
HTTP/2 200
{"synchronized":true}
```

This request traverses Cloudflare and the Cloudflare Tunnel before reaching BTCPay, so it verifies the externally reachable Processing application path rather than only a localhost service.

The same health endpoint returned `{"synchronized":true}` after the local application backup run stopped and restarted the BTCPay Docker stack. This verifies that the reference deployment returned to synchronized service after that backup checkpoint.

The canonical monitoring principle is to use native provider and component health signals first. A third-party agent, dashboard, or monitoring stack should be introduced only when a specific missing check justifies the added operational complexity. Filesystem fullness, swap behavior, Docker container state, updates, and other host details remain part of the compact manual maintenance checkpoint until an automated gap is deliberately selected and verified.

### Planned external Processing watchdog

The missing automated layer is intentionally small: an external watchdog should periodically request the public BTCPay health endpoint and alert only when the expected healthy state is not observed consistently.

The watchdog must run **outside `sprey-btcpay`**. A monitor running on the payment host cannot report a complete host, network, Docker, or Tunnel outage after the host itself becomes unavailable. The preferred future location is the separate server/application layer behind `sprey.win`, once that layer is operational.

The intended architecture is:

```text
sprey.win server/application layer
   |
   | periodic external request
   v
https://pay.sprey.win/api/v1/health
   |
   +-- HTTP 200 + {"synchronized":true} -> healthy, no alert
   |
   +-- repeated failure/unhealthy state -> operator alert
```

This watchdog is not yet deployed, so its polling interval, retry threshold, notification channel, and `status.sprey.win` integration are deliberately **pending implementation and verification**. The design goal is not to introduce another general-purpose monitoring platform: it is to add the smallest external check needed to detect loss of the Processing application path.

A future `status.sprey.win` service may consume this external health state, but public status reporting must remain separate from administrative access and must not expose merchant data, credentials, internal topology, or sensitive diagnostics.

## Verified public and administrative ingress

The reference deployment separates the public Processing endpoint from the protected administrative endpoint:

```text
Internet
   |
   v
Cloudflare
   |
   v
Cloudflare Tunnel
   |
   +--> pay.sprey.win ----------------------> nginx -> BTCPay
   |
   +--> adminpay.sprey.win -> Access ------> nginx -> BTCPay
```

`pay.sprey.win` remains public because merchant, customer, API, webhook, and invoice traffic must reach BTCPay without an interactive Access login.

`adminpay.sprey.win` is configured as an additional BTCPay host and is protected by Cloudflare Access. The current Access policy allows a specific administrative email address rather than an entire email domain. The address itself is intentionally not published.

The Cloudflare Tunnel connects to the internal nginx service over HTTP. Public HTTPS terminates at Cloudflare; the reference origin does not publish port 443.

A Hetzner Cloud Firewall is attached to `sprey-btcpay`. Its verified inbound policy allows SSH on TCP port 22 and ICMP. Port 80 is still published by the Docker nginx container on the host, but unsolicited inbound web traffic is dropped by the external Hetzner firewall. This prevents the server IP from acting as a public bypass around the Cloudflare Tunnel. No outbound firewall rules are configured, so the host can establish the outbound connection required by `cloudflared`.

The host UFW service is currently inactive. The reference deployment deliberately relies on the Hetzner Cloud Firewall for the public perimeter rather than claiming UFW protection that is not active.

### Cloudflare compatibility note

Cloudflare Rocket Loader caused BTCPay login JavaScript to fail under BTCPay's Content Security Policy. The failure was reproduced on the reference deployment and disappeared when Rocket Loader was disabled.

The verified production configuration keeps Rocket Loader enabled globally for the `sprey.win` zone and disables it only for the BTCPay hostnames through the active Cloudflare Configuration Rule `BTCPay - Disable Rocket Loader`:

```text
Hostname equals pay.sprey.win
OR
Hostname equals adminpay.sprey.win

-> Rocket Loader: Off
```

After the hostname-specific rule was deployed, global Rocket Loader was re-enabled. The login-code flow on `pay.sprey.win` and the Cloudflare Access plus BTCPay login flow on `adminpay.sprey.win` were both re-tested successfully. This hostname-specific exclusion is therefore the canonical verified configuration.

## Current product state

The BTCPay Server instance is online and the **Sprey Processing** store exists. The public and administrative ingress paths, origin network perimeter, Bitcoin Core synchronization and pruning state, host resource baseline, and public BTCPay health endpoint have been verified.

A payment method is not considered operational merely because its configuration page is available. It becomes part of the verified Sprey Processing reference only after the complete merchant flow has been tested: merchant destination configured, invoice created, customer payment sent independently, network state observed by BTCPay, and invoice state reported correctly.

## Product verification path

The canonical initial product verification path follows the merchant journey rather than treating internal component checks as separate product milestones:

1. **Bitcoin Core — verified.** Confirm mainnet synchronization, out-of-IBD state, pruning configuration, and absence of warnings.
2. **Store.** Verify the `Sprey Processing` BTCPay Store configuration required for the first real payment.
3. **Merchant-controlled wallet.** Connect and verify the merchant-controlled Bitcoin destination without exposing seed words or private keys to Sprey.
4. **Invoice.** Create a real invoice through BTCPay.
5. **Real payment.** Send a small real on-chain Bitcoin payment independently of Sprey.
6. **Network observation.** Verify that BTCPay observes the Bitcoin network and determines the correct invoice state.
7. **Invoice state.** Verify the resulting invoice lifecycle and merchant-facing status.
8. **Document and extend.** Record the verified configuration and recovery implications, then add other payment methods and integrations one at a time.

NBXplorer remains an internal BTCPay component and can be inspected when troubleshooting requires it, but a standalone NBXplorer health check is no longer the first merchant product milestone.

Lightning remains optional and separate from the initial on-chain Bitcoin verification path.

## Backup checkpoint

The reference host currently has two distinct backup layers:

1. **Hetzner Backups** provide the provider-level VPS backup layer.
2. A local BTCPay application backup was produced by the deployment's existing legacy `backup.sh`, which dumped PostgreSQL, stopped the BTCPay Docker stack, archived the selected application data, restarted the stack, and completed successfully.

After that restart, `https://pay.sprey.win/api/v1/health` again returned `{"synchronized":true}`.

This does **not** close the application backup work. Restore has not yet been tested, and the canonical long-term BTCPay backup/restore workflow has not yet been selected and verified. Until restore testing succeeds, the local archive is evidence of a successful backup run, not a verified disaster-recovery procedure.

## Self-host BTCPay Server

Sprey also documents the path for operators who prefer to run their own BTCPay Server instead of using `pay.sprey.win`.

The self-host guide follows the same deployment that is being used for the Sprey reference server. It is built progressively from verified operational knowledge rather than reconstructed from memory.

See [Self-host BTCPay Server](/products/self-host-btcpay-server/).

## Documentation rule

The operational rule for Sprey Processing is:

> **Build it. Verify it. Document it.**

A configuration becomes canonical documentation only after it is understood and verified on the real deployment. Where upstream BTCPay documentation offers multiple valid approaches, Sprey documentation should distinguish the upstream choices from the configuration actually used and tested by Sprey.
