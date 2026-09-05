# Rep3 — Geometry-Derived Hinge Line

Date: 2026-09-05

Status: **PRE-VERDICT EXPERIMENT CONTRACT**

Experiment branch:

`experiment/rep3-geometry-derived-hinge-line`

Substrate/provenance base:

`codex/nextgen-jv-live-frontier@d83308dd36559c7357c4ebfb62ccbaed444f4001`

Canonical project truth at selection time:

`main@9df1833c26955e8b0a3d2017ea14c154891adbd6`

The branch inherits C1/Stage-A/V0 code and `box3d.js@0.0.2` only as convenient validated research substrate. That inherited implementation has no architecture authority over Rep3.

## 1. Selection decision

Fresh post-C1 reselection compared four candidate classes.

### Minimal drivable C1-class carrier

High product proximity, but currently high causal blast radius. Adding compliant suspension geometry to the primitive carrier would entangle ride/contact, steering, drive, chassis motion and presentation. A bad or ambiguous Owner result could therefore be difficult to diagnose.

### Another adaptive real component

Potentially useful, but a point-to-point component could mostly repeat the adaptation/correspondence class already tested by C1 unless it introduces a materially different mechanical relation.

### Cardan / driveline

Historical source recovery found `Cardan_shaft.gltf` as a real asset donor but did not recover a causal drivetrain path using it. The historical M5 vehicle applies drive through wheel-joint spin motors, and the inspected M5/M6 runtime contains no `Cardan`/`shaft` integration. Selecting Cardan now would therefore require simultaneous invention of transmission authority, orientation/phase semantics and visual adaptation.

### Geometry-derived hinge line — SELECTED

Stage A already established direct authored pivot/endpoint geometry driving a real arm/hinge/wheel path, but its revolute frames were identity-oriented: the axis/DOF was not spatially authored. This leaves a compact and materially new product question.

Rep3 is selected because it can test a new construction class — **geometry that defines a mechanical relation**, not merely geometry that parameterizes a relation whose orientation is hidden — with much lower blast radius than a full vehicle carrier.

## 2. Central unknown

Can a mechanically recognizable pair of spatial chassis-side bearing/mount points be sufficient authoring authority for a real one-DOF hinge relation, such that:

`two physical mounts → derived hinge line → native revolute relation → live arm/wheel-endpoint motion`

without an independently authored hidden solver axis?

And, after the technical seam is proven, does directly moving those physical mounts read to the Owner as **building/repositioning a mechanism** rather than configuring an abstract solver parameter?

## 3. Competing interpretations this experiment must separate

### G — geometry-first relation

The Owner authors the real mounting geometry. The hinge line/DOF is derived from that geometry. Solver frames and visible causal representation are downstream projections.

### A — abstract-axis-first relation

The real mechanical authority is an explicit axis/frame parameter; visible mount geometry is secondary decoration or must separately follow it.

### H — hybrid relation

Physical mount geometry provides a strong default/inference, but an explicit axis/frame correction or intent lock is sometimes necessary.

Rep3 does **not** select G/A/H as final architecture. It tests whether G is technically and experientially viable enough to deserve broader use and where its ambiguity begins.

## 4. Representative apparatus

Use a small recognizable suspension-arm/bearing assembly, not a naked mathematical hinge:

- one fixed chassis-like support;
- two visible chassis-side bearing/mount points, `mountA` and `mountB`;
- one rigid arm body attached at the midpoint of those mounts;
- one clearly visible wheel/spindle endpoint on the arm;
- a repeatable external load/impulse for machine tests;
- later, a minimal BUILD/PLAY presentation if the machine seam passes.

The two mount points are the only authored source of hinge-line orientation in the normal apparatus.

Derived relation:

- `pivot = midpoint(mountA, mountB)`;
- `axisLine = line(mountA, mountB)`;
- native revolute local-frame Z axes must be derived from that same line;
- visible bearing line / arm motion must project the same live relation.

