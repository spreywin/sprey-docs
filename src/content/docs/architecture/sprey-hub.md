---
title: Sprey Hub — Internal Workspace Architecture
description: Planned internal workspace for Sprey files, team collaboration, passwords, dashboards, and future AI services.
---

**Sprey Hub** is the planned internal workspace for Sprey. It is intentionally separate from the public storefront and payment infrastructure.

The goal is to give Sprey a durable working environment that is not tied to one Windows installation, one browser profile, or one SaaS provider. The Hub should become the internal entry point for files, collaboration, credentials, documentation, boards, and later selected AI-assisted workflows.

This page describes the intended architecture before deployment. Components remain **planned** until they are installed, secured, backed up, and verified.

## Design goal

The target is a small, self-hosted internal platform with clear service boundaries:

```text
                         SPREY
                           |
             +-------------+-------------+
             |                           |
        PUBLIC INFRA                 INTERNAL INFRA
             |                           |
         sprey-web                    sprey-hub
      Zurich, Switzerland          Zurich, Switzerland
             |                           |
         sprey.win                  hub.sprey.win
     WordPress/WooCommerce                |
                                         +-- cloud.sprey.win
                                         |   Nextcloud Hub
                                         |
                                         +-- vault.sprey.win
                                         |   Vaultwarden
                                         |
                                         +-- internal dashboard
                                         |
                                         +-- files / calendar / contacts
                                         |
                                         +-- boards / tasks / notes
                                         |
                                         `-- AI workspace later

Separate infrastructure:

pay.sprey.win   -> Sprey Processing / BTCPay host
docs.sprey.win  -> canonical public documentation
mail            -> separate mail architecture decision
```

The important boundary is simple:

> **Sprey Hub is internal workspace infrastructure. It is not the public store and it is not payment infrastructure.**

## Host separation

The proposed Zurich layout keeps the public storefront and internal workspace on separate virtual machines.

### `sprey-web`

Purpose:

- `sprey.win` public site;
- WordPress;
- WooCommerce;
- Caddy;
- only the services required by the public storefront.

The public web host should remain deliberately boring and isolated. Internal collaboration tools, password managers, mail servers, and AI services should not be added to it merely because capacity exists.

### `sprey-hub`

Purpose:

- internal file storage and synchronization;
- future team workspace;
- credentials and shared secrets management;
- internal start page / service dashboard;
- collaboration tools;
- later selected AI and knowledge workflows.

The Hub may contain several services, but they should still be separated by containers, data volumes, credentials, and explicit network boundaries.

## Proposed Zurich resource layout

The current preferred layout is to repurpose the already-tested Zurich ARM64 VM as the future Hub rather than use it as the public web host.

Current candidate allocation:

```text
Zurich, Switzerland

sprey-hub
  current VM
  2 OCPU
  12 GB RAM
  99 GB boot volume

sprey-web
  new small VM
  1 GB RAM
  minimum practical boot volume
  swap enabled as required by the verified WP Stack baseline

remaining storage capacity
  kept uncommitted initially
  may later be assigned to sprey-hub when real usage justifies it
```

The Hub is expected to benefit more from RAM and storage than the public WordPress host because it may hold Nextcloud files, file versions, collaboration data, Vaultwarden, dashboards, and later additional internal services.

The public `sprey-web` host is intentionally kept minimal. The Sprey WP Stack has already been verified on an approximately 1 GB host with swap, so this class of VM is considered a valid starting point for the public storefront. Production sizing should still be adjusted later if measured traffic, updates, or WooCommerce workloads show that more capacity is required.

Any remaining storage capacity is a reserve rather than a separate product commitment. If Hub usage grows, spare storage should preferentially be assigned to `sprey-hub` before creating another storage-heavy service.

## Core service: Nextcloud Hub

The planned center of the internal workspace is **Nextcloud Hub**.

Initial functions:

- synchronized company files;
- shared team folders;
- calendar;
- contacts;
- tasks;
- notes;
- Deck boards;
- WebDAV access;
- desktop and mobile synchronization;
- file history and versioning;
- a future path to document collaboration through OnlyOffice or Collabora if needed.

Proposed hostname:

```text
cloud.sprey.win
```

Nextcloud should be treated as the working copy and collaboration layer, not as the only backup of company data.

## Workstation resilience

One of the first practical goals is to remove the Windows workstation as a single point of failure.

The intended model is:

```text
Windows workstation
       |
       | selected synchronized folders
       v
Nextcloud / Sprey Hub
       |
       | encrypted backup
       v
independent offsite storage
```

A clean Windows installation should therefore be an inconvenience, not a disaster.

The migration should not blindly synchronize the entire PC. Existing files should first be reviewed and moved into a deliberate company structure, for example:

```text
Sprey/
├── Company
├── Finance
├── Legal
├── Infrastructure
├── Processing
├── Store
├── Documentation
├── Design
├── Backups
└── Personal-Work
```

The exact structure may evolve, but company knowledge should gradually move out of ad-hoc Downloads/Desktop folders and into named, backed-up locations.

## Passwords and secrets: Vaultwarden

Passwords should not live in text files, chat history, browser notes, or general-purpose file storage.

The planned password service is **Vaultwarden**, using the Bitwarden client ecosystem.

Proposed hostname:

```text
vault.sprey.win
```

Expected use:

- infrastructure credentials;
- secure notes;
- TOTP where appropriate;
- team organizations and collections;
- role-based sharing of credentials;
- browser, Windows, Android, and iOS clients.

As the team grows, a person should receive only the credentials required for that person's work rather than a shared master password collection.

Vaultwarden data is high-value infrastructure and requires its own tested backup and recovery procedure.

## Sprey Hub dashboard

The Hub should have a simple, visually clean internal homepage that acts as the front door for the future Sprey team.

Proposed hostname:

```text
hub.sprey.win
```

A first version can be a minimal dashboard with links such as:

```text
Sprey Hub

