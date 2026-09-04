# JV_CORE rendered correspondence + Rep2 reselection gate — 2026-09-04

Status: **donor archaeology STOP / Rep2 final selection NOT YET earned**

This receipt records the bounded result of the JV_CORE visual-rig forensics needed before final Representative Problem #2 selection. It is intentionally not an architecture decision and does not authorize reuse of the historical runtime rigging model.

## 1. Exact donor and evidence boundary

Historical donor repository: `Jozzpoly/Box3d_FunProject`

Exact donor source commit:

`241fe10a9056836332c21d9614471d32d749ce3d`

Relevant exact source blobs under that commit's `samples/` tree:

- `jozz_vehicle_m6_rig_lab.cpp` — `68ec22373ce08339186b5a84665804acf73dd8d6`
- `jozz_vehicle_m6_rig_lab_mount_visual.cpp` — `7a3e712cc7e2545203ad23c5ed3ebd03af4ce482`
- `jozz_vehicle_m6_rig_lab_steering_visual.cpp` — `ddede86f320a825700d0708e77138d5134e5c237`
- `jozz_vehicle_m6_suspension_rig.cpp` — `cb4dc2f63ec110d20366e9705356d31c26aa8e02`
- `jozz_vehicle_m6_geometry.cpp` — `f15931f3ea57e9f1f3a6426c709bc00b530279d7`
- `jozz_vehicle_visual_mesh_draw.cpp` — `56344aaee1e9233746f4367bdfe5d797ed9c153d`

Historical source comments are not treated as authority over the actual transforms, bodies, anchors, or rendered evidence.

## 2. Rendered evidence

Throwaway donor-render branch:

`research/jv-core-rendered-forensics-2026-09-04`

### Baseline / diagnostic pass

- commit `bac79e2dc867ad85b9e273f04755f388b843f23a`
- workflow run `33855720119`
- artifact `9930283875`
- artifact SHA-256 `bb2c8ae781ea43dc86bef84e13018b337c117d6ab852f339941b3e288facf643`

The steering close-up visibly separates the thick authored/procedural steering rod from the thin cyan physical tie-rod diagnostic.

### Preload stress pass

- commit `a5e294152e9c25e6f47fdf007e5f3c87bfb33425`
- workflow run `33859343386`
- artifact `9931727918`
- artifact SHA-256 `0f2630e18a6e1138c8130dd8f7a48e13d3e958b92880b06008eab3cb7f071e2b`

### Isolated-corner pass

- commit `518c272b032399bcd6299fc9a9b39041f5d24e20`
- workflow run `33860359811`
- job `100983152963`
- artifact `9932102368`
- artifact SHA-256 `e93b35b0d94e5b4d794c564815dc140998ffcdb1e641efbfbcc0a68bc942ad65`

Evidence frames:

- `m6-mount-isolated-007.png`
- `m6-mount-isolated-015.png`
- `m6-steering-isolated-007.png`
- `m6-steering-isolated-015.png`

The isolated mount frames show the real physical coilover diagnostic (green) on a different axis from either of the two large visible telescoping dampers at both tested settled preload states, 0.07 and 0.15. This is a two-state rendered correspondence observation, not a claim of continuous dynamic behavior.

The steering-isolated frames do not contradict the source-proven endpoint divergence, but overlap/occlusion makes source inspection the stronger evidence for exact endpoint identity there.

No further donor render archaeology is justified without a concrete new falsifier.

## 3. Source-grounded correspondence matrix

