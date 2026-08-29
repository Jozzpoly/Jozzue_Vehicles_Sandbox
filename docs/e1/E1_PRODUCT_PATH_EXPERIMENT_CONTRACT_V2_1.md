# JV Next-Gen — E1 Product-Path Experiment Contract v2.1

**Date:** 2026-08-28  
**Status:** reconciled with Codex SolUltra regrounding and closure-validated on Browser/Owner side; **implementation remains HOLD**  
**Canonical recipient:** `Jozzpoly/Jozzue_Vehicles_Sandbox`  
**Provisional E1 viewport/render substrate:** Three.js + `WebGLRenderer` — E1-only, not a final JV engine/render decision

---

## 0. Purpose

This document defines **one product-path experiment**, not the architecture of next-generation JV.

E1 asks:

> **Can a strong minimal explicit spatial construction model let Owner directly, predictably and permissively structurally rebuild a small functioning vehicle-relevant mechanism in real 3D — and, if it cannot, what is the smallest missing capability that actually buys the missing value?**

The simple model must have a fair chance to win.

A PASS does not prove a final JV architecture.  
A FAIL does not automatically justify ports, inference, adaptation, a global solver or richer transaction machinery.

The next decision follows the observed failure mode.

---

## 1. Product intent protected by E1

E1 matters only insofar as it advances the intended loop:

> **build → run → observe → improve → get in and drive**

The builder should tend toward:
- direct spatial construction;
- permissiveness;
- predictable/local consequences;
- causal readability;
- cheap rebuilding and recovery;
- a short BUILD ↔ PLAY round-trip;
- the feeling of constructing a mechanism rather than configuring a technical tool.

The experiment must not optimize the elegance of the research apparatus over this product experience.

---

## 2. H0 — Strong Minimal Explicit Spatial Construction

H0 conceptually provides:
- simple mechanical participants;
- stable/resolvable spatial references sufficient for the mechanism;
- explicit mechanical relations/joints;
- direct spatial manipulation;
- explicit add/connect/disconnect/reconnect operations;
- legal detached participants;
- enough preview/cancel/undo/recovery for low-cost experimentation;
- a direct BUILD → PLAY → BUILD loop.

H0 intentionally excludes:
- rich semantic/capability ports;
- automatic connection inference;
- automatic topology choice or structural commit;
- continuous procedural adaptation;
- global scaffolds;
- global Owner-facing constraint authoring;
- generalized unresolved-state transactions;
- final component schema;
- final persistence/versioning;
- final physics representation;
- generic authoring-framework machinery.

### 2.1 Anti-bespoke H0 rule

H0 must not be made artificially weak, but it also must not encode the expected solution into the fixture.

A participant/reference exposed in E1 is admissible only if its existence can be justified **independently of the final pushrod/rocker answer**.

Acceptable examples of rationale:
- a simple endpoint;
- a simple attachment point;
- a pivot axis;
- another minimal spatial feature that naturally belongs to the participant even if it is connected differently.

Unacceptable rationale:
- “this point exists because the final task needs a pushrod input here”;
- hidden role tags such as `pushrodInput`, `damperOutput`, `rockerTarget`;
- reference placement or hidden metadata whose only purpose is to make the expected topology easy.

A rocker may expose several simple stable references because a rocker mechanically needs several spatial locations; those references must not encode which future participant is supposed to use each one.

Before implementation, Codex must be able to explain the reference palette without referring to the target solution.

This is a methodological requirement, **not** a final component-schema design.

---

## 3. Selected scenario

### E1 — Direct-Acting Damper → Pushrod/Rocker Motion Path

The scenario begins with a small, readable, already functioning suspension-like fixture:

- a fixed chassis/reference structure;
- one moving arm with a meaningful chassis pivot;
- a direct-acting damper between chassis and moving arm;
- a bounded PLAY driver that moves the arm through a bump-like range.

The initial mechanism is already assembled because E1 primarily tests **structural rebuilding**, not the unrelated cost of constructing the entire baseline from empty space.

Owner first inspects and runs the baseline.

The rebuild goal is:

> Rebuild the mechanism so that the same damper is actuated through a pushrod and a chassis-pivoted rocker instead of directly by the moving arm.

A small schematic/topology card may communicate the mechanical goal. It must not prescribe exact coordinates, click order or implementation details.

---

## 4. Required structural mutation

The successful rebuild must require the semantic equivalent of:

1. inspect/run the direct-acting baseline;
2. disconnect/remove the old direct arm↔damper relationship;
3. introduce a rocker;
4. establish its chassis pivot;
5. introduce a pushrod;
6. connect moving arm → pushrod → rocker;
7. reconnect the existing damper through the rocker;
8. spatially arrange participants as needed;
9. PLAY;
10. observe;
11. return to BUILD and remain able to revise/recover.

The UI does not have to expose these as literal commands.

The task must not be solvable solely by moving one existing point or changing one parameter.

Detached parts and partially rebuilt but understandable mechanisms are legal BUILD states.

PLAY may require a sufficiently resolved mechanism. If resolution fails, diagnose it rather than fabricate a working result.

### 4.1 Gesture-local working state is not E3

Ordinary interaction may temporarily use:
- drag/transform preview;
- connection preview;
- cancel/revert during one gesture;
- a deliberately detached participant between explicit construction operations.

These do **not** by themselves constitute E3.

E3 would only become decision-relevant if useful structural rebuilding requires a **persistent, multi-operation unresolved authored state** with its own resolution/recovery semantics.

E1 must not build that subsystem pre-emptively.

---

## 5. Minimum genuine-3D burden

E1 must not become “a planar linkage editor shown by a 3D renderer”.

The mechanism may remain almost planar and the evaluator may be bounded/planar, but the Owner-facing authoring task must contain **at least one decision-bearing spatial condition** that requires real 3D position/orientation judgement.

The preferred minimal burden is the rocker/pivot orientation:

- the rocker has a real 3D orientation;
- its pivot has a real 3D axis;
- the axis/orientation must be readable and manipulable;
- a materially wrong orientation must have an observable consequence for the authored/evaluated mechanism rather than being ignored by the system.

The exact geometry is a repo-native design choice.

The implementation must not inflate this requirement into a full spatial suspension problem. One genuine spatial degree of authoring burden is sufficient for E1.

If the implemented fixture can be used meaningfully without any real depth/orientation judgement, the result cannot support a “real-3D authoring” PASS and must be classified as out-of-domain/insufficient-fidelity evidence.

---

## 6. Minimal PLAY truth

PLAY is not decorative animation.

Required truth:
- the moving arm receives a known bounded input motion;
- authored pivots/links/relations determine how that motion propagates;
- direct baseline: arm motion produces damper travel directly;
- rebuilt mechanism: motion propagates arm → pushrod → rocker → damper;
- rocker rotation and damper travel may not be independently scripted to imitate the expected answer;
- changing authored geometry must change evaluated motion consistently;
- an unsolvable configuration must not be visually faked as working.

Allowed simplification:
- bounded kinematic evaluator;
- almost-planar kinematics;
- no final physics engine.

Not required:
- spring/damper force fidelity;
- mass/inertia;
- tire/contact physics;
- load transfer;
- final suspension dynamics.

Authoring remains genuinely 3D even if evaluation is deliberately simpler.

### 6.1 Derived geometry is not continuous-adaptation evidence

E1 may render/evaluate a simple link, rod or damper from current authored spatial references. For example, a visible pushrod may span two current endpoints and therefore change its displayed length when those endpoints move.

That is allowed as **derived representation needed to show the authored mechanism**.

It does **not** establish that JV has solved continuous component adaptation.

E1 must not infer from such representation that it has solved:
- persistent parametric component intent;
- thickness/proportion/variant adaptation;
- intent locks;
- asset-driven adaptive behavior;
- generalized propagation of component properties.

If derived geometry starts acquiring those durable design semantics, the adaptation axis has entered the experiment and requires a new explicit decision.

---

## 7. Owner-facing task contract

### Phase A — Grounding
Owner inspects and runs the working direct-acting fixture.

### Phase B — Structural rebuild
Owner receives the functional target and a small explanatory topology/schematic if useful.

Do not provide:
- IDs;
- JSON;
- exact coordinates;
- click-by-click instructions;
- hidden agent-side edits.

Owner chooses construction sequence and spatial arrangement.

### Phase C — PLAY verification
Owner runs the rebuilt mechanism and judges whether PLAY matches what they believe they constructed.

### Phase D — Optional free experiment
Owner may alter one or more spatial choices and run again.

This phase is not required for PASS. It probes spontaneity:
> “Do I naturally want to try another arrangement?”

### 7.1 Task-clarity precondition

The task presentation must communicate the intended mechanical transformation clearly enough that Owner is not being tested on prior knowledge of pushrod suspension terminology.

The schematic may explain:
- what moves;
- what the target motion path is;
- what the rocker/pushrod topology means.

