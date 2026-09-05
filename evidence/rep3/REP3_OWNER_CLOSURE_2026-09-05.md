# Rep3 — Owner closure

Date: 2026-09-05

Status: **CLOSED — BOUNDED TECHNICAL PASS + HUMAN OPERATION DEMONSTRATED; PRODUCT / FEEL VERDICT NOT EARNED**

## 1. Closure scope

Rep3 asked whether two recognizable physical mount/bearing points can be the sole authored spatial authority for a real hinge relation:

`two physical mounts → derived hinge line → native revolute relation → live arm / endpoint motion`

without a separately authored hidden solver axis, and whether a minimal Owner-facing BUILD/PLAY apparatus is sufficient to judge that relation as mechanically causal construction.

The experiment stops at the natural boundary from the pre-verdict contract: the first honest Stage-B Owner verdict. It is not extended into a wishbone corner, coilover integration, tire/contact, a drivable vehicle or a generic builder.

## 2. Exact preserved refs

Experiment branch before closure-only documentation:

`experiment/rep3-geometry-derived-hinge-line@798cf235b4550bbfb9725364f4f3d85da0cd8d67`

Stage-A qualified implementation / evidence head:

`33c248a6f8991a22f11a92509626d13033458038`

Stage-B qualified runtime / frozen Owner specimen:

`3de78caf3c7c0066b352d62097591b48fce90d20`

Frozen Owner alias:

`rep3-stage-b-owner-checkpoint@3de78caf3c7c0066b352d62097591b48fce90d20`

Machine/render receipt:

`evidence/rep3/REP3_STAGE_B_MACHINE_PREFLIGHT_2026-09-05.md`

Stage-A receipt:

`evidence/rep3/REP3_STAGE_A_AUTHORITY_METAMORPHISM_RECEIPT_2026-09-05.md`

Pre-verdict contract:

`evidence/rep3/REP3_GEOMETRY_DERIVED_HINGE_LINE_CONTRACT_2026-09-05.md`

## 3. Technical result retained

Stage A remains **BOUNDED TECHNICAL PASS**.

Demonstrated within the ideal rigid-hinge apparatus:

- authored spatial authority contains the two physical mount positions and no independent editable hinge-axis field;
- pivot and hinge direction are derived from those mounts;
- live native Box3D joint bodies / pivot / local frames read back consistently with that derived relation;
- materially changing mount-line direction produces a materially different real endpoint path;
- line-preserving bearing-spacing changes remain kinematically equivalent in the bounded ideal hinge, preventing spacing from acting as hidden axis/stiffness authority;
- swapping mount labels does not change free-hinge endpoint trajectory;
- singular / non-finite mount authority rejects explicitly instead of inventing a fallback axis.

This is evidence that recognizable authored geometry can own a real mechanical relation. It is not evidence that geometry-first authoring is the final JV relation model.

## 4. Stage-B machine/render preflight retained

Exact runtime `3de78caf…` passed the dedicated real-Chromium preflight and inherited Stage-P / Stage-A regression gates.

The preflight demonstrated rendered acquisition of the physical bearing handles, real X/Y/Z gizmo interaction, camera orbit, real Box3D PLAY consequence, exact BUILD recovery and acquisition of the second bearing after the round trip.

This remained machine reachability evidence only until the Owner run.

## 5. Owner hands-on evidence

The Owner ran the frozen Stage-B specimen in a browser through StackBlitz/WebContainers and supplied a hands-on recording plus direct feedback.

Observed human operation from the recording:

- both physical bearings were visually acquired and selected;
- bearing positions were directly manipulated in 3D with the world-axis gizmo;
- multiple axes and large geometry changes were explored rather than only tiny nominal perturbations;
- camera orbit was used to inspect the mechanism;
- repeated BUILD → PLAY → BUILD cycles were performed;
- substantially different derived hinge orientations were reached, including a near-vertical hinge line;
- no Rep3 runtime failure was observed during the recorded interaction.

Therefore **human operation reachability is demonstrated** for this bounded apparatus. This is stronger than privileged automation reachability and directly addresses the discoverability warning retained from R1.

## 6. Owner verdict

The decisive Owner feedback was not that the hinge relation felt wrong. The apparatus was judged **too raw, too limited and too placeholder-heavy to support a meaningful feel/product judgement**.

The Owner could operate it, but there was too little to do: one hinge relation, one arm and a small set of spatial edits did not provide enough construction space, mechanical richness or consequence space to evaluate whether the emerging JV builder/mechanical experience is satisfying.

Accordingly:

- **technical causal viability:** PASS within Rep3 scope;
- **human operation / basic discoverability:** demonstrated;
- **construction-quality verdict:** NOT EARNED;
- **feel verdict:** NOT EARNED;
- **product acceptance:** NOT EARNED;
- **general builder / architecture acceptance:** NOT EARNED.

Do not rewrite `NOT EARNED` as FAIL. The prototype did not manifest enough of the target experience to support that claim.

## 7. StackBlitz delivery note

