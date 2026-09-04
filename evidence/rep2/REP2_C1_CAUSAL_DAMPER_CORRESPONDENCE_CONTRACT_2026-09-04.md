# Rep2 C1 — causal damper correspondence contract

Date: 2026-09-04

Status: **EXECUTION CONTRACT — implementation not started**

Branch:

`experiment/rep2-c1-causal-damper-correspondence`

Exact branch base:

`experiment/rep2-c0c-solver-native-kc@ca69ccabd6a9d2df6ec1874c46a38d0b1f0d3230`

C0c accepted runtime specimen:

`2da7ff61219e20afd49d2be7ac7520645625a186`

This contract exists to test one narrow product/research claim. It is not a suspension architecture, component schema, asset-pipeline design or builder milestone.

## 1. Owner rule being tested

Owner judgement confirms the central Nextgen JV rule:

> When JV presents a component as mechanically causal, the visible attachment/motion path should correspond to the same real mechanical relation that produces vehicle behaviour. Cosmetic detail may be visual-only, but a second nearby visual mechanism must not stand in for a different hidden physical mechanism.

For C1, refine this to:

> **One presented mechanical relation has one authority truth. Physics and visible representation are downstream projections of that same authored/live relation, not independently authored nearby mechanisms.**

This does **not** mean rendered polygons must equal solver geometry.

## 2. Exact evidence entering C1

### Physics prerequisite

C0a established a bounded causal relation:

`component force law + spatial attachment geometry -> live force path -> r x F -> body response`.

C0b established that an external state-dependent spring force held stale across `World_Step(1/60,4)` is not a trustworthy normal-loop realization.

C0c then qualified, narrowly for linear `k > 0`, a solver-native Box3D distance-spring realization in which authored physical `k`, `c`, `restLength` and spatial attachment eyes remain authority while Hertz/damping ratio are internal derived solver quantities using axial effective mass.

C0c acceptance workflow:

- run `33875428047`;
- conclusion `success`;
- regression suite `61/61 PASS`;
- accepted axial-mass mapping force-law NRMSE mean ~2.934%, worst ~3.834% in the bounded comparator.

Independent pure damping (`k=0,c>0`) remains unresolved and is outside C1.

### Historical negative evidence

Exact JV_CORE donor forensics established that historical visual and physical suspension/steering paths could be parallel truths, including cases with different endpoint geometry or even different body topology.

C1 therefore must prove not merely that a damper looks plausible, but that the apparatus can detect the historical failure class.

### Real visual donor

Repository:

`Jozzpoly/Box3d_FunProject`

Exact donor source commit:

`241fe10a9056836332c21d9614471d32d749ce3d`

Exact donor asset:

`assets/source/Asset_Dumper.gltf`

Git blob:

`dcdaf197bf48ef8894af4de27682d55dd0b1343d`

Size:

`32240 bytes`

The glTF is a self-contained Blockbench export with embedded binary data and authored nodes including:

- `Part_Upper`;
- `Part_Stretch`;
- `Part_Lower`.

The historical runtime binding is **not** donor authority.

### Stage-B apparatus donor

Preserved branch:

`experiment/rep2-single-source-suspension-link@bb77b6035f49d88a5882aab3e2e6f0410f25ca84`

Useful donor capital:

- correspondence measurement from the actual rendered Three.js transform;
- browser/WebGL validation pattern;
- rest + moving-state checks;
- explicit prohibition on a second visual hardpoint table.

Do not inherit the Stage-B primitive segment as the result or product representation.

## 3. C1 authority state

For the bounded specimen the authoritative mechanical relation is provisionally only:

- physical body A identity;
- physical body B identity;
- attachment eye A in body-A local coordinates;
- attachment eye B in body-B local coordinates;
- linear spring stiffness `k`;
- linear damping coefficient `c` with `k > 0`;
- free/rest length `L0`.

From this state runtime derives:

1. the two exact live world attachment eyes;
2. the live axial relation / physical native spring path;
3. the solver-only Hertz/damping-ratio mapping qualified by C0c;
4. the visible adaptive donor damper pose.

No separately authored runtime visual eye pair is allowed.

## 4. Visual freedom that remains legitimate

The real donor visual may have:

- thickness and housing geometry;
- Upper / Stretch / Lower segmentation;
- a visual coil, shaft and body detail;
- internal authored offsets needed to place the visual form around its attachment relation;
- LOD or cosmetic variants in future work.

