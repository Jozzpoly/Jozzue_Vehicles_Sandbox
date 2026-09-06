# Nextgen JV — Creative Freedom Foundation Red-Team

Date: 2026-09-06  
Status: **adversarial correction to the foundation audit / NOT architecture**  
Parent synthesis: `evidence/grammar/JV_CREATIVE_FREEDOM_FOUNDATION_AUDIT_2026-09-06.md`

## 0. Why this second pass exists

The first creative-freedom audit deliberately avoided a universal framework, but it still used attractive words such as `component`, `reference`, `relation`, `definition`, `instance` and `Semantic Affordance Field`.

Those words can become architecture gravity even when a document says “not architecture”.

This pass therefore tries to break the synthesis itself.

The adversarial question is:

> **If JV eventually supports mechanisms, arbitrary structural fabrication, reusable assemblies, unusual propulsion, world interaction, electrical/hydraulic/control networks, continuously adaptive parts and source revisions over years, which assumptions in our current vocabulary would become the next cage?**

The desired output is a *smaller* foundation, not a more complete schema.

---

## 1. Correction: `Component` is not a safe universal root

A future JV project can contain authored things that are not naturally “components”:

- an explicit datum or construction frame;
- a user-created anchor on existing geometry;
- an axis inferred from two physical mounts;
- a mechanical relation;
- a belt or cable route;
- a subassembly definition;
- an exposed subassembly interface;
- an electrical or hydraulic connection;
- a control mapping;
- a world anchor or interaction region;
- a diagnostic/measurement definition;
- potentially a procedural construction recipe.

Forcing all of these to inherit from or masquerade as `Component` would produce a pseudo-universal ontology.

### Red-team conclusion

The strongest minimal guarantee is not a Component base class. It is closer to:

> **some committed authored things have stable identity and scoped meaning, and consumers must not confuse that identity with geometry, display objects or runtime handles.**

The exact set of authored thing categories remains open.

Product-facing “components” remain central to JV. They simply should not become the ontological root merely because the first successful construction object is a damper.

---

## 2. Correction: definition → instance is a pressure, not a law of existence

Reusable component definitions and authored instances are strongly motivated by asset updates, repeated parts and subassemblies.

But not every authored thing needs a reusable definition.

Examples:

- a one-off construction datum;
- a unique world anchor;
- a geometry-derived attachment created during one build;
- a transiently committed repair/rebind point;
- an inline one-off procedural construction.

Requiring a reusable definition for all authored content could turn direct play into ceremony.

### Red-team conclusion

Protect the distinction **when reuse exists**:

`source / reusable definition / authored use / realized representation`

Do not require every authored identity to pass through all four layers.

---

## 3. Correction: `Reference` must not mean only a rigid frame

JURE gives strong evidence that a local rigid `RigFrame` is an excellent semantic unit for mounts, pivots and axes. Onshape similarly uses local coordinate-system Mate Connectors.

That does not make a rigid frame a universal address.

JV may need references to:

- a rigid local point/frame/axis;
- a world datum;
- a curve/path and a parameter along it;
- a surface region and local material coordinates;
- an adaptive component feature generated from parameters;
- a relation-derived point or line;
- a volume/region;
- a moving or deforming material location;
- a semantic interface that is not primarily spatial at all.

### Three useful coordinate-pressure classes

Without freezing implementation, future consumers already pressure at least three different address spaces:

1. **rigid local coordinates** — good for mounts, pivots, sensor frames;
2. **procedural/material coordinates** — good for adaptive tubes, swept geometry, deforming/generated features;
3. **world/external coordinates** — good for fixtures, world anchors and external reference geometry.

More may appear.

### Red-team conclusion

Protect **addressability and resolution semantics**, not a universal `Frame` type.

---

## 4. Correction: the Semantic Affordance Field must be a negotiation, not an oracle

The first audit proposed contextual affordances instead of permanently displaying every possible socket.

That direction survives, but the naive version is dangerous.

A global system that scans the world and declares “best connection here” could become an opaque hidden authoring solver.

A stronger formulation is:

```text
ACTIVE AUTHORING INTENT
+ SOURCE-SIDE SEMANTIC POSSIBILITY
+ TARGET-SIDE CONTEXTUAL AFFORDANCES
+ CURRENT INTERACTION CONTEXT
→ SMALL SET OF EXPLICIT CANDIDATE COMMITMENTS
```