Cloud        -> cloud.sprey.win
Vault        -> vault.sprey.win
Docs         -> docs.sprey.win
Processing   -> pay.sprey.win
Store        -> sprey.win
Status       -> status.sprey.win
GitHub       -> github.com/spreywin
Boards       -> Nextcloud Deck
AI           -> future internal AI workspace
```

The dashboard is an interface, not the source of truth. Architecture, operations, recovery procedures, and security rules remain documented in **Sprey Docs**.

The visual direction should follow the existing Sprey homepage language: minimal, branded, fast, and free of unnecessary administration complexity.

## Boards and project work

A separate project-management platform is not required initially.

The first implementation should use **Nextcloud Deck** for lightweight Kanban workflows such as:

```text
Backlog -> In progress -> Review -> Done
```

If the team later needs deeper planning, issue relationships, time tracking, roadmaps, or more complex permissions, dedicated tools such as Plane, OpenProject, or Vikunja can be evaluated at that point.

The operating principle is to avoid deploying a separate service until a real workflow requires it.

## AI workspace — later phase

A future internal AI endpoint may be added, for example:

```text
ai.sprey.win
```

The Zurich Hub host is not intended to run a large production language model locally merely because it has available RAM. A more practical first architecture is a lightweight internal interface connected to selected external or remote model APIs.

Potential later uses:

- help with internal documentation;
- search and question answering over approved company knowledge;
- infrastructure assistance;
- product support knowledge;
- internal RAG over selected Sprey documents.

AI access must respect the same credential, data-classification, and least-privilege rules as the rest of the Hub.

## Mail boundary

Moving Sprey mail away from Zoho is a separate infrastructure project and should not be bundled casually into the first Hub deployment.

Running reliable business mail requires more than starting an SMTP container. It requires deliberate handling of:

- reverse DNS / PTR;
- SPF;
- DKIM;
- DMARC;
- IP reputation;
- abuse and spam controls;
- blacklist monitoring;
- outbound SMTP/provider restrictions;
- backup and recovery;
- delivery monitoring;
- operational continuity.

Therefore the initial architecture is:

```text
Sprey Hub       -> self-host internal workspace
Current mail    -> remains on Zoho during initial Hub rollout
Future mail     -> separate design, host/IP/reputation decision
```

A future dedicated mail host or a hybrid design with an outbound relay can be evaluated after the Hub and public web infrastructure are stable.

Mail should not be placed on `sprey-web`.

## Backup is a separate layer

A synchronized server is not a backup.

The required model is:

```text
workstation
    |
    v
Sprey Hub working data
    |
    v
server-side backup / snapshot
    |
    v
encrypted OFFSITE backup
```

At minimum, the backup scope should eventually include:

- Nextcloud data;
- Nextcloud database;
- Vaultwarden database and attachments;
- service configuration;
- required secrets and recovery material;
- internal dashboard configuration;
- future service-specific data.

An independent storage target such as object storage or another provider should be preferred so that a single provider account, VM, disk, or operator mistake cannot destroy both the working copy and its backup.

Backups are not considered complete until restore has been tested.

## Security principles

Sprey Hub should follow the existing Sprey engineering model:

- least privilege;
- no unnecessary public ports;
- explicit service boundaries;
- strong unique credentials;
- MFA where supported;
- separate administrator and ordinary user access where practical;
- offsite encrypted backups;
- minimal exposed administration interfaces;
- no secrets committed to Git;
- no assumption that an internal dashboard itself provides authentication or authorization.

Public reachability and authentication policy for each Hub service must be decided before production exposure. Cloudflare Access, VPN-only access, application-native authentication, or combinations of those controls can be evaluated per service.

## Proposed rollout

The Hub should be built incrementally rather than as one large stack.

1. Confirm the role swap: repurpose the current 2 OCPU / 12 GB / 99 GB Zurich VM as `sprey-hub` and create a separate minimal `sprey-web` VM.
2. Keep remaining storage capacity uncommitted until real Hub or web usage justifies allocation; prefer expanding `sprey-hub` when internal storage or collaboration demand grows.
3. Deploy Nextcloud and verify desktop/mobile synchronization, persistence, upgrade behavior, and recovery boundaries.
4. Define the company file taxonomy and migrate selected workstation data.
5. Implement encrypted offsite backups and perform a restore test.
6. Deploy Vaultwarden and verify backup/recovery before moving critical credentials.
7. Create the minimal `hub.sprey.win` dashboard using the existing Sprey visual language.
8. Enable Nextcloud Deck and other collaboration functions only as workflows require them.
9. Add AI integration only after access control and internal data boundaries are clear.
10. Design mail migration separately; keep Zoho until the replacement mail architecture is proven.

## Architecture rule

Sprey Hub follows the same operating rule as the rest of the platform:

> **Build it. Verify it. Document it.**

The additional Hub-specific rule is:

> **Synchronization is not backup. Internal convenience must not weaken service isolation or recovery.**

This document should move individual components from **Planned** to **Verified** only after their real deployment and recovery path have been tested.