It must not explain **how to operate the builder**.

If Owner does not understand the requested mechanical goal despite adequate presentation, classify the session as **INCONCLUSIVE-T**, not as a construction-model failure.

---

## 8. Minimum interaction fidelity

E1 requires enough quality for:
- real 3D orbit/pan/zoom and useful focus/frame behavior;
- reliable spatial picking;
- clear hover and selection;
- direct manipulation of mechanically meaningful spatial things;
- explicit connection targeting;
- connect/disconnect/reconnect without IDs/property-database work;
- readable joint/reference axes;
- cancel/recovery from abandoned manipulation;
- Undo sufficient for fearless local experimentation;
- short, obvious BUILD ↔ PLAY.

### 8.1 H0 feedback vs inference boundary

H0 may:
- show available simple spatial references;
- highlight the reference currently under the pointer;
- show the explicitly selected connection source;
- show the currently hovered/explicitly selected target;
- preview the connection between two explicitly chosen references;
- show success/failure after an explicit relation operation.

H0 must not, without separate evidence:
- search for or rank “best” connection targets;
- recommend topology;
- automatically choose a relation type;
- silently filter candidates using rich hidden component semantics;
- auto-connect or auto-commit structural intent.

If an explicit relation type itself makes some **purely geometric** target invalid (for example a point operation requiring a point-like spatial reference), the UI may communicate that fact. This must not grow into a hidden capability/port system.

Thus “candidate” in E1 means **the target Owner is currently explicitly considering**, not an inferred recommendation set.

---

## 9. JURE evidence boundary

JURE provides bounded behavioral/evidence capital:
- orbit/pan/zoom and focus/fit;
- ephemeral transform proxy;
- world/local manipulation;
- preview → commit/cancel;
- Escape/pointer-cancel/blur interruption;
- non-authoritative render-object → authored-target mapping.

Do not automatically inherit:
- `RigDocument`;
- `RigDisplayModel`;
- JURE element/frame/relation ontology;
- SOURCE workflow;
- panel relation authoring;
- whole `RigViewportController`;
- full-scene rebuild strategy;
- explicit `Edit pose` as a JV requirement.

`SELECTED != EDITING` is conditional/negative UX evidence, not a product law.

---

## 10. Minimum graphics/readability contract

Graphics are functional evidence infrastructure.

Owner must be able to judge:
- depth and orientation;
- what is targeted;
- what is connected;
- authored vs preview/evaluated/debug state.

Visual language must clearly distinguish, as needed:
- normal;
- hover;
- selected;
- explicit connection source;
- explicitly considered target;
- connection preview;
- committed relation;
- warning/unresolved;
- BUILD vs PLAY.

The scene should provide:
- solid readable volume, not debug lines only;
- stable simple lighting;
- ground/reference or equivalent depth cue;
- adequate antialiasing/color handling;
- coherent BUILD/PLAY visual continuity.

Not required:
- final art direction;
- advanced PBR;
- final shadows;
- reflections/post;
- final transparency pipeline;
- scans/world graphics.

---

## 11. Authority boundary

Semantic direction:

```text
AUTHORED JV MEANING
(participants / spatial references / explicit mechanical relations)
        |
        | derive / resolve
        +----> visual projection (Three)
        |
        +----> PLAY evaluation
        |
        +----> diagnostics
```

This does not mandate a final schema, ECS, graph count or renderer interface.

It means:
- `THREE.Object3D` is not the authored participant;
- Three IDs/userData are not canonical JV identity;
- scene hierarchy is not mechanical topology;
- `Object3D.position/quaternion` is not automatically authored truth;
- `BufferGeometry` is not the component definition;
- render-loop lifecycle is not BUILD/PLAY semantics.

Durable change crosses a JV-owned edit boundary.

---

## 12. Evidence contract

### A. Machine/technical evidence
Eventually verify sufficiently that:
- baseline/reset is deterministic;
- authored mechanism resolves deterministically;
- structural operations modify authored topology, not only render state;
- Undo/recovery restores authored intent;
- BUILD↔PLAY does not silently rewrite authoring truth;
- runtime/evaluated poses are derived state and returning from PLAY restores/continues the authored BUILD state rather than committing runtime motion;
- PLAY does not silently consume, rewrite or invalidate the authored Undo/recovery history;
- evaluated motion derives from authored relations;
- renderer/proxy state is not sole authority.

Exact test framework is a Codex decision.