Example:

- dragging a damper eye does not ask for every possible relation in the scene;
- the active eye already narrows the problem to compatible spatial/mechanical intents;
- nearby holes, explicit frames, surfaces or existing anchors produce a few candidate targets;
- the UI previews exactly what each candidate would commit;
- ambiguous candidates may be cycled, locked or rejected rather than silently chosen.

### Important scaling consequence

Candidate affordances should be **lazy and local**.

A 500-part assembly should not instantiate or render every possible inferred point/axis/surface anchor. Most potential references should remain cheap derived possibilities until interaction makes them relevant.

### Red-team conclusion

The core idea becomes:

> **contextual candidate generation + explicit preview + explicit commit**

not “smart snapping”.

---

## 5. New trust invariant: correct-or-broken, never plausibly-wrong

Persistent references are one of the most dangerous long-term failure modes.

If a source asset or adaptive component changes topology, JV must not silently reattach an authored relation to the nearest plausible replacement merely to keep the project green.

A wrong-but-valid-looking mechanism is worse than a visibly broken reference because it corrupts the Owner's causal model.

### Pressure contract

A durable reference resolver should conceptually be able to end in states such as:

- resolved unambiguously;
- target intentionally deleted;
- missing;
- ambiguous;
- incompatible after revision;
- repair/rebind available.

These are not proposed final enums.

The semantic rule is:

> **if the intended target cannot be re-established with enough confidence, preserve the authored reference/provenance and surface the break instead of silently choosing a new target.**

Open CASCADE/OCAF is useful pressure here because its reference-key/topological-naming model separates persistent references from current geometry and records topology evolution. JV does not need OCAF, but it should learn from the class of problem.

---

## 6. Feature identity should be strongest where the component knows its own meaning

Not all persistent geometric references need equally hard machinery.

### Strongest case: definition-authored feature identity

If a component definition knows it has:

- `upper-eye`;
- `wheel-axis`;
- `shaft-output`;
- `mount-face`;

those semantic features can remain stable even when the visual mesh changes substantially.

### Procedural/adaptive case

A procedural component may expose references in its own semantic parameter space.

For a conceptual adaptive tube, an attachment could potentially be described by something like:

- owning component identity;
- semantic surface/feature identity;
- normalized position along span;
- circumferential/local orientation;
- expected semantic/geometric signature.

This is a **research hypothesis**, not a proposed storage format.

It illustrates an important possibility: a generated component can often preserve intent more robustly through semantic coordinates than through raw triangle IDs.

### Weakest case: unstructured imported geometry

When a user commits an arbitrary point on geometry with no semantic definition, the reference may require weaker provenance/geometric signatures and may legitimately break after a major reimport.

Explicit repair is preferable to pretending all arbitrary geometry can be named permanently.

---

## 7. Major correction: “locks” are really authority over degrees of freedom

The first audit treated intent locks as an unresolved feature. The red-team suggests a deeper framing.

Consider one damper-like component in BUILD:

- endpoint A may be fixed by a committed attachment;
- endpoint B may be directly authored by the Owner;
- current visual length is derived from A/B;
- roll may be inferred by a component rule;
- rest length may be an authored physical property;
- actual compression during PLAY is runtime-evaluated state.

A single boolean `locked` is not enough to explain this.

The real issue is **who currently owns each meaningful degree of freedom/value**.

Candidate authority sources may include:

- explicit Owner authored value;
- relation/reference-derived value;
- component adaptation rule;
- inherited/default definition value;
- solver proposal accepted by the Owner;
- transient runtime/evaluated value.

This is not a request to implement a generic property-provenance database now.

### Red-team conclusion

Preserve the seam for **authority/provenance of derived versus authored state**.

An intent lock can later be understood as a change in allowed authority: “this quantity is no longer free for adaptation” rather than merely an arbitrary UI checkbox.

---

## 8. Rep3 adds a crucial hybrid lesson: geometry may define mechanics, until it does not

Rep3 demonstrated a bounded geometry-first relation:

`two physical mounts → derived hinge line → native revolute relation`

No hidden editable solver axis was necessary for that specimen.

But Rep3 explicitly preserved a hybrid hypothesis:

- visible geometry can provide the strong default/inference;
- an explicit correction or intent lock may become necessary when real mechanisms introduce ambiguity.

It also showed why full internal solver-frame gauge/roll should not become authored semantics just because the physics API requires a quaternion.

### Red-team conclusion

Do not force either extreme:

- **everything is manually authored abstract mechanics**, or
- **everything must always be inferred from visible geometry**.

Prefer:

> **physical/semantic geometry owns what it can unambiguously own; only promote additional authored degrees of freedom when a real mechanism requires them.**

This protects both directness and extensibility.

---

## 9. `Relation` is not a universal connection language

Mechanical rigid-body relations are only one causal domain.

Future components may participate in several simultaneously:

- rigid-body kinematics;
- torque/power transmission;
- electrical networks;
- hydraulic/pneumatic flow;
- control/signal routing;
- thermal exchange;
- aerodynamic force generation;
- gameplay/world-material interactions.

Modelica is useful external pressure because its component connections have domain-specific variables and semantics: potential, flow, stream and causal connectors are deliberately not interchangeable.

This does **not** mean JV should implement Modelica.

It means a single universal `Connection { a, b }` object with transform semantics would likely be a future cage.

### Red-team conclusion

Protect only a weaker seam:

> **authored things may expose scoped semantic interfaces/endpoints that domain-specific capabilities can consume.**

The exact endpoint/capability/connection model remains deferred until named consumers exist.

---

## 10. Authored relation graph != runtime interaction graph

A physical runtime continuously creates interactions that were never explicitly authored:

- contacts;
- friction constraints;
- collisions;
- aerodynamic interactions;
- terrain support;
- impact impulses.

These are real and causal, but they should not automatically become authored relations.

Likewise a user may place two components touching without creating a persistent weld/hinge relation; physics may still make them collide.

### Red-team conclusion

Preserve:

`AUTHORED INTENT GRAPH(S) != TRANSIENT EVALUATED INTERACTION GRAPH(S)`

A future explicit `capture` operation may deliberately convert a runtime observation/result into authored truth, but that is a new authoring act.

---

## 11. Construction itself should be able to create new future affordances

A wide-wall builder cannot rely only on feature references supplied by factory component definitions.

The Owner should eventually be able to construct something that creates new useful interfaces.

Example pressure:

1. place an adapter plate on a chassis;
2. create or select a datum/hole/mount on that plate;
3. attach a damper or wishbone there;
4. expose part of the resulting mechanism as a reusable subassembly interface.

The construction has now expanded the set of semantically useful places in the project.

### Red-team conclusion

Committed user-created references/datums are potentially first-class authored meaning, not merely editor helpers.

This is one of the clearest escape routes from Family C's six-socket ceiling.

---

## 12. Subassembly containment and causal networks must be separate

A reusable suspension corner can reasonably contain internal authored identities and expose external interfaces.

Containment/composition may therefore form a hierarchy.

But the physical/electrical/control relations inside and across subassemblies may form arbitrary graphs with cycles and cross-boundary links.

JURE deliberately avoided a generic hierarchy in its small kernel; JES independently warns that visual bone, hardpoint, relation and attachment are not one hierarchy edge.

### Red-team conclusion

Do not let any one tree simultaneously own:

- object organization;
- transform parenting;
- reusable-definition containment;
- mechanical joints;
- power/signal networks;
- renderer scene graph.

They may project onto each other where appropriate, but their authorities differ.

---

## 13. Identity operations need explicit semantics

Stable identity is not only about delete/recreate.

Extreme authoring pressures:

### Duplicate / pattern

A copied authored thing should normally receive fresh identity even if every initial property matches.

### Undo / Redo

Restoring historical authored state should restore its historical identity where the original operation is being restored.

### Mirror

A mirrored part/subassembly may require more than a copied transform:

- handed semantic interfaces;
- left/right feature correspondence;
- sign conventions;
- control direction;
- asymmetric source variants.

### Replace

Replacing a damper with a compatible actuator raises the question:

> which external references/relations are semantically compatible enough to preserve, and which must break explicitly?

### Red-team conclusion

Do not define these policies globally today, but do not let ordinary object cloning accidentally define them either.

---

## 14. Revision/migration pressure is part of creative freedom