| Presented mechanism | Historical visual live truth | Physical live truth | Correspondence verdict | Reuse decision |
| --- | --- | --- | --- | --- |
| Old-mount upper visual arm | Procedurally spans authored arm endpoints transformed through chassis `bracketWorld` and knuckle `hubWorld` | Dedicated `upperArmId`, upper hinge hardpoints and upper ball joint | **Parallel truth**. Same broad corner motion can make them look plausible, but visual arm is not projected from the physical upper-arm body/hardpoints. | Do not reuse binding. Authored mesh form may remain donor material. |
| Old-mount lower visual arm | Same chassis `bracketWorld` → knuckle `hubWorld` procedural span | Dedicated `lowerArmId`, lower hinge hardpoints and lower ball joint | **Parallel truth** | Do not reuse binding. |
| Old-mount visible dampers | Two `Asset_Dumper` instances; endpoints come from `suspension.visual.damper_*` sockets transformed through chassis `bracketWorld` and knuckle `hubWorld` | One wishbone distance-joint coilover, `chassisId ↔ knuckleId`, exact anchors `hp.coiloverChassis ↔ hp.coiloverKnuckle` | Body pair happens to match, but endpoint geometry and multiplicity do not. Rendered green physical axis visibly diverges from both visible dampers. | Reject visual-socket endpoint authority. Preserve separate `Asset_Dumper` as candidate visual component. |
| Steering-rig visual upper arm | Both visual wishbone arm wheel-ends are driven through a frame baked to **`lowerArmId`** | Upper arm has its own `upperArmId` and upper hardpoints | **Wrong physical ownership** | Reject binding. |
| Steering-rig visual lower arm | Procedural chassis end → `lowerArmId`-derived wheel end | Dedicated physical lower arm | Closer in ownership than visual upper arm, but still a separate procedural geometry truth rather than the physical hardpoint/body truth itself | Do not grant architecture authority. |
| Steering-rig visible steering rod | Inboard endpoint = real rack body **centre** `{0,0,0}`; outboard endpoint via knuckle visual frame | Physical tie rod = rack endpoint `±rackHalfWidth` → physical steering-arm hardpoint | **Direct source-proven endpoint mismatch**; rendered close-up also separates the paths | Reject binding. |
| Steering-rig visible damper | Top from authored visual socket on chassis frame; lower follows `lowerArmId` and is further remapped through procedural visual lower-arm placement | Physical wishbone coilover = `chassisId ↔ knuckleId`, physical coilover hardpoints | **Different causal topology: chassis↔lower-arm visual path vs chassis↔knuckle force path** | Reject binding completely. |

## 4. Important correction: combined rig mount is not the shock

A prior mesh probe found a clean 96-vertex / 48-triangle region under `Socket_SingleDamper_Mount` in `OneSided_Steering_Suspension_Rig.gltf`, with `Socket_SingleDamperUpper` and `Socket_SingleDamperLower` themselves carrying no vertices.

Source trace corrects the interpretation: the actual telescoping shock rendered by M6 is a **separate real Blockbench asset**:

`assets/source/Asset_Dumper.gltf`

The combined rig supplies authored context/socket locations; the shock visual itself comes from `m_dumper`.

Therefore the clean C1 donor should not be described as “extract the shock from the combined rig”.

## 5. Donor capital that survives

`JozzVehicleRiggedMesh::DrawTelescopingDamper(topWorld, botWorld, ...)` contains a compact adaptive-visual pattern worth preserving as research donor capital:

- locate authored `Upper`, `Stretch`, `Lower` pieces;
- derive the authored rest axis from the Upper/Lower bind positions;
- orient the component from authored axis to the live endpoint axis;
- pin the rigid upper part exactly to `topWorld`;
- pin the rigid lower part exactly to `botWorld`;
- stretch only the middle section along the live gap while preserving its authored fractional position.

Crucially, this routine **does not choose the mechanical endpoints**. Historical causal wrongness enters through the caller that supplies parallel visual endpoints.

Candidate reuse boundary for C1:

**May reuse / recover:**

- real `Asset_Dumper.gltf` authored visual form;
- its internal Upper/Stretch/Lower partition and bind geometry;
- the bounded adaptive idea: rigid ends + extensible middle.

**Must not inherit as authority:**

- historical visual endpoint/socket semantics;
- old chassis/lower-arm/knuckle visual frame assignment;
- old full rig skeleton/data model;
- old steering-rod centre binding;
- historical “looks connected to the same bodies” as evidence of correspondence.