### B. Interaction smoke evidence
Before interpreting Owner judgement:
- camera stable;
- picking matches visuals;
- hover/selection/connection previews legible;
- manipulation cancellable;
- browser/resize/focus bugs do not dominate.

Failure here → **INCONCLUSIVE-I**.

### C. Task-clarity evidence
Before interpreting construction-model failure:
- Owner understands the requested mechanical transformation;
- task card/schematic communicates target topology without teaching the builder.

Failure here → **INCONCLUSIVE-T**.

### D. Owner-observational evidence
Record qualitatively:
- Directness;
- Predictability;
- Locality;
- Structural authority;
- Mutation friction;
- Recoverability;
- Permissiveness;
- Causal understanding;
- PLAY continuity;
- Spontaneity.

Secondary observations:
- hesitation;
- needed explanation;
- failed targeting/connection attempts;
- Undo/recovery use;
- surprising topology/consequences.

Do not invent pseudo-precise thresholds before evidence exists.

### E. Evidence receipt / provenance

Every decision-bearing E1 run should preserve a compact receipt sufficient to reconstruct what was actually judged:

- exact repo commit/ref;
- exact relevant dependency/configuration snapshot;
- scenario/evaluator configuration or fixture revision;
- result of technical interaction/evaluator preflight;
- whether task-clarity validity passed;
- Owner verdict/classification;
- short qualitative observations that materially affected the verdict;
- explicit scope/ceiling of the conclusion;
- known confounds or unresolved anomalies.

This receipt is provenance, not a laboratory product or telemetry framework. It should remain lightweight and should not create a new sticky research UI.

---

## 13. Precommitted result classification

### PASS — Owner-observed H0 sufficiency at E1 scale

A PASS requires technical validity gates plus Owner judgement that:
- structural rebuild is completed without IDs/JSON/code/agent-side coordinates;
- connectivity is understandable;
- main gesture consequences are predictable;
- local edits mostly retain local meaning;
- detached/weird intermediate states are not paternalistically blocked;
- mistakes are recoverable without fear;
- PLAY matches the mechanism Owner believed they constructed;
- relation handling does not become dominant bookkeeping;
- the experience resembles constructing a mechanism more than managing configuration.

Interpretation:
> H0 is sufficient **for this E1 scale**. Do not add richer machinery without new evidence.

PASS is not an objective proof of final architecture and does not settle adaptation or larger assemblies.

### FAIL-R — Representation/semantic insufficiency
With interaction/task/evaluator validity adequate, Owner's intended structure cannot be expressed clearly/stably with available participants/references/relations.

Response:
> identify the smallest missing semantic capability; do not jump to a general port system.

### FAIL-O — Structural-operation friction
The structure is representable, but reaching it is dominated by relation bookkeeping, repetitive reconstruction, unclear reconnect operations or loss of intent.

Response:
> isolate whether the missing value is interaction, inference, relation operation or bounded edit-state support.

### FAIL-P — Product/permissiveness failure
The topology can be created, but workflow is bureaucratic/paternalistic or recovery cost suppresses experimentation.

### INCONCLUSIVE-T — Task/information clarity
Owner does not adequately understand the intended mechanical transformation or target topology.

Response:
> improve task communication; do not change construction semantics yet.

### INCONCLUSIVE-I — Interaction fidelity
Camera/picking/manipulation/targeting/visual feedback prevents fair semantic judgement.

### INCONCLUSIVE-E — Evaluator/implementation
Authored intent is understandable but evaluator/implementation bugs prevent reliable PLAY judgement.

### OUT-OF-DOMAIN / FALSE-PASS RISK
E1 may work while remaining too small/planar/bounded to justify extrapolation.

This classification also applies if the supposed “real 3D” task does not actually require meaningful 3D judgement.

Interpretation:
> record H0 success at the tested scope only; choose any stronger falsifier later from evidence, not roadmap habit.

---

## 14. Evidence that could buy richer machinery later

These are triggers for **new questions**, not implementation orders.

### Richer reference/port semantics
Only if fair interaction repeatedly shows that simple stable spatial references cannot preserve/communicate the mechanically relevant distinction Owner needs.

### Connection inference
Only if explicit relation creation is demonstrated as dominant friction and candidate/preview machinery could reduce it without reducing Owner authority.

### Larger unresolved-edit window
Only if legal detached parts + atomic explicit operations still make real structural rewire unnaturally impossible/brittle.

### Continuous adaptation
Only in a separate task showing meaningful repetitive work/loss of intent under continuous geometric/property changes.

