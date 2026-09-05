# Rep2 — canonical research closure index

Date: 2026-09-05

Status: **CANONICAL INDEX OF BOUNDED EVIDENCE**

This file records what the Rep2 donor-forensics / suspension-link / spring-damper line established without promoting its experimental implementation into `main`.

It is an index and scoped interpretation layer. Exact implementation, tests, measurements and receipts remain on their preserved research branches.

## 1. Why this line existed

R1 established bounded Owner-backed evidence that direct spatial steering geometry can remain on a real causal path to changed driving behavior. It did not establish a general builder grammar.

Before selecting a materially different representative problem, the project performed bounded JV_CORE donor forensics because historical visual rigging and mechanical authority were known to be unreliable and could otherwise contaminate the next experiment.

The result was not donor adoption. It was recovery of useful donor capital, negative evidence and a narrower causal-correspondence question.

## 2. Donor / visual-rig forensics

Preserved branch:

`research/jv-core-visual-rig-forensics@b7539e4b8f361609d3dc9fd1f2f60491dab6512c`

Historical donor repository / specimen:

`Jozzpoly/Box3d_FunProject@241fe10a9056836332c21d9614471d32d749ce3d`

Important recovered evidence:

- historical JV_CORE could contain parallel visual and physical truths;
- visible suspension/steering members could follow different endpoints or bodies than the mechanical relation that actually caused behavior;
- the historical visible damper path could differ from the single physical coilover axis;
- historical steering visual endpoints could differ from the physical tie-rod endpoints;
- visually plausible motion was therefore not evidence of mechanical correspondence;
- the separate real Blockbench donor `assets/source/Asset_Dumper.gltf` was recovered as useful visual donor capital without importing historical M6 rig/socket authority;
- the old `DrawTelescopingDamper` pattern showed a reusable technique: rigid end sections plus an extensible middle, while also demonstrating that the caller-supplied endpoints are where authority errors can enter.

Durable negative lesson:

> A visible mechanism must not become a decorative explanation around a different hidden mechanical path.

## 3. Rep2 Stage A — direct suspension-link geometry

Preserved branch:

`experiment/rep2-single-source-suspension-link`

Accepted Stage A specimen:

`954b6eb8e5f3bc3466134e77934cecc841ff5e5a`

Stage A established a bounded causal path:

`authored pivot / endpoint geometry → real arm body / hinge → wheel endpoint/path/contact`

It included same-length/different-direction falsification and one-side independence.

It did **not** establish general suspension authoring, hinge-axis authoring, product UX or architecture.

The later Stage-B measurement apparatus on that branch remained unfinished and has no automatic authority over future work.

## 4. C0a — direct physical force-path seam

Preserved branch:

`experiment/rep2-coilover-force-path@fa372932e92ceaae3767da24e5045552749bc73a`

Accepted physical seam:

`30ee3a5ddf2c7dd3589d953ab0024fe42b965f92`

Bounded result:

- an authored spring/damper component with fixed physical `k/c/restLength` can apply equal-and-opposite axial forces at exact live eyes;
- changing installation geometry changes leverage / `r × F` / body response without silently changing component properties.

This was an experiment-local direct-force implementation, not a final solver design.

## 5. C0b — numerical qualification

Preserved branch:

`experiment/rep2-c0b-numerical-qualification@0213994430ac7915409a3b964045d816caf5313c`

Accepted numerical specimen:

`e2976c1618363830e17cfb34fd482d0e8250c3f3`

Bounded result:

- state-dependent external spring force evaluated only once before a multi-substep `World_Step` can be materially stale across internal substeps;
- this produced measurable energy pumping in the tested bench;
- fine explicit force refresh converged in the bounded comparison.

This was a warning about one implementation seam, not evidence that Nextgen JV requires a custom Box3D fork or callback architecture.

## 6. C0c — solver-native physical `k/c` qualification

Preserved branch:

`experiment/rep2-c0c-solver-native-kc@ca69ccabd6a9d2df6ec1874c46a38d0b1f0d3230`

Accepted solver-native specimen:

`2da7ff61219e20afd49d2be7ac7520645625a186`

Bounded result for linear `k > 0` spring / combined spring+damper:

- authored physical `k/c/restLength + spatial eyes` can be mapped into the native Box3D distance spring;
- solver Hertz and damping ratio remain derived internal coefficients rather than component truth;
- the qualified mapping uses the distance relation's axial effective mass;
- generalized mechanism mass and fixed-Hertz-as-component-truth were strongly falsified for this purpose.

Pure damping `k=0, c>0` remains unresolved.

No final remapping policy for large travel was established.

## 7. C1 — causal damper correspondence

Closure branch:

`codex/nextgen-jv-live-frontier@d83308dd36559c7357c4ebfb62ccbaed444f4001`

Accepted implementation:

`8c7cb1515577f0c885e576266ad10997e69b26e7`

Exact closure receipt on that branch:

`evidence/rep2/REP2_C1_CAUSAL_DAMPER_CORRESPONDENCE_RECEIPT_2026-09-05.md`

Accepted remote workflow for implementation:

`33953935724`

Final branch-head workflow:

`33954116013`

Status:

**CLOSED — BOUNDED TECHNICAL PASS**

C1 established one bounded authority chain:

`authority record → native Box3D spring → live body eyes → real Asset_Dumper donor → independent Three.js scene-graph readback`

Accepted evidence included:

- maximum normal correspondence error: `0 m`;
- deliberate stale-eye mismatch detected: `0.0323160521063434 m`;
- geometry-response separation: `0.0299701653420925 rad`;
- identical authored `k=900`, `c=18`, `L0=0.5` across the tested geometry mutation;
- native joint bodies, local frames, spring state, rest length, Hertz and damping ratio read back from the live joint rather than trusted from self-report;
- the normal authority page exposes no arbitrary visual-endpoint escape hatch;
- source/build and real Chromium gates passed locally and on Linux CI.

The exact donor was:

`Jozzpoly/Box3d_FunProject@241fe10a9056836332c21d9614471d32d749ce3d:assets/source/Asset_Dumper.gltf`

Git blob:

`dcdaf197bf48ef8894af4de27682d55dd0b1343d`

## 8. Durable rule strengthened by this line

The project should now treat the following as a strong product constraint unless later evidence contradicts it:

> **One presented mechanical relation has one authority truth. Physics and visible representation are downstream projections of that same relation.**

This does **not** mean render mesh equals solver geometry, nor that cosmetic detail cannot be visual-only.

It means that when JV presents a visible part/attachment/motion path as the mechanism causing behavior, that presented causal relationship should correspond to the real mechanical relation rather than a separately authored visual story.

## 9. Explicit non-claims

Rep2/C0/C1 did **not** establish:

- Owner acceptance of the C1 apparatus;
- a good vehicle or driving feel;
- a product suspension system;
- a general builder interaction grammar;
- a final component/data/reference model;
- final adaptation or intent-lock semantics;
- a complete suspension topology;
- pure damping semantics;
- nonlinear springs/dampers, bump/droop, preload or ride-height policy;
- large-travel solver remapping policy;
- final renderer, physics runtime, asset pipeline or Web/native split;
- architecture authority for the experimental code.

## 10. Current boundary

C1 is closed. Do not continue vehicle/carrier implementation on its branch by inertia.

The next work begins from the updated canonical truth spine and must freshly reselect the highest-information representative product problem.

A minimal drivable carrier, geometry-derived hinge/axis authoring, another adaptive real component, driveline/Cardan work, or a different problem are candidates only. None is automatically the next stage because it follows naturally from C1's code.
