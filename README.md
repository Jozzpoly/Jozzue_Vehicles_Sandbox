# Jozzue Vehicles Sandbox

> **E1-LOCAL / PROVISIONAL / NOT JV ARCHITECTURE**

This repository is the clean canonical recipient for next-generation JV work. Its current implementation is deliberately narrower than the future product: an **E1 Structural Rewire candidate** used to test whether a strong-simple explicit construction model can support real 3D disconnect/add/connect/reconnect work and causal BUILD → PLAY → BUILD recovery.

Nothing in the first slice is promoted to permanent JV architecture by existing here. A later, explicit evidence gate must either graduate, replace, or retire each E1-local decision.

## Current bounded claim

The implementation is ready to ask — but cannot answer without Owner use — whether:

- authored state is distinct from evaluated/rendered state;
- simple participants with neutral point/axis references and explicit relations are sufficient at E1 scale;
- direct pose manipulation plus explicit add/connect/disconnect operations feels like structural construction rather than relation bookkeeping;
- relation existence can remain permissive while geometric satisfaction is diagnosed as derived state;
- a deterministic evaluator makes direct and rocker motion paths causally visible in PLAY;
- PLAY remains permissive and diagnostic rather than partially solving a broken construction;
- returning to BUILD recovers the exact authored construction and Undo history.

Machine and browser preflight do **not** constitute E1 PASS. Owner has not yet performed the complete structural-rewire task on this implementation. The slice also does not test continuous component adaptation, a vehicle runtime, a final component/reference schema, a final renderer, Blockbench integration, rich ports, inference, or generalized unresolved-state machinery.

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
