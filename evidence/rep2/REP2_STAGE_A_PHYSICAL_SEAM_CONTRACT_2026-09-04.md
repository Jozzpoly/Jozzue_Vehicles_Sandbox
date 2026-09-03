# Rep2 Stage A — physical single-source suspension-link seam

Date: 2026-09-04

Status: **execution contract; no implementation PASS claimed**

Branch lineage:

- branch: `experiment/rep2-single-source-suspension-link`
- base specimen: `9d1ce9217ad9ed255ec30181730d57ab87165b85`

Research evidence lives separately on `research/jv-core-visual-rig-forensics`:

- donor-forensics: `08402a15179f39b69c84ebf08ceb99fcbcb5390b`
- wheel-mount comparator: `2b4d7a7cc1360cef4e18fb4f296629d4e9f0c5d7`
- fresh Representative Problem #2 selection: `6a6f687c177118a18ff9f1385b494609f9b8b252`
- carrier feasibility audit: `48ec9f7eb2582df096fdc0fd65775cb52179e4aa`

Do not merge those research commits into this experimental lineage merely for convenience.

## 1. Stage-A question

Can one experiment-owned spatial state instantiate a real Box3D suspension arm so that changing that state changes the actual live arm hinge / wheel path, with no parallel hidden physical hardpoint description?

Stage A deliberately does **not** answer visual correspondence or Owner interaction yet.

## 2. Reuse boundary

Reuse from V0 only the proven neutral substrate:

- `box3d.js@0.0.2` world/body/joint API patterns;
- `vec3` / quaternion helpers where semantically neutral;
- the minimal chassis, ground, wheel-contact and rear-drive ideas from `src/v0/straight-carrier.ts`;
- existing TypeScript/test conventions.

Do not extend or depend on:

- `SteeringGeometry`;
- `PhysicalSteeringWorld`;
- V0 rack/tie-rods/oracle;
- `V0Projection`;
- R1 pickup authoring UI.

Rep2 gets its own modules under `src/rep2/` and tests under `tests/rep2/`.

## 3. Minimal authored state

Start with one selected rear corner, left by default.

A disposable initial shape is sufficient:

```ts
export interface Rep2SuspensionGeometry {
  readonly armPivotLocal: Readonly<{ x: number; y: number; z: number }>;
  readonly wheelEndpointLocal: Readonly<{ x: number; y: number; z: number }>;
}
```

The state is chassis-local. It is the only source for the selected arm's pivot and wheel-side endpoint.

Do not add damper endpoints until the arm/wheel seam is physically demonstrated. If the car cannot remain usable without a spring, add the minimum damper state in a later bounded change rather than hiding a stabilizer inside Stage A.

## 4. Physical construction

Create `src/rep2/suspension-link-world.ts` by extracting the minimum straight-carrier logic, not by subclassing V0.

For the selected rear corner:

1. create a dynamic shapeless arm body at world position `chassisTransform * armPivotLocal`;
2. set explicit non-zero arm mass/inertia;
3. create a chassis↔arm revolute hinge at `armPivotLocal`;
4. derive `armToWheel = wheelEndpointLocal - armPivotLocal` directly from the authored state;
5. create the wheel body at `chassisTransform * wheelEndpointLocal`;
6. create the wheel spin revolute joint with its arm-side anchor equal to `armToWheel`;
7. drive that wheel through the existing rear-wheel motor pattern.

The hinge axis should initially match the simplest physically meaningful one-sided/trailing-link swing for this carrier. It is an experiment constant, not a user-authored final axis model.

The opposite rear corner remains the frozen direct-spin baseline for Stage A unless asymmetric topology makes the vehicle numerically unusable; if so, give the opposite side the same arm topology with frozen baseline geometry, not mirrored authored edits.

## 5. Required trace

Expose enough runtime truth to test the causal seam without rendering:

```text
step
chassis transform / velocity
selected arm body transform
selected wheel body transform
hinge world pivot from chassis side
hinge world pivot from arm side
wheel endpoint world from arm side
wheel centre world
arm length
world contacts
```

If box3d.js exposes joint reaction/error information cheaply, record it, but do not expand scope to build telemetry infrastructure.

## 6. Stage-A tests

Create focused tests that must pass before any visual/Owner work.

### A1 — exact authored construction

Given geometry G, assert at creation/rest that:

- chassis-side hinge world pivot and arm-side hinge world pivot coincide within tolerance;
- arm-derived wheel endpoint and wheel centre coincide within tolerance;
- reported arm length equals `|wheelEndpointLocal - armPivotLocal|`.

### A2 — physical mutation consequence

Instantiate G1 and G2 that differ only in `armPivotLocal` or `wheelEndpointLocal`. Assert the live Box3D anchors/body placement differ accordingly. This must inspect runtime body/joint-derived positions, not only the input object.

### A3 — spatial falsifier

Use G1 and G2 with approximately equal arm length but different direction/height. Apply the same bounded disturbance or short drive/settle protocol and assert a different wheel path / arm pose result.

Purpose: prevent a hidden scalar arm-length mapping from satisfying the experiment.

### A4 — one-side independence

Changing the selected left authored geometry must not change the opposite rear baseline coordinates.

### A5 — contact/drivability sanity

After a bounded settle/drive sequence:

- all relevant body transforms remain finite;
- the selected wheel participates in world contacts at least once under the chosen protocol;
- the chassis makes forward progress under drive;
- no extra hidden joint is introduced to force the wheel to the authored endpoint.

### A6 — permissive boundary

- finite but odd geometry should instantiate when Box3D can structurally represent it;
- non-finite values and near-zero arm length should fail explicitly with diagnosis rather than NaN-ing the world.

Do not clamp strange finite geometry back toward baseline silently.

## 7. Explicit tripwires

Stage A fails the intended research contract if any of these appear:

- a second physical pivot/endpoint table distinct from `Rep2SuspensionGeometry`;
- a kinematic wheel-position override each frame;
- a hidden force that teleports/pulls the wheel toward a target independently of the real arm joint;
- visual-only changes used as evidence of physical change;
- mirroring the edited side into the other side without an explicit later experiment decision;
- adding full wishbone/hardpoint/component architecture because JV_CORE had it.

## 8. Natural stop

Stop Stage A as soon as source tests / runtime probes demonstrate or falsify:

`authored spatial state → real arm hinge/body → real wheel endpoint/path/contact`

Do not build the Owner-facing editor in the same stage.

Only after Stage A passes should Stage B add the smallest visual representation that consumes the exact same runtime/authored endpoints, followed by Stage C direct manipulation and BUILD→DRIVE→BUILD recovery.

## 9. Current execution boundary

This browser session verified the source substrate and created the experiment branch, but its local sandbox cannot resolve GitHub or install the branch's `box3d.js` / Three dependencies. Therefore no Stage-A implementation or test PASS is claimed here.

The next execution should run in a repo-native environment with dependency/runtime access, on this exact branch and base. It should implement only the contract above, run the focused Stage-A tests plus the existing project check applicable to the branch, and return an exact commit SHA plus test output/evidence before Stage B begins.
