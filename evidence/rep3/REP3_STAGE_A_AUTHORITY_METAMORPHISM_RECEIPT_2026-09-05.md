# Rep3 Stage A — geometry-derived hinge authority / metamorphism receipt

Date: 2026-09-05

Status: **BOUNDED TECHNICAL PASS — STAGE A ONLY**

## Scope and claim boundary

This receipt closes only Rep3 Stage A from the pre-verdict contract:

`two physical mounts → derived hinge line → native revolute relation → live arm endpoint motion`

It does **not** establish Stage B / Owner value, a suspension corner, bearing stiffness, joint limits/motors/zero-angle semantics, a drivable vehicle, generic builder semantics, final data/component architecture, or final renderer/physics architecture.

## Qualified live ref

- branch: `experiment/rep3-geometry-derived-hinge-line`
- handoff Stage-P head before Stage-A work: `122ff50822dd0e3dade9f9ec2ec108c3e6e7185d`
- Stage-A implementation + evidence workflow head qualified here: `33c248a6f8991a22f11a92509626d13033458038`

Stage-A change sequence:

1. `8fd99608ef71d054cc56241c89e4a9b7a98ef851` — geometry-derived hinge authority world;
2. `dff887cc1c720a7e755dd3228b878659145b29f8` — A1–A5 source tests;
3. `8c638b3af0558a3ff423d2dd8a6b64822a6b2cbf` — strict indexed-access compile fix only;
4. `37d5af53081887cea394c68bdd2f851af01408e0` — exact A1–A5 evidence emitter;
5. `33c248a6f8991a22f11a92509626d13033458038` — dedicated Stage-A workflow.

The first CI run after adding the tests failed at TypeScript compile because the path-comparison helper indexed arrays under strict indexed-access typing without a non-null assertion. This was a test-helper typing failure, not a mechanical/result failure. The fix was limited to explicit non-null assertions after an equal-length assertion.

## Authority implementation

The authored Stage-A authority is intentionally only:

```text
mountAWorld
mountBWorld
```

There is no independently authored hinge axis, Euler orientation, or quaternion in the Stage-A authority record.

The runtime derives:

- `pivotWorld = midpoint(mountAWorld, mountBWorld)`;
- `axisWorld = normalize(mountBWorld - mountAWorld)`;
- Box3D revolute local-frame Z directions from that same derived line.

The solver-frame roll/gauge used to complete the quaternion remains internal representation only.

## Machine validation

Dedicated workflow:

- workflow: `Rep3 Hinge Line Stage A`
- run: `33957392310`
- job: `101283086637`
- exact head: `33c248a6f8991a22f11a92509626d13033458038`
- result: **success**
- inherited + Rep3 tests: **77 / 77 PASS, 0 FAIL**
- production build: **PASS**

Evidence artifact:

- name: `rep3-stage-a-geometry-derived-hinge-evidence`
- artifact ID: `9966802519`
- ZIP size: `1223` bytes
- SHA-256: `50047288f525919745b9a06a376f3ccea539c3236ec43c191a67b162567f3942`
- schema: `rep3-stage-a-geometry-derived-hinge-v1`

Pinned apparatus retained from Stage P where applicable:

- `box3d.js@0.0.2`
- `dt = 1/60 s`
- `4` solver substeps
- arm length `0.7 m`
- arm mass `8 kg`
- isotropic COM inertia `0.5`
- endpoint drive force `3 N`
- `45` default outer steps
- experiment-local singular mount-span threshold: `1e-5 m`

## A1 — native authority correspondence: PASS

Authored authority keys emitted by the run:

- `mountAWorld`
- `mountBWorld`

Representative authored pair:

- A = `(0.25, -0.1, -0.45)`
- B = `(0.25, -0.1, 0.35)`

Derived relation:

- pivot = `(0.25, -0.1, -0.05000000000000002)`
- axis = `(0, 0, 1)`
- mount span = `0.8 m`

Native readback:

- native body A/B identities match the expected support/arm bodies: `true`
- native axis A alignment error: `0`
- native axis B alignment error: `0`
- native pivot A error: `1.6660004562435934e-9 m`
- native pivot B error: `1.398944918736464e-5 m`
- native pivot separation: `1.398913719417172e-5 m`
- max axial-coordinate drift: `0 m`
- max radial-distance drift: `1.3716894328719142e-5 m`
- max angular-velocity off-axis: `0`
- material endpoint motion: `0.2775876921512302 m`

These remain within the pre-existing bounded Stage-P-like integrity tolerances used by the Stage-A tests (`axis < 1e-6`, pivot `< 1e-4 m`, path drift `< 2e-3 m`, angular off-axis `< 2e-2`).

## A2 — materially different mount direction changes real motion: PASS

Control keeps the same midpoint, initial endpoint, body properties, integration settings and applied world load while changing only the physical mount-line direction.

- baseline derived axis: `(0, 0, 1)`
- tilted derived axis: `(0, 0.7071067811865475, 0.7071067811865475)`
- initial endpoint separation: `0 m`
- final endpoint separation: `0.19430488561029874 m`
- max sampled path separation: `0.19430488561029874 m`
- baseline final Z delta from common midpoint: `-5.960464483090178e-9 m`
- tilted final Z delta from common midpoint: `0.1382078319787979 m`

The physical endpoint motion plane therefore changes materially from mount geometry alone; this is not merely a different quaternion/readback value.

## A3 — line-preserving bearing-spacing metamorphism: PASS

Same midpoint and same hinge-line direction, materially different physical mount spacing:

- short span: `0.3 m`
- long span: `1.1 m`
- span difference: `0.8 m`
- initial endpoint separation: `0 m`
- final endpoint separation: `0 m`
- max sampled trajectory separation: `0 m`

For this ideal rigid, unsprung, unmotorized hinge apparatus, spacing is therefore not acting as hidden axis/stiffness authority.

This does **not** claim that real bearing spacing has no structural/stiffness consequences in a vehicle.

## A4 — endpoint-order metamorphism: PASS

Swapping the labels of the same two world-space mounts gives:

- forward derived axis: `(0, +0.7071067811865476, +0.7071067811865476)`
- swapped derived axis: `(0, -0.7071067811865476, -0.7071067811865476)`
- axis opposition error: `0`
- initial endpoint separation: `0 m`
- final endpoint separation: `0 m`
- max sampled trajectory separation: `5.960464477539063e-8 m`

For the free/unlimited/unmotorized hinge, endpoint ordering does not become hidden mechanical authority. Axis sign / solver-frame gauge is not promoted to product semantics by this result.

## A5 — singularity handling: PASS

All required invalid authority cases reject explicitly rather than inventing a fallback axis:

- coincident mounts: rejected;
- near-coincident mounts (`0.5 × minMountSpan`): rejected;
- non-finite mount A: rejected;
- non-finite mount B: rejected;
- exact `minMountSpan` boundary is also covered by the source test and rejects.

The `1e-5 m` threshold is experiment-local apparatus policy, not a final product tolerance.

## Stage-A verdict

**PASS within the pre-verdict Stage-A claim boundary.**

Demonstrated:

- two physical mounts are the sole authored spatial hinge-line authority in the Stage-A apparatus;
- native solver body/frame/pivot readback corresponds to the relation derived from those mounts;
- changing mount-line direction changes real constrained endpoint motion;
- line-preserving spacing does not secretly change ideal rigid-hinge kinematics;
- mount endpoint order does not secretly change free-hinge kinematics;
- singular/non-finite authority rejects explicitly.

Not demonstrated:

- Owner readability or naturalness;
- direct-manipulation usability;
- BUILD → PLAY → BUILD product value;
- any broader suspension/vehicle/builder semantics.

## Frontier after this receipt

Stage B is now technically eligible under the contract.

The next bounded move is the smallest Owner-facing apparatus that projects exactly this same two-mount authority into a readable 3D BUILD/PLAY loop: visible support, two large/acquirable mount handles, inferred hinge line, arm + endpoint, direct 3D translation, camera control, and reset/play-pause. No editable axis gizmo and no expansion into wishbone/coilover/tire/vehicle/generic-builder scope.

Machine/render preflight must remove obvious interaction and visibility confounds before spending Owner attention. The natural Rep3 STOP remains the first honest Stage-B Owner verdict.
