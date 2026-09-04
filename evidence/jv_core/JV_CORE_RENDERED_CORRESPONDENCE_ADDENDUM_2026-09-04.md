# JV_CORE rendered correspondence addendum

Date: 2026-09-04

Status: **bounded donor-forensics closure addendum**

This addendum extends the source-level receipts already recorded on this branch. It does not promote JV_CORE into a foundation and does not change canonical `main`.

## 1. Why this pass existed

The earlier source trace established that historical JV_CORE often rendered mechanical parts from a representation separate from the physical bodies, hardpoints and joint anchors that actually constrained the vehicle. That source result alone was not enough to claim a rendered mismatch under live motion: two separately-authored representations can accidentally coincide at rest or stay visually close across a narrow pose range.

The bounded rendered gate therefore asked only:

> do the historical visible members and the live-physics diagnostics remain one geometric mechanism when the suspension state materially changes?

The gate was deliberately observational. It did not repair historical code.

## 2. Exact donor provenance

Historical donor entry point:

`Jozzpoly/Box3d_FunProject@241fe10a9056836332c21d9614471d32d749ce3d`

Historical tree:

`8c3acbf84e923a22f3fe90f4887f345cc1829134`

Temporary forensic branch:

`research/jv-core-rendered-forensics-2026-09-04`

The branch contains presentation/capture instrumentation only. It is not a repaired donor branch.

### Stress render pass

Specimen SHA:

`a5e294152e9c25e6f47fdf007e5f3c87bfb33425`

GitHub Actions:

- run `33859343386`;
- job `100979933069`;
- conclusion: SUCCESS;
- native Windows/D3D11 sample build: PASS;
- old mount capture at zero preload: PASS;
- old mount capture at offroad-valid preload: PASS;
- steering-rig capture at zero preload: PASS;
- steering-rig capture at offroad-valid preload: PASS.

Artifact:

`jv-core-m6-rendered-stress-forensics`

Digest:

`sha256:0f2630e18a6e1138c8130dd8f7a48e13d3e958b92880b06008eab3cb7f071e2b`

The full-car framing still occluded several relationships with wheel/body visuals, so it was not treated as the final visual comparison.

### Isolated-corner pass

Specimen SHA:

`518c272b032399bcd6299fc9a9b39041f5d24e20`

GitHub Actions:

- run `33860359811`;
- job `100983152963`;
- conclusion: SUCCESS;
- warm host settings: PASS;
- isolated old mount at preload `0.07`: PASS;
- isolated old mount at preload `0.15`: PASS;
- isolated steering rig at preload `0.07`: PASS;
- isolated steering rig at preload `0.15`: PASS.

Artifact:

`jv-core-m6-isolated-corner-forensics`

Digest:

`sha256:e93b35b0d94e5b4d794c564815dc140998ffcdb1e641efbfbcc0a68bc942ad65`

This pass changed presentation only: wheel/body skin occlusion was removed and the camera was brought onto the relevant corner. The donor mechanics remained the historical mechanics.

## 3. Important source correction retained

The old `One_Sided_wheel_mount` visual is **not** simply a static/chassis-attached decorative arm.

Its `Chassis_Top` / `Chassis_Bottom` mesh parts are procedurally transformed with `DrawPartBetween(...)` between endpoints derived from:

- a chassis-relative `bracketWorld` visual frame; and
- a knuckle-relative `hubWorld` visual frame.

Meanwhile the physical double-wishbone corner owns separate `upperArmId` / `lowerArmId` bodies, hinge frames, ball joints and wishbone hardpoints.

The corrected failure model is therefore more subtle:

> **parallel-but-potentially-coincident visual and physical representations**, not merely a non-moving visual shell.

That distinction matters because a parallel representation can look convincing over a useful pose range while still having no structural guarantee that it is the same mechanism.

## 4. Rendered observations

The isolated captures were compared at two materially different suspension preload/ride states.

### Old mount

Observed:

- the blocky authored mount/arm visual and the colored live-physics diagnostics both articulate as suspension state changes;
- the visible members do not collapse onto the same geometric lines as the live physical upper/lower arm diagnostics;
- the relative relationships remain visibly distinct across both tested states rather than becoming one shared geometry after articulation.

Interpretation bounded by the source trace:

- the rendered result is consistent with the already-traced parallel visual-frame versus physical-body/hardpoint representations;
- the source-level split is therefore not merely a naming defect or a single bad rest-pose screenshot.

No pixel-derived numerical hardpoint claim is made from these images.

### Combined steering/suspension rig

Observed:

- the visible steering member and the cyan live physical tie-rod diagnostic trace materially different lines;
- both respond to the changed suspension state, but they remain geometrically distinct;
- the visible suspension members/damper assembly and the live physical diagnostics likewise do not become one shared rendered mechanism.

This rendered observation directly agrees with the traced source authority split:

- visual steering rod inboard endpoint = live **rack centre**;
- physical tie-rod inboard endpoint = live rack end at `±rackHalfWidth`;
- visual wishbone/damper endpoints are reconstructed through visual chassis/lower-arm/knuckle frames;
- physical wishbone and coilover use their own bodies/hardpoints/joint anchors.

## 5. Donor conclusion after rendered gate

The historical failure is now supported by both source and native rendered evidence:

> JV_CORE could render a mechanically plausible moving assembly while the visible members and the physical constraints were owned by different geometric descriptions.

The important negative evidence is not "skeletal rigging is bad" or "procedural stretch is bad". Both can be useful implementation techniques.

The failure mode to avoid is:

> **two independently authoritative descriptions of one presented mechanism.**

A safe Nextgen experiment should therefore separate two truths intentionally:

1. **BUILD authority** — authored mechanical state instantiates the actual physical relation/body/joint/force path;
2. **PLAY authority** — the live physical relation/body/joint state supplies the endpoints/pose that the visible component represents.

The visual component may adapt, stretch or use a skeleton, but it should adapt **downstream of the live physical relation**, not solve a nearby second mechanism from its own hardpoint table.

## 6. Useful donor capital retained

The rendered gate does not invalidate all visual donor capital.

Still useful:

- real Blockbench/glTF semantic points;
- rigid-per-bone decomposition of authored assets;
- `DrawPartBetween` as a local visual adaptation technique when its live endpoints are trustworthy;
- `Asset_Dumper.gltf` and the small telescoping-damper visual idea: real upper/lower pieces can be pinned to two live endpoints while the middle span adapts.

None of these fragments gains architecture authority.

## 7. Natural stop

The visual/rig donor-forensics phase has reached its intended stop condition.

Further broad JV_CORE archaeology is not justified unless a later bounded experiment encounters a concrete unknown that this evidence cannot answer.

The remaining high-value work is fresh representative-problem selection/implementation under the corrected failure model, not more historical rig excavation.
