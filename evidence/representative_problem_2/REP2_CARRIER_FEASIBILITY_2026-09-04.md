# Representative Problem #2 — carrier/substrate feasibility audit

Date: 2026-09-04

Status: **carrier choice sufficient; implementation not yet claimed**

This audit follows `REPRESENTATIVE_PROBLEM_2_SELECTION_2026-09-04.md`. It is intentionally narrow: choose the cheapest carrier that can test one single-source suspension-link causal path without inheriting a historical JV rig architecture.

## 1. Inputs checked

Nextgen R1/V0 research specimen:

- `experiment/nextgen-jv-direct-spatial-pickup@9d1ce9217ad9ed255ec30181730d57ab87165b85`

Relevant source:

- `package.json`
- `src/v0/straight-carrier.ts`
- `src/v0/physical-steering-world.ts`
- `src/v0/projection.ts`
- `src/r1/app.ts`

JV_CORE donor fragment:

- `Jozzpoly/Box3d_FunProject@241fe10a9056836332c21d9614471d32d749ce3d`
- `assets/source/One_Sided_wheel_mount.gltf`

## 2. Substrate truth

The R1/V0 web specimen already uses:

- `box3d.js@0.0.2` for actual 3D rigid-body physics;
- `three@0.185.1` for rendering;
- Vite/TypeScript;
- Playwright plus source tests for machine preflight.

The minimal `StraightCarrierWorld` is materially simpler than the R1 steering apparatus. It creates:

- one dynamic chassis;
- four dynamic wheel bodies;
- front locked knuckles;
- direct wheel spin joints;
- rear wheel drive;
- real world contact against a Box3D ground plane.

The rear wheel seam is especially useful: each rear wheel is currently connected directly to the chassis by one revolute spin joint. Replacing one selected rear corner with:

`chassis → suspension-arm hinge/body → wheel spin joint`

is a bounded local change. It does not require importing the V0/R1 rack, tie-rods, steering oracle or steering authoring model.

## 3. Carrier decision

### Reject: use R1 application as the Rep2 carrier

`src/r1/app.ts` and `V0Projection` are strongly steering-shaped:

- authored state is `SteeringGeometry`;
- picking is hard-coded to LEFT/RIGHT steering pickup markers on a horizontal plane;
- visible mechanical members are rack/tie-rods/steering arms;
- telemetry and UI language are steering-specific.

Reusing that whole app would make Rep2 look cheap in lines of code while importing the wrong research grammar and visual assumptions.

### Reject: use JV_CORE native M6/M7 lab directly

It already contains suitable multi-body suspension physics, but using the lab as the experiment carrier would also import the very visual/physics correspondence ambiguity the donor-forensics exposed, plus a large amount of historical configuration and rig semantics.

That would turn donor archaeology into architecture by inertia.

### Select: new small Rep2 web specimen on the proven V0 substrate

Use the existing project/toolchain and **extract the minimal straight-carrier mechanics**, not the R1 product surface.

Proposed implementation lineage:

- branch from the exact R1/V0 specimen so the proven `box3d.js`/Three/test substrate is present;
- create experiment-owned `src/rep2/*` modules rather than extending `src/r1/*`;
- reuse small generic math/loop/render patterns only where they remain semantically neutral;
- build a new `Rep2SuspensionWorld` from the straight carrier rather than subclassing/mutating the steering world.

This is substrate reuse, not R1 continuation.

## 4. Minimum physics construction

For the first specimen, change only one rear corner mechanically. The opposite rear corner can remain the frozen baseline direct-spin carrier unless stability requires the same suspension topology with non-editable baseline geometry.

Experiment-owned authored state should stay small and explicitly spatial. Initial candidate:

```text
armPivotLocal: Vec3
wheelEndpointLocal: Vec3
[optional, only if required] damperChassisLocal: Vec3
[optional, only if required] damperArmLocal: Vec3
```

The exact data shape is not architecture.

The selected corner should instantiate from that state:

1. a dynamic shapeless arm body whose hinge origin is `armPivotLocal`;
2. a chassis↔arm revolute joint using the authored pivot/axis;
3. a wheel body whose spin anchor is derived from `wheelEndpointLocal - armPivotLocal`;
4. a wheel spin joint from arm to wheel;
5. only the minimum spring/damper needed to keep the car usable, with its endpoints in the same authored state if introduced.

No second “visual pivot” or “visual wheel endpoint” is allowed.

## 5. Minimum visual construction

Do not reuse `V0Projection` as the representation contract. A new Rep2 projection should consume the same authored/runtime frames as the physics world.

The visual arm should be fitted exactly between the live physical pivot and live wheel-side endpoint produced by the selected arm body. Any donor mesh adaptation must consume those same endpoints.

A primitive cylinder is acceptable as an internal machine-debug fallback, but should not become the Owner-facing evidence if a real donor fragment can be integrated at bounded cost.

### Real asset feasibility

`assets/source/One_Sided_wheel_mount.gltf` is a self-contained Blockbench 5.1.4 glTF with an embedded binary data URI, a skin and named semantic nodes. No external `.bin` dependency is required.

However, the whole historical assembly should not be rendered as though it were the new mechanism. The preferred extraction is the smallest mechanically recognizable arm fragment / rigid bone group plus the useful authored socket geometry. If extracting that group from the skin proves disproportionate for this bounded experiment, create one small Blockbench-derived arm asset rather than growing a placeholder asset system or adopting the whole old rig.

## 6. Why this carrier is sufficient

This substrate can answer the selected research question without a broad engine decision:

- Box3D already supplies real dynamic bodies, revolute joints, distance/spring joints and wheel contact;
- the straight carrier already drives and has a stable minimal chassis/wheel loop;
- Three already supplies the rendering space and direct manipulation machinery;
- the repository already has build/source/browser validation patterns;
- no R1 steering mechanism is required for the causal chain.

The main new uncertainty is therefore the intended one: **shared authored geometry owning physics + visible mechanism + driving consequence**, not whether we can stand up another vehicle runtime.

## 7. Machine preflight contract before Owner attention

The implementation should not be handed to the Owner until machine evidence demonstrates at least:

1. **single-source identity** — physics and visual construction read the same authored state object/immutable snapshot;
2. **physical propagation** — changing the pivot/endpoint changes Box3D joint/body anchors measured from runtime;
3. **visual correspondence** — rendered arm endpoints coincide with the live physical endpoints within a small tolerance;
4. **spatial falsifier** — two authored geometries with equal arm length but different direction/height produce different physical wheel paths / runtime response;
5. **no hidden symmetrization** — a one-corner edit does not silently alter the opposite corner;
6. **exact recovery** — BUILD → DRIVE → BUILD returns exactly to the authored coordinates;
7. **real contact** — selected wheel remains a live Box3D body with ground contact and the vehicle remains drivable;
8. **permissive failure** — strange geometry is diagnosed; only non-finite/structurally dangerous cases are rejected.

Rendered browser checks should additionally make the edited mechanism visible enough to judge without privileged coordinates.

## 8. Natural implementation boundary

The carrier decision is now sufficiently resolved. Do not continue substrate archaeology.

Recommended implementation branch:

`experiment/rep2-single-source-suspension-link`

Base it on:

`9d1ce9217ad9ed255ec30181730d57ab87165b85`

because that exact specimen contains the proven web physics/render/test substrate. Keep the donor-forensics and selection evidence on the separate research branch; refer to their exact SHAs from the experiment receipt rather than merging research history into the implementation lineage.

The first implementation stage should end at a **headless/source-testable physical single-corner suspension link with traceable runtime anchors**, before spending effort on polished manipulation or a donor visual. Once that physical seam is demonstrated, add the minimum visual correspondence path and only then an Owner-facing BUILD interaction.

This ordering is not a generic process gate: it isolates the causal seam exposed by donor-forensics so visual success cannot hide a non-physical mechanism.
