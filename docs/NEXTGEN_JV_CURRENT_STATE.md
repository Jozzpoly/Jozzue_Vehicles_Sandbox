# Nextgen Jozz Vehicle — Current State

Date: 2026-09-03

This document is the current high-level technical/research state of the Nextgen Jozz Vehicle project. It is intentionally more concrete and more replaceable than `NEXTGEN_JV_PROJECT_SOUL.md`.

Live source, exact experiment refs and reproducible evidence override this summary when they disagree.

## 1. Executive state

The project has completed two bounded research programs:

- **E1 — construction-loop research: CLOSED, H0 unresolved.**
- **V0 — drivable physical steering consequence: CLOSED with technical PASS and final Owner readability PASS for reuse as a research carrier.**

No current experiment defines the final JV architecture.

The next phase should not be general product implementation. It should select a fresh representative problem that begins to connect:

`direct construction → mechanical consequence → PLAY/DRIVE → return to construction`

The leading candidate is direct spatial editing of the steering linkage on the frozen V0 carrier, but that candidate has not yet been authorized as the next experiment.

## 2. Canonical and experimental refs

### Canonical docs base before this closure

- `main@640f6d9074a5dea42ca18e05afb782a90dbb5947`

At that commit `main` contains the E1 docs-only closure and archived E1 control apparatus. It is behind the actual project state described here until this regrounding work is merged.

### E1

- Historical frozen control: `55b62da06632e9325c9f6e1cbfb4e9acb4ba6bde`
- Final F1 specimen: `experiment/e1-final-f1@b9426adfcecb6f8340ffe21ff94fbd38c4c439ef`
- Canonical closure: `evidence/e1/E1_CLOSURE_2026-08-31.md`

### V0

- Technical drivable steering specimen: `work/front-steering-v0@673dd584d5783b59e177c4ed48c9a64f83a72e49`
- First Owner rehearsal input checkpoint: `work/front-steering-owner-rehearsal@184c2ed9fb71632afa30f0d60032b8e2b923aa1e`
- Final deconfounded Owner specimen: `work/front-steering-v0-deconfound@69d8a8ee91117d4ce44c7dd14657418241844b2e`
- Technical receipt: `evidence/v0/V0_DRIVABLE_STEERING_RECEIPT_2026-09-01.md` on the V0 specimen lineage
- Final Owner closure: `evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md` on this docs-only regrounding branch

Preserve these branches as research provenance. Do not merge experimental code merely to make `main` look current.

## 3. E1 disposition

E1 studied a bounded form of structural construction and exact BUILD recovery.

Portable result:

- authored edit → causal PLAY → exact BUILD recovery had bounded Owner and technical value;
- locality-preserving completion reduced operation burden in the tested apparatus;
- technical reachability did not establish a satisfying construction experience;
- placeholder readability, task understanding, target identity and operation burden could confound the representation question.

E1 did **not** establish:

- the final reference model;
- the final relation grammar;
- sockets/axes as JV ontology;
- a general constraint solver;
- continuous adaptation semantics;
- a final builder UI;
- a final renderer or asset pipeline.

`E1Document`, PointRef/AxisRef, Connect/FIT and the E1 evaluator/projection remain disposable apparatus.

## 4. V0 disposition

V0 selected a more vehicle-representative causal problem: steering geometry affecting actual driving through a physical linkage.

The technical chain is:

`input → physical rack → fixed-length physical tie-rods → steering knuckles/wheels → contact → trajectory`

The analytical steering oracle observes the physical mechanism and does not actuate the wheels.

Technical V0 demonstrated a material A/B difference under deterministic traces. Variant A used steering-arm radius `0.18 m`; variant B used `0.30 m`. At the receipt's controlled command the short-arm geometry produced roughly 1.8× the curvature magnitude of the long-arm geometry in both steering directions, with bounded rack/oracle/tie-rod errors and all four disposable wheel contacts present.

The first Owner rehearsal was not a fair product reading of this result because the apparatus contained confirmed confounds:

- user-visible left/right semantics were inverted;
- the camera was body-relative front-right and harmed orientation;
- the A/B physical difference was weakly legible in the scene despite strong telemetry;
- motion was too weak for a short Owner run to expose the trajectory clearly.

