---
title: Sprey Hub — Internal Workspace Architecture
description: Current internal workspace architecture for Sprey files, collaboration, passwords, dashboards, and AI services.
---

**Sprey Hub** is Sprey's internal workspace under active deployment. It is intentionally separate from the public storefront and payment infrastructure.

The goal is to give Sprey a durable working environment that is not tied to one Windows installation, one browser profile, or one SaaS provider. The Hub should become the internal entry point for files, collaboration, credentials, documentation, boards, and later selected AI-assisted workflows.

This page describes the current architecture and remaining rollout work. Components move from **Planned** to **Verified** only after they are installed, secured, tested, and included in a recovery plan.

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
                                         +-- ai.cloud.sprey.win
                                         |   LocalAI backend
                                         |
                                         `-- ai.sprey.win
                                             Sprey AI Gateway

Separate infrastructure:

pay.sprey.win   -> Sprey Processing / BTCPay host
docs.sprey.win  -> canonical public documentation
mail            -> Zoho-hosted business mail; SMTP used by Hub services
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

The public web host should remain deliberately boring and isolated. Internal collaboration tools, password managers, and AI services should not be added to it merely because capacity exists. Business mail remains externally hosted on Zoho.

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

The current center of the internal workspace is **Nextcloud Hub** at `cloud.sprey.win`.

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

## AI workspace and gateway

The AI layer is now active and separated into local inference, gateway/routing, and client layers:

```text
Nextcloud Assistant
        |
        v
https://ai.sprey.win/v1
Sprey AI Gateway / LiteLLM
        |
        +--> external model groups via OpenRouter
        |
        `--> LocalAI at ai.cloud.sprey.win
             local Gemma fallback
```

The gateway uses LiteLLM with PostgreSQL-backed configuration, model groups, credentials, virtual keys, health checks, and routing. Nextcloud uses a dedicated virtual key and the public router name `sprey-assistant`; it does not receive the LiteLLM master key or the OpenRouter provider key.

The verified capabilities are:

- text chat through the `external-free` model group;
- image analysis through the `external-vision` model group;
- modality-aware routing through `sprey-assistant`;
- multiple external deployments for redundancy;
- LocalAI / Gemma as a local fallback for text;
- private LiteLLM administration through an SSH tunnel rather than a public admin endpoint.

The public route is deliberately split:

```text
https://ai.sprey.win/       -> Sprey AI landing
https://ai.sprey.win/v1/*   -> LiteLLM OpenAI-compatible API
127.0.0.1:4000/ui           -> Admin UI through SSH tunnel
```

Speech-to-Text, Text-to-Speech, image generation, and later RAG/MCP-assisted workflows remain follow-up work.

See [Sprey AI Gateway](/architecture/ai-gateway/) for the current gateway topology, routing model, credential boundaries, backup scope, and remaining AI roadmap.

AI access must respect the same credential, data-classification, and least-privilege rules as the rest of the Hub.

## Mail integration

Sprey business mail remains on **Zoho**. Self-hosting the mail server is not part of the current Sprey architecture or roadmap.

Hub applications use Zoho as the external mail provider when they need to send notifications or system email. For example, Nextcloud should use the appropriate Zoho SMTP account rather than running its own SMTP service.

The boundary is:

```text
Zoho Mail
   |
   | SMTP / authenticated mail delivery
   v
Nextcloud and other Sprey services

Sprey Hub -> no self-hosted mail server
sprey-web -> no self-hosted mail server
```

Mail credentials should be stored and managed as service secrets, with only the minimum access required by each application.

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

Public reachability and authentication policy for each Hub service must be decided before production exposure. Cloudflare Access, application-native authentication, SSH tunneling for private administration, or combinations of those controls can be evaluated per service.

## Current rollout status

The Hub is being built incrementally rather than as one large stack.

1. **Verified:** Nextcloud is live at `cloud.sprey.win`; continue the remaining application configuration, synchronization, access-policy, and operational checks.
2. **Next:** Define the company file taxonomy and migrate selected workstation data into a deliberate internal structure.
3. **Verified:** Vaultwarden is live; keep backup/recovery verification as part of the security checklist.
4. **Verified:** LocalAI is live at `ai.cloud.sprey.win`.
5. **Verified:** The Sprey AI Gateway is live at `ai.sprey.win` with LiteLLM, PostgreSQL, OpenRouter, LocalAI fallback, text routing, and image analysis.
6. **Next:** Add Speech-to-Text and Text-to-Speech only after the current text/vision gateway state is documented and backed up.
7. **Next:** Complete encrypted offsite backup and restore verification for Hub and AI stateful data.
8. **Next:** Create the minimal `hub.sprey.win` dashboard using the existing Sprey visual language.
9. **As needed:** Enable Nextcloud Deck and other collaboration functions only when workflows require them.
10. **Verified direction:** Keep business mail on Zoho and use authenticated Zoho SMTP for Hub applications; do not deploy a local mail server.

## Architecture rule

Sprey Hub follows the same operating rule as the rest of the platform:

> **Build it. Verify it. Document it.**

The additional Hub-specific rule is:

> **Synchronization is not backup. Internal convenience must not weaken service isolation or recovery.**

This document should move individual components from **Planned** to **Verified** only after their real deployment and recovery path have been tested.