E1 does not test adaptation.

---

## 15. Product-path capital and exit contract

Worth preserving as behavior/meaning:
- camera/selection/manipulation behavior Owner likes;
- direct connection semantics;
- preview/cancel expectations;
- Undo/recovery expectations;
- BUILD/PLAY contract;
- visual-state vocabulary;
- authored meaning;
- causal readability;
- Owner evidence.

Consciously replaceable:
- Three adapter code;
- scene objects;
- gizmo glue;
- primitive meshes;
- first materials/shaders;
- scenario fixture implementation;
- first evaluator;
- first UI shell;
- temporary diagnostics plumbing.

Exit test:
> replacing Three/evaluator/UI may cost code, but must not require redefining what the authored mechanism means.

---

## 16. Prototype-gravity tripwires

Checkpoint if:
1. Three/render objects become authored truth.
2. Scene hierarchy encodes mechanical topology.
3. Renderer/physics identity becomes relation authority.
4. Scenario-specific references begin encoding the expected solution.
5. The primitive fixture becomes the assumed general JV component model.
6. The evaluator begins dictating final physics semantics.
7. JURE behavior is kept mainly because it already exists.
8. Generic scene/editor/asset/component infrastructure expands before E1 needs it.
9. Temporary persistence gains compatibility commitments.
10. A product requirement is rejected mainly because provisional code makes it expensive.
11. Graphics expands from E1 readability into premature final graphics work.
12. The test is modified to make H0 pass rather than remove a genuine confound.
13. Hidden candidate/compatibility semantics enter H0 under the label of visual feedback.
14. Derived display geometry is treated as evidence that generalized continuous adaptation has been solved.
15. Evidence/provenance work expands into a sticky laboratory framework rather than a lightweight receipt.
16. Three-specific plumbing begins to dominate E1 cost.

---

## 17. Explicit non-goals

E1 does not build or decide:
- full vehicle/front corner;
- tire/contact model;
- drivetrain;
- final suspension force model;
- final physics engine;
- final renderer/engine/GPU backend;
- final UI framework;
- final component/data schema;
- persistence/versioning;
- Blockbench integration;
- general adaptive-component framework;
- rich ports/capabilities;
- automatic topology inference;
- global scaffold;
- global constraint-authoring UI;
- generalized unresolved-state transaction system;
- full Graphics Foundation;
- world/scan rendering;
- mobile authoring;
- replay laboratory;
- E2;
- E3.

---

## 18. Browser-side closure condition

The browser-side contract is considered ready for repo-native challenge only if:

- H0 is strong but not task-tailored;
- one meaningful 3D authoring burden exists;
- feedback is cleanly separated from inference;
- task clarity has its own validity gate;
- PASS remains explicitly limited to E1 scale;
- gesture-local preview/cancel remains explicitly separated from E3;
- derived geometry remains explicitly separated from continuous adaptation;
- decision-bearing runs have a lightweight provenance/receipt requirement;
- no final architecture is prescribed;
- Codex retains real engineering freedom.

All six conditions are satisfied by this v2 contract at the specification level.

Their practical implementability and cost remain **UNKNOWN until Codex challenges the contract against the repo**.

---

## 19. Natural next gate

Next stage, not authorized by this document:

> **Codex Repo-Native E1 Implementation Design / Challenge**

Codex should challenge:
- whether the anti-bespoke reference requirement is implementable without disproportionate machinery;
- whether the minimal genuine-3D burden can remain small and diagnostic;
- whether PLAY truth can be met with a bounded evaluator;
- whether Three/JURE plumbing remains contained;
- whether any contract requirement accidentally forces architecture.

Then propose the smallest implementation-ready design and stop before meaningful product implementation.

---

## 20. Final browser-side verdict

**E1 PRODUCT-PATH EXPERIMENT CONTRACT v2.1: PASS — READY FOR CODEX REPO-NATIVE DESIGN CHALLENGE**

Selected scenario:

> **Direct-acting suspension-like damper path → structural rebuild into pushrod + chassis-pivoted rocker → causal PLAY → return to BUILD.**

Primary test:

> **Can the strongest non-bespoke minimal explicit spatial construction model support that rebuild directly, predictably, permissively and causally — with at least one genuine 3D authoring burden — without evidence yet requiring richer authoring machinery?**

The experiment is deliberately small.

Its **experience may not be a disposable surrogate**.  
Its **implementation may remain provisional**.  
Its **meaning and evidence must remain portable**.