A bounded deconfounding patch corrected the input boundary, changed only the research camera/presentation, added FRONT and current/one-previous trajectory trails, and modestly increased drive readability without changing the physical steering core.

Final machine preflight plus second Owner hands-on established that:

- steering semantics are now understood correctly;
- front/rear and camera orientation are sufficiently readable for this carrier;
- A/B now produce a clearly perceptible difference to the Owner;
- the carrier can support another bounded construction→driving research question.

V0 therefore receives:

- **technical consequence PASS**;
- **Owner readability PASS for research-carrier reuse**;
- **NO vehicle/product PASS**;
- **NO architecture authority**.

Stop V0 feature development unless a future experiment requires a minimal carrier-specific repair to keep its own question valid.

## 5. What is now relatively strong

The following directions have repeated support and should be treated as strong product constraints unless later evidence contradicts them:

### Short creative round trip

The core product loop is:

`build → run → observe → improve → get in and drive`

The loop may cross process/window boundaries if the round trip remains natural and short.

### Causal mechanics

When the product presents a mechanism as causing vehicle behavior, the mechanism should own that behavior rather than being decorative around a hidden handling mapping.

### Direct, permissive construction

The long-term builder should support direct spatial manipulation, topology/rebuilding, exact values and optional snap/gizmo assistance. Strange constructions should generally run with diagnosis rather than be paternalistically forbidden.

### Adaptive components

Components that adapt length, thickness, proportions or bounded functional geometry are a strong product direction. Their exact adaptation/intent-lock semantics remain open.

### Owner-readable consequence

A machine-measured difference does not count as a useful product-path result if the Owner cannot perceive or understand it. Camera, orientation, scene cues and enough motion can be part of experiment validity without becoming final product systems.

## 6. Major open questions

The project still does not know:

- the natural direct-building interaction grammar;
- whether one editable steering-linkage task generalizes beyond a one-dimensional parameter in 3D;
- how adaptive component behavior should distinguish automatic adaptation from explicit locked intent;
- the final vehicle/component/reference/data representation;
- the final physics runtime or how many physical representations are needed;
- the final tire/contact and suspension models;
- the correct product-facing relationship between Blockbench source assets, runtime glTF/GLB and JV semantics;
- when real assets become necessary to prevent placeholder readability from confounding construction research;
- the final renderer or Web/native/desktop split;
- the eventual world-interaction architecture for ruts, terrain response, local deformation/destruction and other emergent vehicle↔world behavior;
- the correct replay/comparison contract for different experiment types.

Do not convert these unknowns into architecture merely to obtain a cleaner implementation plan.

## 7. Leading next representative problem — candidate, not commitment

A strong candidate is to replace the V0 preset-only A/B authoring boundary with one bounded direct spatial construction task.

The product question would be approximately:

> Can the Owner directly edit a mechanically meaningful part of the steering linkage, understand any adaptation performed by connected components, run/drive the resulting vehicle, perceive the consequence, and return to the authored construction naturally enough to justify further builder research?

Why it is attractive:

- it combines E1's construction-loop lesson with V0's demonstrated physical consequence;
- A/B already isolate a meaningful geometry difference on a functioning carrier;
- `PhysicalSteeringWorld` internally consumes a geometry object, so custom geometry need not imply rewriting the physical steering core;
- the consequence is already Owner-readable after deconfounding.

Why it is dangerous:

- dragging a point constrained to one scalar can become a slider disguised as a builder;
- automatically recomputing tie-rod neutral length can hide an unresolved adaptation/intent decision;
- a successful steering task could be overgeneralized into a builder architecture;
- V0 primitive visuals may again become a confound once the question shifts from driving consequence to natural construction.

Before implementation, compare this candidate against at least a small number of alternative representative problems on information gain, representativeness, cost, likely confounds and prototype gravity.

## 8. Donor and asset posture

Native JV, JV-Web, Box3D experiments and existing Blockbench/glTF assets are donors, not ceilings.

Known useful donor capital includes real vehicle/mechanical assets such as chassis/body, wheel mounts, steering/suspension rigs, wheels and driveline pieces. Their presence does not establish the final asset semantics.

The preferred long-term authoring direction remains:

`.bbmodel editable source → exported runtime visual artifact → JV-owned component/mechanical semantics`

Do not make `.bbmodel` itself the runtime product contract.