## 6. C1 single-truth contract candidate

The smallest clean-room correspondence experiment should test this rule, not reproduce the old rig:

> The authored mechanical attachment anchors are the sole endpoint truth. The real spring/damper force path attaches at those exact runtime anchors, and the visible real Blockbench damper consumes those same two runtime endpoints. There is no independently positioned visual hardpoint pair.

The asset's internal Upper/Stretch/Lower geometry remains a visual adaptation detail. It must not become a second source of mechanical attachment locations at runtime.

This is an **experiment-local contract**, not a final component/data architecture.

## 7. C0c prerequisite now closed

The spring-law substrate question needed by a meaningful mount-authoring test has been separately bounded and closed for `k > 0`:

- authored `k/c/L0` can be mapped to the native Box3D distance spring through its own axial effective mass;
- acceptance force-law NRMSE: mean 2.934%, worst 3.834% in the bounded C0c bench;
- generalized-mechanism-mass mapping and fixed-Hz alternatives were strongly separated;
- no current evidence justifies a custom constraint or Box3D fork;
- pure-damper `k=0` remains an explicit gap and need not be pulled into C1.

Therefore a future geometry-causality experiment must preserve an authored physical component law rather than silently retune Hertz to preserve a target wheel response.

## 8. Why the trailing-arm donor retuning is negative evidence for Nextgen semantics

Historical JV_CORE trailing-arm physics derives motion ratio from attachment geometry and then retunes damper Hertz so the resulting wheel rate targets a fixed value. This was a legitimate historical tuning convenience, but it can hide the behavioral consequence of moving a damper mount.

For the current representative problem, that would defeat the claim being tested.

Provisional experimental semantics should therefore be:

- hold authored component physical law (`k`, `c`, rest length) fixed;
- move the authored attachment geometry;
- allow motion ratio and therefore effective wheel behavior to change causally;
- map `k/c` to solver parameters using the qualified C0c seam rather than treating Hertz as authored stiffness.

This does **not** decide final adaptive-component or intent-lock semantics.

## 9. Rep2 reselection gate

The earlier “single-source suspension-link / arm-pivot” Representative Problem #2 selection remains only a provisional hypothesis. Stage A remains useful bounded substrate evidence; Stage B remains a B0 correspondence harness, not a real-asset milestone.

After this donor recovery, a stronger provisional candidate is:

> **Direct spatial coilover-mount authoring:** can the Owner move a coilover attachment on a simple physical suspension such that the same authored attachment geometry defines the real spring/damper force path and the visible adaptive Blockbench damper, while the geometry change produces a readable, causal wheel/vehicle behavior change and survives BUILD → DRIVE → BUILD recovery?

Why this currently dominates the arm-pivot candidate:

1. R1 already covered a kinematic steering-linkage geometry → drive path. Coilover placement probes a different class: **force-path/compliance geometry → wheel load/motion → drive feel**.
2. It introduces a real authored/adaptive Blockbench component immediately.
3. It directly tests the historical JV_CORE failure class: visible mechanism vs actual mechanical authority.
4. It exposes the unresolved but important semantics of geometry-dependent motion ratio without requiring final architecture.
5. It remains bounded relative to full wishbone authoring.

Still NOT earned:

- final Rep2 selection;
- final component/data model;
- general builder architecture;
- product PASS for the donor visual;
- claim that a two-state screenshot proves continuous dynamic correspondence.

## 10. Required next boundary: Owner correction

Before turning this candidate into product-facing implementation, ask one bounded Owner question about the historical/product rule:

> Is this the historical wrongness that matters: visible suspension pieces that appear to be the causal mechanism while actually following parallel sockets/frames or even a different body topology? For Nextgen, when a component is presented as the spring/damper or steering link causing behavior, should its visible attachment path be the same real attachment/constraint path that produces the behavior, except for clearly non-causal cosmetic detail?

Owner judgement here has authority over intended mechanical readability. A YES would justify final Rep2 reselection toward the coilover-mount problem; a correction should alter the experiment before implementation.
