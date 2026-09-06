# Family C Owner audit — Spatial Compass frontier

Date: 2026-09-06
Status: **Owner-grounded interaction finding + technically qualified follow-up spike; experiment-local, not architecture**

## Executive judgement

Family C has moved from **weakly interesting representation probe** to a **directionally promising construction interaction**, but it is still far from a builder PASS.

The important change is not polish. In the fresh Owner session the interaction stopped behaving only like a prescribed attach/reconnect test and started supporting self-directed construction with repeated real `Asset_Dumper` instances. The Owner kept extending and rearranging the mechanism into a visibly non-preauthored structure and reported the first meaningful positive emotional signal from seeing a personal construction emerge from their own assets.

That is evidence worth protecting.

It does **not** mean Family C V3, V5, its six sockets, its endpoint representation, or this Spatial Compass are the final JV grammar.

## Fresh Owner evidence

The 2026-09-06 Owner recording is approximately 135 seconds of mostly unscripted use. It shows:

- repeated retrieval of real `Asset_Dumper` instances from the rack;
- continued attach/reconnect/rebuild actions rather than one prescribed topology edit;
- substantial camera orbiting while trying to reason about the growing mechanism spatially;
- a progressively denser, self-chosen arrangement around the fixture rather than a pre-authored A/B variation;
- continued experimentation despite the interaction being described as rough, unintuitive and still poor overall.

The Owner's qualitative verdict is therefore:

**DIRECTIONALLY POSITIVE / FAR FROM PASS**

The strongest positive evidence is not “the controls are good.” They are not. It is that the prototype finally caused the Owner to *want to keep constructing* and made the longer-term JV vision feel slightly more concrete.

## Critical apparatus finding — V3 was camera-incoherent

The dominant spatial-control problem was not merely subjective tuning.

`component-in-hand-app-v3.js` mapped all endpoint and free-part pointer motion through one fixed world plane:

```js
new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
```

The pointer therefore edited on world `Z=0` regardless of camera orientation. The Owner's report that point control became especially unintuitive at different angles, rotations and camera orientations has a direct implementation-level cause.

The original browser smoke did not falsify this failure mode. It validated create/attach/reconnect/detach/undo/delete from one camera arrangement, but never required spatial manipulation to remain coherent after camera rotation.

This is a useful correction to our previous interpretation: some of the apparent “3D interaction grammar” weakness was an **apparatus defect** rather than evidence against component-as-object construction itself.

## Interaction research context

External interaction precedents support the underlying decomposition without dictating JV's UI:

- Blender explicitly separates Global, Local, View and custom transform orientations because the useful frame depends on the operation and object; a fixed world frame is not sufficient for all spatial manipulation.
- Unity's position handles are parameterized by orientation and are normally kept screen-readable rather than allowed to become arbitrarily tiny with camera distance.
- Maya's Universal Manipulator combines several transforms in one local/world-aware tool, demonstrating the value of one compact precision layer instead of repeated tool switching.
- Besiege and Trailmakers both supplement direct building with frame-relative transforms, snapping and camera-relative controls rather than relying on one world-plane drag mapping.
- 3D interaction research such as snap-dragging and Smart3DGuides suggests a useful distinction between **guidance** and **forced correction**: visual or alignment cues can increase precision without taking authorship away from the user.

These are donors, not product authority. JV should not become generic CAD merely because CAD has solved parts of the coordinate-frame problem.

## Bounded follow-up experiment — Spatial Compass V0/V0.1

Branch:

`experiment/construction-grammar-family-c-spatial-compass-v0`

The experiment preserves Family C's **component-as-object** metaphor and the real `Asset_Dumper`, while replacing the fixed-plane apparatus with two complementary layers.

### 1. Direct current-view manipulation

Dragging an endpoint moves it on a camera-facing plane passing through the picked endpoint at drag start.

This makes the simplest gesture correspond to what the Owner currently sees instead of silently projecting every motion onto a hidden global `Z=0` plane.

Empty-space camera orbit keeps the current component selected so spatial inspection does not destroy working context.

### 2. Mechanism-aware Spatial Compass

A small optional local precision layer appears at the active endpoint.

It deliberately does **not** expose generic RGB world XYZ. Its directions are derived from the actual part and world:

- **SPAN** — along the damper's own axis;
- **LIFT** — world-up/gravity projected perpendicular to the damper axis;
- **SIDE** — the remaining lateral direction of the local mechanical frame.

Direct endpoint drag remains the low-floor interaction. The compass is an optional disambiguation/precision layer rather than a mandatory mode.

### 3. Explicit 3D snap intent

The first view-plane implementation exposed a new conflict: a view-plane drag is camera-coherent, but by itself cannot conveniently cross depth to a mount that merely appears under the cursor.

That first implementation **failed the existing attach smoke**. The failure was useful rather than papered over.

The follow-up separated gesture from geometric authority:

- direct motion remains on the current-view plane;
- when the pointer is visually near a compatible mount, that real 3D mount becomes an explicit preview target;
- a pale halo/tether shows the exact prospective snap before commit;
- the exact 3D snap occurs only on release;
- moving into genuine empty space leaves the endpoint unsnapped.

This preserves directness without reintroducing a hidden world plane or silent automatic correction.

## Validation results

Latest qualified head before this document update:

`2be07035a8abf817192fbbc0d0285d5b14c69d1a`

Latest Family C CI run:

`34028818488` — **PASS**

Qualified in real Chromium + production build:

