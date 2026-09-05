# Nextgen JV — C1 causal damper correspondence execution handoff

Date: 2026-09-05

Status: **CLOSED — BOUNDED TECHNICAL PASS**

Accepted implementation:

`codex/nextgen-jv-live-frontier@8c7cb1515577f0c885e576266ad10997e69b26e7`

Accepted CI:

`https://github.com/Jozzpoly/Jozzue_Vehicles_Sandbox/actions/runs/33953935724`

Closure receipt:

`evidence/rep2/REP2_C1_CAUSAL_DAMPER_CORRESPONDENCE_RECEIPT_2026-09-05.md`

C1 established a bounded live chain from one authority record through a native
Box3D distance spring and live body eyes to the exact real donor, with an
independent Three.js scene-graph observer that detects a stale visual eye and
then verifies recovery. Owner checkpoint remains **NOT RUN**; no product,
vehicle, or architecture PASS is claimed.

Stop implementation on this branch. The next move is a separate docs-only
canonicalization branch from a freshly verified `origin/main`, followed by
fresh problem reselection. Do not merge this experimental lineage to recover
documentation.

Reproduction:

1. `node scripts/rep2-c1-donor-probe.mjs`
2. `npm run check`
3. `npx playwright test --config playwright.rep2-c1.config.ts`

On this Windows machine use the recorded exact Node/npm fallback when the npm
shim is unavailable. Playwright server reuse is disabled and a busy port must
fail closed.

The branch-local `README.md`, `NEXTGEN_JV_CURRENT_STATE.md`,
`NEXTGEN_JV_FRESH_TAKEOVER.md`, and `NEXTGEN_JV_PROJECT_SOUL.md` are inherited
from an older line and are not canonical current project truth.

The remainder of this document preserves the pre-verdict execution brief and
acceptance boundary from `005bc82aeb75167ca153b3d704585af4ef022049` for audit.

This is the compact startup spine for continuing the current Rep2 work on the exact C1 branch. It exists because the current canonical `main` docs predate the C0a/C0b/C0c and C1-readiness work.

It does **not** replace the Project Soul or grant experimental code architecture authority.

## 1. Exact live state

Canonical `main` remains intentionally untouched by Rep2 experimental implementation:

`main@ad75ca9ea7436548f901bf6c11e69cd5e465379e`

Latest bounded donor/readiness research:

`research/jv-core-visual-rig-forensics@b7539e4b8f361609d3dc9fd1f2f60491dab6512c`

C0a lineage:

- branch head: `experiment/rep2-coilover-force-path@fa372932e92ceaae3767da24e5045552749bc73a`
- accepted physical seam: `30ee3a5ddf2c7dd3589d953ab0024fe42b965f92`

C0b lineage:

- branch head: `experiment/rep2-c0b-numerical-qualification@0213994430ac7915409a3b964045d816caf5313c`
- accepted numerical specimen: `e2976c1618363830e17cfb34fd482d0e8250c3f3`
- workflow `33870297080`: `success`

C0c lineage:

- branch head: `experiment/rep2-c0c-solver-native-kc@ca69ccabd6a9d2df6ec1874c46a38d0b1f0d3230`
- accepted solver-native specimen: `2da7ff61219e20afd49d2be7ac7520645625a186`
- workflow `33875428047`: `success`

Preserved Stage-B measurement donor:

`experiment/rep2-single-source-suspension-link@bb77b6035f49d88a5882aab3e2e6f0410f25ca84`

C1 branch:

`experiment/rep2-c1-causal-damper-correspondence`

Created exactly from:

`ca69ccabd6a9d2df6ec1874c46a38d0b1f0d3230`

C1 execution contract initial commit:

`005bc82aeb75167ca153b3d704585af4ef022049`

Contract:

`evidence/rep2/REP2_C1_CAUSAL_DAMPER_CORRESPONDENCE_CONTRACT_2026-09-04.md`

## 2. Central Owner rule

Owner confirmed that this may be the most important experimental novelty in Nextgen JV:

> When JV presents something as the mechanism causing behaviour, the visible attachment/motion path should correspond to the same real mechanical relation that causes the behaviour. Cosmetic detail may be visual-only; a false visible mechanism beside a different hidden physical mechanism is not acceptable.

Technical refinement:

> **One presented mechanical relation has one authority truth. Physics and visible representation are downstream projections of that same relation.**

Do not misread this as `render mesh == solver geometry`.

## 3. What is demonstrated before C1

Do not re-litigate these without new evidence.

### C0a

Changing only spatial spring/damper installation geometry while holding component `k/c/restLength` fixed changes real force leverage/body response through actual live eyes.

### C0b

External state-dependent force evaluated once before `World_Step(1/60,4)` can be materially wrong because the same stale force is reused through internal substeps. Fine explicit refresh converged in the bounded bench.

### C0c

For bounded linear `k > 0` spring / combined spring+damper, native Box3D distance spring can preserve authored physical `k/c/restLength + spatial eyes` when solver Hertz/damping ratio are derived internally from the distance joint's **axial effective mass**.

Accepted C0c force-law NRMSE was ~2.934% mean / ~3.834% worst in the tested comparator.

Fixed-Hertz-as-component-truth and generalized-mechanism-mass mapping were strongly falsified for this purpose.

Independent pure damping `k=0,c>0` remains unresolved and is outside C1.

## 4. Historical negative evidence that C1 must beat

JV_CORE forensics established real parallel-truth failures:

- visual steering rod endpoints differed from physical tie-rod endpoints;
- visual suspension members could follow separate procedural frames instead of physical hardpoints/bodies;
- steering-rig visible damper followed a chassis-to-lower-arm visual topology while the physical wishbone coilover was chassis-to-knuckle;
- old-mount visible dampers used visual socket geometry that did not coincide with the one physical coilover axis.

Therefore visual plausibility is not C1 evidence.

The C1 detector must demonstrably catch an intentionally injected parallel-visual mismatch.

## 5. Exact real donor

Donor repository:

`Jozzpoly/Box3d_FunProject`

Exact source commit:

`241fe10a9056836332c21d9614471d32d749ce3d`

Asset:

`assets/source/Asset_Dumper.gltf`

Git blob:

`dcdaf197bf48ef8894af4de27682d55dd0b1343d`

Size:

`32240 bytes`

It is a self-contained Blockbench glTF with embedded buffer and authored `Part_Upper`, `Part_Stretch`, `Part_Lower` nodes.

Do **not** import historical M6 rig/socket authority with it.

## 6. Pre-implementation refinement: asset-local attachment reference

Do not assume that `Part_Upper` and `Part_Lower` **node origins** are mechanically meaningful eye centres merely because the historical renderer treated their bone origins as endpoints.

C1.0 must independently inspect/verify the loaded donor's authored bind geometry.

Acceptable outcome:

- the authored node/bone origin is visibly and geometrically the intended mount reference; or
- the donor requires a fixed **asset-local bind-space offset/reference** from the node origin to the visual eye centre.

A fixed asset-local visual offset is legitimate cosmetic/asset metadata. It is not a second mechanical truth because it does not create another live world endpoint or depend on physical outcome.

Not acceptable:

- a second runtime visual hardpoint pair;
- per-pose correction points;
- offsets tuned separately for different physical geometry specimens;
- visual endpoints chosen to make screenshots look connected.

Record any asset-local reference decision before the dynamic C1.2 claim.

## 7. First executable move

Do this next; do not broaden scope first.

### Step A — donor integrity + real browser load

1. copy/import the exact `Asset_Dumper.gltf` into the C1 branch;
2. verify its Git-blob SHA against `dcdaf197...`;
3. load it with current Three.js `GLTFLoader` in a real Chromium/WebGL runtime;
4. recover the authored Upper/Stretch/Lower structure from the loaded asset;
5. audit the visual attachment references described above.

### Step B — real asset between arbitrary endpoints

Before physics integration, adapt the real donor between two arbitrary materially different endpoint pairs and measure attachment correspondence from the **actual Three.js scene graph**.

Do not use a placeholder cylinder as the result.

### Step C — connect to C0c live eyes

