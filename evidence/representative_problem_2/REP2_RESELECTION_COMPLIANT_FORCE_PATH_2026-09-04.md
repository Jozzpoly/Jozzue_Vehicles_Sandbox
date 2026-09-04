# Nextgen JV — Representative Problem #2 reselection amendment

Date: 2026-09-04

Status: **fresh amendment after rendered JV_CORE correspondence gate; implementation not yet accepted**

This file does not erase `REPRESENTATIVE_PROBLEM_2_SELECTION_2026-09-04.md`. It records why new evidence changes the preferred representative question.

The original one-sided suspension-link choice produced useful Stage-A evidence and remains preserved. The new evidence below changes what should be asked next.

## 1. Evidence that changed the selection

Three findings matter.

### A. Rigid single-source geometry is already demonstrated at machine scale

Rep2 Stage A at:

`experiment/rep2-single-source-suspension-link@954b6eb8e5f3bc3466134e77934cecc841ff5e5a`

already demonstrated, within its bounded apparatus:

`authored spatial pivot/endpoint -> real arm body + hinge -> real wheel endpoint/path/contact`

including same-length/different-direction spatial falsification and one-side independence.

Repeating the next Owner-facing question around another rigid arm endpoint now buys less new information than it did at original selection time.

Stage A remains evidence. It is not revoked by this amendment.

### B. Rendered donor forensics confirmed the harder problem

`JV_CORE_RENDERED_CORRESPONDENCE_ADDENDUM_2026-09-04.md` confirms that old JV could have a visible mechanical assembly and live physical diagnostics both moving plausibly while representing different geometric mechanisms.

The research frontier is therefore not merely "can a spatial point build a joint?" It is increasingly:

> **can authored mechanical intent instantiate one real causal relation whose live state is also what the player sees, without a second nearby mechanism?**

### C. The donor exposed a stronger adaptive-mechanics question

Historical trailing-arm code calculates a damper motion ratio from attachment geometry and then retunes damper solver stiffness/hertz to preserve a target wheel rate.

That is a legitimate historical tuning convenience, but it is dangerous as a default semantic for direct causal construction: moving a real mechanical attachment can have part of its consequence silently cancelled by a hidden outcome-preserving remap.

The donor also contains a real Blockbench telescoping damper asset and a small renderer that can adapt the visible damper between two live endpoints.

Together these fragments expose a more informative bounded problem than another rigid-link edit.

## 2. Relation-class comparison

The candidates are compared as **mechanical relations**, not as product components. This avoids choosing a part because its asset happens to look useful.

| Relation class | New information beyond R1/Stage A | Immediate causal consequence | Real-asset leverage | Cost / blast radius | Main risk | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Rigid suspension arm/link | Medium-low | wheel path/kinematics | Medium | Low; Stage A exists | repeats spatial rigid-link lesson and current carrier is not Owner-feel-ready | retain as substrate/evidence |
| Compliant spring-damper force path | **High** | force, load, motion ratio, ride/handling | **High** (`Asset_Dumper.gltf`) | Medium and bounded | hidden compensation or preload confounds | **select** |
| Rotational driveline/cardan | High | torque transmission | Medium/high visual asset value | High | no small trustworthy donor torque path; would open driveline/differential work | defer |
| Structural/adaptive member | High builder relevance | weak unless mass/collision/structure also modeled | Medium | Medium/high | visual adaptation becomes the result instead of mechanics | defer |
| Wheel/hub offset | Low/medium | track/contact consequence | Medium | Low | collapses into disguised scalar tuning | defer |

The compliant relation separates the most current unknowns without requiring a full suspension architecture.

## 3. Reselected representative question

> **Can the Owner spatially place a real spring-damper's two attachment eyes so that the exact same authored attachment state owns both its physical force path and its visible adaptive component, while the component's own physical properties remain invariant and geometry is allowed to change wheel response through real leverage?**

This is not a request to build a final coilover system.

It is a test of:

- causal spatial construction;
- compliant/force-path mechanics rather than another rigid kinematic linkage;
- real adaptive asset correspondence;
- what should remain invariant when geometry changes;
- whether hidden outcome compensation can be avoided.

## 4. Critical semantics: component property vs outcome compensation

Do not encode the spring component as "keep wheel rate at X" for this experiment.

The provisional physical component properties are ordinary constitutive properties such as:

- spring stiffness `k` in N/m;
- damping coefficient `c` in N·s/m;
- a fixed free/rest length for the controlled machine specimen.

Changing attachment geometry is then allowed to change:

- motion ratio;
- line of action;
- moment about the suspension hinge;
- effective wheel stiffness/damping;
- static/dynamic wheel response;
- ultimately vehicle response.

This does **not** establish final JV adaptation semantics. It deliberately tests one clean interpretation.

### Box3D representation warning

The exact historical Box3D 3D source calculates distance-joint axial effective mass from both bodies' inverse masses/inertias and anchor lever arms, then combines that with spring `hertz`/damping ratio through solver softness.

Therefore raw Box3D `hertz` is not a safe product-level synonym for a physical spring constant when attachment geometry/effective mass changes.

A clean experiment should not preserve raw `hertz` and call that "the same spring".

## 5. Preferred physical implementation for the first probe

Avoid the historical outcome-preserving `distance spring` setup in the first causal probe.

