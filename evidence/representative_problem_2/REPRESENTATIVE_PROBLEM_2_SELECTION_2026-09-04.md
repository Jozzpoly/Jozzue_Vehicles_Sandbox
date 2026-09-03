# Nextgen JV — Representative Problem #2 selection

Date: 2026-09-04

Status: **fresh selection after bounded JV_CORE donor-forensics; experiment not yet implemented**

This is not an inherited “R2” from the previous conversation. The selection below is derived from the post-R1 canonical state plus the live donor evidence recorded in:

- `evidence/jv_core/JV_CORE_VISUAL_RIG_FORENSICS_2026-09-04.md`
- `evidence/jv_core/JV_CORE_WHEEL_MOUNT_CORRESPONDENCE_COMPARATOR_2026-09-04.md`

## 1. What the donor changed

The donor does not provide one trustworthy visual/physics rig architecture to reuse.

Instead it demonstrates useful fragments:

- real Blockbench/glTF semantic points can be recovered;
- a rigidly-skinned asset can be decomposed into adaptable render parts;
- authored points can feed physics geometry;
- live physics bodies can drive visual endpoints;

while also demonstrating the failure mode Nextgen JV must avoid:

- visual and physical mechanisms can silently use different bodies/endpoints;
- contract role names and `physicsAuthority` flags do not reliably describe all downstream use;
- the same asset can feed physics in one rig path while its visual model is rendered in another.

The next representative problem should therefore test **one spatial construction state owning both the visible mechanism and the physical mechanism**.

## 2. Candidate comparison

### A. Repair the steering-link correspondence

High mechanical clarity and low implementation cost, but too close to V0/R1. It would largely test another steering endpoint after R1 already established spatial steering geometry → physical linkage → driving consequence.

**Reject as Representative Problem #2.** It remains a useful micro-probe only if a later implementation needs to falsify a narrow transform/correspondence bug.

### B. Full double-wishbone hardpoint authoring

Very representative and information-rich, but too many simultaneous unknowns: multiple arm bodies, hinge axes, spherical joints, steering, damper geometry, visual adaptation and wheel kinematics. It would make a failure hard to diagnose and give the old donor hardpoint model too much prototype gravity.

**Reject for now as too broad.**

### C. Frame / adaptive structural member

Strong for direct construction and adaptation semantics, but a simple tube/member edit has weak immediate driving consequence unless mass, collision or structural mechanics are also introduced. That risks turning visual adaptation into the result rather than vehicle mechanics.

**Defer.**

### D. Wheel/hub offset only

Low cost and directly perceivable, but easy to collapse into a disguised track-width/offset parameter rather than a new class of construction.

**Defer unless the suspension-link carrier proves too large.**

### E. Bounded one-sided suspension link / wheel carrier

One visible load-bearing member connects a chassis-side pivot to a wheel-side endpoint. The same authored geometry can own:

- the physical arm hinge/pivot;
- the physical wheel-end position / suspension arc;
- the visible arm placement/adaptation;
- a simple spring/damper attachment if required for a usable driving carrier;
- a driving consequence through changed wheel path, geometry and load response.

It is mechanically different from R1 steering authoring, exposes visual↔physics correspondence directly, uses spatial construction rather than a disguised scalar, and can stay much smaller than a full wishbone.

**Selected.**

## 3. Representative question

> Can the Owner directly change a small piece of suspension-link spatial geometry and have that exact authored geometry simultaneously define the visible mechanism and the live physical mechanism, with a perceivable consequence during driving and exact BUILD recovery?

This is the question. The experiment is not “build a suspension system” and not “port JV_CORE trailing arm.”

## 4. Minimum causal contract

The first specimen should have one small experiment-owned spatial state. Exact fields remain implementation-dependent, but conceptually it should contain only what the mechanism genuinely needs, such as:

- chassis-side arm pivot;
- wheel-side / hub endpoint;
- only the minimum damper endpoints needed to make the carrier dynamically usable.

The critical rule is more important than the exact schema:

> **visual placement and physics construction must consume the same authored state; there must not be a parallel hidden visual endpoint table and a separate physical hardpoint table describing the same mechanism.**

A change to the selected editable point must propagate through this one path:

`authored spatial state → physical arm/joint geometry → wheel motion/contact → driving response`

and, from the same state:

`authored spatial state → visible arm/damper geometry`

The visual mechanism observes/represents the physical construction; it must not be a mechanically different reconstruction that merely follows nearby bodies.

## 5. Deliberate non-goals

Do not add merely because they are attractive:

- a full suspension editor;
- full double wishbone;
- final hardpoint ontology;
- final adaptive-component semantics;
- generic gizmos/snap/grid/numeric system;
- final rigging format;
- `.bbmodel` runtime authority;
- final component/data model;
- suspension tuning breadth;
- body/frame construction;
- damage/deformation;
- replay/ghost infrastructure.

The current donor contract types and names are evidence, not the Nextgen schema.

## 6. Asset posture

Use real donor visual capital early enough to expose correspondence problems, but do not force an old whole rig into the specimen.

Preferred order:

1. reuse the real wheel visual where practical;
2. inspect whether one mechanically meaningful rigid part from `One_Sided_wheel_mount.gltf` or another donor asset can honestly represent the selected link;
3. if not, use the smallest new Blockbench-derived link asset necessary rather than creating a growing placeholder-asset subsystem inside JV.

The asset is allowed to be disposable. Its role is to make the mechanism recognizable and to test real import/placement constraints.

## 7. Validation contract

Machine evidence should establish only claims it can actually prove:

- one authored state is the source consumed by both visual and physics construction paths;
- moving the editable point changes the physical hinge/geometry, not only a render transform;
- visual endpoints remain coincident with the physical endpoints within a defined tolerance;
- the suspension remains a real constraint/body mechanism during PLAY;
- asymmetric edits are not silently mirrored or normalized;
- BUILD → PLAY/DRIVE → BUILD recovers the exact authored state;
- degenerate/extreme geometry is diagnosed and remains runnable unless it threatens program integrity.

A useful falsifier should compare two geometries that cannot be reduced to the same scalar length — for example equal arm length with different pivot direction/height — so a hidden one-dimensional mapping cannot accidentally satisfy the test.

Owner hands-on is then needed for the claims machine evidence cannot establish:

- whether the edited point/part is discoverable and understandable;
- whether the visible mechanism reads as the thing causing the behavior;
- whether the driving consequence is perceptible/useful;
- whether BUILD → DRIVE → BUILD feels like meaningful construction rather than tuning a hidden parameter.

## 8. Stop condition

Stop the experiment when either:

1. one spatial suspension-link edit has demonstrated the shared causal path through visible mechanism + physical mechanism + driving consequence + exact recovery; or
2. the representation fails in a way that answers the research question.

Do not polish the carrier after that merely because it became fun or visually promising.

## 9. Immediate next bounded action

Before implementation, perform a **small carrier/substrate feasibility audit** only for this selected problem:

- determine the cheapest existing drivable research carrier that can accept one physical suspension-link DOF without inheriting unrelated old architecture;
- check whether R1/V0 web carrier reuse is genuinely cheaper than extracting a tiny mechanism into a new specimen;
- inspect the minimum real asset fragment needed for readable link/wheel correspondence;
- define the smallest machine preflight that can prove the causal path before spending Owner attention.

Stop that audit as soon as one carrier choice is clearly sufficient. Do not reopen a broad engine/substrate selection.
