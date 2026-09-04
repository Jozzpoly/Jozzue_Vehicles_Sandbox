# Rep2 causal-correspondence readiness gate — 2026-09-04

Status: **READY TO DESIGN C1 / NOT YET A PRODUCT OR ARCHITECTURE PASS**

This receipt records the readiness audit performed after Owner confirmation of the central Nextgen JV rule:

> When JV presents a component as mechanically causal, its visible attachment/motion path should correspond to the same real mechanical relation that produces the vehicle behaviour. Cosmetic detail may be visual-only, but a second nearby visual mechanism must not stand in for a different hidden physical mechanism.

This is an Owner product-intent judgement. The rest of this receipt narrows its technical meaning and checks whether the current evidence base is sufficient to continue without smuggling historical JV_CORE semantics into Nextgen.

## 1. Live state reverified

Canonical `main` remains unchanged at:

`ad75ca9ea7436548f901bf6c11e69cd5e465379e`

No Rep2 experimental implementation has been promoted to `main`.

Current research branch before this receipt:

`research/jv-core-visual-rig-forensics@67b76d10ccc31dd053372c8a87183c38a0fa10a0`

The Rep2 physics qualification is intentionally fragmented across bounded experimental branches and must therefore be cited by exact branch/SHA rather than inferred from `experiment/rep2-coilover-force-path` alone.

### C0a — causal force-path seam

- branch head: `experiment/rep2-coilover-force-path@fa372932e92ceaae3767da24e5045552749bc73a`
- accepted C0a specimen: `30ee3a5ddf2c7dd3589d953ab0024fe42b965f92`
- result: same physical `k/c/restLength` plus different attachment geometry changes real restoring moment/body response; equal-and-opposite force path at exact live eyes; no wheel target or hidden wheel-rate compensation.

### C0b — direct-force numerical qualification

- branch: `experiment/rep2-c0b-numerical-qualification`
- branch head: `0213994430ac7915409a3b964045d816caf5313c`
- accepted specimen: `e2976c1618363830e17cfb34fd482d0e8250c3f3`
- workflow run: `33870297080`
- live workflow conclusion: `success`
- result: externally evaluated state-dependent spring force held stale across `World_Step(1/60,4)` internal substeps can inject severe artificial spring energy; explicit fine refresh is credible in the bounded bench. Therefore the direct-force C0 implementation must not be carried naively into a normal vehicle loop.

### C0c — solver-native physical `k/c` mapping

- branch: `experiment/rep2-c0c-solver-native-kc`
- branch head: `ca69ccabd6a9d2df6ec1874c46a38d0b1f0d3230`
- accepted specimen: `2da7ff61219e20afd49d2be7ac7520645625a186`
- workflow run: `33875428047`
- live workflow conclusion: `success`
- result: for the bounded linear `k > 0` spring / combined linear spring+damper case, a native Box3D distance spring can preserve authored physical `k`, `c`, `restLength` and real attachment geometry when solver Hertz/damping ratio are derived internally from the distance constraint's axial effective mass.
- bounded force-law NRMSE: mean ~2.934%, worst ~3.834% for the accepted axial mapping.
- fixed Hertz and generalized-mechanism-mass mappings were strongly falsified as physical component authority under mass/leverage mutation.
- independent pure damping (`k=0, c>0`) remains unresolved.

The earlier appearance of a provenance contradiction was caused by checking only the older C0a branch. C0b and C0c do exist on their own named branches. The lesson is still important: future cross-stage receipts should cite these exact branches/SHA so demonstrated state does not depend on conversational memory.

## 2. Refined rule: one mechanical authority, not `visual mesh == solver constraint`

The Owner rule must not be interpreted as a naive requirement that every rendered polygon literally be solver geometry or that one visible component must map one-to-one onto one Box3D joint object.

The stronger and more useful experimental rule is:

> **One presented mechanical relation has one authority truth. Physics and visible representation must be downstream projections of that same authored/live relation, not independently authored nearby mechanisms.**

For the C1 coilover relation, the provisional authority state is:

- body A identity;
- body B identity;
- attachment eye A in body-A local coordinates;
- attachment eye B in body-B local coordinates;
- physical constitutive state (`k`, `c`, `restLength`) for the bounded linear specimen.

At runtime this authority produces:

1. the exact live world eye positions and relative axial state;
2. the physical spring/damper constraint/force path;
3. the visible adaptive damper placement.

