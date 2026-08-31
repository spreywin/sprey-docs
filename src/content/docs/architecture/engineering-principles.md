---
title: Engineering Principles
description: Practical engineering rules for changing, operating, and documenting the Sprey platform.
---

These principles define how Sprey should evolve. They are intended to keep the platform understandable, reproducible, and operationally simple as products and infrastructure grow.

## Prefer the smallest correct change

Solve the actual problem with the smallest change that fully solves it. Avoid broad refactors, new abstractions, or additional components when the existing architecture can express the solution cleanly.

A small change is not automatically a good change: it must still be complete, correct, and leave the system in a coherent state.

## Minimum custom code, maximum system consistency

Prefer native framework, platform, and upstream capabilities over custom replacements when they satisfy the requirement.

Custom code should exist because it solves a real Sprey-specific problem, not because a standard component can be recreated differently. Fewer custom layers reduce maintenance, regressions, upgrade friction, and operational knowledge that exists only in one person's memory.

## One task, one understandable change

Keep each logical task focused. Do not mix unrelated content changes, UI work, infrastructure changes, and refactoring into one change unless they are inseparable for correctness.

A change should be easy to explain, review, verify, and reverse.

## Understand the architecture before changing it

Identify the component that actually owns the behavior before editing code or documentation. Preserve service boundaries rather than fixing symptoms in the wrong layer.

For example, storefront behavior belongs to the storefront stack, payment-state observation belongs to payment infrastructure, and documentation presentation belongs to the documentation portal.

## Preserve working state before major changes

Before a risky or wide-reaching change, preserve a known-good state with an appropriate Git branch, commit, backup, or infrastructure snapshot.

The purpose is not to avoid change. It is to make experimentation recoverable.

## Verify after every logical stage

Do not accumulate many unverified changes and test only at the end. After each meaningful stage, verify the behavior that was changed and confirm that adjacent working behavior remains intact.

For infrastructure and operational documentation, verification should include the real deployment path whenever practical. A command that looks correct is not considered proven merely because it is plausible.

## Rollback is an engineering tool

Rollback is a normal response when a change makes the system less clear, less stable, or harder to maintain. Do not preserve a bad direction merely because work has already been invested in it.

After rollback, restore only the changes that have demonstrated value. Do not automatically rebuild the entire discarded implementation.

## Documentation is canonical operational knowledge

Sprey documentation should describe how the platform actually works and should remain independent from marketing copy.

Operational guides must be reproducible enough to deploy, verify, maintain, recover, and, where appropriate, roll back a service without relying on undocumented memory. Commands, prerequisites, assumptions, dangerous actions, verification steps, and service boundaries should be explicit.

When implementation and documentation disagree, investigate the implementation and update the canonical documentation to reflect the verified system rather than preserving convenient wording.

## Automation must reduce operational complexity

Automation is valuable when it removes repetitive work, reduces error-prone manual steps, and makes behavior more predictable.

Do not automate a process merely to call it automated. An automation layer that creates more hidden state, maintenance burden, or failure modes than the manual process violates this principle.

## Preserve ownership boundaries

Do not describe Sprey as owning or controlling a process that happens independently of it.

For payment processing, the payment itself happens independently of Sprey between the buyer and the merchant-controlled payment destination. BTCPay observes the Bitcoin blockchain or other relevant payment network, determines invoice state from network data, and reports that state to the storefront. Sprey does not initiate, route, receive, hold, or forward merchant funds.

This same discipline applies across the platform: documentation should state precisely which component owns data, performs an action, observes a state, or reports a result.

## Working rule

> **Minimum custom code, maximum system consistency. One task, one understandable change.**

When two solutions are otherwise equivalent, prefer the one that leaves fewer moving parts and is easier for the next operator to understand, verify, and recover.
