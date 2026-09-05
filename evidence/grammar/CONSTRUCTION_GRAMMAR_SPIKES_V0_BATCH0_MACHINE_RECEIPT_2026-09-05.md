# Construction Grammar Spikes V0 — Batch 0 machine/render receipt

Date: 2026-09-05
Status: **LIGHTWEIGHT INTERACTION-PREFLIGHT PASS — OWNER VERDICT NOT YET RUN**

## Exact runtime

- qualification branch: `experiment/construction-grammar-spikes-v0`
- exact qualified SHA: `c0fadf25622a54c785c6e48c85fbf411a9bdb0e4`
- frozen Owner checkpoint: `construction-grammar-spikes-v0-owner-checkpoint@c0fadf25622a54c785c6e48c85fbf411a9bdb0e4`
- workflow: `Construction Grammar Spikes V0`
- run: `33981265125`
- job: `101346784548`
- production build: PASS
- real Chromium Variant A smoke: PASS
- real Chromium Variant B smoke: PASS
- artifact: `construction-grammar-spikes-v0`
- artifact id: `9973823565`
- artifact digest: `sha256:3164c07dc117fc33d3dee6eb9eafb7b3bbacf81cd399d17b52efcdb73a109ea4`

## Failure retained from V0

The first combined A+B smoke at `275561579adcc1371b8697d27b443152da145be1` failed after Variant A had already exercised create/undo/damper/reconnect/delete. Two issues were exposed:

1. one 45-second test budget accumulated software-rendered Chromium interaction cost across both variants;
2. more importantly, repeated `Object3D.clone(true)` of `Asset_Dumper.gltf` was invalid for the skinned donor and produced corrupted/giant visual transforms.

V1 fixes the real donor issue with `SkeletonUtils.clone(...)` and replaces the permanent idle render loop with event-driven rendering. A and B are qualified by separate short browser tests rather than one long sequence.

## What this checkpoint can be used to judge

This is an **interaction / experience spike**, not a physical-mechanics specimen.

It can support Owner feedback on:

- whether dynamic topology itself feels materially more like construction than Rep4 hardpoint tuning;
- drag-to-connect versus component/tool-first endpoint nomination;
- create/delete/reconnect/undo discoverability and directness;
- whether visible sockets help or feel like scaffolding;
- whether the real damper reads sufficiently as a component in this interaction context;
- what missing construction operation/metaphor becomes obvious.

It cannot support claims about:

- physical causality;
- suspension correctness;
- BUILD→PLAY consequence;
- final component/socket/data architecture;
- final builder grammar;
- product feel beyond this small interaction task.

## Natural STOP

STOP after the first honest Owner comparison.

Do not polish Batch 0 by inertia. If neither A nor B produces a strong signal, move to the planned **Family C — component as a physical object** spike rather than trying to force a winner.