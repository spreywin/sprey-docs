---
title: WP Stack phpMyAdmin access
description: Start phpMyAdmin safely, connect through an SSH tunnel, retrieve database credentials, and stop the maintenance service.
---

phpMyAdmin in Sprey WP Stack is an **optional maintenance tool**. It is disabled by default and is never exposed directly to the public Internet.

The service publishes only to the VPS loopback interface:

```text
127.0.0.1:8081 -> phpMyAdmin:80
```

Do **not** open TCP `8081` in UFW or in the VPS provider firewall. Remote access is intended to go through SSH port forwarding.

## Start phpMyAdmin

On the WP Stack VPS:

```bash
cd /root/sprey-wp-stack
docker compose --profile admin up -d phpmyadmin
```

Verify that the service is running and remains localhost-only:

```bash
docker compose --profile admin ps
docker port sprey-wp-stack-phpmyadmin-1
curl -I --max-time 5 http://127.0.0.1:8081/
```

Expected port mapping:

```text
80/tcp -> 127.0.0.1:8081
```

A successful local HTTP check should return an HTTP response such as `200 OK`.

## Open the SSH tunnel

On your own computer, open a separate terminal and keep it running while you use phpMyAdmin:

```bash
ssh -L 8081:127.0.0.1:8081 root@YOUR_SERVER
```

Then open:

```text
http://localhost:8081
```

The phpMyAdmin page should load through the SSH tunnel. No public port change is required.

## Database credentials

The installer generates database credentials in `/root/sprey-wp-stack/.env`.

For full MariaDB administration through phpMyAdmin, use:

```text
Username: root
Password: MYSQL_ROOT_PASSWORD
```

Retrieve only the root password value with:

```bash
grep '^MYSQL_ROOT_PASSWORD=' /root/sprey-wp-stack/.env
```

Copy the value after `=` into the phpMyAdmin password field.

For routine access limited to the WordPress database, the application account can be used instead:

```text
Username: value of MYSQL_USER
Password: value of MYSQL_PASSWORD
```

Retrieve those values with:

```bash
grep -E '^(MYSQL_USER|MYSQL_PASSWORD)=' /root/sprey-wp-stack/.env
```

Treat `.env` as a secret. Do not paste its full contents into tickets, public chats, screenshots, repositories, or documentation.

## Verified behavior

The current WP Stack deployment has verified the following path end to end:

- phpMyAdmin started from the `admin` Compose profile;
- the service published only on `127.0.0.1:8081`;
- the VPS-local HTTP check returned `200 OK`;
- the UI opened successfully through an SSH tunnel at `http://localhost:8081`;
- login as MariaDB `root` with `MYSQL_ROOT_PASSWORD` succeeded;
- the `wordpress` database and MariaDB system schemas were visible after login;
- stopping phpMyAdmin removed the localhost listener and `127.0.0.1:8081` became unreachable;
- starting the same service again restored `127.0.0.1:8081` and the local HTTP check returned `200 OK` again.

The Compose service uses both `edge` and `app` networks so Docker can publish the localhost maintenance port while phpMyAdmin can still reach MariaDB on the private `app` network. MariaDB itself remains on `app` only.

## Stop and restart phpMyAdmin

When maintenance is finished:

```bash
cd /root/sprey-wp-stack
docker compose --profile admin stop phpmyadmin
```

Confirm that the local port is no longer reachable:

```bash
curl -I --max-time 5 http://127.0.0.1:8081/
```

To start the already-created maintenance container again:

```bash
docker compose --profile admin start phpmyadmin
```

Then verify:

```bash
docker compose --profile admin ps
curl -I --max-time 5 http://127.0.0.1:8081/
```

The stop/start lifecycle is verified. Reboot behavior is intentionally tracked separately and should not be described as verified until tested explicitly.

## Security notes

- Keep TCP `8081` closed publicly.
- Use SSH tunneling rather than publishing phpMyAdmin on `0.0.0.0`.
- Start phpMyAdmin only when needed and stop it after maintenance.
- Prefer the WordPress database user for routine inspection when full MariaDB root privileges are unnecessary.
- Protect `.env`; it contains database credentials generated for the deployment.