Those details do not become mechanical authority merely because they are visible.

The visual adapter may transform the real donor asset from its authored bind/rest state onto the live mechanical relation. It may not introduce a second mechanical topology, alternative live endpoint pair or visual-only suspension trajectory.

## 5. Clean-room implementation posture

Do not port the old M6 rig runtime.

The first executable C1 step should:

1. copy/import the exact donor `Asset_Dumper.gltf` into this experimental branch;
2. verify the copied file against donor provenance, preferably by computing its Git-blob SHA and requiring `dcdaf197...`;
3. load it with current Three.js / `GLTFLoader` in a real browser;
4. identify the authored Upper / Stretch / Lower references from the loaded asset itself;
5. build the smallest adapter that consumes only the two live mechanical world eyes plus asset bind metadata.

Do not create a generalized asset-component framework to accomplish this.

## 6. C1 execution gates

These are bounded gates, not a mandatory micro-waterfall. Correct the implementation if evidence shows a better ordering, but preserve the claims they separate.

### C1.0 — real donor import sanity

Establish that the exact asset used by the rendered experiment is the intended donor and that its authored part/reference structure is recoverable without old JV_CORE runtime semantics.

Required evidence:

- exact donor file provenance;
- successful browser load;
- required authored part/reference identities found;
- no dependency on historical M6 socket tables or rig data.

### C1.1 — arbitrary-endpoint real-asset adaptation

Before adding Box3D motion, adapt the **real loaded donor** between two arbitrary 3D endpoints.

Measure correspondence from the actual loaded/rendered scene graph, not from a duplicate mathematical oracle.

Required:

- visual upper attachment reference coincides with endpoint A within tight numerical tolerance;
- visual lower attachment reference coincides with endpoint B;
- a materially different direction and length also passes;
- finite odd orientations remain valid unless the asset transform itself is singular.

This gate establishes visual adapter correctness only, not mechanical causality.

### C1.2 — live physical relation correspondence

Use the bounded C0c hinged mechanical bench or the smallest equivalent physical substrate.

The same authority eye pair must feed:

- the native solver spring relation;
- the visible donor adapter.

Required states:

- initial/rest or settled state;
- after real physical motion;
- at least one materially different authored attachment geometry while `k/c/L0` remain invariant.

The visual adapter receives live eyes downstream from the physical relation. It must not read a second authored suspension geometry table.

### C1.3 — historical-failure negative control

The C1 apparatus must prove that it can catch the bug class it is meant to exclude.

Create a **test-only** falsifier that deliberately offsets or substitutes one visual endpoint while leaving the physical relation unchanged.

Required result:

- normal causal path passes correspondence;
- deliberately false visual path is detected with a large non-zero endpoint/correspondence error;
- no production/runtime option exists whose purpose is to preserve that visual offset.

A test suite that only confirms the good path is insufficient evidence for C1.

## 7. Required measurements

At minimum expose machine-readable snapshots containing:

- authority body identities or stable specimen identifiers;
- authored local eye A/B;
- live world eye A/B;
- current damper length;
- current physical spring state sufficient to prove the native relation is live;
- donor visual upper/lower attachment reference reconstructed from the actual Three.js scene;
- per-eye visual correspondence error;
- `k`, `c`, `L0` used by the physical relation;
- current physical motion state (for example hinge angle/velocity) so moving evidence cannot be confused with rest-only evidence.

Do not invent a broad telemetry architecture. These values are experiment receipts.

## 8. Metamorphic / falsification checks

C1 must preserve the following invariants:

1. **Same authority, two projections** — physics and visual both consume the same live eye relation.
2. **Constitutive invariance** — changing attachment geometry does not silently change authored `k/c/L0`.
3. **Geometry consequence remains real** — changed attachment geometry changes mechanical leverage/response through the actual mechanism; C1 must not reintroduce wheel-rate-preserving hidden compensation.
4. **Cosmetic non-authority** — changing purely visual scale/material/detail must not alter physical eye locations or spring properties.
5. **No second endpoint state** — there is no persistent visual hardpoint pair capable of drifting independently.
6. **Negative-control sensitivity** — the correspondence apparatus demonstrably catches an injected visual/physical mismatch.

## 9. Validation ladder

Match validation to claim.

### Source / unit

Use the existing repository test harness. `scripts/test-all.mjs` automatically includes TypeScript tests under `tests/rep2`.

