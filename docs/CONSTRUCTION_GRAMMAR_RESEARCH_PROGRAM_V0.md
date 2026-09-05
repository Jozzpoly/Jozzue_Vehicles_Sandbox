# Nextgen JV — Construction Grammar Research Program V0

Date: 2026-09-05
Status: **experiment-local research frame — NOT architecture**

## Why this program exists

Rep3 and Rep4 accumulated increasingly strong causal and interaction evidence, but Owner hands-on repeatedly showed that more editable coordinates/hardpoints inside a pre-authored mechanism did not materially create a satisfying sense of construction.

The working diagnosis is now:

> **JV needs structural agency, not merely a larger parameter/hardpoint surface.**

The Owner should increasingly be able to create, remove, reconnect and recombine recognizable mechanical components/relations, then run the result and understand why it behaves as it does.

This program exists to explore that interaction grammar quickly and comparatively before paying the full cost of physics integration.

It does **not** define the final builder, component model, data model, socket ontology, snapping system, renderer, physics runtime, or asset contract.

## Research method correction

Use three deliberately different prototype roles:

1. **Causal lab** — prove a mechanical relation or physical mapping when its technical truth is uncertain.
2. **Experience / interaction spike** — cheaply compare ways of authoring and restructuring a mechanism. It may fake physics or omit PLAY entirely as long as that limit is explicit.
3. **Integration specimen** — combine a promising interaction grammar with qualified causal mechanics only after Owner evidence says the interaction is worth the cost.

Do not make every interaction idea survive a long causal-hardening pipeline before the Owner sees it.

Conversely, do not promote an attractive interaction-only spike into a mechanical truth without a later causal gate.

## Durable builder target

The long-term builder should tend toward:

- low initial friction;
- broad space of personally chosen constructions rather than a single prescribed path;
- increasing depth without replacing direct manipulation with forms;
- direct spatial operations with optional snap/grid/gizmo and exact numeric control;
- permissive topology and geometry, with diagnosis rather than unnecessary blocking;
- recognizable components whose visible mechanism can later share one causal authority with physics;
- short `BUILD → RUN/PLAY → OBSERVE → IMPROVE` loops;
- eventual `get in and drive`, without forcing driving into every research spike.

A useful lens is **low floor / wide walls / high ceiling**, but it is a design heuristic, not a requirement to copy Scratch or any existing game.

## Construction-grammar design space

Do not reduce the problem to one choice such as `drag vs click`.

### 1. Primary object of action

Candidate grammars can make different things feel primary:

- **socket / hardpoint first** — connect visible points;
- **relation first** — create a link/mate between endpoints;
- **component first** — pick up a damper, arm, bearing, tube, etc. and place/attach it;
- **geometry first** — draw/extrude/stretch a component between spatial references;
- **assembly first** — move whole components until compatible references snap/mate.

These are not mutually exclusive. A strong builder may use different grammars for different component classes.

### 2. Intent ordering

Important alternatives:

- endpoint A → endpoint B, with the active component type already selected;
- component/tool → endpoint A → endpoint B;
- component spawned in space → independently attach/move its endpoints;
- component dragged from one anchor toward another in one gesture;
- place whole component first, then infer or explicitly nominate attachments.

The ordering matters because it changes what the Owner feels they are manipulating: an abstract relation, a physical component, or geometry.

### 3. Attachment semantics

Candidate attachment models include:

- explicit visible sockets/ports;
- implicit snap points generated from component geometry;
- surface/edge/axis references;
- inferred nearest compatible reference with explicit preview;
- explicit local connector/joint frame when orientation cannot be inferred safely from geometry alone.

Do not assume a permanent socket ontology merely because early spikes use sockets.

### 4. Topology operations

A builder-like grammar must eventually make at least these operations natural enough to explore:

- create;
- delete;
- reconnect endpoint A/B;
- duplicate;
- insert/split or replace a component/relationship;
- possibly detach while preserving the free component;
- possibly multi-select / grouped transform.

Not every spike needs all operations. But a candidate that cannot plausibly grow into topology editing has low long-term leverage.

### 5. Spatial editing after connection

Connection and geometry editing are separate concerns.

Candidate layers:

- drag component/body directly;
- drag endpoint/reference directly;
- gizmo translate/rotate;
- optional snap/grid;
- exact numeric coordinates/angles/lengths;
- local/world/component frames;
- future intent locks when adaptation would otherwise destroy explicit Owner intent.

Exact numeric control should augment direct manipulation, not replace it.

### 6. Feedback and permissiveness

Preferred behavior:

- show a live ghost/preview before committing an operation;
- make compatible targets legible at the moment they matter;
- allow weird finite constructions where program integrity permits;
- diagnose singular/unsupported mechanical states rather than silently fixing them;
- distinguish `interaction prototype can display this` from `causal runtime can simulate this`.

## Candidate grammar families

### Family A — direct connect gesture

`socket A → drag → socket B`

Strengths:

- very low operation count;
- highly direct and reversible;
- good for wiring/link semantics;
- strong precedent in construction sandboxes.