Extreme creative freedom is not only the design space reachable today. It also means the Owner can keep a vehicle/project alive while JV and its assets improve.

Three distinct revisions may eventually matter:

1. source visual/artifact revision;
2. component semantic-definition revision;
3. authored project/document revision.

A purely visual source revision should be able to improve representation without changing authored instance identity.

A semantic-definition revision may require migration/re-resolution of features, defaults or adaptation behavior.

A breaking semantic change should be able to fail or become a new definition instead of silently changing the meaning of old vehicles.

OpenUSD's composition/reference/override/variant model is useful pressure showing that reusable definitions and downstream overrides can evolve non-destructively, but JV should not copy USD's complete composition engine without need.

---

## 15. Extension pressure: unknown future component types must not require a core rewrite

Long-term JV explicitly wants room for unusual components such as propellers, wings, jets and more speculative drives that remain coherent with the world's physics.

Therefore future component kinds unknown today must have somewhere to add:

- semantic interfaces/references;
- authoring affordances;
- adaptation behavior;
- physical/evaluated behavior;
- diagnostics;
- representations.

But this pressure does **not** justify implementing a plugin ABI, ECS, universal capability bag or scripting VM today.

### Red-team conclusion

The immediate requirement is only:

> **do not freeze a closed central taxonomy whose schema must be edited every time a new meaningful component class appears.**

The extension mechanism itself remains consumer-driven and deferred.

---

## 16. Directness and exactness are complementary layers

The Owner's desired builder cannot be reduced to one manipulation tool.

A high-ceiling interaction likely combines, when appropriate:

- direct grab/drag;
- contextual semantic snap/preview;
- local mechanism-aware manipulation;
- world/local/reference coordinate fallbacks;
- exact numeric values;
- optional grid/snap;
- explicit intent locks/authority controls;
- later, higher-level reusable operations or automation.

Spatial Compass is therefore best understood as one experiment in **precision escalation**, not a foundation gizmo.

Creative freedom is the ability to move between these layers without changing the meaning of the authored construction.

---

## 17. Scale pressure changes interaction implementation, not authored meaning

A future assembly with hundreds or thousands of authored entities should not require:

- displaying every potential mount;
- resolving every possible relation continuously;
- exposing every internal subassembly entity at all zoom levels;
- maintaining a persistent authored object for every hover candidate.

Likely future implementation techniques include spatial filtering, contextual candidate generation, interaction scopes and level-of-detail presentation.

Those are not foundation semantics.

### Durable pressure

A reference that was committed while zoomed deeply into one subassembly must still mean the same authored thing when that subassembly is collapsed, instanced, hidden or represented at another display LOD.

---

## 18. Runtime fidelity must remain a consumer choice without falsifying authored causality

The same authored mechanism may eventually have different evaluated representations for different purposes:

- authoring preview;
- high-fidelity local mechanism test;
- whole-vehicle simulation;
- cheap remote/mobile playback;
- diagnostics.

This does **not** authorize canonical “execution modes”.

It creates only a pressure:

> authored intent should not be encoded so tightly in one physics backend's bodies/joints that another legitimate evaluator cannot consume the same design meaning.

Any simplification must remain honest about what causal claim it can support.

---

## 19. Serialization should preserve authored meaning, not runtime accidents

A long-lived project format eventually needs:

- explicit schema/version identity;
- deterministic enough authored semantics to validate/migrate;
- stable IDs where persistence matters;
- explicit broken/unresolved references rather than silent data loss;
- source/component revision provenance where needed;
- no dependence on current renderer object order or physics handle allocation.

But designing the final file format now would be premature.

### Red-team conclusion

Protect **serializability and migration pressure**, not a schema.

---

## 20. Foundation minimization after the red-team

The first audit listed several candidate durable meanings. After trying to break them, the foundation can be described more minimally.

### Meaning Protection Layer — conceptual only

```text
COMMITTED AUTHORED IDENTITIES + INTENT
        │
        ├── durable addresses/references only where something is actually referenced
        ├── explicit authority/provenance boundary for authored vs derived state
        ├── reversible/versioned authored transitions
        └── unresolved/broken meaning can survive without silent retarget

                 ↓ consumed by

REPLACEABLE RESOLVERS / DOMAIN CAPABILITIES / ADAPTERS

                 ↓ produce

DERIVED REALIZATIONS
  visual / physical / aero / power / control / diagnostics / etc.

                 ↓

TRANSIENT EVALUATED RUNTIME + OBSERVATION
```

