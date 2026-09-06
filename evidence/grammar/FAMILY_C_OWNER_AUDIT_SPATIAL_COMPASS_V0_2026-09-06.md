# Family C Owner audit — Spatial Compass frontier

Date: 2026-09-06
Status: **Owner-grounded interaction finding; experiment-local, not architecture**

## Fresh Owner evidence

The Owner tested Family C V3 freely rather than following a scripted attach/reconnect sequence. The resulting session materially exceeded the earlier Batch 0 behavior:

- many real `Asset_Dumper` instances were taken from the rack and assembled into self-chosen configurations;
- topology was not merely edited once — the Owner kept constructing, reconnecting and extending the assembly;
- the resulting structure became visibly non-preauthored and increasingly personal;
- despite describing the prototype as very rough and still poor overall, the Owner explicitly reported a small positive emotional signal: seeing a personal construction emerge from their own assets made the future JV vision feel more concrete.

Owner verdict is therefore **DIRECTIONALLY POSITIVE / FAR FROM PASS**.

This is stronger than Batch 0's weak-positive endpoint-graph signal, but it does not qualify a final builder grammar, socket ontology, component model or physics integration.

## Critical apparatus finding

V3's dominant spatial-control problem is not just subjective tuning.

`component-in-hand-app-v3.js` maps all endpoint and free-part pointer motion through one fixed world plane:

```js
new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
```

The pointer therefore edits on world `Z=0` regardless of camera orientation. This creates a direct camera/manipulation-frame mismatch exactly when the Owner rotates around the workpiece.

The current browser smoke does not falsify this failure mode. It validates create/attach/reconnect/detach/undo/delete from one camera arrangement, but never requires spatial manipulation to remain coherent after camera rotation.

## Updated diagnosis

The frontier has moved.

Previous question:

> Can the Owner materially restructure a mechanism rather than tune pre-authored hardpoints?

Family C now gives enough positive evidence to continue exploring that direction.

Current question:

> Can direct component/endpoint manipulation remain legible and controllable across arbitrary useful camera orientations without turning JV into generic CAD?

This is a **spatial interaction / reference-frame problem**, not yet a physics problem.

## Bounded next experiment — Spatial Compass V0

Preserve Family C's component-as-object metaphor and real donor asset. Replace the fixed-plane apparatus with two complementary layers:

1. **Direct view-plane manipulation**
   - dragging an endpoint or a free component moves on a camera-facing plane passing through the picked object at drag start;
   - this should make the simplest gesture track what the Owner sees rather than a hidden global plane.

2. **A small mechanism-aware Spatial Compass**
   - appears only at the active endpoint;
   - not a generic RGB XYZ translate gizmo;
   - three semantic directions are derived from the component and world:
     - **SPAN** — along the component's own axis;
     - **LIFT** — gravity/world-up projected perpendicular to the component axis;
     - **SIDE** — the remaining lateral direction from the component frame;
   - center/eye drag remains free view-plane manipulation;
   - handles are an optional precision/disambiguation layer, not a mandatory mode.

Add live compatible-socket preview before release, keep actual snap explicit on release, preserve permissive finite placements, undo/delete/clear and event-driven rendering.

## Deliberate non-goals

Do not add yet:

- final rotation/scale gizmos;
- numeric panels;
- a permanent socket or mate ontology;
- physics integration;
- a general component data architecture;
- automatic repair of weird constructions;
- a polished production UI.

The experiment should answer whether a small local semantic frame materially fixes the Owner's spatial-control failure while preserving the emerging construction feeling.

## Validation

Technical/browser gate should cover more than V3:

- existing Family C topology operations remain reachable;
- after a real camera orbit, direct endpoint drag is no longer constrained to world `Z=0`;
- SPAN handle changes length along the component frame rather than a hidden world axis;
- socket preview is observable before commit and snap remains release-driven;
- no page/console errors;
- production build passes.

Final experiential authority remains Owner hands-on judgement.