Risks:

- can make a physical component feel like an abstract wire;
- active component type may be easy to forget;
- harder to express orientation-rich or multi-anchor components.

### Family B — component/tool first, endpoints second

`choose Link/Damper → click A → click B`

Strengths:

- component intent is explicit before attachment;
- compatible with richer component palettes and typed relations;
- easier to extend to components requiring additional setup.

Risks:

- more modal/tool-like;
- can drift toward CAD/configurator interaction;
- component may still feel like a command rather than an object.

### Family C — component as a physical object

`spawn/pick up component → move/attach endpoint(s) → manipulate component directly`

This is a high-priority next family if A/B do not produce a strong signal.

Strengths:

- strongest physical-object metaphor;
- directly compatible with real Blockbench component capital;
- may naturally support detach/reconnect and free placement;
- likely better basis for adaptive components.

Risks:

- requires better placement/ghost/snap semantics;
- multi-endpoint components can become cumbersome;
- component pose vs endpoint authority must eventually be made mechanically coherent.

### Family D — draw/adapt component between references

`start at reference → drag through space → finish at reference`, with the component generated/adapted from the gesture.

Strong candidate for tubes, braces, shafts, rods and other intrinsically span-defined components.

Risk: do not generalize this grammar to every component merely because it works well for links.

### Family E — explicit connector/mate frame

Use when point positions are insufficient and orientation/axis/roll matters.

This can borrow ideas from CAD mate/joint connectors while remaining much more direct and game-like.

It should be an advanced/local grammar, not automatically the default authoring surface.

## What current Spike Batch 0 actually tests

The current `?grammar` spike compares only two intent orderings on the same small workbench:

- **A — drag-to-connect**;
- **B — component/tool first, then two endpoints**.

Both support topology create/delete/undo/reconnect and use the same socket set and visual context.

This batch is **not** intended to select the final JV grammar.

Its purpose is to learn quickly:

- does either ordering immediately feel more natural;
- does either make the Owner think in terms of constructing a mechanism rather than issuing commands;
- do visible sockets help or merely expose implementation scaffolding;
- does dynamic topology itself produce a meaningful experiential step beyond Rep4;
- what missing operation/metaphor becomes obvious once topology is no longer fixed.

A likely outcome is that neither A nor B is sufficient and Family C becomes the next spike. That is a useful result, not a failure of the program.

## Evaluation dimensions for Owner spikes

Do not ask the Owner to score a spreadsheet. These are analysis dimensions for interpreting natural hands-on feedback:

- **intent immediacy** — how quickly can an intended structural change be expressed;
- **discoverability** — can the next operation be understood from the scene;
- **directness** — does it feel like manipulating the mechanism itself;
- **component identity** — does a damper/link/arm feel like a thing, not a parameter or line;
- **topology agency** — can the Owner materially restructure rather than tune;
- **reversibility** — is experimentation cheap and safe;
- **spatial legibility** — are attachment and orientation clear in 3D;
- **wide walls** — can the same primitives support many self-chosen configurations;
- **precision path** — can direct manipulation plausibly coexist with exact values/snap/grid;
- **causalizability** — can a promising interaction later map to one real mechanical authority without hidden magic;
- **prototype gravity risk** — would keeping the implementation prematurely define final architecture.

## Cadence / stopping rule

For interaction-only spikes:

1. choose one or two sharply contrasting grammar questions;
2. implement only enough for a realistic self-directed interaction;
3. run a lightweight build + real-browser smoke for obvious technical/presentation failure;
4. perform screenshot/render review;
5. give the Owner the checkpoint early;
6. stop after the first honest comparative feedback;
7. discard, mutate, or combine ideas before doing causal integration.

Do not require the full historical Rep4 regression apparatus for an interaction-only claim.

Do not send a broken or visually confounded spike merely for speed.

For causal/integration prototypes, restore claim-matched mechanical validation.

## Support references / donor ideas

These are conceptual donors only, not authorities:

- Shneiderman — direct manipulation: continuous representation plus rapid, incremental, reversible visible action;
- Resnick / Papert construction-kit framing — low floor, wide walls, high ceiling;
- Scrap Mechanic — visible connection points and drag-to-connect/reconnect interactions;
- Besiege — component placement, draggable span-defined components, permissive simulation and advanced transform tools;
- Trailmakers — simple components/connection knobs producing combinatorial construction space;
- Onshape — implicit/explicit mate connectors and local frames;
- Fusion — component joints and explicit joint origins when geometry alone is insufficient.

The JV goal is not to average these systems. It is to use them to expose alternatives and then let representative Owner experimentation plus causal evidence select what survives.

## Immediate execution

Finish Batch 0 V1 only to a clean lightweight browser checkpoint:

- skeleton-safe dynamic real-damper cloning;
- event-driven rendering rather than a permanent idle frame loop;
- separate short Chromium smokes for A and B;
- no physics integration;
- no new component/data architecture.

Then hand A/B to the Owner early.

If neither produces a strong positive signal, do **not** polish them. Build Family C (component-as-object) as the next cheap comparative spike.