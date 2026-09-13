---
title: Nextcloud verification — 2026-09-13
description: Initial verified deployment checkpoint for the Sprey Nextcloud AIO host.
---

This checkpoint records the Nextcloud state directly verified on 2026-09-13. It is intentionally limited to what was observed on the live host and does not claim that the full Sprey Hub rollout is complete.

## Host

The active host is:

```text
sprey-nc
```

The deployment is running on Oracle infrastructure and currently has approximately 6 GiB of RAM available to the operating system.

A verified memory snapshot showed:

```text
Mem total:      5.8 GiB
Mem used:       1.9 GiB
Mem available:  3.9 GiB
Swap:           0 B
```

## Nextcloud deployment

Nextcloud was installed using the **Nextcloud All-in-One (AIO)** deployment model.

During the verified checkpoint, the Docker stack was active. The observed running containers included:

- `nextcloud-aio-apache`;
- `nextcloud-aio-nextcloud`.

The observed one-shot Docker stats included approximately:

```text
nextcloud-aio-apache    ~56 MiB RAM
nextcloud-aio-nextcloud ~461 MiB RAM
```

These numbers are a point-in-time observation, not sizing guarantees.

## Security boundary

Administrative passwords, recovery material, and application secrets are not stored in Sprey Docs.

Any password shown or changed during setup remains operational secret material and must stay outside the repository.

## Verification status

Verified:

- Oracle host `sprey-nc` is online;
- Nextcloud AIO is installed;
- the Nextcloud AIO Docker stack is running;
- Apache and Nextcloud application containers were observed running;
- host memory headroom was checked;
- no swap was configured at this checkpoint.

Not yet claimed as complete in this checkpoint:

- full desktop synchronization verification;
- mobile synchronization verification;
- external sharing workflow verification;
- backup and restore verification;
- update/upgrade verification;
- final Sprey Hub service set and architecture.

## Documentation rule

This deployment should move from **installed** to **verified for production use** only as the remaining operational flows are tested and documented.
