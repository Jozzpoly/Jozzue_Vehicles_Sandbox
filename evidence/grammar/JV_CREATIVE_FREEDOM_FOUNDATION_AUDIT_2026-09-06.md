# Nextgen JV — Creative Freedom Foundation Audit

Date: 2026-09-06  
Status: **research synthesis / pressure audit / NOT architecture**  
Branch context: `experiment/construction-grammar-family-c-spatial-compass-v0`

## 0. Purpose

This audit asks a broader question than whether Family C or Spatial Compass is good:

> **What meanings and seams must Nextgen Jozz Vehicle preserve now if the long-term builder is expected to support extreme creative freedom, adaptive real assets, unusual mechanisms, deep rebuilding and a short BUILD → RUN/DRIVE → BUILD loop without painting the project into an architectural corner?**

The goal is deliberately **not** to invent one universal component schema, plugin system, relation solver or final builder grammar.

The goal is to identify:

- repeated constraints that survive materially different project evidence;
- assumptions that already fail plausible future JV constructions;
- seams that deserve protection even though their final implementation is unknown;
- bounded future break-tests capable of falsifying proposed foundations before they become expensive.

This document is subordinate to `docs/NEXTGEN_JV_PROJECT_SOUL.md`. It is experiment-local evidence, not canonical product architecture.

---

## 1. Correct definition of “maximum creative freedom”

Maximum creative freedom does **not** mean exposing every numerical degree of freedom at all times.

A builder with 500 unconstrained numbers can be less free in practice than one in which a direct gesture expresses clear intent and the system performs transparent, reversible adaptation.

For JV, useful creative freedom is closer to:

> **maximum reachable meaningful design space at low enough cognitive and operational cost that the Owner can actually explore it, while preserving authorship, causality and the ability to understand what the system changed.**

This implies several simultaneous requirements:

1. **Low floor** — common construction should begin with direct manipulation rather than ceremony.
2. **High ceiling** — advanced work must not collapse into a fixed preset, socket or component taxonomy.
3. **Permissive failure** — weird, underconstrained, overconstrained or poor designs should usually remain inspectable and authorable.
4. **Explicit assistance** — snap, adaptation, inference and automation may help strongly, but should not silently rewrite intent.
5. **Mechanical truth** — when a mechanism is presented as causal, its mechanical realization should own the consequence.
6. **Recoverability** — the user must be able to experiment without fearing that one manipulation destroys the authored design state.
7. **Evolution** — a project created today should have a plausible path through improved source assets, component revisions and stronger runtimes tomorrow.

The dangerous optimization target is therefore not “fewest clicks” alone. It is **authorial leverage**.

---

## 2. Current Family C is useful because it exposes the next ceiling

Family C has produced the first strong signal that the Owner can begin treating a real JV asset as construction material rather than a parameterized fixture.

That evidence matters. The current implementation must nevertheless remain disposable.

Its hidden ceiling is now clear:

- arbitrary numbers of `Asset_Dumper` instances can be created;
- their endpoints can occupy free positions;
- but persistent fixture attachment still terminates at only six predefined sockets;
- each component is structurally biased toward the two-endpoint span problem;
- the visual complexity of a dense lattice can therefore exceed the true richness of its authored topology.

A larger socket library would postpone the problem without solving it.

**Conclusion:** the next long-term freedom problem is not “more sockets”. It is **reference freedom**: how the user can meaningfully refer to places, directions, features and interfaces that were not all enumerated in advance.

---

## 3. Cross-project donor evidence

### 3.1 E1 — clean representation can become a trap

E1 used an attractive local model:

`Participant → Point/Axis Reference → Relation`

with point-coincidence and revolute-axis relations.

The implementation correctly labeled itself `E1-LOCAL / PROVISIONAL / NOT JV ARCHITECTURE`.

That warning should be preserved. The model is elegant for its specimen but already becomes questionable for:

- a surface attachment;
- a curve or slot;
- a swept tube;
- a gear mesh;
- a belt route;
- a weld region;
- a multi-port component;
- an aerodynamic surface;
- a network connection with no meaningful transform relation.

### 3.2 REP4 / Family C — world hardpoints are apparatus, not foundation

REP4's authoring boundary names a small closed set of world-coordinate hardpoints such as `upper-bearing-a`, `chassis-tie`, and `damper-lower-eye`.