Required before C1 acceptance:

- C1 unit tests;
- all inherited E1/V0/R1/Rep2 tests still PASS;
- `tsc --noEmit` / production build PASS through `npm run check`.

### Browser / rendered

C1 requires a real Chromium/WebGL pass because the claim includes a real loaded glTF and actual scene transforms.

Create a dedicated config rather than silently reusing the old Stage-B test name:

`playwright.rep2-c1.config.ts`

and a dedicated browser test, provisionally:

`tests/browser/rep2-c1-causal-damper-correspondence.spec.ts`.

The browser test should validate actual correspondence at rest and under motion, plus the negative-control case.

Screenshots can support diagnosis/readability but are **not** acceptance evidence by themselves.

### Evidence artifact

Prefer one compact machine-readable success artifact, e.g. `rep2-c1-evidence.json`, containing the accepted correspondence snapshots and falsifier result.

The final receipt should record:

- exact accepted SHA;
- workflow run/job IDs;
- test counts;
- artifact ID/name;
- artifact SHA-256 if practical;
- any failed attempts that materially changed understanding.

## 10. GitHub Actions workflow

Create with the first executable C1 commit:

`.github/workflows/rep2-c1-causal-damper-correspondence.yml`

Trigger only on:

`experiment/rep2-c1-causal-damper-correspondence`

and relevant C1 paths.

Expected jobs:

### `source-check`

- checkout;
- Node 22 + npm cache;
- `npm ci`;
- `npm run check`.

### `rendered-correspondence`

- checkout;
- Node 22 + npm cache;
- `npm ci`;
- install Chromium with Playwright dependencies;
- run the dedicated C1 Playwright config;
- upload compact evidence / failure artifacts.

Do not make success depend on unrelated historical workflows whose branch filters target other experiments.

## 11. Working discipline

Follow repository practice:

`checkpoint -> validate -> commit -> push`.

A green checkpoint is reproducible state, not automatically an accepted research claim.

During C1:

- preserve exact SHA after coherent implementation changes;
- inspect workflow result rather than assuming push == validation;
- if a test fails, classify compile/apparatus failure separately from physical/visual falsification;
- do not rewrite acceptance criteria after seeing the result unless a pre-verdict refinement is explicitly recorded first;
- preserve failed evidence when it materially changes the model of the problem.

## 12. Explicit non-scope

C1 must not expand into:

- a full suspension corner;
- a symmetric vehicle carrier;
- Owner BUILD -> DRIVE -> BUILD testing;
- direct manipulation UI;
- generic gizmos/snap/grid/numeric authoring;
- final coilover schema;
- pure-damper solution;
- nonlinear spring/damper curves;
- bump/rebound stops;
- preload/ride-height product semantics;
- general adaptive-component framework;
- final glTF/Blockbench pipeline;
- custom Box3D constraint or engine fork;
- graphical polish beyond what is required to make the real donor correspondence legible.

If implementation pressure starts demanding these, stop and ask whether C1 has been scoped incorrectly.

## 13. PASS / FAIL meaning

### C1 bounded PASS

C1 may pass only if the **real donor asset** is shown in a real browser to remain visually attached to the exact same live mechanical relation that the physical spring uses, at rest, during physical motion and after a material attachment-geometry change, while the apparatus also detects an intentionally injected parallel-visual mismatch.

A C1 PASS would establish only:

> **A real adaptive Blockbench damper can be a faithful visible projection of one live causal mechanical relation without requiring a parallel visual mechanism in this bounded specimen.**

It would not establish a general component architecture or product-quality suspension builder.

### C1 FAIL / RESELECT

Stop and reconsider if any of the following is required to make the demo work:

- independent live visual hardpoints;
- old M6 socket/rig authority;
- hidden physical retuning that erases geometry consequence;
- a fake placeholder standing in for the donor asset;
- a visual mismatch that the correspondence apparatus cannot detect;
- large architectural machinery unrelated to the bounded claim.

## 14. Natural stop and next decision

Stop immediately once C1's correspondence claim is either demonstrated or falsified.

Do **not** continue automatically into a vehicle.

After a C1 PASS, the next decision should be freshly made from product uncertainty. The leading candidate is a minimal mechanically symmetric suspension/vehicle carrier that can expose the same mount-geometry consequence to Owner BUILD -> DRIVE -> BUILD judgement, but that step is not pre-authorized by this contract.
