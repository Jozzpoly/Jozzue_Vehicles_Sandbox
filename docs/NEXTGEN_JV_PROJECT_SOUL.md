# Nextgen Jozz Vehicle — Project Soul

This document records the durable product intent of the next-generation Jozz Vehicle project.

It is **not** a final architecture, data model, engine decision, implementation plan or frozen UX specification. It should survive individual experiments and protect the project from accidentally turning a successful prototype, donor, tool or temporary representation into the product itself.

## 1. Product essence

Nextgen Jozz Vehicle is a mechanically credible vehicle sandbox centered on a short creative loop:

`build → run → observe → improve → get in and drive`

The important property is not that every phase occurs in one process, window or runtime. The important property is that the round trip is short, natural and preserves the user's construction and intent.

The desired experience is not primarily selecting a finished vehicle and tuning parameters. It is **making mechanisms and vehicles, seeing why they behave as they do, changing them, and immediately experiencing the consequences through motion and driving**.

The product should make mechanical causality tangible.

## 2. Priority order

When priorities conflict, current development should prefer:

1. a good vehicle;
2. good mechanics;
3. good driving feel;
4. conscious, direct building and rebuilding;
5. a world that is rewarding to drive through and experiment with.

This order does not mean the builder is secondary. It means construction must remain connected to a vehicle worth understanding and driving rather than becoming an isolated CAD exercise.

Likewise, visual richness and world breadth should not hide a weak mechanical core.

## 3. The builder should feel like construction, not configuration

The long-term builder should support direct spatial work on the vehicle and its mechanisms.

Preferred interaction qualities include:

- grabbing, dragging and moving meaningful parts or attachment points directly;
- gizmos when they improve control rather than replace spatial understanding;
- snapping and grid assistance that can be disabled;
- exact numeric entry alongside direct manipulation;
- topology changes and rebuilding, not only tuning predefined assemblies;
- components that can change dimensions, proportions and variants according to their function;
- mechanisms assembled in combinations that were not individually anticipated by the developer.

A UI that merely exposes many sliders or presets is not sufficient because it can become a configurator disguised as a builder.

Direct manipulation also must not become a three-dimensional disguise for a single scalar when the research or product claim concerns genuine construction.

## 4. Adaptive components are a product direction, not yet a solved semantics

A central product direction is that base components can become specific useful parts inside JV.

Examples include a frame tube that can span two points and rebuild its length automatically, or a mechanical part that changes thickness, proportion, mounting geometry or a bounded functional variant.

The working intuition is:

> **Blockbench creates a building block; JV turns it into a specific adaptive part.**

This does not yet define how adaptation is represented or controlled.

Future adaptation may need explicit intent locks or comparable controls so the user can decide which properties are allowed to change. Sensible defaults and additional locks can coexist. The correct boundary must emerge from real construction tasks rather than being designed abstractly in advance.

Automatic adaptation must remain understandable. A component silently changing an important mechanical property can invalidate the user's causal model even if it makes a prototype easier to operate.

## 5. Mechanical causality matters more than convenient imitation

When a vehicle behavior is meant to result from a mechanism, the mechanism should own that consequence wherever practical.

A steering linkage should affect steering because its geometry and physical relationships produce that response, not because the final wheel angle is secretly mapped from a parameter while the mechanism is decorative.

This does not require every research prototype to simulate every physical detail. Simplifications are allowed when their boundary is explicit and they do not falsify the question being tested.

The default product aspiration is mechanically credible behavior. Unusual components — for example propellers, jet propulsion, wings or more speculative drives — can belong in the sandbox if they obey the accepted laws of the world in which they operate.

## 6. Permissive experimentation

The builder should be permissive rather than paternalistic.

Most strange, poor or absurd constructions should be runnable even when the system can predict they will behave badly. The product should prefer:

`diagnose → explain → allow experimentation`

over
`decide for the user → forbid`.

Hard prevention should be reserved for cases where program stability, data integrity or comparable critical safety requires it. Publication-facing constraints can be considered later without making the creative core restrictive by default.

Failure can be part of the experiment.

## 7. Understanding cause is more valuable than raw debug volume

Telemetry, graphs, traces and overlays can be useful, but they should support understanding rather than substitute for it.

The preferred question is:

> **why did this mechanism or vehicle behave this way?**

not merely:

> **what numbers did the simulation output?**

Owner-visible behavior should be readable enough that important consequences are perceptible in the scene or driving experience. V0 demonstrated that a strong machine-measured difference can still be useless to the Owner when orientation, camera or presentation hides it.

Replay, ghost and A/B comparison tools are potentially valuable, but they are supporting instruments rather than the product's organizing center.

Different research questions may require different comparison contracts: identical input, identical trajectory/speed, a controlled stimulus or a hybrid. Do not assume one universal replay definition.

## 8. Asset and authoring direction

