# Jozzue Vehicles Sandbox

> **Canonical recipient for next-generation JV work. Current contents are E1-local experiments, not JV architecture.**

The long-term product direction is a mechanically credible vehicle sandbox with a short, natural loop:

`build → run → observe → improve → get in and drive`

The current repository does **not** define the final builder, vehicle model, renderer, asset pipeline, physics runtime, or desktop/Web split. It preserves a falsifiable product-path experiment and the evidence gathered from it so later work can learn from the implementation without inheriting it by accident.

## Hierarchy of truth

1. Current Owner conversation and judgement govern desired experience, feel, product value, and permissiveness.
2. Live Git source and reproducible checks govern current technical state.
3. The frozen [E1 Contract v2.1](docs/e1/E1_PRODUCT_PATH_EXPERIMENT_CONTRACT_V2_1.md) governs only the scope and interpretation of E1. Its original `implementation remains HOLD` header is historical gate context; later commits and receipts record the subsequently authorized work.
4. Evidence receipts support only their stated claims.
5. Donor documentation and old project labels are historical evidence, not future architecture authority.

## Current checkpoint

| Slice | Technical evidence | Owner evidence | Honest conclusion |
| --- | --- | --- | --- |
| Causal Product-Path Spine | PASS | PASS at its bounded scope | Authored edit → causal PLAY → exact BUILD recovery was usable enough to proceed. This is not E1 PASS. |
| Structural Rewire implementation | Machine and rendered-interaction preflight PASS for the original implementation | First Owner checkpoint attempted; full task and Connect flow were not fairly tested | **INCONCLUSIVE for H0**. The broad perceived regression versus Causal Spine remains Owner evidence; operation-specific conclusions are confounded. |
| Final E1 F1 matched experiment | See the [final F1 preflight receipt](evidence/e1/FINAL_F1_PREFLIGHT_2026-08-31.md) | C1/T1 Owner comparison **NOT_RUN** | Technical reachability only; not H0 PASS. E1 ends after that comparison regardless of outcome. |

Structural Rewire implemented explicit add/disconnect/connect/reconnect operations, neutral E1 point/axis references, derived relation satisfaction, permissive diagnosed/static PLAY, and a deterministic direct/rocker evaluator. It has **not** established whether this interaction grammar feels like natural structural building. The later Owner debrief clarifies that damper movement was a stress test, rocker/link movement was exploratory, Connect did not receive a fair Owner test, the mechanical task was only partly clear, and placeholder readability was a confound.

Do not interpret the current friction as proof that explicit relations are wrong, or as authorization for inference, rich sockets, generalized unresolved-state machinery, a solver, adaptation, or a UX fix pass. The interaction layer itself is a confound. The later Owner-authorized [final F1 addendum](docs/e1/FINAL_F1_CONTRACT.md) permits only one matched operation experiment; work stops at technical preflight before Owner comparison, with no further E1 iterations.

The bounded [Foundation Stabilization receipt](evidence/e1/FOUNDATION_STABILIZATION_RECEIPT_2026-08-29.md) records later correctness and evidence-validity repairs. Those repairs do not add H0 evidence or promote any E1 type, interaction, or renderer choice to JV architecture.

## Cold takeover reading order

1. This README.
2. [E1 Contract v2.1](docs/e1/E1_PRODUCT_PATH_EXPERIMENT_CONTRACT_V2_1.md) — frozen experiment authority, SHA-256 `F8FF7060AD8D05E9BF50F601D161F76BDB9845C7D0789C27DF6525511A891CBB`.
3. [Causal Spine design](docs/e1/IMPLEMENTATION_DESIGN.md) and [gate evidence](evidence/e1/CAUSAL_SPINE_GATE_2026-08-28.md).
4. [Structural Rewire design](docs/e1/STRUCTURAL_REWIRE_IMPLEMENTATION.md), [technical preflight](evidence/e1/STRUCTURAL_REWIRE_PREFLIGHT_2026-08-28.md), historical [Owner checkpoint](evidence/e1/STRUCTURAL_REWIRE_OWNER_CHECKPOINT_2026-08-29.md), and append-only [Owner debrief correction](evidence/e1/STRUCTURAL_REWIRE_OWNER_DEBRIEF_CORRECTION_2026-08-29.md).
5. [Foundation Stabilization receipt](evidence/e1/FOUNDATION_STABILIZATION_RECEIPT_2026-08-29.md) — bounded validity fixes only, not Structural Rewire product improvement.
6. [Final F1 contract](docs/e1/FINAL_F1_CONTRACT.md) and [preflight](evidence/e1/FINAL_F1_PREFLIGHT_2026-08-31.md). Frozen history/control remains `55b62da06632e9325c9f6e1cbfb4e9acb4ba6bde`; current `?f1=C1` retains its operation semantics with matched identity/selection aids, while `?f1=T1` changes only the bounded final treatment. Reloading either entry resets the task; condition is not saved in the document.

## Prototype-gravity boundaries

- `PointRef`, `AxisRef`, relations, `E1Document`, the evaluator, and the current UI vocabulary are E1-local and provisional.
- Primitive mechanical visuals and overlays are disposable; do not grow them into a reusable suspension component or placeholder asset system.
- Existing donor glTF files and their `Socket_*` / `Axis_*` vocabulary are donor history, not the current JV reference ontology.
- Blockbench/component/asset/reference authoring and continuous adaptation are deliberately deferred investigations.
- `Three.js + WebGLRenderer` is the provisional E1 substrate, not a final engine or rendering decision.
- No E1 commit gains architecture authority merely by being the first public code in this repository.

## Local checks

```text
npm ci
npm run check
```

`npm run test:browser` owns its isolated local server lifecycle. For manual use, run `npm run dev -- --host 127.0.0.1 --port 4173` and open `http://127.0.0.1:4173`.