SOURCE/provenance feeds authored adoption/definitions from the side. Editor preview/selection/camera live outside committed truth until commit.

This diagram is **not** a proposed class structure.

### What survives strongest

1. Stable authored identity where persistence matters.
2. Committed authored truth cannot be silently overwritten by preview, runtime or derived realization.
3. Durable references must resolve honestly or remain visibly broken/ambiguous.
4. Derived/adaptive values need enough authority provenance that later intent locks can be meaningful.
5. Representation and runtime backends remain consumers, not authored authority.
6. Domain-specific systems must be free to introduce richer semantics without rewriting existing authored identity.
7. Direct interaction and exact authoring must converge on the same committed meaning.

Everything else remains under pressure.

---

## 21. Revised break-test campaign

Before promoting a generic foundation, deliberately attack these cases in increasing cost:

### RF0 — contextual reference creation

A real component endpoint is attached to a meaningful target that was **not pre-authored as a socket**.

Requirements:

- candidate appears only contextually;
- exact prospective result is previewed;
- release explicitly commits;
- committed reference has stable owning identity/provenance;
- undo restores exact prior authored state.

### RF1 — reference survives a benign change

Change the target/component in a way that should preserve the intended semantic feature.

The reference must either remain correct or be explicitly unresolved. Silent plausible retarget is a FAIL.

### RF2 — deliberate feature break + repair

Remove or incompatibly revise the referenced feature.

The authored project must survive with a diagnosable broken reference and support an explicit bounded rebind path.

### CD0 — non-damper component diversity

Use a 3+ interface component/mechanism where one span axis is insufficient.

Goal: falsify the damper-centric interaction/reference assumptions.

### AO0 — adaptation ownership

Create one construction where two or more plausible adaptation outcomes exist.

The test should expose whether the Owner can understand/control what is allowed to adapt without a giant parameter form.

### SA0 — reusable subassembly interface

Turn a small Owner-built mechanism into a reusable unit with explicitly exposed external references while internal identity remains intact.

### MD0 — non-mechanical domain pressure

Connect one mechanical component to a second domain such as control/power without forcing that connection into transform hierarchy semantics.

This may remain a later paper/probe test until a real project consumer exists.

### CA0 — causal BUILD → RUN/DRIVE

Only once a sufficiently natural construction grammar survives RF/CD/AO pressure, carry it into real causal evaluation and exact BUILD recovery.

---

## 22. Best current next experiment

The highest information-gain next experiment after the Owner Spatial Compass checkpoint is **RF0: contextual reference creation**.

Why RF0 outranks “more gizmo polish”:

- Family C's strongest current ceiling is six pre-authored sockets;
- the new Spatial Compass already has a technically qualified route for camera-coherent direct manipulation;
- reference freedom is necessary for the Owner's observed desire to build arbitrary geometry;
- RF0 can be disposable and small without deciding the final reference schema;
- it directly tests the Semantic Affordance hypothesis rather than merely documenting it.

Why RF0 should remain bounded:

- do not build persistent naming infrastructure first;
- do not build a generic component framework;
- do not add physics;
- do not solve all surfaces/edges/holes;
- choose one materially meaningful non-socket target class and one explicit commit/revert path.

If RF0 feels worse than explicit sockets, that is valuable evidence: reference freedom may need a different interaction grammar before any foundation work.

---

## 23. Final red-team verdict

The first audit survives, but in a narrower form.

The long-term foundation should not be “a flexible component system”. That phrase is still too architectural and too easy to close accidentally.

The strongest current direction is:

> **Protect authored identity, intent, trustworthy reference resolution, authority provenance and reversible transitions. Let components, relations, networks, representations, physics and future domains remain replaceable consumers that earn stronger common abstractions only after multiple real mechanisms need them.**

For creative freedom, the most promising product-level hypothesis remains:

> **the user should be able to point at meaningful geometry or semantic features, receive a small explicit set of context-aware possibilities, commit exactly the intended one, and then continue building new structures that themselves create further usable affordances.**

That is considerably wider than Family C's six sockets while still preserving the direct, playful “I am building my mechanism” signal that finally appeared in Owner hands-on.