The preferred long-term content workflow is not to model every final component from scratch inside JV.

Base visual/mechanical assets are expected to be authored occasionally in Blockbench and then used broadly through JV's adaptation and composition systems. Blender should remain an advanced exception when genuinely necessary rather than the default dependency for ordinary vehicle building.

JV does not need vertex-level mesh editing as a core product capability.

A useful component should usually be built from adaptable base pieces or from several simpler pieces before requiring a new external asset type.

Base component instances should normally adopt improved source-asset versions automatically. A radically changed geometry should more often become a new component rather than silently redefining an old one.

Existing Native/JV-Web/Blockbench/glTF material is donor evidence and reusable capital, not automatic architecture authority.

Once research moves from abstract apparatus toward product-facing construction, real assets should enter early enough that placeholder readability does not become the dominant confound or create a parallel visual system that later has to be discarded.

## 9. Vehicle before world, but the world should eventually react

The near-term center is the vehicle, its mechanics, building loop and feel.

Longer-term world interaction is important. Particularly interesting directions include:

- ruts and tracks;
- terrain responding to weight and repeated passage;
- local deformation or destruction of ordinary world material;
- other emergent vehicle↔world interactions.

This interest does **not** imply destructive deformation of photogrammetric scans as a product requirement.

Advanced BeamNG-like soft-body vehicle damage is not a current pillar. It remains a distant possibility and should not steer the near-term architecture.

## 10. Platform direction

The current authoring priority is desktop/full-browser use with mouse, keyboard and a large display.

A desktop browser version should ultimately expose as much of the full authoring experience as practical. Mobile builder work is attractive long-term but should not distort current design.

A more immediate mobile goal is the ability to export or launch builds conveniently on a phone rather than reproduce the entire desktop authoring surface there.

No current experiment establishes the final desktop/native/Web split.

## 11. Product loop quality beats implementation purity

An ideal technical implementation is not valuable if it makes the creative round trip slow, fragile or cognitively expensive.

The builder/runtime boundary should be chosen to preserve a short loop. Live edit/unpause is attractive, but not a hard architectural requirement. Separate processes or applications are acceptable when the transition is fast and natural.

The user should not have to repeatedly reconstruct context, reload a vehicle through unnecessary ceremony or perform technical operations just to feel the consequence of an edit.

## 12. Research before architecture convergence

The project is intentionally not choosing its final architecture yet.

Experiments should answer representative product questions. A successful experiment may contribute:

- a demonstrated product requirement;
- a falsified assumption;
- a useful interaction pattern;
- a mechanical invariant;
- a reusable implementation technique;
- evidence that a donor or substrate is sufficient for a bounded purpose.

It does **not** automatically contribute architecture authority.

Architecture should begin to converge only after multiple materially different representative problems reveal repeated constraints and successful patterns.

The project should therefore resist two opposite failures:

- endless abstract research that never touches the product loop;
- premature generalization from the first working prototype.

## 13. Current portable lessons from E1 and V0

These are research lessons, not frozen implementations.

From E1:

- authored edit → causal PLAY → exact BUILD recovery has real bounded value;
- technical reachability is not a proxy for natural construction;
- preserving the user's already-placed anchor/intention can materially reduce operation burden;
- task clarity, target identity and presentation can confound a representation question.

From V0:

- a real geometry change can propagate through a physical steering linkage into a materially changed trajectory;
- Owner-readable presentation is part of experimental validity when human perception is the question;
- input semantics and camera/orientation can completely mask an otherwise valid mechanical experiment;
- a primitive carrier can remain useful research capital when its limitations are explicit and it is frozen before prototype gravity takes over.

Together they motivate — but do not yet prove — the next important frontier:

> **direct construction whose authored mechanical change survives into a causal, Owner-readable driving consequence.**

## 14. Deliberate non-decisions

This Project Soul deliberately does not select:

- a final engine or renderer;
- a final physics runtime;
- a final vehicle representation;
- a final component/reference/data model;
- a final builder interaction grammar;
- automatic versus locked adaptation semantics;
- a final asset pipeline;
- a final camera system;
- final tire/contact or suspension models;
- a canonical replay contract;
- final packaging, desktop/native/Web architecture or multiplayer architecture.

Those decisions should be earned by product evidence.

## 15. The standard for progress

Progress is not the number of subsystems implemented.

A meaningful step should increase our ability to make the intended product, for example by:

- demonstrating that a core loop works;
- making a previously hidden causal relationship perceptible;
- separating two competing product hypotheses;
- exposing a false assumption early;
- identifying a stable invariant across distinct experiments;
- reducing the cost of building, understanding or driving a mechanism without hiding its cause.

The project should remain willing to discard code while retaining knowledge.

The durable destination is not the current experiments. It is a vehicle sandbox in which **building, mechanics and driving form one coherent creative activity**.