The visual path must not own an alternative runtime endpoint pair, visual suspension trajectory, independently baked rest mechanism or caller-provided socket table that can diverge from the physical relation.

## 3. What visual freedom remains legitimate

Single authority does **not** forbid useful visual abstraction.

Allowed in principle for this experiment:

- housing thickness and cosmetic geometry around the force axis;
- a spring coil or shock body whose visible surface is offset from its mathematical axis because the model has radius/thickness;
- LOD or simplified geometry;
- rigid upper/lower housings plus a telescoping/stretch section;
- one visible packaged coilover representing several physical sub-relations (spring, damper, travel stop) if those relations intentionally share the same attachment relationship;
- derived solver parameters invisible to the Owner, provided they are deterministically derived from authored physical state and do not silently preserve a target vehicle outcome.

Not allowed for the causal claim:

- separate visual attachment sockets that choose different live endpoints;
- a visual lower eye on a lower arm while the physical force attaches to a knuckle, unless the product explicitly presents those as different mechanisms;
- a visible steering rod to the rack centre while the real tie rod attaches at the rack end;
- a rest-pose or skeleton bake that becomes a second kinematic authority during motion;
- outcome-preserving retuning that changes component physical properties after a geometry edit without explicit authored intent/provenance.

The distinction is **semantic/mechanical correspondence**, not pixel identity.

## 4. Historical falsifier now understood precisely

Exact JV_CORE source plus rendered evidence established that the historical failure was not merely poor placement.

Examples:

- physical wishbone coilover: chassis ↔ knuckle physical hardpoints;
- steering-rig visible damper: chassis ↔ lower-arm/procedural visual path;
- physical tie rod: rack end `±rackHalfWidth` ↔ steering-arm hardpoint;
- visible steering rod: rack centre ↔ knuckle visual path;
- visual upper arm could be driven from the physical lower-arm frame despite a separate physical upper arm.

Old-mount isolated renders at two settled preload states additionally show the physical coilover diagnostic axis diverging from both large visible dampers.

This is sufficient to define the historical failure class as **parallel mechanical truths**.

Do not continue broad JV_CORE archaeology without a new concrete falsifier.

## 5. Real donor asset reuse boundary

The actual shock visual is the separate Blockbench asset:

`Jozzpoly/Box3d_FunProject@241fe10a9056836332c21d9614471d32d749ce3d`

`assets/source/Asset_Dumper.gltf`

The glTF is self-contained: Blockbench-exported JSON with an embedded binary buffer and authored nodes including:

- `Part_Upper`
- `Part_Stretch`
- `Part_Lower`

Therefore C1 does not need the old M6 runtime, old suspension-rig skeleton, external `.bin`, or old visual endpoint contract in order to use the real donor form.

Reusable donor capital:

- the real authored visual asset;
- its upper/stretch/lower internal partition;
- the narrow adaptive idea: rigid end pieces pinned to the two live relation endpoints, extensible middle section filling the live span.

Not reusable as authority:

- old visual sockets/endpoints;
- old body/frame assignments;
- old full-rig skeleton semantics;
- old target-wheel-response compensation.

`.gltf`, its skeleton and the adapter used by C1 remain experiment implementation details, not final runtime contracts.

## 6. Existing Stage B is apparatus donor only

Frozen branch:

`experiment/rep2-single-source-suspension-link@bb77b6035f49d88a5882aab3e2e6f0410f25ca84`

Its `visual-correspondence.ts` and browser gate contain useful measurement grammar:

- reconstruct visible segment endpoints from the actual Three.js transform;
- compare them numerically against live Box3D trace points;
- repeat after physical motion, not only at rest;
- run materially different authored geometry without projection-side variant tables.

But Stage B intentionally uses diagnostic primitives/unit segments. It cannot satisfy C1's real-asset question by itself.

Reuse the measurement discipline, not the primitive as the result.

## 7. Why coilover-mount remains the best Rep2 after falsification

The candidate was reconsidered after Owner confirmation rather than accepted from momentum.

### Rigid suspension link

Stage A already demonstrates substantial rigid-link geometry → real joint/body consequence. Another rigid-link Owner test has reduced information gain.

### Rotational driveline/cardan

Novel and attractive, but it opens torque source/transmission/differential questions before the visual/physical authority rule is qualified on a simpler relation. Higher blast radius.

