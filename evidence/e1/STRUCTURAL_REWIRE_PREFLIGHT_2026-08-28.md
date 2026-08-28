# E1 Structural Rewire — implementation/preflight evidence

> **Gate result: MACHINE + RENDERED INTERACTION PREFLIGHT PASS / OWNER STRUCTURAL TASK NOT RUN / E1 VERDICT NOT RUN**

Date: 2026-08-28  
Scope: bounded Structural Rewire implementation under E1 Product-Path Experiment Contract v2.1.  
Implementation commit: `0e5cba102512bd66da8ac514b0c5d88bf2583d90`  
Implementation tree: `afce3780a0dc21358b37c2429a26f1640d691c0f`

## Claim actually tested

The implementation can represent and execute the preconditions for an Owner structural task:

`direct baseline → explicit disconnect → add rocker/link → explicit axis/point relations → legal geometry violation → diagnosed/static PLAY → exact BUILD recovery/Undo`

It also has a deterministic graph-derived rocker evaluator for a correctly resolved authored construction.

This does **not** establish that explicit relation authoring feels natural, direct, or sufficient. Only Owner completion and judgement of the full structural task can do that.

## Critical semantic closure preserved

- Connect changes source participant pose only and atomically adds a relation.
- Connect does not edit local reference layout or rigid-link length.
- Own length changes only through a separate visible authored operation and Undo entry.
- Relation existence is authored; geometry satisfaction is derived.
- A violated relation has no persistent resolver/recovery transaction. It is simply diagnosed and shown with an amber tether.
- PLAY reads authored rigid-link length, never calibrates it from evaluated frames, and never writes it back.
- Unsupported or violated chains remain permissively playable but whole-mechanism static; no subset solver exists.
- E1 point/axis references are neutral experiment vocabulary, not Blockbench/socket ontology.

## Pure model/evaluator evidence

Command: `npm run test`  
Result: **17/17 PASS**

Decision-relevant coverage:

- preview/cancel/commit/Undo and deterministic reset;
- atomic structural history;
- direct baseline relations and deterministic causal PLAY;
- disconnect preserves participant geometry;
- point and axis snap preserve exact local reference layouts;
- point snap preserves rigid-link length;
- moving a connected participant preserves relation identity and derives a violation;
- explicit own-length editing preserves pose;
- graph-derived rocker topology evaluates deterministically;
- the bounded fixture has a fully resolved rocker cycle;
- deliberate root loss freezes the complete last-valid chain rather than a subset;
- rocker roles are derived from connectivity rather than role tags;
- authored rigid-link length is the evaluator input;
- wrong 3D rocker axis orientation is not ignored;
- PLAY does not mutate authored state/history;
- authored/construction/evaluator layers remain independent of Three.js.

## Production build

Command: `npm run build`  
Result: **PASS**

- strict TypeScript check passed;
- Vite production build passed;
- runtime bundle: 613.15 kB minified / 155.69 kB gzip;
- the expected `>500 kB` warning remains substrate-cost evidence; no code-splitting work was added because it does not affect E1.

## Rendered interaction preflight

Command: `npm run test:browser`  
Environment: local Vite at `http://127.0.0.1:4173`, Microsoft Edge, 1440×900.  
Result: **4/4 PASS**

Covered through the visible UI/canvas:

- correct page identity and nonblank WebGL viewport;
- deterministic direct BUILD → PLAY → BUILD;
- detached add and explicit own-length edit with Undo;
- coincident-reference click cycling;
- visible explicit point and axis targeting;
- axis connect;
- partial structural rewire with two pushrod relations;
- second connect preserves rigid length, keeps the first relation, and exposes one amber geometry violation;
- permissive diagnosed/static PLAY and BUILD recovery;
- Undo removes the last relation/pose snap as one authored operation;
- real translate gizmo commits pose only;
- real local-rotation gizmo commits pose only.

Manual preflight additionally inspected screenshots of baseline, detached parts, axis-connected rocker, one-end-connected pushrod, and violated two-relation pushrod. The visual states were readable enough to hand off for Owner judgement; they are explicitly disposable and are not a graphics/art acceptance.

The Browser plugin was available as a skill, but its required JavaScript control tool was not exposed in this task. The documented Playwright fallback was therefore used. This is Edge/Playwright evidence, not in-app Browser evidence.

## Corrections made during preflight

1. Freshly rebuilt projection children initially depended on the next render frame before their world matrices were correct for picking. The projection now updates world matrices immediately, removing same-turn hit-test instability.
2. Coincident arm/damper references could not be unambiguously selected. Fixed references now use wireframe handles and repeated click explicitly cycles all overlapping references; no semantic target is ranked.
3. Reference hits were initially obscured by participant bodies. Explicit reference handles now take interaction priority over bodies under the same pointer, without changing authored meaning.
4. The earlier causal-spine input range exceeded the solvable envelope of the intended rocker fixture. The shared bounded range was reduced only enough to keep both supported paths fully resolved; a separate stressed-range regression still proves whole-chain root-loss freezing. This is fixture validity work, not vehicle tuning evidence.

## Known confounds and Owner-only questions

- Full resolved rewire has machine evaluator proof but has not been completed through the UI by Owner.
- Owner must judge whether direct explicit relation work is natural or becomes bookkeeping.
- Owner must judge whether pose-first repair of a persistent violated relation is permissive/readable or too awkward.
- Owner must judge whether the real 3D rocker phase/orientation burden is useful rather than gizmo friction.
- Placeholder geometry is intentionally minimal; failure caused by unreadable representation is `INCONCLUSIVE-I`, not H0 failure.
- Hard-coded fixture scale, snap tolerances, part staging, first task card, and exact interaction shell are not product decisions.

## Explicitly not built

No glTF/Blockbench/socket integration, reusable component library, asset browser, adaptive-part framework, rich ports, target inference, generalized unresolved-state machinery, persistence, final physics, final renderer, final graphics language, suspension forces, tires/contact, drivetrain, world, mobile authoring, or deployment.

## Natural stop

Run the Owner structural task on the exact recorded implementation. Do not begin polish, E2/E3, asset/reference investigation, adaptation, or a next experiment before the Owner verdict is classified under Contract v2.1.