Only after Step B passes, connect the adapter to the same live eye pair used by the native physical spring relation.

Use at least:

- rest/initial state;
- moving physical state;
- materially different attachment geometry with unchanged authored `k/c/L0`.

### Step D — negative control

Inject a test-only false visual endpoint and require the apparatus to detect the mismatch.

If the detector cannot reliably fail this case, C1 is not ready for a positive claim.

## 8. Reuse policy

### Reuse from C0c

Reuse only the qualified physical seam needed to instantiate the bounded spring relation.

Do not let C0c comparator/study scripts become product architecture.

### Reuse from Stage B

Recover selectively:

- actual-render-transform correspondence measurement idea;
- browser/WebGL test pattern;
- rest + motion checking discipline.

Do not inherit:

- unit-segment/cylinder result;
- unfinished Stage-B product direction;
- its branch as C1 base.

### Reuse from JV_CORE

Recover:

- exact real `Asset_Dumper.gltf` visual form;
- bounded adaptive idea of rigid end sections + extensible middle if the real asset supports it cleanly.

Reject historical endpoint/socket/runtime authority.

## 9. Workflow / validation

Repository working practice remains:

`checkpoint -> validate -> commit -> push`.

The first executable C1 commit should add a dedicated workflow:

`.github/workflows/rep2-c1-causal-damper-correspondence.yml`

with two claims separated:

### source-check

- `npm ci`;
- `npm run check`;
- inherited and new `tests/rep2` must all pass.

### rendered-correspondence

- real Chromium installation;
- dedicated `playwright.rep2-c1.config.ts`;
- dedicated C1 browser spec;
- real glTF load/render;
- compact machine-readable evidence artifact.

Prefer artifact contents that include accepted rest/moving/mutated snapshots and the deliberate negative-control result.

A green workflow is reproducible execution, not automatically a research PASS. Inspect the actual values.

Classify failures before changing anything:

- compile/type/build failure;
- asset/import apparatus failure;
- correspondence detector failure;
- physical substrate failure;
- real falsification of the one-authority hypothesis.

Do not tune acceptance criteria after seeing output unless a pre-verdict refinement note is recorded first.

## 10. Presentation preflight

C1 is not an Owner checkpoint, but the claim says **visible representation**.

Therefore browser validation should establish more than a loaded scene object:

- real donor geometry has non-zero world bounds;
- it is inside the intended camera/frustum and actually rendered;
- successful snapshots should be available for machine/assistant inspection if a scene transform looks suspicious.

Screenshot plausibility is supporting evidence only; numerical correspondence remains required.

## 11. Hard non-scope

Do not start during C1:

- symmetric vehicle carrier;
- Owner BUILD -> DRIVE -> BUILD;
- direct-manipulation UI;
- final spring/damper system;
- pure-damper solution;
- nonlinear force curves;
- bump/droop stops;
- preload/ride-height semantics;
- general adaptive-component framework;
- final glTF pipeline;
- custom Box3D constraint/engine fork;
- broad visual polish.

## 12. Natural stop

C1 stops when either:

### PASS candidate

The **real donor** remains a faithful visible projection of the exact same live mechanical relation at rest, under motion and after geometry mutation, with `k/c/L0` preserved, and the apparatus catches the injected false visual path.

or:

### FAIL / reselection

The experiment requires parallel live visual endpoints, historical rig authority, outcome-preserving retuning, a placeholder stand-in, or architectural machinery disproportionate to the question.

Do not continue automatically to the vehicle carrier after C1.

## 13. Documentation debt / next canonicalization boundary

Current `main` canonical docs still describe the older donor-forensics frontier and therefore predate the Rep2 reselection/C0/C1 work.

Do **not** solve that by merging experimental implementation into `main`.

At the next coherent research boundary — preferably immediately after a C1 PASS/FAIL verdict — perform a **docs-only canonicalization** that updates at least the current-state/fresh-takeover spine with exact Rep2 refs and the Owner causal-correspondence rule, while preserving experimental branches as evidence.

Until then, this handoff plus the C1 contract and exact branch refs above are the startup authority for continuing C1.
