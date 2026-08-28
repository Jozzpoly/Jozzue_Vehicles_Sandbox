# Jozzue Vehicles Sandbox

> **E1-LOCAL / PROVISIONAL / NOT JV ARCHITECTURE**

This repository is the clean canonical recipient for next-generation JV work. Its first implementation is deliberately narrower than the future product: an **E1 Causal Product-Path Spine** used to test whether a small authored construction can survive direct 3D editing, causal evaluation, and exact BUILD → PLAY → BUILD recovery.

Nothing in the first slice is promoted to permanent JV architecture by existing here. A later, explicit evidence gate must either graduate, replace, or retire each E1-local decision.

## Current bounded claim

The slice may establish only that:

- authored state is distinct from evaluated/rendered state;
- one mechanically meaningful hardpoint can be edited directly in real 3D;
- a deterministic evaluator makes that authored change causally visible in PLAY;
- PLAY remains permissive and diagnostic rather than partially solving a broken construction;
- returning to BUILD recovers the exact authored construction and Undo history.

It does **not** yet test Owner-authored topology changes, add/connect/reconnect interaction, continuous component adaptation, a vehicle runtime, a final component schema, a final renderer, or the complete E1 structural-rewire task.

## Commands

```text
npm run dev
npm run test
npm run build
npm run check
```

## Authority boundary

- Owner judgment remains authoritative for whether the interaction feels direct, permissive, causal, and like building rather than operating a debug rig.
- Machine checks cover deterministic behavior, state separation, reversible editing, and failure semantics only.
- `Three.js + WebGLRenderer` is an E1 substrate, not a final engine or rendering decision.
- The browser research contract is recorded by SHA-256 in [`docs/e1/IMPLEMENTATION_DESIGN.md`](docs/e1/IMPLEMENTATION_DESIGN.md).
