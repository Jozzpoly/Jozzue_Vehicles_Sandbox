# Rep2 Stage B — visual correspondence gate

Date: 2026-09-04

Status: **execution contract; Stage A already closed separately**

Stage-A accepted specimen:

`954b6eb8e5f3bc3466134e77934cecc841ff5e5a`

Stage-A receipt:

`evidence/rep2/REP2_STAGE_A_PHYSICAL_SEAM_RECEIPT_2026-09-04.md`

## 1. Question

Can a visible one-sided suspension link be rendered from the exact same live physical seam established in Stage A, such that the visible pivot, arm endpoint and wheel attachment cannot silently diverge from the Box3D mechanism?

Stage B is not an Owner-facing builder test and does not add direct manipulation.

## 2. Authority rule

The Stage-B projection must consume `Rep2SuspensionTrace`, not `Rep2SuspensionGeometry`.

The authoritative visual endpoints are therefore:

- arm/pivot end: `trace.hingeWorldFromArm`;
- arm/wheel end: `trace.wheelEndpointWorldFromArm`;
- wheel pose: `trace.selectedWheel` / `trace.wheelCenterWorld`.

The projection may derive a cylinder/mesh transform between those two live endpoints. It must not own a second pivot/endpoint table, rest pose, visual suspension trajectory, or animation state that can move independently of physics.

The authored geometry remains upstream in the physical world exactly as Stage A established:

`Rep2SuspensionGeometry -> Box3D mechanism -> Rep2SuspensionTrace -> visible mechanism`

## 3. Diagnostic visual scope

Use the smallest diagnostic Three.js representation sufficient to falsify correspondence:

- transparent/simple chassis cue;
- selected live wheel;
- one visible arm/link between the two live physical endpoints;
- pivot marker;
- optional opposite-rear baseline cue and ground/grid for orientation.

These primitives are **diagnostic apparatus**, not a component model or product art direction.

Do not import the whole historical JV_CORE rig in this stage. Donor-forensics established that its visual/physics semantics are internally split. A real donor asset or extracted fragment should enter deliberately before a later Owner-facing construction checkpoint if primitive presentation would confound mechanical recognizability.

## 4. Required correspondence evidence

Expose machine-readable diagnostic values from the actual rendered scene:

- visual pivot world position;
- visual arm wheel-end world position reconstructed from the rendered arm transform;
- visual wheel centre;
- errors versus the corresponding live Box3D trace positions;
- current physical hinge angle / step for proof that the check is repeated after motion rather than only at rest.

The diagnostic should be evaluated both at rest/settled state and after physical motion/drive.

## 5. Tests

### B1 — rendered segment math

Given two arbitrary 3D endpoints, the Three.js transform used for the arm must reconstruct both endpoints within tight tolerance. Test the actual helper used by the projection, not a separate oracle implementation.

### B2 — no parallel visual geometry

The correspondence function/projection API must derive its arm and wheel placement from `Rep2SuspensionTrace`. No Stage-B visual hardpoint table or authored rest trajectory is allowed.

### B3 — browser rest correspondence

In a real browser/WebGL render, after the physical world settles:

- visual pivot error is within tolerance;
- visual arm wheel-end error is within tolerance;
- visual wheel-centre error is within tolerance;
- no page/runtime errors occur.

### B4 — browser moving correspondence

After driving/physical articulation, repeat the same checks. The rendered link must continue to coincide with the live physical endpoints; passing only at initial rest is insufficient.

### B5 — materially different authored specimen

Instantiate a second bounded authored geometry through the physical world only. The visual mechanism must follow its resulting live physical seam without any projection-side variant data.

## 6. Tripwires

Stage B fails its intended claim if any of these appear:

- a second visual pivot/endpoint geometry table;
- projection code reading a separate authored suspension geometry to place the live arm;
- visual-only wheel/arm animation independent of trace/body state;
- a rest-pose bake used as the authority during motion;
- using screenshot plausibility alone without numerical correspondence checks;
- treating diagnostic primitives as a final component/asset architecture;
- importing JV_CORE rig semantics wholesale because an old asset exists.

## 7. Natural stop

Stop Stage B when the same live physical seam is demonstrated to own the diagnostic visible mechanism at rest, under motion, and for a materially different authored specimen.

Do not add direct manipulation in this stage.

After a Stage-B PASS, the next decision is whether to introduce a bounded real donor visual fragment before Stage C, so an eventual Owner BUILD->DRIVE->BUILD checkpoint is not invalidated by placeholder recognizability or the R1-style hidden-target problem.
