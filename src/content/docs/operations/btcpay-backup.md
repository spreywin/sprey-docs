---
title: BTCPay backup operations
description: Create, encrypt, verify, retain, and restore Sprey Processing BTCPay Server backups.
---

This runbook documents the verified backup and restore path used by the current Sprey Processing reference deployment at `pay.sprey.win`.

The backup pipeline uses BTCPay Server's native backup format. Sprey does not create a proprietary backup format: `btcpay-backup.sh` creates the canonical backup, GPG encrypts it, and the Sprey wrapper delivers and verifies the encrypted archive in Cloudflare R2.

## Recovery layers

The reference deployment uses three independent recovery layers:

| Layer | Purpose | Retention |
| --- | --- | --- |
| Local BTCPay backup | Fast access to the latest native encrypted backup | Latest backup only |
| Cloudflare R2 | Independent encrypted off-site history | 21 daily + 3 monthly |
| Hetzner Backup | Full-VPS recovery checkpoint | 7 daily automatic backups + manual checkpoints |

The local BTCPay backup is stored at:

```text
/var/lib/docker/volumes/backup_datadir/_data/backup.tar.gz.gpg
```

Do not keep an unencrypted BTCPay backup as the normal local recovery artifact.

## Encryption key

The backup passphrase is stored on the VPS in a root-only file:

```text
/root/.config/sprey-backup/btcpay-backup-passphrase
```

Required permissions:

```text
600 root:root
```

An independent recovery copy of this passphrase must exist outside the VPS. The reference deployment stores it in Bitwarden. Never print the passphrase in documentation, logs, tickets, screenshots, or shell commands that embed its value directly.

## R2 storage

The private Cloudflare R2 bucket is `sprey-backups`.

BTCPay objects use these prefixes:

```text
btcpay/daily/
btcpay/monthly/
```

R2 Lifecycle owns retention:

- `btcpay/daily/`: delete after 21 days.
- `btcpay/monthly/`: delete after 93 days.

The VPS backup wrapper does not delete remote backups. Public bucket access is disabled. The R2 service credential is restricted to the backup bucket and to the production VPS public IPv4 and IPv6 addresses.

A Cloudflare budget alert is configured at USD 1 to surface unexpected R2 charges early.

## R2 transport

The reference deployment uses the official upstream `rclone` release rather than the older Ubuntu package build.

Verified version:

```text
rclone v1.75.0
```

The downloaded Debian package was verified against the upstream SHA256 checksum before installation.

The R2 remote is named:

```text
r2:
```

The rclone configuration is root-only. Do not expose its access key or secret key in diagnostics or documentation.

## Backup wrapper

The production wrapper is:

```text
/usr/local/sbin/sprey-btcpay-backup
```

Required permissions:

```text
700 root:root
```

Its responsibilities are deliberately narrow:

1. Read the root-only backup passphrase.
2. Run BTCPay Server's native `btcpay-backup.sh`.
3. Verify that the encrypted archive decrypts with the recovery key and that the resulting gzip stream passes its integrity test.
4. Calculate the local encrypted archive SHA256.
5. Upload the encrypted archive to `btcpay/daily/` using a unique UTC timestamped object name.
6. Read the uploaded object back from R2 and calculate its SHA256 locally.
7. Fail unless the local and read-back hashes match.
8. On the first day of a UTC month, upload the same backup to `btcpay/monthly/` and verify it in the same way.

A typical object name is:

```text
btcpay-2026-09-03T16-15-44Z.tar.gz.gpg
```

Do not use a successful upload alone as proof of a valid off-site backup. The verified path requires a read-back comparison.

R2 does not provide a usable remote SHA256 through the tested `rclone sha256sum` path. The verified implementation therefore reads the object with `rclone cat` and pipes the bytes through local `sha256sum`. This proves that the bytes retrieved from R2 match the local encrypted archive.

## Automation

The wrapper is executed by:

```text
/etc/systemd/system/sprey-btcpay-backup.service
```

The daily timer is:

```text
/etc/systemd/system/sprey-btcpay-backup.timer
```

Schedule:

```text
03:15 UTC daily
```