Do not build a new placeholder component library simply because the current experiments use primitives. Once a new construction experiment depends materially on recognizing real parts and attachment intent, evaluate whether real donor assets should enter before growing the placeholder path.

## 9. Collaboration and execution routing — provisional empirical state

Browser ChatGPT is the primary continuous second brain / co-orchestrator for this project: research, synthesis, critical planning, evidence review, project continuity and as much direct GitHub work as available tooling safely permits.

Local Codex/Work is most valuable when local repository/filesystem/runtime/browser/desktop capabilities materially improve evidence or execution. It should not be treated as the automatic implementation destination for every task.

Current model-routing observations from the V0 calibration are provisional and task-class-specific:

- **Luna High**: useful inexpensive independent rendered scout/smoke preflight;
- **Luna Max**: current practical local workhorse for bounded causal investigation and bounded implementation;
- **Sol High**: escalation when unresolved ambiguity, cross-cutting risk or deeper reasoning plausibly buys enough information to justify its higher cost;
- **Owner**: authority for feel, naturalness, product value, intent and whether a consequence is actually understandable.

Do not turn these observations into permanent model rankings. Recalibrate through real work rather than synthetic benchmark programs unless a routing ambiguity becomes expensive enough to justify one.

A recent Git publishing failure also established a tool-boundary lesson: host GitHub CLI credentials may work in the Owner's normal Windows shell while a local Codex/Work execution environment lacks the same credential context. Agents should fail safely, classify the boundary, use their own GitHub/API capabilities first where possible, and ask the Owner for the minimum local action only when the boundary is real.

## 10. Working epistemic rules

Use the smallest rigor that matches the question and causal blast radius.

- Facts/observations, hypotheses, plans and broader claims should not be silently conflated.
- A PASS must be scoped to the evidence that earned it.
- Owner feel is not replaced by telemetry or AI hands-on.
- Owner feel also should not be interpreted as a diagnosed technical mechanism when source/runtime evidence is needed.
- Experiments, donors, renderers and data types do not gain authority merely through reuse.
- Previous next-step recommendations are candidates, not obligations.
- When the current state is sufficient, continue the work rather than handing routine orchestration back to the Owner.
- Owner attention — prompting, reading, manual technical work and repeated context transfer — is a real project cost.

## 11. Immediate closure/regrounding work

Before a new product experiment begins:

1. preserve the V0 final Owner closure on a docs-only canonical path;
2. establish/update `NEXTGEN_JV_PROJECT_SOUL.md` and this Current State document;
3. simplify/update README so cold readers see the actual project epoch rather than the pre-V0 state;
4. prepare a concise fresh-takeover entry point if it materially reduces restart cost;
5. finalize Project Instructions from the workflow that has now been observed in real use rather than from speculative process design;
6. start the next phase in a fresh conversation within the same ChatGPT Project and perform fresh representative-problem selection before authorizing implementation.

This is a short consolidation phase, not a return to broad abstract research.

## 12. Near-term research roadmap

Use this as a hypothesis-driven roadmap rather than a feature sequence:

- **R0 — closure/regrounding:** make canonical project truth match E1+V0 evidence and current product intent;
- **R1 — direct construction consequence:** test whether an authored spatial mechanical change can survive through PLAY/DRIVE and back to BUILD naturally;
- **R2 — generality:** test a materially different construction/mechanical problem before generalizing builder architecture;
- **R3 — adaptive component semantics:** resolve useful default adaptation versus explicit Owner intent/locks through representative tasks;
- **R4 — representative vehicle substrate:** determine how much real vehicle/contact/suspension/asset fidelity is required before placeholders dominate product judgement;
- **R5 — architecture convergence:** only after repeated cross-problem invariants emerge, promote stable patterns toward a real JV foundation.

These labels are navigation, not gates. A better experiment can reorder or collapse them.

## 13. Current stop condition

Do not begin V1 merely because V0 succeeded.

The next implementation should start only after the representative problem is freshly selected and its question can be stated narrowly enough that:

- success/failure changes what we believe;
- the carrier and presentation are adequate to expose the answer;
- the implementation does not require pretending that unresolved builder/component architecture is already solved;
- the Owner can test the intended product property without unnecessary technical ceremony.

Until then, the correct work is closure, regrounding and selection — not more V0 polish.