### Structural/adaptive member

High builder relevance, but unless structural load/mass/collision is modeled deeply enough, visual adaptation can become the apparent result rather than causal mechanics.

### Wheel/hub offset

Bounded but risks collapsing to a scalar/tuning experiment.

### Compliant coilover force path

Still has the best current separation power because it combines:

- a new relation class beyond R1/Stage-A kinematics;
- direct spatial leverage and line-of-action consequences;
- physical component invariants versus derived vehicle behavior;
- a real Blockbench adaptive component;
- the historical parallel-truth failure class;
- an eventual short BUILD → DRIVE → BUILD loop.

Therefore the preferred Rep2 remains **direct spatial coilover-mount authoring**.

## 8. C1 must be smaller than a suspension corner

Readiness for C1 does **not** mean readiness for a full vehicle suspension.

The next experiment should remain a correspondence bench around the already-qualified compliant relation.

Minimum C1 question:

> Can the real `Asset_Dumper.gltf` be adapted from the exact same two live mechanical eyes that own a qualified physical spring/damper relation, such that changing authored eye geometry or allowing the bodies to move cannot create a second visual endpoint truth?

C1 should not yet ask whether the car feels softer, whether the damper model is production quality, or whether the builder UX is fun.

## 9. C1 required falsifiers

A C1 PASS must require all of the following, not screenshot plausibility:

1. **Real asset** — load the actual `Asset_Dumper.gltf`, not a procedural substitute.
2. **No visual endpoint table** — the runtime visual adapter accepts the two live mechanical eyes (or a single relation trace containing them), not independent visual sockets.
3. **Rest correspondence** — mechanically meaningful visual attachment references align with the two physical eyes at rest within explicit tolerance.
4. **Dynamic correspondence** — repeat after real physical motion/articulation.
5. **Geometry mutation** — change only an authored attachment point; both physical relation and visual assembly follow without projection-side variant data.
6. **Body-pose mutation** — rotate/translate the owning bodies; correspondence survives because endpoints are recomputed from body-local authored eyes.
7. **Causal non-interference** — changing purely cosmetic visual adaptation parameters cannot alter physics.
8. **Physical invariance** — geometry mutation does not silently change authored `k/c/restLength`.
9. **Negative-control anti-pattern** — an intentionally separate visual endpoint pair should be detectable by the same measurement apparatus, demonstrating that the test can actually fail.
10. **No full-rig inheritance** — importing historical M6 frame/socket semantics to make the asset fit is a C1 failure, not a shortcut.

Rendered/browser evidence should accompany machine endpoint errors because this is partly a recognizability/correspondence claim, but pixel appearance alone cannot grant PASS.

## 10. What remains explicitly unknown

Even after C1, the following remain open:

- final component/data model;
- whether a coilover is one component or a package of spring/damper/stop relations;
- nonlinear spring curves;
- asymmetric/nonlinear damper curves and pure-damper representation;
- bump/rebound stops;
- installed preload/perch semantics;
- final solver/substrate choice;
- adaptive-component intent locks;
- generic relationship framework;
- full suspension topology;
- whole-vehicle handling/feel;
- performance implications of many adaptive components;
- authoring UX and discoverability.

C1 must not solve these by accident.

## 11. Readiness verdict

**READY to design and then implement a bounded C1 real-damper correspondence bench.**

This readiness is earned because:

- the Owner has confirmed the mechanical-readability rule;
- the historical failure class is source- and render-grounded;
- C0a established the causal spatial force path;
- C0b exposed and bounded the stale external-force numerical trap;
- C0c established a credible solver-native realization for the bounded `k>0` case without making Hertz component truth;
- the real donor asset is separable from historical rig semantics;
- a correspondence measurement grammar already exists and can be reused without promoting its placeholder visual.

This verdict does **not** authorize C2 vehicle integration, C3 Owner feel judgement, generic architecture, or merge to `main`.

## 12. Best next bounded move

Create a fresh C1 experimental lineage from the strongest qualified physics substrate, while copying only the minimum proven apparatus needed from Stage B and importing the real donor asset clean-room.

The first C1 implementation should stop once real-asset static/dynamic/mutated correspondence and anti-parallel-truth falsifiers are machine- and browser-demonstrated.

Only then decide whether the next information gain is a symmetric vehicle carrier or a correction to the relation/asset semantics.