This was useful for a bounded question. It does not scale as authored truth for arbitrary construction because the identity and meaning of a reference would remain bound to one fixture-specific data structure.

### 3.3 Damper donor — adaptation is already separate from the visual mesh, but only narrowly

`c1-damper-adapter.ts` binds semantic donor parts (`Part_Upper`, `Part_Stretch`, `Part_Lower`) and realizes a requested pair of endpoints by moving rigid end pieces and stretching the central visual representation.

This is useful donor evidence for the idea:

`authored intent → adaptive realization → representation`

but its orientation semantics are deliberately incomplete. The source explicitly uses a temporary minimal-rotation roll convention and says it is not final component orientation semantics.

That is exactly the correct epistemic posture: adaptation implementation is evidence, not ontology.

### 3.4 JURE — strongest existing donor for meaning separation

`Jozz-Universal-Rig-Editor` already pressure-tested several boundaries on real glTF/GLB rigs:

- source asset identity/provenance is not authored rig truth;
- `RigElement` has stable authored identity independent of renderer objects;
- `RigFrame` is a local semantic frame that can exist without a relation;
- `RigRelation` expresses authored intent between frames;
- representation binding is separate from authored semantics;
- neutral authored pose is separate from evaluated motion;
- editor preview/selection is separate from both;
- renderer objects are disposable projections.

JURE also falsified a singleton global representation-binding model when a real source asset required more than one mapping.

This does **not** authorize importing JURE's rig kernel into JV. It does provide unusually strong donor evidence that several meanings must remain separate.

### 3.5 JES — stable identity and small-foundation strategy

JES independently reached a closely related strategic correction:

`NOT: slow universal core → plugins → experiments`

`YES: small core of meanings/data protection → replaceable capabilities for named consumers → cheap experiments with explicit exits`

JES also has executable identity tests showing that:

- deleting and recreating identical geometry at the same pose creates a different entity incarnation;
- stale commands aimed at the deleted incarnation must not retarget the replacement;
- Undo/Redo restores the exact historical identity;
- a branched history creates a new identity rather than accidentally reusing an abandoned one.

Its Future Consumer Pressure Matrix explicitly identifies parametric fabrication as a topology-regeneration problem that can destroy face indices and therefore deserves a preserved seam for feature identity without prematurely choosing the system.

This is strong cross-project corroboration.

---

## 4. External engineering precedents — useful patterns, not product templates

### Onshape Mate Connectors

Onshape treats mate connectors as local coordinate-system entities that may be defined explicitly or created implicitly from geometry. They can live on parts, curves, sketches and surfaces; a mate then defines intended degrees of freedom between connector frames.

Useful lesson for JV:

> a spatial reference does not need to be identical to the relationship that later consumes it, and useful candidate references can be inferred contextually rather than permanently displayed everywhere.

Sources:

- https://cad.onshape.com/help/Content/PartStudio/mate_connector.htm
- https://cad.onshape.com/help/Content/Assembly/mates.htm

### Persistent naming / OCAF / Open CASCADE

Parametric CAD has a well-known failure mode: topology regeneration can rename or replace faces, edges and vertices, breaking downstream references.

Open CASCADE's TNaming/OCAF architecture explicitly separates persistent reference keys from the current geometric value and records topology evolution (`generated`, `modify`, `delete`, etc.) to help resolve dependent references after model changes.

Useful lesson for JV:

> durable authored intent should not depend directly on transient renderer or mesh indices; geometry should be a realization/value behind a more stable semantic reference whenever possible.

Sources:

- https://dev.opencascade.org/doc/refman/html/_t_naming_8hxx.html
- https://sso.opencascade.com/doc/occt-6.8.0/overview/html/occt_user_guides__ocaf_wp.html
- https://reqrefusion.github.io/FreeCAD-Documentation-html/wiki/cs/Topological_naming_problem.html

### OpenUSD composition

OpenUSD demonstrates a different but relevant pressure: large authored worlds benefit from separating reusable source assets from composition, overrides, references and variants. References compose smaller assets into larger aggregates; variants allow non-destructive alternatives; stronger layers may override values without rewriting the source asset.

JV does not need USD architecture today. The useful pressure is:

> long-lived reusable component definitions, instances, per-instance intent and source revisions should not become one undifferentiated object.