Use a direct equal-and-opposite spring-damper force law between the two exact live attachment points:

`F_axis = -k * extension - c * relativeAnchorSpeed`

where:

- each live eye position is derived from its owning physical body and authored local attachment point;
- anchor velocity includes body linear velocity plus `omega × r`;
- force acts along the current eye-to-eye axis;
- equal and opposite forces are applied at the actual world attachment points, producing torque naturally through `r × F`;
- no force is applied directly to a wheel target or desired suspension trajectory.

The exact donor Box3D API supports force-at-world-point application through `b3Body_ApplyForce(...)`.

A travel-limit joint may be added later only if the vehicle carrier requires it. If added, it must use the same two attachment points and remain a limit, not become a hidden second spring law.

This direct force implementation is experiment apparatus, not a final physics architecture decision.

## 6. Deconfounded machine falsifier before vehicle feel

Do not begin by asking whether a car "feels softer". Ride height, preload and asymmetry would make that too easy to misread.

First use a tiny relation bench around the already-proven hinged arm concept.

Construct two attachment geometries with:

- the same arm mass/inertia;
- the same physical spring `k` and damper `c`;
- the same spring free/rest length;
- the same initial damper length, therefore zero initial preload;
- different radial placement of the attachment pair relative to the arm hinge.

A simple controlled pair can keep the damper vertical and the eye-to-eye length constant while placing both eyes at radius `a` from the hinge:

- specimen A: `a = 0.25 m`;
- specimen B: `a = 0.50 m`;
- same vertical eye separation in both specimens.

For a small arm-angle perturbation around this pose:

`dL/dtheta` scales approximately with `a`,

so the small-angle rotational spring effect scales approximately as:

`k_theta ~= k * (dL/dtheta)^2`.

Doubling the attachment radius should therefore produce a strong, approximately fourfold difference in rotational stiffness while the physical spring itself is unchanged.

The machine evidence should not rely solely on that approximation. It should trace the exact live anchor geometry, extension, force, moment arm and body response.

### Required metamorphic checks

1. **Constitutive invariance** — for equivalent axial extension/velocity states, the component force follows the same `k/c` law across different attachment geometries.
2. **Leverage consequence** — for the same bounded arm perturbation, changing only spatial attachment geometry changes restoring moment/body response.
3. **Reciprocity** — applied forces are equal and opposite at the two eyes; no hidden wheel-target force exists.
4. **Spatial falsifier** — two layouts that cannot be reduced to the same damper length scalar produce different mechanical response because line of action / lever changes.
5. **Permissive boundary** — odd but finite attachment geometry runs unless it creates a true numerical/structural singularity.

This machine bench is a preflight, not the representative Owner experience.

## 7. Visual authority after the force path is proven

Only after the force relation itself passes should the real visual damper enter.

Preferred authority chain:

`authored body-local eye points`

`-> live physical body attachment points`

`-> physical spring/damper force path`

and from the **same live physical eye points**:

`-> adapted real Blockbench damper visual`.

The visual must not read a second rest hardpoint table to decide where the live damper is.

`Asset_Dumper.gltf` is useful donor capital because it already contains authored `Upper`, `Stretch` and `Lower` rigidly-skinned parts. Whether Nextgen uses a skeleton, rigid part extraction or another disposable adapter for this experiment remains open.

No visual implementation technique gains architecture authority from this test.

## 8. Owner-facing carrier comes later and must be earned

The accepted Stage-A carrier is intentionally asymmetric and springless on the selected side. It is sufficient for machine isolation but is **not** an honest suspension-feel carrier.

Before Owner judgement the experiment must remove those presentation/physics confounds with the smallest justified vehicle carrier:

- mechanically symmetric relevant axle/corners;
- real spring-damper relation on the tested geometry;
- enough steering/drive to create a meaningful short drive/bump loop;
- readable real damper visual and attachment handles;
- no R1-style hidden/occluded targets.

Do not turn this requirement into a broad suspension or vehicle rewrite.

A useful Owner protocol should eventually compare the same real damper component under materially different mount geometry and ask whether:

- the changed force path is visually understandable;
- changed wheel/body response is perceptible;
- the mechanism reads as the cause;
- BUILD -> DRIVE -> BUILD remains worth iterating.

## 9. Disposition of existing Rep2 work

### Stage A

**Retain as accepted bounded evidence and physical substrate donor.**

Do not reopen it.

### Existing Stage B diagnostic primitive work

**Freeze; do not promote into Owner-facing work merely because it exists.**

Its single-source visual-correspondence discipline remains valid and reusable. Its primitive orange-link presentation is not sufficient reason to continue that lineage as the main experiment.

No product/architecture PASS is implied.

### New experimental lineage

If implementation begins, prefer a new named branch forked deliberately from the clean accepted Stage-A physical seam rather than silently mutating the unfinished Stage-B branch.

Suggested branch intent:

`experiment/rep2-coilover-force-path`

The first implementation scope is the force-path machine falsifier only.

## 10. Natural stop

Stop the first new stage when it has demonstrated or falsified:

> **same physical spring/damper properties + different authored spatial attachment geometry -> different real mechanical leverage/response, with a direct equal-and-opposite force path and no outcome-preserving compensation.**

Do not add the real visual asset, builder interaction or driving polish before this causal seam earns them.