- production TypeScript/Vite build passes;
- real `Asset_Dumper` still loads;
- create / attach / reconnect / detach / undo / delete remain reachable;
- a real camera orbit materially changes the view direction while preserving selection;
- direct endpoint drag after camera rotation changes world depth, proving the interaction is no longer trapped on world `Z=0`;
- `SPAN` changes the component's endpoint separation in the component frame;
- compatible-socket preview is observable **before release**;
- release commits the previewed exact 3D snap;
- a camera-independent empty-space detach gate verifies that the endpoint can remain unsnapped;
- no page or console errors in the covered paths.

An intermediate expanded gate also exposed a stale test assumption: its hard-coded “detach by +240/+150 screen pixels” happened to land near `h-mid` under the new projection, so the new system correctly previewed and snapped there. The test was repaired to choose a genuinely socket-clear screen region instead of forcing the runtime to preserve an old camera accident.

## What this actually establishes

The evidence now supports a stronger but still narrow claim:

> **A component-as-object construction interaction can preserve real Family C topology operations while using camera-coherent direct manipulation plus an optional semantic local frame, without requiring every pointer movement to live on a single world plane.**

It also supports three provisional interaction principles worth carrying into further tests:

1. **Direct gesture first; precision layer second.**
   The easiest action should work approximately in the visible scene. Additional constraints should refine intent, not gate basic construction.

2. **Use mechanical meaning before generic coordinate meaning.**
   A damper naturally has a span direction. Gravity gives a meaningful lift reference. These may be easier to reason about than arbitrary world X/Y/Z when the camera and component rotate.

3. **Preview assistance without stealing authorship.**
   The system may show a plausible exact relation before release, but the Owner should still be able to leave strange finite geometry unsnapped and should know when a snap will happen.

None of these principles has final product authority yet. Owner feel remains the decisive gate.

## Broader audit — the next ceiling is already visible

Fixing the spatial frame does **not** solve Family C's deeper grammar limits.

### A. Apparent graph richness currently exceeds true attachment richness

The Owner recording becomes visually complex because many dampers can be added, but every persistent attachment still terminates at the same six fixture sockets:

- `c-upper / c-mid / c-lower`
- `h-upper / h-mid / h-lower`

Multiple dampers can therefore create a dense-looking lattice while reusing a tiny fixed node vocabulary.

This is real structural agency compared with preset tuning, but it is not yet the wide-wall construction system the project wants. Family C has **edge multiplicity and free endpoint placement**, not yet a demonstrated generative attachment grammar.

Do not mistake the visually emergent web for proof that arbitrary component-to-component construction is solved.

### B. Dense-build legibility is likely to become the next interaction bottleneck

The recording already approaches a point where many overlapping dampers and endpoints occupy the same screen region. Selection identity, active endpoint readability, occlusion, and “which relation am I changing?” will matter increasingly as assemblies become real rather than toy-sized.

The Spatial Compass should therefore stay local and lightweight. A permanent forest of global gizmos would scale badly.

### C. Two-endpoint damper success may not generalize

A telescoping two-eye damper has an unusually clean semantic frame. `SPAN` is obvious and component geometry can adapt naturally between two endpoints.

A wishbone, steering knuckle, engine mount, tube junction, wheel hub or multi-port assembly may require different manipulation affordances. The project should test another materially different component/mechanism before promoting `SPAN/LIFT/SIDE` into a universal component API.

### D. Adaptation intent is still unresolved

The current damper visually adapts between endpoints, which aligns strongly with the product direction “Blockbench creates the building block; JV turns it into a specific adaptive part.”

But the experiment has not yet answered what the Owner intends to lock:

- endpoint position;
- component length;
- orientation;
- mounting feature;
- proportions or travel;
- automatic adaptation versus explicit authored dimensions.

Do not infer the final lock/data model from this success.

### E. No physics/build→drive claim yet

This remains an interaction spike. The new grammar has not yet earned a causal physical relation, RUN/DRIVE survival, or exact BUILD recovery.

The right sequence is still to make construction sufficiently natural to justify carrying it into a causal integration specimen, rather than attaching physics to an interaction that the Owner still describes as largely poor.

## Deliberate non-goals for this checkpoint

Do not add yet merely because they are obvious future features:

- final translate/rotate/scale gizmos;
- numeric transform panels;
- a permanent socket/mate ontology;
- arbitrary component-to-component attachment architecture;
- general component schemas;
- automatic geometry repair;
- physics integration;
- polished production UI;
- generalized selection frameworks.

Those may become necessary, but the current experiment should first answer whether the Owner's dominant spatial-control complaint is materially reduced while the positive “I am actually building something” signal survives.

## Current frontier / natural next gate

The next authority is an **Owner checkpoint on the Spatial Compass specimen**, not more headless tuning.

The Owner should use it freely, including deliberately awkward camera orientations, and judge:

- whether direct eye motion now follows visual expectation more often;
- whether the mini-compass helps precisely when free drag becomes ambiguous;
- whether `SPAN / LIFT / SIDE` feel mechanically meaningful or merely like renamed XYZ;
- whether snap preview communicates intention before commit;
- whether the added apparatus helps without burying the emerging feeling of physically building with real assets.

If the answer is materially positive, the highest-value research frontier is likely no longer “make this gizmo prettier.” It becomes **expanding actual attachment/structural vocabulary without losing the low-floor component-in-hand feeling**, while separately addressing dense-assembly legibility.

If the Owner still finds spatial control broadly unintuitive, do not proceed to deeper grammar or physics. The reference-frame/interaction model remains the unresolved bottleneck.
