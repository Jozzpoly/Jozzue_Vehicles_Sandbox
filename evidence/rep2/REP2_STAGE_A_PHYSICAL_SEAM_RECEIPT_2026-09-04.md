# Rep2 Stage A — physical single-source suspension-link receipt

Date: 2026-09-04

Status: **TECHNICAL PASS — scoped to Stage A only**

## 1. Provenance

Branch:

`experiment/rep2-single-source-suspension-link`

Base specimen:

`9d1ce9217ad9ed255ec30181730d57ab87165b85`

Final Stage-A specimen:

`954b6eb8e5f3bc3466134e77934cecc841ff5e5a`

Execution contract:

`evidence/rep2/REP2_STAGE_A_PHYSICAL_SEAM_CONTRACT_2026-09-04.md`

Canonical `main` is not changed by this experiment.

## 2. Question tested

Stage A asked whether one experiment-owned spatial state can instantiate a real Box3D suspension arm so that authored geometry is the only source for the selected physical pivot and wheel-side endpoint, and changing that spatial state changes the live mechanism and wheel path without a parallel hidden hardpoint description.

The tested causal seam is:

`Rep2SuspensionGeometry -> real arm body + chassis/arm hinge -> wheel endpoint/spin joint -> live wheel path/contact`

Visual correspondence and Owner interaction were explicitly outside this stage.

## 3. Implemented physical seam

The experiment adds `src/rep2/suspension-link-world.ts` and owns its own state rather than extending V0 steering semantics.

The only authored geometry for the selected rear-left arm is:

```ts
interface Rep2SuspensionGeometry {
  armPivotLocal: { x: number; y: number; z: number };
  wheelEndpointLocal: { x: number; y: number; z: number };
}
```

From that state the runtime directly derives:

`armToWheel = wheelEndpointLocal - armPivotLocal`

The selected corner contains:

- one dynamic shapeless arm body with explicit mass/inertia;
- one real chassis-to-arm revolute hinge located from `armPivotLocal`;
- one real wheel body initially located from `wheelEndpointLocal`;
- one real arm-to-wheel spin revolute whose arm-side anchor is exactly `armToWheel`;
- ordinary physical wheel contact and rear-wheel motor drive.

The other rear wheel remains the frozen direct chassis-to-wheel baseline. The edited side is not mirrored into it.

There is no Stage-A spring/damper, second physical endpoint table, kinematic wheel-position override, target force pulling the wheel to authored geometry, steering apparatus, or visual mechanism.

Owned dynamic bodies in the specimen: 6 (chassis, selected arm, four wheels).

Owned joints: 5 (selected arm hinge plus four wheel-spin joints).

## 4. Runtime evidence exposed

`Rep2SuspensionTrace` reads live Box3D state and includes:

- chassis transform / velocity;
- arm transform;
- selected and opposite rear wheel transforms;
- hinge world point independently from chassis and arm sides;
- wheel endpoint world point derived from the live arm body;
- selected wheel centre from the live wheel body;
- opposite rear baseline anchor;
- arm length;
- live hinge angle;
- selected-wheel contacts and world contact count;
- owned body/joint counts.

These values are runtime/body/joint-derived; the Stage-A causal tests do not establish physical change by inspecting the authored input object alone.

## 5. Stage-A machine evidence

### Final successful run

GitHub Actions workflow:

`Rep2 Stage A`

Run:

`33826867781`

Job:

`100881291058`

Exact tested SHA:

`954b6eb8e5f3bc3466134e77934cecc841ff5e5a`

Environment included Node `22.23.2` and `box3d.js@0.0.2` from the pinned package lock.

Result:

- `npm ci`: PASS;
- `npm run test`: **48/48 PASS**;
- Rep2 A1-A6: **6/6 PASS**;
- prior E1/V0/R1 source tests: PASS;
- `tsc --noEmit`: PASS;
- `vite build`: PASS.

The build emitted existing/general warnings about `node:module` browser externalization in `box3d.js` and large chunks; neither invalidated this Stage-A source/runtime claim.

### A1 — exact authored construction: PASS

At creation/rest:

