---
title: Sprey AI Gateway
description: Verified Sprey AI Gateway architecture for local and external model routing through LiteLLM.
---

**Sprey AI Gateway** is the unified OpenAI-compatible AI routing layer for Sprey.

The gateway is live at:

```text
https://ai.sprey.win/v1
```

It separates AI clients such as Nextcloud from individual model providers, provider API keys, and backend-specific endpoints.

## Verified topology

```text
Nextcloud Assistant
        |
        | OpenAI-compatible API
        | dedicated LiteLLM virtual key
        v
https://ai.sprey.win/v1
        |
        v
Cloudflare Tunnel
        |
        v
LiteLLM Gateway
sprey-litellm
        |
        +------------------------------+
        |                              |
        v                              v
sprey-assistant                    PostgreSQL
Auto Router                        Gateway state
        |
        +------------------------------+
        |                              |
        v                              v
external-free                  external-vision
text model group               vision model group
        |                              |
        +------------+-----------------+
                     |
          +----------+----------+
          |                     |
          v                     v
      OpenRouter             LocalAI
 external providers      ai.cloud.sprey.win
                           Gemma fallback
```

The architecture is designed so clients address stable Sprey model names while the gateway owns backend selection and failover.

## Public and administrative endpoints

The public hostname is intentionally split:

```text
https://ai.sprey.win/       -> Sprey AI landing
https://ai.sprey.win/v1/*   -> LiteLLM OpenAI-compatible API
```

The LiteLLM Admin UI is not exposed through the public route.

Administrative access is performed through an SSH tunnel:

```text
local browser
    |
    v
http://127.0.0.1:4000/ui
    |
    | SSH port forwarding
    v
sprey-nc -> 127.0.0.1:4000
```

The host binding remains loopback-only:

```text
127.0.0.1:4000 -> LiteLLM
```

This preserves public API access through Cloudflare while keeping the administration interface private.

## Gateway stack

The current gateway stack uses:

- **LiteLLM Gateway** as the OpenAI-compatible proxy and router;
- **PostgreSQL 16** for persistent LiteLLM state;
- **Cloudflare Tunnel** for the public `/v1` route;
- **OpenRouter** as the first external model aggregator;
- **LocalAI** as the local backend;
- **Nextcloud Assistant** as the first integrated client.

LiteLLM stores models, provider credentials, virtual keys, router configuration, usage state, and related gateway data in PostgreSQL.

## Credential boundaries

Provider and client credentials are deliberately separated.

### OpenRouter

The OpenRouter provider credential is stored inside LiteLLM as:

```text
openrouter-main
```

Clients do not receive the OpenRouter API key.

### Nextcloud

Nextcloud uses one dedicated LiteLLM virtual key.

The virtual key is intentionally not the LiteLLM master key and is not the OpenRouter provider key.

The current client path is:

```text
Nextcloud
   |
   | dedicated virtual key
   v
Sprey AI Gateway
```

This allows new model groups to be added behind the gateway without distributing provider secrets to Nextcloud.

### Secrets

Secrets must not be committed to Git or copied into public documentation.

The LiteLLM salt key is recovery-critical because it is required to decrypt encrypted provider credentials stored by the gateway.

## Model groups

### `external-free`

`external-free` is the main text model group.

It contains multiple external free-model deployments so that temporary provider failures, rate limits, and upstream capacity errors do not depend on one endpoint.

The group also includes the local LocalAI model as the final local fallback:

```text
LocalAI
model: gemma-3-1b-it
API base: http://nextcloud-aio-local-ai:10078/v1
```

Free-provider availability is volatile. The current deployments configured in LiteLLM Admin UI are the source of truth; documentation should describe the routing design rather than assume that a specific free provider will remain available indefinitely.

### `external-vision`

`external-vision` contains several models capable of image input.

The group exists separately from the general text pool because a text-only deployment can accept a normal chat request but fail when the same request contains image content.

The current vision pool uses several OpenRouter free endpoints for redundancy.

## Auto Router: `sprey-assistant`

Nextcloud uses the public router name:

```text
sprey-assistant
```

The router provides one client-facing model name while LiteLLM decides which model group should process the request.

Current routing intent:

```text
normal text
    |
    v
external-free

image-bearing request
    |
    | modality routing
    v
external-vision
```

The Auto Router has modality routing enabled so image requests can move away from text-only deployments.

Session-pin override for image requests is also enabled so a conversation previously routed to a text deployment can temporarily use a vision-capable deployment when an image is supplied.

## Verified capabilities

The following capabilities have been verified through the real Nextcloud -> Gateway path:

- text chat through `sprey-assistant`;
- external model routing through OpenRouter;
- multiple deployments under a common LiteLLM model group;
- health checks and degraded-provider visibility;
- local LocalAI/Gemma fallback;
- image analysis through the vision group;
- modality-aware routing from Nextcloud image tasks;
- dedicated Nextcloud virtual-key authentication;
- private LiteLLM Admin UI through SSH tunneling.

## Current limitations and next work

The following items are intentionally not considered complete yet:

- Speech-to-Text;
- Text-to-Speech;
- image generation;
- production policy for paid fallback models;
- long-term usage and budget policy;
- final retry and provider-priority tuning;
- RAG over Sprey Docs;
- MCP/Greenfield integration for AI-assisted BTCPay support;
- commercial customer-facing Sprey AI UI/API packaging.

The immediate next AI milestone is audio support, but it should be implemented only after the current gateway state is backed up and documented.

## Backup and recovery

A LiteLLM installation with database-backed configuration cannot be recovered from Docker Compose alone.

The minimum recovery set includes:

- PostgreSQL dump;
- LiteLLM environment/configuration files;
- `LITELLM_SALT_KEY`;
- LiteLLM master key and service secrets;
- Cloudflare routing/tunnel configuration or documented reconstruction procedure;
- Sprey AI landing configuration.

A PostgreSQL custom-format dump should be validated with `pg_restore -l` before it is considered a usable checkpoint.

Secrets and database dumps must remain outside the public documentation repository.

## Operational rule

The AI layer follows the general Sprey rule:

> **Build it. Verify it. Document it.**

For AI routing, add one more rule:

> **Expose stable Sprey model names to clients; keep provider churn and failover inside the gateway.**

This prevents Nextcloud and future clients from becoming tightly coupled to one provider, one model slug, or one external API key.
