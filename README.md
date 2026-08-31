# Jozzue Vehicles Sandbox

> **Canonical recipient for next-generation JV work. Current contents are bounded research slices, not JV architecture.**

The long-term product direction is a mechanically credible vehicle sandbox with a short, natural loop:

`build → run → observe → improve → get in and drive`

The current repository does **not** define the final builder, vehicle model, renderer, asset pipeline, physics runtime, or desktop/Web split. It preserves falsifiable product-path experiments and their evidence so later work can learn from them without inheriting their implementations by accident.

## Hierarchy of truth

1. Current Owner conversation and judgement govern desired experience, feel, product value, and permissiveness.
2. Live Git source and reproducible checks govern current technical state.
3. The frozen [E1 Contract v2.1](docs/e1/E1_PRODUCT_PATH_EXPERIMENT_CONTRACT_V2_1.md) governs only the scope and interpretation of E1. Its original `implementation remains HOLD` header is historical gate context; later commits and receipts record the subsequently authorized work.
4. Evidence receipts support only their stated claims.
5. Donor documentation and old project labels are historical evidence, not future architecture authority.

## Current checkpoint

**Active experimental branch: `work/front-steering-v0`.** V0 asks only whether a real steering-geometry change can propagate through one physical linkage into visible wheel motion, contact and a changed driving trajectory. The [V0 technical receipt](evidence/v0/V0_DRIVABLE_STEERING_RECEIPT_2026-09-01.md) records C0–C3, quantitative evidence and the disposable boundary. V0 contains no direct builder and has no Owner verdict yet.

The default branch page on this working branch runs V0. Add `?e1=1` only to inspect the closed E1 apparatus.

**E1 is CLOSED as a research program; H0 remains unresolved.** The [closure record](evidence/e1/E1_CLOSURE_2026-08-31.md) separates the local benefit of F1 from the still-negative/mixed Owner product signal. No further E1 treatment or polish is authorized.