Source:

- https://openusd.org/dev/intro.html

---

## 5. Candidate durable meanings — protect the distinction, not the schema

The following are the strongest **meaning-level** candidates after cross-project pressure. Their names and storage are not frozen.

### A. Stable authored identity

There must be a durable answer to:

> “which exact authored thing is this?”

Identity should not silently follow geometry, current pose, display order, physics handle, array index or source-node index.

Delete/recreate should normally mean a new incarnation. Undo/Redo should be able to restore the old one exactly.

### B. Authored intent

The state the Owner has explicitly accepted as the design must be distinguishable from anything merely calculated or previewed.

Examples may eventually include:

- this instance exists;
- this endpoint is attached here;
- this axis is intended to align there;
- this dimension is locked;
- this component may adapt along this degree of freedom;
- this subassembly exposes these interfaces.

### C. Spatial / semantic references

JV needs a concept broad enough to answer:

> “what meaningful place, direction or feature am I referring to?”

Without assuming that every answer is a socket.

Possible future realizations include points, frames, axes, surfaces, paths, regions, datum features or component-provided semantic interfaces.

Do **not** freeze this list yet.

### D. Relation / mechanism intent

A relation answers something closer to:

> “what is intended to be true between these things?”

rather than “where is the mesh?”.

A rigid attachment, revolute relationship, prismatic relationship, adaptive span, gear ratio or routed flexible transmission are not the same semantic operation even if all eventually produce physics constraints.

Relations may not always be binary. Belt/chain routes and more complex networks are immediate pressure against a universal `relation(A,B)` assumption.

### E. Adaptive realization

A component can realize authored intent by changing geometry, pose, length, proportions, variant or internal arrangement.

The result is **derived realization**, not automatically authored intent.

This distinction is essential if the Owner can later lock or unlock what adaptation is allowed to change.

### F. Source / component definition / instance

Three different meanings are likely needed long-term:

1. **source artifact/revision** — e.g. Blockbench/glTF donor material;
2. **JV component definition** — the semantic/adaptive building block JV understands;
3. **authored instance** — this particular placed use with its own identity and overrides/intent.

Project Soul already requires base instances to be capable of adopting improved source-asset versions without silently redefining radically different geometry as the same component.

### G. Representation binding

The visual mesh/bones/pieces that realize a component must not become the component's identity or mechanical authority merely because Three.js currently renders them.

A single authored component may later have multiple representations: authoring visual, runtime visual, simplified collision, high-detail display, diagnostic overlay, LOD, etc.

### H. Physical realization / evaluated state

Physics bodies, shapes, joints and solver state are generated consumer state for an authored baseline.

They should not become the only place where the Owner's construction exists.

Likewise transient simulation motion is not automatically a change to the authored neutral construction.

### I. Editor interaction state

Selection, hover, active handle, camera, current drag plane, snap preview, temporary transform and gizmo visibility are editor state.

They must be allowed to be rich and disposable without mutating the authored model until commit.

---

## 6. The highest-value new hypothesis: a Semantic Affordance Field

Family C currently makes all possible persistent fixture references visible as six hard-coded sockets.

That cannot scale to a wide creative builder. A 100-part mechanism would become a forest of thousands of permanently displayed handles.

A stronger research hypothesis is:

> **references can be partly authored and partly discovered contextually; only the user's committed choice needs to become durable authored intent.**

Working concept — deliberately not architecture:

### Before interaction

The scene remains visually clean. Components may expose a small set of strong semantic references internally, but they need not all be rendered.

### During manipulation

The active component/feature asks the scene for plausible compatible affordances near the pointer/intent:

- explicit mount frames;
- centers/axes of holes and cylinders;
- meaningful edges or surfaces;
- existing authored anchors;
- component-generated features;
- arbitrary geometry hit if the operation permits it.

These are **ephemeral candidates**.

### During preview

The system shows the exact candidate, its orientation and what relation/adaptation would result.

Nothing is yet silently authored.

### On commit

The chosen candidate is promoted into durable authored intent.

If the target already has a stable semantic reference, use it.

If it was an arbitrary geometry location, the system may need to create a persistent anchor with enough provenance/semantic signature to survive reasonable geometry evolution or at least fail diagnostically and support rebind.

### Why this matters

This would give JV both:

- the **low floor** of direct “grab this and put it here” construction;
- and the **high ceiling** of arbitrary structural work without pre-authoring every socket.

It also gives Spatial Compass a healthier role: local disambiguation of intent rather than universal manipulation ontology.

### Major risk

Persistent arbitrary-geometry anchors are difficult. Storing `meshIndex / faceIndex / vertexIndex` would reproduce the classic CAD topological-naming failure.

Therefore this concept must be tested explicitly before it becomes foundation.

---

## 7. Reference robustness ladder

Not every reference needs the same persistence strategy.

A useful pressure model is:

1. **Definition-authored semantic reference**  
   Example: damper upper eye, wheel spin axis.  
   Strongest intended identity.

2. **Generated semantic reference**  
   Example: centerline or endpoint produced by an adaptive component definition.  
   Should survive if the component's semantic feature survives.

3. **Existing authored assembly anchor**  
   User-created reusable datum/interface independent of raw mesh topology.

4. **Geometry-derived committed anchor**  
   User clicked an arbitrary valid surface/edge location. Requires provenance/signature/evolution support or explicit rebind on failure.

5. **Ephemeral interaction candidate**  
   Hover-only implicit point/axis/surface candidate. No persistence obligation until committed.

This is a pressure ladder, not a proposed enum.

---

## 8. Major anti-invariants — things we should actively refuse to freeze

### Socket-only construction

Sockets are useful authored references, not a universal grammar.

### Raw mesh topology as authored truth

`vertex 42`, `face 7`, Three object order or glTF child index are unacceptable long-term identities for durable mechanical intent.

### Physics object = component

A Box3D/Jolt/etc. body or joint cannot be the sole identity of the authored part or relation. Runtimes and physical representations must remain replaceable.

### Renderer scene graph = authored assembly

Visual parenting, authoring containment and mechanical constraint graphs are different meanings.

One hierarchy should not be forced to own all three.

### Generic parent/child tree as universal mechanism model

Mechanical, electrical, hydraulic and control networks naturally contain cross-links and cycles. Subassembly containment may be hierarchical; causal networks often are not.

### Closed universal part taxonomy

A permanent universal union such as `damper | wheel | engine | wing | ...` will become a ceiling.

This does **not** automatically prove that an ECS/capability bag is the right answer. It only rejects one closed taxonomy as foundation.

### Two-endpoint span as universal component grammar

The damper is an excellent representative adaptive component and a terrible universal ontology.

### Binary-only relations

Belts, chains, cable routes, hydraulic/electrical networks and some multi-body mechanisms immediately pressure N-ary or network semantics.

### One global solver silently repairing authoring

A powerful solver that moves user-authored geometry until everything becomes valid can reduce authorship and make causality opaque.

Solver assistance should remain explicit, previewable and attributable.

### Automatic adaptation with no provenance

If the system changes a dimension, mount, variant or orientation, the Owner should eventually be able to know whether that value was:

- explicitly authored;
- inherited from definition;
- inferred/defaulted;
- adapted from relations;
- locked by the Owner;
- runtime-derived.

The exact provenance model remains open, but collapsing these meanings would make later intent locks unreliable.

### Universal XYZ gizmo as the interaction language

XYZ can remain an important precision fallback. It should not define the product's construction semantics.

---

## 9. Definition / instance / revision pressure

Project Soul expects improved base assets to propagate to existing component instances where sensible.

That creates a hard architectural pressure long before we choose implementation:

```text
SOURCE REVISION
      ↓
COMPONENT DEFINITION / SEMANTIC CONTRACT
      ↓
AUTHORED INSTANCE INTENT + OVERRIDES
      ↓
ADAPTIVE REALIZATION
      ↓
VISUAL + PHYSICAL REPRESENTATIONS
```

A source mesh update should be able to improve visuals without destroying instance identity.

A component-definition revision may alter adaptation behavior or semantic references and therefore needs a controlled migration/re-resolution story.

A radical semantic break should normally become a new definition rather than silently mutating the meaning of existing builds.

This pressure strongly argues against storing instance intent as edits directly on arbitrary source mesh nodes.

---

## 10. Subassemblies are not just groups

Extreme creative development will eventually need reusable user-built mechanisms.

A useful subassembly must plausibly support:

- stable identity for the subassembly definition and each instance;
- internal authored topology;
- exposed external semantic interfaces;
- internal changes propagating to instances where intended;
- per-instance overrides without duplicating the whole definition;
- mirror/copy/variant operations with explicit identity policy;
- ability to edit internally without breaking external relations unnecessarily.

This is closer to composition than to a viewport “Group”.

OpenUSD demonstrates mature non-destructive definition/reference/override/variant pressure, but its exact scene-composition model should not be imported into JV without a real consumer.

---

## 11. Multiple causal domains must remain possible

Long-term JV should not assume that every meaningful connection is a geometric joint.

A component may eventually participate simultaneously in:

- rigid-body/mechanical constraint networks;
- torque/power transmission;
- electrical connections;
- hydraulic/pneumatic flow;
- control/signal networks;
- thermal systems;
- aerodynamic surfaces/flow consumers;
- gameplay/world interactions.

A jet engine, active suspension unit or anti-gravity component could therefore expose several different semantic capabilities while remaining one authored component instance.

The immediate conclusion is narrow:

> do not make the transform hierarchy or one universal mechanical `Connection` object the only extension seam.

The actual domain/capability system remains deferred.

---

## 12. Permissive invalidity as a foundation pressure

A creative sandbox should be able to preserve authored states that are not currently simulatable or mechanically sensible.

Examples:

- disconnected part;
- unsupported assembly;
- self-intersection;
- impossible hard collision at start;
- overconstrained mechanism;
- underconstrained mechanism;
- missing source asset after reimport;
- broken persistent feature reference;
- actuator outside supported range;
- physics backend unable to realize a relation.

The preferred semantic response is:

`preserve authored intent → diagnose locally → explain consequence → run what can be run when safe`

not:

`silently repair`, `delete invalid data`, or `refuse the whole project`.

Program-stability/data-integrity limits remain valid hard boundaries.

---

## 13. Future break-test matrix

Any candidate future foundation should be considered suspicious until it can plausibly survive materially different cases.

| Break test | Pressure exposed |
|---|---|
| Damper between two mounts | simple two-reference adaptive span |
| Frame tube between arbitrary surface points | socketless committed geometry references |
| Tube endpoint moved after placement | adaptation + stable intent |
| Wishbone / triangular arm | 3+ interfaces; orientation cannot be inferred from one span |
| Steering knuckle / hub | many semantic frames on one rigid component |
| Wheel / axle | axis + roll + revolute mechanical intent |
| Telescopic actuator | adaptive length + travel + actuator semantics + locks |
| Cardan / driveshaft | rotating transmission between moving references |
| Gear pair | geometry-derived engagement + ratio relation |
| Rack-and-pinion | spatial relation + nontrivial motion mapping |
| Belt / chain / rope route | path/N-ary relation, not pairwise point connection |
| Welded tube frame | structural attachment to arbitrary surfaces/regions |
| Adapter plate | placed component creates new usable references/interfaces |
| Reusable suspension subassembly | internal graph + exposed external interfaces + instancing |
| Mirrored subassembly | identity and handedness policy |
| Replace damper with compatible component | relation preservation / compatibility / migration |
| Source asset visual revision | instance survives representation update |
| Source topology revision | persistent feature re-resolution or explicit rebind |
| 100+ overlapping components | selection/affordance scalability |
| Half-broken absurd construction | permissive invalidity + diagnosis |
| BUILD → RUN crash/deformation → BUILD | authored baseline survives evaluated/runtime mutation |
| Jet / propeller / wing | nonstandard physical capabilities without special-casing builder architecture |
| Electrical/hydraulic/control network | non-spatial/cross-domain graph |
| Component with no visual mesh | authored semantics not dependent on renderer representation |
| Component with multiple visuals/LODs | representation multiplicity |

This matrix should evolve. Passing one row must never be generalized to all rows.

---

## 14. Strongest provisional invariants after this audit

These are not a final schema. They are the meanings currently supported by the broadest evidence and most expensive to lose accidentally.

### `PROTECT`

