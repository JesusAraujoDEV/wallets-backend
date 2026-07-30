# 2026-07-30 — Cross-repo parity rule recorded in AGENTS.md

## What changed

A new **Cross-repo parity rule (MANDATORY)** section was added to `AGENTS.md`, between the role ownership map and the agent rules. It states that every epic built in the web frontend must also be built in the mobile companion `platica-app`, names `wallets-frontend` as the source of truth for an epic's scope, requires a mobile-appropriate UI rather than a pixel copy, marks the direction as one-way (web → mobile), and records that changes in this repo supporting an epic serve both consumers automatically — the API is shared, so backend work is never duplicated per client.

## Why

The owner of the three repos set the rule: "toda épica que se haga en el frontend, se hace en la app móvil". This repo carries it because backend work is where the "do we need a second implementation for mobile?" question would otherwise be asked — the answer is no, and it should be written down rather than re-derived.

## How

The section is worded identically in `wallets-frontend/AGENTS.md`, `wallets-backend/AGENTS.md` and `platica-app/AGENTS.md`, and placed in the same position in each (after the role ownership map, before agent rules), so a diff across the three shows drift immediately. The section carries its own note saying it must change in all three or not at all. Recorded in the same pass that scaffolded the full crew standard into `platica-app`, which previously had a stub `AGENTS.md`.

No source code was touched.

## Promoted knowledge

- `AGENTS.md` § Cross-repo parity rule — the living statement of the rule for this repo.

## Follow-ups

- [ ] None.
