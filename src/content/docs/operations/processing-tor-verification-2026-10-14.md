---
title: Sprey Processing Tor Access Verification — 2026-10-14
description: Operational record for enabling and verifying Tor onion access on the Sprey BTCPay Server reference deployment.
---

## Result

**Verified by the operator on 2026-10-14:** the onion address appeared in the BTCPay administration interface, opened successfully, and the operator confirmed that the service worked through it.

- **Service:** Sprey Processing — `https://pay.sprey.win`
- **Server:** `sprey-btcpay`
- **BTCPay Server:** `v2.4.5+5d0745cae` (reported from the live footer)
- **Operating system:** Ubuntu 26.04.1 LTS
- **Onion URL:** [http://ouzdv6adywyfehbnmnrekyfmkqj2vsugqvxeihzw7e5r64y4ouvteryd.onion](http://ouzdv6adywyfehbnmnrekyfmkqj2vsugqvxeihzw7e5r64y4ouvteryd.onion)

Use Tor Browser to access the onion URL. The `.onion` URL uses HTTP by design for Tor onion services; traffic inside Tor is encrypted between the client and the onion service, but this does not make a logged-in user anonymous to the application.

## Change made

Before the change, `sudo btcpay-fragments show` reported these additional fragments:

```text
btcpay-host
opt-add-cloudflared
opt-save-storage-xs
```

A backup was created before changing the configuration. The operator then ran:

```bash
sudo btcpay-fragments add opt-add-tor
```

The command completed and regenerated/applied the Docker Compose configuration. The resulting configuration reported:

- `opt-add-tor` — enabled and listed in `effectiveFragments`;
- `opt-add-cloudflared` — retained and active;
- `opt-add-tor-relay` — not enabled;
- existing `opt-save-storage-xs` and `opt-mempoolfullrbf` configuration retained;
- BTCPay and Bitcoin-related containers started successfully.

## Runtime checks

The operator checked:

```bash
sudo docker logs --tail 80 tor
sudo docker logs --tail 80 tor-gen
sudo docker port tor
sudo docker inspect tor --format '{{json .NetworkSettings.Ports}}'
sudo docker inspect tor --format '{{json .NetworkSettings.Networks}}'
sudo btcpay-routes show
```

Observed results:

- Tor reached `Bootstrapped 100% (done)`.
- The `tor` and `tor-gen` containers were running.
- Docker showed `{"9050/tcp":null,"9051/tcp":null}`; Tor's SOCKS and control ports were not published on host ports.
- Tor was attached to Docker network `generated_default`.
- `btcpay-routes show` returned empty `optionalRoutes` and `enabledRoutes` arrays.
- The onion URL was then opened successfully, and the operator confirmed the service worked.

## Security notes and boundaries

- `opt-add-tor` is enabled on this reference deployment by default after this change.
- `opt-add-tor-relay` remains disabled. Sprey is not running a Tor relay as part of this setup.
- `opt-add-cloudflared` remains enabled; ordinary public and administrative ingress was not intentionally replaced by Tor.
- Tor logs warned that SOCKS (`0.0.0.0:9050`) and ControlPort (`0.0.0.0:9051`) listen on all interfaces **inside the Tor container**. Since Docker did not publish these ports on the host, the logs alone do not prove public internet exposure. However, other containers attached to the same Docker network may be able to reach them; this remains a container-network security consideration.
- UFW reported inactive. The operator stated that a provider/server-side firewall is in use. Docker port inspection showed no host-published ports for 9050/9051, but this should not be interpreted as a complete audit of all network paths.
- The onion URL provides an alternate way to reach the service; it is not a promise of complete anonymity. Account authentication, browser configuration, application-level data, and user actions can still identify or correlate activity.
- The operator confirmed that the onion endpoint and service worked. This record does not claim a separate end-to-end paid invoice was created and settled specifically through the onion URL.

## Recheck after future changes

After a major BTCPay/Docker update, server recovery, or fragment reconfiguration:

1. Run `sudo btcpay-fragments show` and confirm `opt-add-tor` remains in `effectiveFragments`.
2. Check `docker ps` and the Tor/Tor generator logs.
3. Open the saved onion URL in Tor Browser.
4. Verify `https://pay.sprey.win` still works through the normal Cloudflare Tunnel path.
5. If the onion URL changes, update this record and the Sprey Processing product page after confirming the replacement address works.

**Documentation rule:** this is a live-configuration record based on the operator's reported tests on 2026-10-14. It should be revised when the configuration or verification boundary changes.