The timer uses `Persistent=true`, so systemd can trigger a missed run after the server returns from downtime.

Check the timer with:

```bash
systemctl status sprey-btcpay-backup.timer --no-pager
systemctl list-timers sprey-btcpay-backup.timer --no-pager
```

Check backup execution with:

```bash
systemctl status sprey-btcpay-backup.service --no-pager
journalctl -u sprey-btcpay-backup.service -n 100 --no-pager
```

A successful run must include the wrapper's remote verification success and must leave the BTCPay containers running.

## Verified backup checkpoint

The following path was verified end to end on 2026-09-03:

```text
BTCPay native backup
        ↓
PostgreSQL dump
        ↓
GPG encrypted archive
        ↓
local decrypt + gzip integrity test
        ↓
rclone upload
        ↓
Cloudflare R2
        ↓
remote read-back
        ↓
SHA256 comparison
        ↓
verified match
```

The first verified encrypted archive was approximately 21 MB. Multiple timestamped daily uploads were successfully created, and the systemd service was exercised independently before the timer was enabled.

The local backup directory was cleaned after verification so that only the latest encrypted `backup.tar.gz.gpg` remains as the normal local backup artifact.

## Verified restore checkpoint

A native BTCPay restore was successfully tested on the production VPS on 2026-09-03 while the deployment had no merchant wallets or customer activity. A fresh manual Hetzner Backup was confirmed `Available` immediately before the test as the rollback checkpoint.

The encrypted local backup was restored with BTCPay Server's native `btcpay-restore.sh` using the root-only recovery passphrase. The script successfully:

1. Decrypted and extracted the GPG backup.
2. Stopped the BTCPay deployment.
3. Restored the backed-up Docker volumes.
4. Started PostgreSQL and restored the database dump.
5. Restarted the complete BTCPay deployment.
6. Completed with exit status `0`.

Post-restore verification confirmed:

```text
All BTCPay containers running
Bitcoin chain: main
Bitcoin blocks = headers: 965346
Bitcoin verificationprogress: 1
Bitcoin initialblockdownload: false
Bitcoin pruned: true
BTCPay /api/v1/health: {"synchronized":true}
Sprey Processing store present and accessible
```

The existing pruned Bitcoin blockchain survived the native restore, so no full blockchain resynchronization was required.

**Native BTCPay backup restore — VERIFIED.**

This checkpoint proves that the current encrypted native backup can restore the BTCPay application state on the existing deployment. It does not replace a future clean-host disaster-recovery exercise. Once the service contains merchant wallets or customer activity, perform destructive restore testing only in an isolated environment rather than on production.

## Restore procedure

Before a production restore, confirm that a current independent recovery checkpoint exists and that the backup passphrase is available from its independent recovery copy.

From the BTCPay Docker directory:

```bash
export BTCPAY_BACKUP_PASSPHRASE="$(cat /root/.config/sprey-backup/btcpay-backup-passphrase)"

./btcpay-restore.sh \
  /var/lib/docker/volumes/backup_datadir/_data/backup.tar.gz.gpg

RESTORE_STATUS=$?
unset BTCPAY_BACKUP_PASSPHRASE
echo "Restore exit status: $RESTORE_STATUS"
```

Do not interrupt the restore while containers, volumes, or PostgreSQL are being restored. If the restore fails, inspect the failure before making further changes or invoking the provider-level rollback.

After a successful restore, verify containers, Bitcoin state, and BTCPay health:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
./bitcoin-cli.sh getblockchaininfo
curl -fsS https://pay.sprey.win/api/v1/health && echo
```

Then verify the expected Store and configuration in the BTCPay UI.

## Operational boundary

Backup ownership is intentionally separated:

```text
BTCPay Server → canonical backup creation and restore
Sprey wrapper → scheduling, encrypted off-site delivery, and verification
Cloudflare R2 → object storage and retention lifecycle
Hetzner → independent full-VPS recovery layer
Bitwarden → independent recovery copy of the encryption key
```

Keep this boundary when extending the system. Do not add remote deletion, a proprietary backup format, or unrelated infrastructure management to the backup wrapper.
