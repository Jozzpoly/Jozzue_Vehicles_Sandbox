# Nextgen Jozz Vehicle — Current State

Date: 2026-09-05

This is the canonical high-level technical/research state for Nextgen Jozz Vehicle. Live source/runtime, exact experiment refs, reproducible evidence and current Owner judgement override this summary when they disagree.

## 1. Executive state

Closed research layers:

- **E1 — construction-loop research:** CLOSED; central sufficiency hypothesis unresolved.
- **V0 — drivable physical steering consequence:** CLOSED with technical PASS and Owner readability PASS for bounded research-carrier reuse only.
- **R1 — direct spatial steering construction consequence:** CLOSED with bounded positive Owner-backed causal-construction evidence; current authoring surface is not product-accepted.
- **Rep2 — donor/force/correspondence line:** donor forensics, Stage A, C0a/C0b/C0c and C1 are bounded evidence. C1 is **CLOSED — BOUNDED TECHNICAL PASS** with no Owner/product/vehicle/architecture PASS.

A fresh post-C1 reselection has now been completed.

**Selected next representative problem: Rep3 — geometry-derived hinge line.**

Rep3 asks whether recognizable physical mounting geometry can itself define the real hinge relation:

`two physical mounts → derived hinge line → native revolute relation → live arm / wheel-endpoint motion`

rather than requiring a separately authored hidden solver axis.

Rep3 Stage P, the pinned-substrate feasibility gate, has passed on Linux CI. The current frontier is therefore **Rep3 Stage A — causal geometry-derived relation gate**.

No experiment defines final JV architecture.

## 2. Canonical and active refs

Canonical default branch after post-C1 docs canonicalization:

`main@9df1833c26955e8b0a3d2017ea14c154891adbd6`

Rep2 C1 closure:

- closure branch: `codex/nextgen-jv-live-frontier@d83308dd36559c7357c4ebfb62ccbaed444f4001`
- accepted implementation: `8c7cb1515577f0c885e576266ad10997e69b26e7`
- receipt: `evidence/rep2/REP2_C1_CAUSAL_DAMPER_CORRESPONDENCE_RECEIPT_2026-09-05.md` on that lineage

Active Rep3 research branch:

`experiment/rep3-geometry-derived-hinge-line@122ff50822dd0e3dade9f9ec2ec108c3e6e7185d`

Rep3 pre-verdict contract:

`evidence/rep3/REP3_GEOMETRY_DERIVED_HINGE_LINE_CONTRACT_2026-09-05.md`

Contract commit:

`989b50e8843daa015d669e0a02b8907afccbd7a2`

Stage P workflow/run:

- workflow: `Rep3 Hinge Line Stage P`
- run: `33956208177`
- exact head: `122ff50822dd0e3dade9f9ec2ec108c3e6e7185d`
- job: `101279905241`
- artifact: `9966443775`
- artifact digest: `sha256:14008e9bd18b225844ac8cb9bef2824359ed0a700d538b967b90d8267e882dc8`

Preserve experimental implementation on its named branch. Do not merge it into `main` merely because it is current.

## 3. Durable evidence inherited from earlier work

### E1

Portable evidence:

- authored edit → causal PLAY → exact BUILD recovery can have bounded value;
- preserving already placed intent can reduce operation burden;
- technical reachability does not establish a natural construction grammar;
- presentation/identity confounds can invalidate an otherwise functioning apparatus.

### V0

V0 established a bounded physical steering chain:

`input → physical rack → fixed-length tie-rods → steering knuckles/wheels → contact → trajectory`

Owner hands-on established that the primitive carrier was readable enough to reuse for bounded research, not that it was a good vehicle/product.

### R1

R1 established bounded positive evidence that direct spatial authoring can causally change steering/driving behavior and participate in repeated BUILD → DRIVE → BUILD experimentation.

It also established a validation warning:

> privileged automation reachability is not evidence of human affordance discoverability.

### Rep2 donor forensics / Stage A / C0 / C1

Important retained conclusions:

- real Blockbench/glTF donors can be reused without inheriting historical rig authority;
- historical JV_CORE showed concrete visual/physical authority divergence, so plausible animation is not proof of causal correspondence;
- Stage A established authored pivot/endpoint geometry → real arm/hinge → wheel endpoint/path/contact, but did not author hinge-axis orientation;
- C0a established physical component properties + installation geometry → real leverage/body response;
- C0b falsified one stale external-force substep path;
- C0c qualified a bounded native `k/c/restLength + eyes` mapping for `k>0` linear spring / combined spring+damper using axial effective mass;
- C1 established a bounded single-authority chain from mechanical relation to native Box3D spring and exact real donor visual projection.

C1 strengthened this durable product constraint:

> **One presented mechanical relation has one authority truth. Physics and visible representation are downstream projections of that same relation.**

This is not `render mesh == solver geometry`; it rejects a second live visual mechanical story around a different hidden physical relation.

## 4. Rep3 selection decision

Fresh reselection compared at least these classes:

- minimal drivable C1-class carrier;
- another adaptive real component;
- Cardan/driveline;
- geometry-derived hinge/axis authoring.

### Why not the drivable carrier yet

It is product-close but currently high blast radius: compliant suspension would entangle contact, ride, steering, drive, chassis motion and presentation. A negative Owner result would be hard to localize.

### Why not Cardan yet