No editable `axis`, Euler angle, solver quaternion or second visual hinge line is allowed in the normal authority path.

## 5. Stage P — pinned-substrate feasibility gate

Before building an Owner-facing apparatus, prove the pinned browser substrate can honestly express the relation.

Pinned dependency inherited from the C1 lineage:

`box3d.js@0.0.2`

Required probe:

1. create a real 3D native revolute joint with a materially non-world-Z axis using `base.localFrameA.q` and `base.localFrameB.q`;
2. read the native local frames back from the live joint;
3. transform each native local-frame Z direction into world space and show that it is collinear with the requested hinge line within numerical tolerance;
4. apply a controlled off-axis impulse/load and show that live body motion is constrained to rotation about that non-default axis;
5. repeat for at least one materially different axis.

PASS means only: the pinned web substrate can represent and independently read back the required 3D hinge relation.

FAIL/BLOCKED means stop and classify the substrate boundary before designing UI. Do not emulate a 3D hinge with decorative Three.js motion.

## 6. Stage A — causal geometry-derived relation gate

If Stage P passes, build the smallest actual Rep3 authority path.

Normal authority record contains at minimum:

- `mountAWorld`;
- `mountBWorld`;
- fixed arm/spindle geometry needed by the apparatus;
- body identity / mechanical constants needed to execute the test.

It must **not** contain a separately authored hinge-axis field.

Required evidence:

### A1 — native authority correspondence

For every accepted state:

- native joint bodies are the intended support and arm bodies;
- native pivot equals the midpoint-derived pivot within tolerance;
- native world hinge axis is collinear with `mountB - mountA` within tolerance;
- the native relation is read back from the live joint, not trusted from setup self-report.

### A2 — materially different mount direction changes real motion

Use two mount pairs with:

- the same midpoint;
- the same arm geometry and starting endpoint;
- the same body properties;
- the same load/impulse;
- materially different hinge-line direction.

The live endpoint path/motion plane must differ materially and in the direction predicted by the two derived hinge lines.

A telemetry difference without real body/path separation is not a PASS.

### A3 — line-preserving spacing metamorphism

Use two mount pairs with:

- the same midpoint;
- the same hinge-line direction;
- materially different distance between the two bearing points.

For this **ideal rigid-hinge apparatus**, the kinematic DOF and resulting endpoint trajectory under the same initial state/load should remain equivalent within numerical tolerance.

This is experiment-local evidence that mount spacing is not secretly being used as an axis/stiffness control. It is **not** a claim that bearing spacing has no structural/stiffness consequences in a real vehicle.

### A4 — endpoint-order metamorphism

Swap `mountA` and `mountB` without changing their world positions.

For the free, unmotorized, unlimited hinge used in this gate, physical endpoint trajectory should remain equivalent. Joint-angle sign/frame gauge may differ and is not product semantics here.

This prevents accidental point ordering from becoming hidden mechanical authority.

### A5 — singularity handling

Coincident / near-coincident / non-finite mount pairs must reject explicitly rather than inventing a fallback axis.

## 7. Frame-roll / quaternion boundary

Box3D revolute mechanics use the local-frame Z direction as hinge axis. A full quaternion also contains a roll/gauge choice around that axis.

Rep3 must not accidentally promote that gauge into authored product semantics.

For the unlimited, unsprung, unmotorized Stage P/A hinge:

- derive any required orthonormal frame deterministically from the hinge line;
- treat rotation around the hinge axis used only to complete the solver frame as internal representation;
- do not expose it as a Builder property;
- do not claim this resolves future zero-angle, joint-limit, bushing-anisotropy or motor phase semantics.

Those become new questions only if a representative mechanism actually needs them.

## 8. Stage B — minimal Owner-facing BUILD/PLAY gate

Only if Stage P/A are technically clean.

The smallest useful presentation should contain:

- a readable chassis/support;
- two large, clearly visible physical mount/bearing handles;
- the arm and its wheel/spindle endpoint;
- the visible line/structure implied by the mounts, without a separate editable axis gizmo;
- direct spatial translation of each mount using a normal 3D manipulation affordance (for example a translate gizmo), not only sliders;
- reset / play-pause or equivalent short BUILD → PLAY → BUILD round trip;
- enough camera control to understand the 3D relation;
- optional exact numeric readout/editing only if cheap and non-confounding.

Avoid repeating R1's discoverability failure: actionable mount handles must be visible/acquirable without privileged automation coordinates.

The apparatus may use simple geometry if that keeps the relation legible. This is not permission to establish a parallel placeholder asset system.

## 9. Owner questions

The Owner checkpoint should answer perceptual/product questions, not re-run machine validation:

1. Without relying on telemetry, is it visually understandable that the two mount locations define how the arm can rotate?
2. Can the Owner intentionally change the motion plane by moving the physical mounts and roughly predict the consequence?
3. Does this feel more like repositioning/building a real mechanism than configuring an abstract hinge-axis parameter?
4. Is the BUILD → PLAY → BUILD correction loop readable and worth continuing?
5. What feels awkward or missing: physical mount semantics, manipulation, camera/readability, or the inferred relation itself?

A negative Owner result is useful evidence. Do not redesign the whole builder inside the checkpoint merely to obtain a PASS.

## 10. Validation requirements

Use evidence matched to the claim:

- source/authority inspection: prove no hidden editable axis path;
- native joint readback: prove actual solver frames/pivot/axis;
- deterministic machine tests: metamorphisms and path differences;
- real Chromium render/interactions: prove the visible/runtime apparatus actually behaves as reported;
- screenshot/video inspection: guard against telemetry-only success or hidden/occluded handles;
- Owner hands-on: only for readability/naturalness/value claims.

Before asking for Owner time, remove obvious machine failures and presentation confounds.

## 11. PASS / FAIL / STOP boundaries

### Stage P PASS

Pinned `box3d.js@0.0.2` honestly supports/readbacks materially non-default 3D hinge frames.

### Stage A PASS

Two physical mounts are the sole spatial hinge-line authority; native solver readback corresponds; geometry mutations cause the expected real path changes; line-preserving metamorphisms behave as specified; singular states reject.

### Stage B bounded positive result

Owner can understand and deliberately manipulate the physical mounting geometry to change arm motion, and the interaction reads as mechanically causal construction enough to justify broader testing.

### Negative result

Close the experiment with the failure class identified: substrate, authority semantics, geometry ambiguity, interaction/readability or product value.

### Natural STOP

Stop after the first honest Stage B Owner verdict. Do **not** grow this apparatus into a wishbone corner, coilover integration, tire/contact model, drivable vehicle or generic builder during Rep3.

## 12. Explicit non-scope / non-claims

Rep3 does not establish:

- final builder grammar;
- final component/reference/data model;
- final definition of hinge/constraint entities;
- bushing compliance or bearing structural stiffness;
- joint limits, motors, zero-angle authoring or rotational springs;
- final intent-lock semantics;
- full wishbone/multilink suspension;
- spring/damper integration;
- wheel/tire/contact behavior;
- vehicle handling or driving feel;
- Cardan/driveline semantics;
- final asset pipeline or need for a real donor in this apparatus;
- final renderer/physics/runtime architecture;
- architecture authority for `box3d.js`, Three.js, C1 or inherited test code.

## 13. Why this experiment matters if it succeeds

R1 showed that moving a spatial pickup can causally change steering/driving behavior.

C1 showed that a visible mechanical component and real physical relation can share one live authority truth.

Rep3 asks a different and deeper construction question:

> Can the **shape/placement of the mechanism itself define the constraint**, instead of the Builder asking the Owner to configure the solver relation separately?

A positive result would still be bounded, but it would move Nextgen JV one step away from configuration and toward direct spatial mechanical construction.