- chassis-side and arm-side live hinge points coincide within tolerance;
- live arm-derived wheel endpoint coincides with the live wheel centre;
- reported arm length equals the authored endpoint distance;
- topology is exactly the expected 6 owned bodies / 5 owned joints.

### A2 — physical mutation consequence: PASS

Changing authored pivot geometry changes the actual live Box3D hinge/body placement and derived arm length.

### A3 — spatial falsifier: PASS

Two geometries were constructed with:

- the same initial wheel endpoint;
- equal arm length;
- different arm pivot direction/height.

After the same bounded physics protocol their live wheel path / hinge pose separates.

Therefore Stage A cannot be satisfied by a hidden scalar arm-length mapping alone.

### A4 — one-side independence: PASS

Editing the selected left geometry leaves the opposite rear baseline anchor and initial wheel placement unchanged within runtime float tolerance.

### A5 — contact / drivability sanity: PASS

Without adding a spring/damper:

- the runtime remains finite through settle and drive;
- the selected wheel participates in world contact;
- the vehicle retains at least the expected world-contact regime;
- rear drive moves the chassis forward by the bounded required amount;
- after driving, the live arm-derived endpoint remains coincident with the live wheel centre within 1 mm;
- no extra hidden joint was introduced.

This is evidence that the minimal physical seam itself is viable enough for the next correspondence stage. It is **not** evidence that a springless free arm is a good suspension design.

### A6 — permissive boundary: PASS

A materially odd but finite geometry instantiates without being silently clamped toward baseline.

Non-finite coordinates and near-zero arm length fail explicitly before entering the physics world.

## 6. First run failure retained as evidence

The first CI attempt was:

- run `33826336317`;
- job `100879684497`;
- SHA `8191dcdf7ec9d64e60b650f7990d41e4ad0c2402`.

It produced **47/48 tests PASS**. Rep2 A1, A2, A3, A5 and A6 already passed. A4 failed because the test used strict JavaScript equality between `0.62` and a Box3D/WASM float32-derived value `0.6200000047683716`.

This was a test-precision defect, not a physical-seam failure. The assertion was changed to the same bounded numerical-tolerance discipline used elsewhere. The follow-up also strengthened A5 with the post-drive live arm-endpoint versus wheel-centre correspondence check.

The successful second CI run above is the Stage-A acceptance evidence.

## 7. Stage-A conclusion

Within this bounded specimen, the following chain is demonstrated:

> **one authored spatial pivot/endpoint state -> real Box3D arm hinge/body -> real wheel endpoint/path/contact**

The same authored state is sufficient to change the live mechanism spatially, including a same-length/different-direction falsifier, without a second physical hardpoint description.

This is a small but important improvement over the historical donor pattern exposed by JV_CORE forensics: Stage A does not maintain a decorative or parallel representation around an independently authored physical mechanism.

## 8. What this PASS does not establish

Stage A does **not** prove:

- visual-model / physics correspondence;
- that a real Blockbench/glTF component can consume this seam naturally;
- a final rig or component representation;
- a final hardpoint/data model;
- authored hinge-axis semantics;
- adaptive-component or intent-lock semantics;
- a useful final suspension topology;
- damping, springing, realistic suspension feel or vehicle quality;
- Owner discoverability, direct-manipulation quality or BUILD->DRIVE->BUILD value for this problem;
- a final renderer, physics engine or product architecture;
- product acceptance.

The current `Rep2SuspensionGeometry`, fixed hinge-axis choice, free arm and carrier remain disposable research apparatus.

## 9. Natural stop and next stage

Stage A has reached its defined natural stop. Do not add Owner-facing editing or suspension features under the Stage-A claim.

The next bounded question is **Stage B — visual correspondence**:

> Can the visible one-sided mechanism be generated from the exact same authored/runtime seam, so the visual pivot, arm endpoint and wheel attachment cannot silently diverge from the mechanism that Box3D is actually simulating?

Stage B should add the smallest falsifiable visual representation first. It must not create a second visual endpoint table or visual-only kinematic solve. Any diagnostic primitives used to validate transforms should remain diagnostic apparatus, not be promoted into a product-facing component system. Real donor asset capital should be introduced deliberately before a later Owner-facing construction checkpoint if placeholder visuals would confound mechanical recognizability.