Historical recovery found `Cardan_shaft.gltf` as a real visual donor but no recovered causal drivetrain path using it. Historical M5 drive authority lives in wheel-joint spin motors. Selecting Cardan now would require simultaneous invention of transmission authority, phase/orientation semantics and adaptive visual behavior.

### Why Rep3

Stage A already exposed the exact missing semantic: pivot/endpoint geometry was authored, but revolute local frames remained identity-oriented. Rep3 therefore tests a materially new construction class at low blast radius:

> **Can the geometry of a recognizable mechanism define the constraint itself?**

This tests geometry-first viability without deciding final G/A/H architecture:

- G: geometry-first relation;
- A: explicit abstract-axis-first relation;
- H: hybrid/default inference + explicit correction/lock where needed.

## 5. Rep3 Stage P — CLOSED bounded substrate PASS

Stage P only asked whether pinned `box3d.js@0.0.2` can honestly express and independently read back a materially non-default 3D revolute axis.

Linux CI on exact `122ff508…` passed:

- inherited + Rep3 source tests: **72/72 PASS**;
- production TypeScript/Vite build: PASS;
- exact machine evidence artifact emitted.

The normal world-Z case and a materially tilted axis `normalize(0,1,1)` both produced real native revolute motion around the requested line.

Selected artifact measurements:

- baseline native axis alignment error: `0`;
- tilted native axis A alignment error: `4.44e-16`;
- tilted native axis B alignment error: `2.18e-10`;
- tilted native pivot separation: `9.06e-6 m`;
- tilted max axial-coordinate drift: `2.02e-5 m`;
- tilted max radial-distance drift: `6.91e-6 m`;
- tilted max angular-velocity off-axis: `4.15e-4`;
- final endpoint separation between world-Z and tilted-axis runs: `0.1943048064 m`.

Claim boundary remains narrow:

> pinned browser substrate feasibility only.

Stage P does **not** prove Stage A authority semantics, rendered/Owner readability, product value, vehicle behavior or architecture.

## 6. Current frontier — Rep3 Stage A

Do **not** redo reselection or Stage P unless new evidence contradicts them.

The next bounded task is Stage A from the frozen pre-verdict contract.

Normal authority path must contain physical mount geometry, not a separately authored hinge axis:

- `mountAWorld`;
- `mountBWorld`;
- fixed apparatus/body geometry needed for execution;
- no editable `axis`, Euler angle, solver quaternion or second visual hinge line.

Derived relation:

- `pivot = midpoint(mountA, mountB)`;
- `axisLine = line(mountA, mountB)`;
- native revolute local-frame Z directions derive from that line.

Required Stage A evidence:

1. **A1 native authority correspondence** — live joint bodies, pivot and world axis read back from the actual native joint and correspond to derived geometry.
2. **A2 materially different mount direction changes real motion** — same midpoint/arm/start/load, different hinge-line directions → materially different live endpoint path/motion plane.
3. **A3 line-preserving spacing metamorphism** — same midpoint/axis direction but different bearing spacing remains kinematically equivalent in this ideal rigid-hinge apparatus.
4. **A4 endpoint-order metamorphism** — swapping mount labels must not change free unlimited hinge trajectory.
5. **A5 singularity handling** — coincident/near-coincident/non-finite mount pairs reject explicitly rather than inventing fallback authority.

Only after Stage A is technically clean should Rep3 proceed to a minimal real-browser Owner-facing Stage B.

## 7. Rep3 Stage B boundary

Stage B is intentionally small and Owner-facing only after machine preflight.

It should present a recognizable support + two clearly visible physical mount/bearing handles + rigid arm + wheel/spindle endpoint, with direct 3D translation and a short BUILD → PLAY → BUILD loop.

The key Owner questions are whether the two mounts visibly/readably define how the arm can rotate, whether moving them intentionally changes the motion plane, and whether this feels like building/repositioning a mechanism rather than configuring a solver axis.

Natural STOP: first honest Stage B Owner verdict.

Do not grow Rep3 into a full wishbone, coilover integration, tire/contact system, drivable vehicle or generic builder.

## 8. Strong product constraints to protect

- short loop: `build → run → observe → improve → get in and drive`;
- real authored mechanics should own presented consequences;
- visible causal mechanisms should project the same live mechanical authority;
- direct spatial construction where mechanically appropriate;
- permissive diagnosis rather than paternalistic blocking where program integrity permits;
- physical component semantics before hidden outcome-preserving retuning;
- real assets early enough to avoid placeholder-product gravity;
- Owner hands-on remains authority for feel/readability/value; telemetry does not substitute for it.

## 9. Important open questions

Still unresolved:

- whether geometry-first, axis-first or hybrid relation authoring generalizes beyond Rep3;
- final builder grammar;
- final component/reference/data model;
- final adaptive-component/intent-lock semantics;
- hinge limits/motors/zero-angle/bushing semantics;
- pure damping and large-travel spring remapping;
- full suspension topology;
- tire/contact and drivetrain/transmission models;
- final renderer/physics/runtime/asset pipeline;
- product-level vehicle feel and handling.

Do not turn these unknowns into architecture for planning convenience.

## 10. Execution routing

Browser ChatGPT is currently the primary JV research/execution surface.

The Owner is temporarily reserving Codex/Work for separate experiments with newly available AI. Do not make JV progress depend on Codex or hand routine work to it by default until that routing changes.

Use Browser ChatGPT + GitHub/web/runtime capabilities directly where sufficient. Ask the Owner for the smallest possible local/manual action only at a genuine capability boundary.