The final specimen is preserved separately at [`experiment/e1-final-f1@b9426ad`](https://github.com/Jozzpoly/Jozzue_Vehicles_Sandbox/tree/b9426adfcecb6f8340ffe21ff94fbd38c4c439ef). `main` receives a docs-only closure based on frozen control `55b62da06632e9325c9f6e1cbfb4e9acb4ba6bde`; **F1 implementation is not merged into main**. Neither branch defines future JV architecture.

| Slice | Technical evidence | Owner evidence | Honest conclusion |
| --- | --- | --- | --- |
| Causal Product-Path Spine | PASS | PASS at its bounded scope | Authored edit → causal PLAY → exact BUILD recovery was usable enough to proceed. This is not E1 PASS. |
| Structural Rewire implementation | Machine and rendered-interaction preflight PASS for the original implementation | First Owner checkpoint attempted; full task and Connect flow were not fairly tested | **INCONCLUSIVE for H0**. The broad perceived regression versus Causal Spine remains Owner evidence; operation-specific conclusions are confounded. |
| Final F1 specimen | Recorded 39 operation tests, 8 browser tests, build and UI-only A/B endpoint-order paths PASS | Local improvement from locality-preserving completion; overall building experience still unsatisfactory | Local positive result, not H0 PASS or simple-reference falsification. E1 closed; see closure limitations. |

Structural Rewire implemented explicit add/disconnect/connect/reconnect operations, neutral E1 point/axis references, derived relation satisfaction, permissive diagnosed/static PLAY, and a deterministic direct/rocker evaluator. It has **not** established whether this interaction grammar feels like natural structural building. The later Owner debrief clarifies that damper movement was a stress test, rocker/link movement was exploratory, Connect did not receive a fair Owner test, the mechanical task was only partly clear, and placeholder readability was a confound.

Do not interpret the current friction as proof that explicit relations are wrong, or as authorization for inference, rich sockets, generalized unresolved-state machinery, a solver, adaptation, or a UX fix pass. E1 is now closed by Owner decision with H0 unresolved, not awaiting another repair cycle. The next stage requires a fresh Nextgen JV re-grounding and selection of a more representative product problem; it has not started.

The bounded [Foundation Stabilization receipt](evidence/e1/FOUNDATION_STABILIZATION_RECEIPT_2026-08-29.md) records later correctness and evidence-validity repairs. Those repairs do not add H0 evidence or promote any E1 type, interaction, or renderer choice to JV architecture.

## Cold takeover reading order

1. This README.
2. [V0 steering receipt](evidence/v0/V0_DRIVABLE_STEERING_RECEIPT_2026-09-01.md) — active branch scope, exact prior checkpoints, evidence and stop boundary.
3. [E1 closure](evidence/e1/E1_CLOSURE_2026-08-31.md) — current disposition, exact control/specimen refs, final Owner feedback and evidence limits; links to immutable F1 contract/preflight.
4. [E1 Contract v2.1](docs/e1/E1_PRODUCT_PATH_EXPERIMENT_CONTRACT_V2_1.md) — frozen experiment authority, SHA-256 `F8FF7060AD8D05E9BF50F601D161F76BDB9845C7D0789C27DF6525511A891CBB`.
5. [Causal Spine design](docs/e1/IMPLEMENTATION_DESIGN.md) and [gate evidence](evidence/e1/CAUSAL_SPINE_GATE_2026-08-28.md).
6. [Structural Rewire design](docs/e1/STRUCTURAL_REWIRE_IMPLEMENTATION.md), [technical preflight](evidence/e1/STRUCTURAL_REWIRE_PREFLIGHT_2026-08-28.md), historical [Owner checkpoint](evidence/e1/STRUCTURAL_REWIRE_OWNER_CHECKPOINT_2026-08-29.md), and append-only [Owner debrief correction](evidence/e1/STRUCTURAL_REWIRE_OWNER_DEBRIEF_CORRECTION_2026-08-29.md).
7. [Foundation Stabilization receipt](evidence/e1/FOUNDATION_STABILIZATION_RECEIPT_2026-08-29.md) — bounded validity fixes only, not Structural Rewire product improvement.

## Working checkpoints

- Do active work on a named working/experimental branch, not directly on `main`.
- At coherent boundaries: **checkpoint → commit → push**. A checkpoint means reproducible work, not acceptance or readiness. Continue without an extra gate when scope and direction are clear.
- Prefer checkpoints after a working slice, important result/failure or hypothesis change, before risky restructuring, and before a longer break/handoff.
- Report significant checkpoints briefly: **SHA / status / demonstrated result / largest uncertainty**.
- Codex is the default sole writer of the active branch. If Owner/Browser contributes separately, obtain the exact SHA/branch and synchronize before further writes. Verify live remote HEAD before resuming after a handoff/review.
- Do not force-push active checkpoints. Publishing a commit does not promote experimental code to JV architecture. These workflow rules do not reopen closed E1.

## Prototype-gravity boundaries

- `PointRef`, `AxisRef`, relations, `E1Document`, the evaluator, and the current UI vocabulary are E1-local and provisional.
- Primitive mechanical visuals and overlays are disposable; do not grow them into a reusable suspension component or placeholder asset system.
- Existing donor glTF files and their `Socket_*` / `Axis_*` vocabulary are donor history, not the current JV reference ontology.
- Blockbench/component/asset/reference authoring and continuous adaptation are deliberately deferred investigations.
- `Three.js + WebGLRenderer` is the provisional E1 substrate, not a final engine or rendering decision.
- The V0 Box3D carrier, spherical contact, oracle, geometry variants, HUD and translucent inspection projection are disposable experimental capital, not a generic vehicle foundation.
- No E1 commit gains architecture authority merely by being the first public code in this repository.

## Local checks

```text
npm ci
npm run check
```

`npm run test:browser` owns its isolated local server lifecycle. For manual V0 use on this branch, run `npm run dev -- --host 127.0.0.1 --port 4173` and open `http://127.0.0.1:4173`.

On canonical `main`, the root still runs the archived E1 control apparatus. The immutable final F1 specimen and its entry points are pinned in the E1 closure record; check the ref before comparing behavior.
