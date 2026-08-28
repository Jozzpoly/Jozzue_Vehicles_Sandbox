# E1 Structural Rewire — bounded implementation design

> **Status: E1-LOCAL / PROVISIONAL / NOT JV ARCHITECTURE**

Upstream Owner/Browser authority remains `JV_NEXTGEN_E1_PRODUCT_PATH_EXPERIMENT_CONTRACT_V2_1.md`, SHA-256 `F8FF7060AD8D05E9BF50F601D161F76BDB9845C7D0789C27DF6525511A891CBB`.

The preceding Causal Product-Path Spine passed its bounded machine and Owner checkpoint. This extension asks the still-open E1 question; it does not promote the spine or this implementation to a foundation.

## Diagnostic question

Can Owner rebuild the direct arm → damper path into arm → rigid link → chassis-pivoted rocker → damper using a strong-simple model of neutral point/axis references and explicit relations, while PLAY causally reflects the authored mechanism?

Only Owner performance and judgement on the complete task can produce E1 PASS/FAIL evidence.

## Deliberately small authored model

- E1-local participants with a pose and neutral local point/axis references.
- `point-coincidence` and `revolute-axis` relations only.
- No sockets, capability ports, role tags, inference, unresolved transactions, persistence, or compatibility promise.
- Rocker points are neutral `Attachment A/B`; pushrod and damper points are neutral `Endpoint A/B`. Evaluator input/output roles are derived from explicit graph connectivity.

The renderer owns no authored identity or topology.

## Connect and manipulation semantics

- Selecting a body edits participant pose only.
- Selecting a point/axis authors relations.
- Connect explicitly chooses relation type, source, and target.
- Connect may translate/rotate only the source participant pose, then atomically records the relation.
- Connect never changes local reference layout, rigid-link length, or any participant's own geometry.
- Linear-part length is a separate visible authored operation. `FIT TO TARGET SPAN` is explicit, independently undoable geometry editing; it is not a snap side effect or continuous adaptation.
- Moving a connected participant preserves the relation. Satisfaction is recomputed, never persisted.
- A violated relation is shown with an amber tether. There is no recovery plan, resolver, pending transaction, or automatic repair state.
- Disconnect removes only the relation; both participants remain in place.

Coincident references are disambiguated by explicit repeated-click cycling. The UI does not rank semantic targets.

## PLAY boundary

The bounded evaluator derives either:

- direct arm → damper motion; or
- arm → rigid link → rocker → damper motion.

The rocker branch uses a deterministic scalar root solve. Rigid-link length comes from its authored local endpoint span at PLAY start; it is never recalibrated from the runtime frame or written back. A required violated relation or unsupported topology enters whole-mechanism diagnosed/static PLAY. Root loss freezes the complete last-valid frame. No subset is solved.

## Product-path capital worth observing

- real 3D picking, translation, local rotation, and axis readability;
- direct explicit relation authoring;
- permissive detached/violated BUILD states;
- preview/commit/cancel/Undo and exact BUILD recovery;
- authored/evaluated/render separation;
- causal direct and rocker evaluation.

Worth observing does not mean graduated.

## Consciously disposable

- primitive chassis/arm/damper/rocker/link visuals and colors;
- exact fixture dimensions and staged part poses;
- task card and panel layout;
- Three-specific projection and gizmo glue;
- relation tolerances and first evaluator;
- every E1-local type/name in the current document.

## Explicitly still undecided

Final component/reference ontology, asset markers, Blockbench workflow, adaptive parts, richer interfaces, relation inference, larger unresolved editing, persistence/versioning, physics engine, renderer, graphics foundation, vehicle topology, and desktop/Web relationship.

## Stop boundary

Stop at the Owner structural task. Do not polish the placeholder language, integrate glTF/socket donors, build a component library, add inference, add generalized unresolved-state machinery, or begin the next experiment from machine PASS alone.
