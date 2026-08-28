# E1 Causal Product-Path Spine — bounded implementation design

> **Status: E1-LOCAL / PROVISIONAL / NOT JV ARCHITECTURE**

> Historical bounded spine design. Its technical and Owner checkpoint passed at
> that scope. The current structural extension is documented in
> [`STRUCTURAL_REWIRE_IMPLEMENTATION.md`](STRUCTURAL_REWIRE_IMPLEMENTATION.md).

## Upstream experiment authority

Owner/Browser contract: `JV_NEXTGEN_E1_PRODUCT_PATH_EXPERIMENT_CONTRACT_V2_1.md`
Verified SHA-256: `F8FF7060AD8D05E9BF50F601D161F76BDB9845C7D0789C27DF6525511A891CBB`

This implementation is a precondition slice beneath the full contract. It cannot produce a full E1 PASS because it intentionally omits Owner-authored add/connect/reconnect work.

## Diagnostic question

Can the smallest product-path 3D slice preserve a truthful causal chain:

`authored hardpoint edit → explicit commit → deterministic evaluation → visible mechanical consequence → exact BUILD recovery`

without importing a final component ontology, generalized constraint solver, or disposable surrogate product?

## Authority split

```text
E1Document + E1EditSession (pure TypeScript authored truth)
                 │
                 ├── E1Evaluator (pure evaluated frames + diagnostics)
                 │
                 └── ThreeProjection (selection, preview, rendering only)
```

The renderer never owns authored truth. PLAY never mutates the document or its Undo history.

## Deliberately narrow interaction

- Real 3D camera, spatial picking, and transform gizmo.
- Only the upper damper hardpoint is directly translatable in this slice.
- Drag is preview-only; release commits one history entry; `Escape` cancels; Undo restores exactly.
- The arm rotates about a real arbitrary 3D axis.
- No live graph propagation, hidden snapping, topology mutation, or auto-disconnect.

## Deterministic evaluation

- A complete PLAY run always starts at phase zero and uses a fixed frame schedule.
- The direct baseline analytically rotates the authored arm around its authored axis.
- Prepared rocker/pushrod fixtures exercise a scalar root solve with fixed bracket samples, fixed bisection iterations, deterministic tie-breaking, and continuity from the prior root.
- A supported chain either evaluates as a whole or enters diagnosed/static PLAY. Mid-cycle loss of a root freezes the last valid whole-chain frame.
- There is no partial solver.

## Reusable product-path capital

- Real 3D viewport and direct spatial manipulation.
- Authored/evaluated separation.
- Reversible preview/commit/cancel/Undo semantics.
- Deterministic evaluator boundary and explicit diagnostics.
- BUILD/PLAY continuity and minimal readable visual states.

Reusable means "worth evaluating later", not "already promoted".

## Consciously disposable

- Primitive geometry and colors.
- The single direct-arm scenario and its exact dimensions.
- Small HUD layout and keyboard shortcuts.
- The analytic baseline motion and prepared linkage fixtures.
- Three-specific projection objects.

## Explicitly undecided

Final engine/renderer, UI framework, persistence, component/reference schema, relation authoring, inference, unresolved edit transactions, physics solver, continuous adaptation, asset pipeline, vehicle topology, desktop/Web relationship, and graduation of any E1 code.

## Stop boundary

Stop after machine validation and browser proof of the causal spine. Do not add a palette, create/reconnect relations, expose the rocker/pushrod task to the Owner, implement adaptive geometry, or call this a finished E1.
