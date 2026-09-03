# R1 direct steering pickup — machine-preflighted rendered checkpoint

Date: 2026-09-03
Status: **machine-preflighted rendered Owner checkpoint**. This is not a product PASS, Owner PASS or architecture decision.

## Research question

Can the Owner directly move the real left and right steering-arm pickup points in authored local X/Z, run the physical rack/tie-rod mechanism, perceive the driving consequence, return to BUILD with the exact authored geometry, and make another conscious edit without the builder becoming a disguised slider?

## Provenance and canonical spine

- Canonical base: `main@73dc9ce2c4814e47d7745dee7be6721e43d6fdd9`.
- Frozen V0 carrier source: `work/front-steering-v0-deconfound@69d8a8ee91117d4ce44c7dd14657418241844b2e`.
- Working branch: `experiment/nextgen-jv-direct-spatial-pickup`.
- `README.md`, `docs/NEXTGEN_JV_PROJECT_SOUL.md`, `docs/NEXTGEN_JV_CURRENT_STATE.md`, `docs/NEXTGEN_JV_FRESH_TAKEOVER.md` and `evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md` remain from canonical `main` and were not overwritten by the older carrier README/state.
- Only the carrier substrate, its technical receipt, package/build wiring and V0 regression tests were imported. V0 remains provenance, not architecture.

## Bounded implementation

- `src/r1/app.ts` is the experiment surface: BUILD direct pointer drag, RUN/DRIVE, exact return to BUILD and only the required instrumentation.
- `src/v0/steering-geometry.ts` generalizes the pickup from a radius to independent authored local `{x,z}` vectors for LEFT and RIGHT.
- `src/v0/physical-steering-world.ts` accepts authored geometry directly. Physical rack, fixed-length physical tie-rods and knuckles remain steering authority; the oracle observes only.
- Neutral tie-rod length is computed from each authored neutral endpoint as an explicit experiment-local auto-fit rule.
- `src/v0/projection.ts` renders the actual arms, tie-rods and gold pickup markers and maps pointer movement to the authored X/Z plane.
- Fixed in this iteration: rack, axle, track and remaining V0 geometry. No topology, suspension, tire redesign, drivetrain, assets, generic builder, solver, sockets, relation ontology or component model.
- Builder behavior is permissive. Non-finite coordinates are rejected at the small authored-value boundary; a zero-length arm is rejected only because it cannot be stably instantiated. Analytical-oracle domain misses are diagnosed and do not actuate the physical world.

## Machine and rendered evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Unit/operation regression | PASS | `npm run check`: 37/37 tests, including 2 R1 tests plus existing E1/V0 suites |
| Build | PASS | `npm run check` build to disposable `dist-v0`; only existing externalized-module/chunk-size warnings |
| BUILD → RUN/DRIVE → BUILD | PASS | Browser R1 test preserves both authored values exactly after physical world disposal |
| Two authored layouts → different trajectories | PASS | R1 deterministic unit test compares baseline pickup `(-0.18, 0)` with materially different `(-0.30, 0)` layout and requires distinct heading/curvature; measured heading `-1.8340` vs `-1.0790` rad and curvature `-0.1893` vs `-0.1073` rad/m |
| Causal linkage | PASS | Custom authored worlds report `PHYSICAL` linkage and bounded tie-rod length error; existing removed-linkage regression still passes |
| Browser/rendered interaction | PASS | `npm run test:browser`: 11/11; R1 direct drag and recovery, E1 5/5, V0 4/4 |
| Browser page identity/health | PASS | `http://127.0.0.1:4173/`, title `JV R1 Direct Steering Pickup`, meaningful DOM, no framework overlay, no relevant console error/warning/pageerror |
| Responsive rendered check | PASS | R1 browser test at `390x844`; both pickup readouts remain visible and the viewport has no body overflow |

The in-app Browser inspection also exercised a real pickup drag: LEFT changed from local `X -0.180 · Z 0.000` to approximately `X 0.056 · Z -0.995`; the altered gold marker, orange arm and cyan tie-rod moved together in the rendered BUILD scene. The same authored values were observed after RUN/DRIVE and return to BUILD.

## Deliberate boundary

This checkpoint proves technical and rendered readiness for Owner evaluation of one bounded construction loop. It does not establish that the interaction feels like natural construction, that the pickup task represents a general builder grammar, that placeholders are sufficient for product judgement, or that any V0 implementation should become JV architecture.

The next action is a short Owner hands-on, then stop for judgement. Do not add feature breadth before that judgement. Change direction if the drag feels like a scalar slider, placeholder readability dominates construction judgement, the substrate becomes the problem, or the scope starts requiring generic builder/solver/component architecture.