1. **Stable authored identity is independent of geometry/pose/runtime handles.**
2. **Authored intent is distinct from preview, adaptive realization, evaluated runtime state and evidence.**
3. **Source asset/provenance, JV semantic definition, authored instance and representation binding are different authorities.**
4. **A meaningful local reference/frame can exist independently of a relation.**
5. **Committed relations should target durable semantic references where possible, not transient renderer topology.**
6. **Preview/commit/cancel and reversible history are first-class authoring semantics, not UI decoration.**
7. **Mechanical networks must not be forced into the visual/containment hierarchy.**
8. **Invalid authored states should normally remain data with diagnostics rather than be silently repaired/deleted.**
9. **Component and source revisions need a path that preserves instance identity and Owner intent where semantics remain compatible.**
10. **The final extension model must be able to grow beyond predefined vehicle-part categories and beyond spatial mechanical joints.**

### `PRESERVE SEAM / DO NOT DESIGN YET`

- persistent feature naming/rebind strategy;
- exact reference taxonomy;
- exact relation taxonomy and arity;
- intent-lock representation;
- generic component capability model;
- subassembly/definition override semantics;
- solver architecture;
- physical representation multiplicity;
- plugin/scripting ABI;
- final file format/schema.

### `REJECT AS FOUNDATION`

- Family C's six sockets;
- E1 point/axis relation types;
- REP4 hardpoint enum;
- C1 damper minimal-roll convention;
- Three.js scene graph;
- one physics backend's body/joint handles;
- one universal XYZ/Spatial Compass interaction;
- one closed component class hierarchy.

---

## 15. Most valuable next research questions after the audit

The audit changes the likely sequence of evidence.

### RQ-A — Reference freedom

Can the Owner create a real structural attachment to a meaningful place that was **not pre-authored as a socket**, while the system keeps the gesture understandable and the committed reference inspectable?

A strong bounded specimen would use a real asset and one arbitrary surface/edge/derived feature target, not a new general framework.

### RQ-B — Reference survival

After a bounded adaptive/revision change, can that authored reference either:

- still resolve to the intended semantic feature; or
- fail explicitly with enough provenance to repair/rebind it;

without silently attaching somewhere else?

### RQ-C — Component diversity

Does the promising interaction grammar survive a component that is *not* a two-eye damper — ideally a 3+ interface mechanism where orientation and multiple references matter?

### RQ-D — Intent locks / adaptation ownership

When the user changes one thing in an adaptive mechanism, what should remain fixed, what may adapt, and how can JV expose that distinction without turning construction into a form editor?

### RQ-E — Structural composition

Can a small mechanism built by the Owner become a reusable subassembly with an explicit external interface without flattening or duplicating away its internal identity?

### RQ-F — Causal loop

Only after construction naturalness survives the above should the strongest candidate grammar be carried through real physics and the short BUILD → RUN/DRIVE → BUILD loop.

---

## 16. Recommended research posture

Do **not** respond to the Owner's request for extreme freedom by immediately building a universal framework.

The more ambitious the destination, the more important it is that the early foundation remain small.

The right strategy is:

```text
PROTECT A FEW MEANINGS THAT MULTIPLE CONSUMERS ALREADY NEED
        ↓
KEEP REFERENCES / RELATIONS / CAPABILITIES OPEN
        ↓
ATTACK THE WIDEST FAILURE MODES WITH SMALL REAL-ASSET EXPERIMENTS
        ↓
PROMOTE ONLY CROSS-PROBLEM INVARIANTS
        ↓
LET THE FOUNDATION GROW FROM PRESSURE, NOT ANTICIPATION
```

This is the best current route to a JV that can eventually become enormous without its first successful damper experiment deciding what every future machine is allowed to be.

---

## 17. Current conclusion

The most important outcome of the expanded audit is a shift in what “foundation” means.

The foundation should **not** initially be:

- a universal Component class;
- a master Constraint enum;
- a socket system;
- a scene hierarchy;
- a giant editor framework;
- a generic plugin engine.

The strongest current foundation candidate is much smaller:

> **stable authored identities and intent, explicit semantic references, clean separation from realization/representation/runtime, reversible authored transitions, and preserved seams where future consumers can add richer relations and capabilities without changing what existing authored things mean.**

The most promising new construction direction is correspondingly not “more mounts”, but:

> **contextual semantic affordances → explicit preview → commit to durable authored reference.**

That direction can potentially provide the low-floor feeling emerging in Family C while escaping its six-socket ceiling.

It remains a hypothesis and should be attacked next with real bounded evidence, not promoted directly to architecture.
