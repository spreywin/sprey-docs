# Sprey Documentation

Canonical documentation for the Sprey project.

The documentation portal records architecture, product boundaries, deployment decisions, verified configuration, operational procedures, and recovery implications from the systems that are actually built and tested.

## Sprey Processing

**Sprey Processing** is Sprey's live non-custodial crypto payment infrastructure and the reference implementation of its **non-custodial crypto acquiring** model.

It is intended for businesses accepting crypto payments both **online and in person** through:

- online-store integrations such as WooCommerce;
- Point of Sale and merchant-device payment flows;
- QR payments;
- Payment Requests;
- Payment Buttons and donations;
- crowdfunding;
- API and custom integrations.

Merchant payments go to merchant-controlled wallets or payment destinations. Sprey does not initiate, route, receive, hold, or forward merchant funds.

`Sprey WP Stack` is a ready-made WordPress/WooCommerce online-commerce implementation connected to Sprey Processing. It is one use of `pay.sprey.win`, not the boundary of the Processing product.

## Documentation principle

Upstream capability and verified Sprey capability are intentionally separated. A feature becomes canonical Sprey documentation only after its real behavior and operational implications are understood and verified.

> **Build it. Verify it. Document it.**

## Portal

Canonical documentation: <https://docs.sprey.win/>

GitHub Pages mirror: <https://spreywin.github.io/sprey-docs/>

## Technology

The portal is built with Astro and Starlight and deployed through GitHub Pages.
