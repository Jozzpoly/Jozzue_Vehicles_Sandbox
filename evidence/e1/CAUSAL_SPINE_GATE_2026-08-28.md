# E1 Causal Product-Path Spine — gate evidence

> **Gate result: MACHINE PRECONDITIONS PASS / OWNER JUDGMENT NOT RUN / FULL E1 NOT RUN**

Date: 2026-08-28
Scope: bounded precondition slice below the E1 Product-Path Experiment Contract v2.1.

## Claim actually tested

The implemented slice can maintain this causal and authority chain:

`authored hardpoint edit → preview/commit → deterministic PLAY → visible mechanical consequence → exact BUILD recovery → Undo`

It does so in a real Three.js 3D viewport without making Three objects authoritative for the construction.

## Machine evidence

### Pure model/evaluator suite

Command: `npm run test`

Result: **12/12 PASS**

Covered:

- preview is not committed authored state;
- cancel preserves document and history exactly;
- one drag creates one revision/history entry;
- Undo restores the exact authored snapshot;
- fixed-sample direct PLAY is deterministic;
- authored damper hardpoint changes evaluated damper behavior;
- arbitrary 3D pivot axis changes the actual motion;
- disconnected direct chain enters whole-chain diagnosed/static PLAY;
- invalid zero-length axis remains renderable and diagnosed/static;
- PLAY does not mutate authored state or Undo history;
- prepared rocker/pushrod evaluator is deterministic and branch-continuous;
- root loss freezes the last valid whole-chain frame;
- authored model and evaluator do not import Three.js.

### Production build

Command: `npm run build`

Result: **PASS**

- TypeScript strict check passed.
- Vite production build passed.
- Runtime bundle: 589.56 kB minified / 148.56 kB gzip.
- Vite reports the expected `>500 kB` warning. This is retained as substrate-cost evidence; code splitting was not introduced because it would not change the causal-spine decision.

### Rendered browser smoke

Command: `npm run test:browser`

Environment: local Vite at `http://127.0.0.1:4173`, installed Microsoft Edge, 1440×900 viewport.

Result: **2/2 PASS**

- correct page identity and nonblank 3D canvas;
- BUILD state and authored inspector visible;
- numeric hardpoint edit commits one revision;
- PLAY begins a moving deterministic cycle and visibly changes damper length;
- BUILD returns with the same authored revision/edit history;
- Undo restores the original hardpoint and revision zero;
- visible 3D TransformControls drag commits exactly one authored edit;
- no application console errors or warnings after correction.

The preferred in-app Browser plugin was listed, but its required JavaScript control surface was not exposed in this task. The browser smoke therefore used the documented Playwright fallback with local Edge. This difference is explicit and does not constitute in-app Browser proof.

## Problems found and corrected during validation

1. The first test runner passed a Windows file URL pathname incorrectly and could not launch TypeScript. It now uses `fileURLToPath` and enumerates test files without shell globbing.
2. The prepared root-loss fixture did not actually lose its root. Its bounded motion range was corrected so the test now proves valid-prefix → whole-chain freeze.
3. Three.js reported deprecated `PCFSoftShadowMap`; the projection now uses supported `PCFShadowMap`.
4. The browser requested a missing favicon; a tiny inline SVG favicon removes the 404 without adding an asset pipeline.
5. A zero-length authored pivot axis could throw while constructing its diagnostic frame. The static failure path now stays finite/renderable and is covered by a regression test.
6. The initially pinned Playwright version carried a high-severity advisory. It was updated to 1.62.1; final dependency audit reported zero vulnerabilities.

## Owner authority still required

Not run and not implied by machine PASS:

- whether gizmo manipulation feels direct and trustworthy;
- whether the 3D spatial presentation is readable enough;
- whether BUILD ↔ PLAY continuity feels natural;
- whether the primitive mechanism tells one causally honest visual story;
- whether this deserves any product-path graduation.

## Explicitly not built / not tested

- Owner-authored add/connect/disconnect/reconnect;
- structural rewire task and full E1 PASS/FAIL;
- rocker/pushrod authoring UI (only prepared pure evaluator data exists);
- automatic relation inference;
- unresolved edit transaction subsystem;
- component palette or builder ontology;
- continuous/adaptive geometry;
- physics solver, contact, suspension, tires, drivetrain, vehicle feel;
- persistence, asset pipeline, mobile authoring, deployment;
- final engine/rendering architecture.

## Natural stop

The causal spine is ready for an Owner/manual checkpoint or a separately authorized full-E1 structural-authoring gate. No evidence here authorizes automatically beginning either one.