StackBlitz was introduced ad hoc as a browser-native delivery path for the frozen checkpoint.

The first unfamiliar IDE view created avoidable confusion, but the Owner quickly found fullscreen preview and then obtained a clean large runtime surface. Therefore IDE chrome is **not** retained as a negative Rep3 result.

StackBlitz ultimately demonstrated that the current public Vite/Three.js/Box3D.js experiment can be launched from GitHub in a browser without local setup. However:

- the delivery path itself was not qualified before spending Owner attention;
- raw experiment branches can expose stale branch-local README/project documents alongside a newer runtime;
- cold-start, provenance clarity and fidelity/performance relative to a directly deployed artifact remain separate workflow questions.

StackBlitz therefore remains an auxiliary candidate tool, not a canonical JV Owner-checkpoint surface.

## 8. Workflow lesson from Rep3

Rep3 separates two prototype roles that must not be conflated:

1. a very narrow **implementation / causal prototype** can be excellent for machine falsification and technical feasibility;
2. an **Owner experience gate** can only support claims about construction quality, naturalness or feel when the prototype materially manifests enough of the relevant task and interaction context.

New project workflow rule:

> **Only ask the Owner to judge a quality that the current prototype materially manifests. If the apparatus is too sparse to expose that quality, record the verdict as NOT EARNED and increase only the representative scope needed for the next question.**

This is not permission to maximize prototype fidelity or scope. A larger prototype can create more confounds and prototype gravity. The goal is the smallest representative apparatus that makes the targeted possibilities and limitations visible and measurable.

A second retained delivery rule:

> **The Owner-facing delivery surface is part of the test setup. New hosting/runtime layers should be qualified separately before a critical feel/readability checkpoint when practical.**

## 9. Support research used to challenge the next move

Post-Owner support research reinforced, rather than created, the workflow lesson above:

- Houde & Hill, *What do Prototypes Prototype?* (1997): distinguish role, look-and-feel and implementation questions instead of treating prototype fidelity as one scalar;
- Lim, Stolterman & Tenenberg, *The Anatomy of Prototypes* (ACM TOCHI 2008, DOI `10.1145/1375761.1375762`): a prototype should filter the qualities under investigation without distorting understanding of the whole; prototype material, resolution and scope should be chosen economically for the question;
- Kieffer, *ECOVAL: Ecological Validity of Cues and Representative Design in User Experience Evaluations* (2017): UX findings depend on sufficiently representative cues/tasks/context.

Mechanical-builder analogs were treated only as inspiration, not authority: GearBlocks emphasizes simple functional mechanical parts plus immediate build/interact/improve loops; Trailmakers emphasizes simple connection semantics generating combinatorial complexity; mature CAD systems such as Onshape/Fusion use geometry-anchored joint/mate references while retaining explicit orientation semantics when geometry alone is insufficient.

None of these donors determines JV architecture.

## 10. Next frontier after closure

Do not polish Rep3.

The next work is a **fresh bounded representative-problem selection** with one added criterion: **Owner-judgement eligibility / experiential bandwidth**.

The next candidate should remain mechanically and causally bounded, but should give the Owner enough independent meaningful choices that an actual construction loop can emerge:

`build something → run it → understand a consequence → revise the construction`

rather than only `move one relation → watch one consequence`.

Leading candidate class after support research is a **small multi-relation suspension/mechanism subassembly on a bench**, not a full vehicle. It can potentially combine already-earned evidence rather than inventing a new hidden system:

- geometry-derived hinge/axis authority from Rep3;
- real component `k/c/restLength + eyes` / single-authority correspondence from Rep2 C0c/C1;
- real donor visual capital such as `Asset_Dumper.gltf` and the recovered one-sided suspension/wheel donors;
- direct spatial hardpoint editing;
- several interacting but inspectable mechanical consequences.

A trailing-arm + damper style composition or a carefully bounded two-arm / upright corner are stronger current candidates than either another single-joint microbench or an immediate drivable vehicle. The exact topology is **not selected by this closure document**; it must be compared against Cardan/driveline, generic multi-link construction and drivable-carrier alternatives before implementation.

Selection must score at least:

- new information gain;
- vehicle/product representativeness;
- number of genuinely independent authored mechanical decisions;
- clarity of causal attribution;
- Owner-judgement eligibility;
- reuse of already-qualified causal relations / real donors;
- implementation and validation blast radius;
- risk of placeholder / prototype / architecture gravity;
- natural STOP before tire/contact/driving unless the selected question truly requires them.

## 11. Final disposition

**Rep3 is closed.**

Portable evidence:

- geometry-derived mechanical authority is technically viable in the tested hinge class;
- human direct manipulation of that authority is reachable;
- an intentionally minimal implementation prototype can still be too experientially sparse to earn a product/feel verdict;
- next experiments should increase representative task richness, not automatically visual polish or total system scope.

Do not reopen Rep3 unless a later representative mechanism exposes a specific contradiction that requires returning to its bounded evidence.