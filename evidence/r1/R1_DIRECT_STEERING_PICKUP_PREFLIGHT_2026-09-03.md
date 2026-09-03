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
| Unit/operation regression | PASS | `npm run check`: 41/41 tests, including the R1 validation-hardening tests plus existing E1/V0 suites |
| Build | PASS | `npm run check` build to disposable `dist-v0`; only existing externalized-module/chunk-size warnings |
| BUILD → RUN/DRIVE → BUILD | PASS | Browser R1 test preserves both authored values exactly after physical world disposal |
| Same-radius different-direction trajectories | PASS | Deterministic R1 test uses radius `0.24 m`: baseline `(-0.24, 0)` versus mirrored `(-0.23704520174283306, ±0.03754427160965541)` at `9°`; equal `hypot(x,z)` is asserted exactly, while heading, curvature and left steering response all separate materially |
| Causal linkage | PASS | Custom authored worlds report `PHYSICAL` linkage and bounded tie-rod length error; asymmetric and fixed-constraint checks pass; existing removed-linkage regression still passes |
| Browser/rendered interaction | PASS | `npm run test:browser`: 12/12; R1 3/3, E1 5/5, V0 4/4, including interrupted-drag cancellation |
| Browser page identity/health | PASS | `http://127.0.0.1:4173/`, title `JV R1 Direct Steering Pickup`, meaningful DOM, no framework overlay, no relevant console error/warning/pageerror |
| Responsive rendered check | PASS | R1 browser test at `390x844`; both pickup readouts remain visible and the viewport has no body overflow |

The in-app Browser inspection also exercised a real pickup drag: LEFT changed from local `X -0.180 · Z 0.000` to approximately `X -0.041 · Z -0.521`; the altered gold marker, orange arm and cyan tie-rod moved together in the rendered BUILD scene. RUN/DRIVE showed the physical linkage with wheel contacts `1 / 1 / world 4`, and return to BUILD recovered all four authored coordinates exactly. The final Browser diagnostic log contained only normal Vite connection messages, with no application console error, warning or page error.

## Validation-hardening addendum

- **Anti-slider falsifier:** same-radius / different-direction authored layouts use the exact `0.24 m` specimen above. The directional variant produced a heading delta of approximately `0.09405 rad`, curvature delta `0.009925 rad/m` and left steering-angle delta `0.01598 rad` under the deterministic physical run. This is a direction-sensitive causal difference, not a radius difference; no threshold tuning was used to manufacture a pass.
- **Neutral-reference falsifier:** for the non-axis authored vectors at `9°`, both neutral oracle angles are within `1e-10 rad` of zero relative to their own authored neutral orientation. The oracle is not referenced to fixed `-X`.
- **Asymmetric causal falsifier:** only LEFT changes from `(-0.24, 0)` to `(-0.30, 0)`; RIGHT is deep-equal before and after, and the edited side's physical steering response changes while linkage remains `PHYSICAL`. No hidden symmetrization is used.
- **Interrupted drag:** pointer movement renders a preview from the committed baseline. Only `pointerup` commits; `pointercancel` and `lostpointercapture` discard the preview and recover the prior authored values. The browser test covers both interruption paths.
- **Tie-rod rule:** neutral auto-fit is evaluated when the physical world is constructed. During PLAY, the same lengths remain ordinary fixed physical constraints while steering moves; the unit test bounds neutral and driven current-length error and confirms `PHYSICAL` linkage.
- Two intermediate full-browser attempts encountered transient host `ERR_NO_BUFFER_SPACE` / WebSocket resource noise while the test server was being recycled. After cleaning the disposable test-server state, the final canonical suite passed 12/12 and the in-app Browser log was clean; this remains an environment limitation, not a claimed product behavior.

## Deliberate boundary

This checkpoint proves technical and rendered readiness for Owner evaluation of one bounded construction loop. It does not establish that the interaction feels like natural construction, that the pickup task represents a general builder grammar, that placeholders are sufficient for product judgement, or that any V0 implementation should become JV architecture.

The next action is a short Owner hands-on, then stop for judgement. Do not add feature breadth before that judgement. Change direction if the drag feels like a scalar slider, placeholder readability dominates construction judgement, the substrate becomes the problem, or the scope starts requiring generic builder/solver/component architecture.
