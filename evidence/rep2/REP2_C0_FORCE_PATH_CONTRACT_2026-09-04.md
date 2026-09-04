# Rep2 C0 — compliant force-path falsifier contract

Date: 2026-09-04

Status: **execution contract; no implementation PASS yet**

Branch:

`experiment/rep2-coilover-force-path`

Base:

`954b6eb8e5f3bc3466134e77934cecc841ff5e5a`

The base is the accepted Stage-A physical single-source suspension-link specimen. This new branch deliberately excludes unfinished Stage-B visual work.

## 1. Question

Can a spring-damper relation with fixed physical component properties act directly between two authored spatial attachment points so that changing attachment leverage changes the real rigid-body response, without hidden wheel-rate compensation or a target force applied to the wheel?

C0 is a machine falsifier only. It does not add a real asset, Owner UI, driving carrier or final suspension semantics.

## 2. Physical relation

The experiment-owned component law is:

`F = -k * x - c * v`

along the current line between two live attachment eyes, where:

- `k` is spring stiffness in N/m;
- `c` is damping coefficient in N*s/m;
- `x = currentLength - restLength`;
- `v` is relative anchor velocity projected onto the current eye-to-eye axis.

Anchor velocity must include body rotation:

`v_eye = v_COM + omega x r_world`.

The resulting force pair must be applied:

- equal and opposite;
- at the actual world positions of the two eyes;
- to the bodies that own those eyes.

No force may be applied directly to a desired wheel position, suspension trajectory or response target.

## 3. Why direct force instead of Box3D spring hertz

Exact donor Box3D 3D source computes distance-joint axial effective mass from body inverse masses/inertias and anchor lever arms, while spring softness is parameterized by frequency (`hertz`) and damping ratio.

Therefore preserving raw `hertz` across changing attachment geometry is not equivalent to preserving one physical spring constant `k`.

C0 avoids that semantic ambiguity by expressing the component law directly in force units. This is bounded experiment apparatus, not a final physics architecture decision.

## 4. Bench topology

Use the smallest real Box3D rigid-body bench capable of exposing leverage:

- static reference/chassis body;
- one dynamic shapeless arm body whose origin is the hinge;
- one real revolute hinge at that origin;
- zero gravity;
- explicit arm mass, center of mass and inertia;
- one direct spring-damper force path from a chassis-local eye to an arm-local eye.

The arm may start at a small bounded hinge angle so the component is displaced from its zero-force pose.

No wheel, ground, contact or drive is needed in C0. Those would only add confounds before the relation itself is proven.

## 5. Deconfounded geometry pair

Use two specimens with identical:

- arm body mass/inertia;
- component `k`;
- component `c`;
- rest length;
- initial eye-to-eye length at zero arm angle;
- zero initial preload.

Change only the spatial radius of both component eyes from the hinge while preserving the same vertical eye separation.

Initial intended pair:

- near: attachment radius `0.25 m`;
- far: attachment radius `0.50 m`;
- rest vertical eye separation `0.50 m`.

At zero arm angle both dampers therefore have exactly the same length and component state.

Under the same small angular perturbation, the farther mount has a larger `dL/dtheta` and therefore a larger restoring moment even though the spring itself is unchanged.

## 6. Required trace

For each force application expose at least:

- arm hinge angle;
- chassis-eye world position;
- arm-eye world position;
- current length;
- extension;
- unit force axis;
- chassis-eye velocity;
- arm-eye velocity;
- relative axial speed;
- spring contribution;
- damping contribution;
- total axial force scalar;
- world force on chassis;
- world force on arm;
- arm-eye lever vector from hinge;
- resulting force moment about hinge;
- arm angular velocity after stepping.

Trace values should come from the same live bodies/force calculation used by the world step, not from a separate presentation oracle.

## 7. Tests

### C0.1 — zero-state neutrality

At zero arm angle for both specimens:

- eye distance equals the same rest length;
- extension is approximately zero;
- with zero velocity, spring/damper force is approximately zero.

### C0.2 — reciprocity

At a perturbed pose:

- force on chassis + force on arm = zero within tolerance;
- the applied arm force acts at the exact live arm eye;
- no second force target exists.

### C0.3 — constitutive property invariant

Across different attachment geometries, force calculation must continue to use the same `k`, `c` and rest length.

A geometry change must not rewrite component properties to preserve arm/wheel response.

### C0.4 — leverage consequence

Starting the near and far specimens at the same small hinge perturbation must produce materially different restoring moment and live Box3D angular response.

For the chosen geometry, doubling attachment radius should produce a strong small-angle separation consistent with the expected approximately quadratic leverage effect. The acceptance check should retain exact traced geometry/force values rather than relying only on the approximate `4x` heuristic.

### C0.5 — no hidden scalar-length explanation

Add a paired geometry or perturbation showing that response depends on spatial line-of-action / moment arm, not only the current damper length scalar.

### C0.6 — permissive boundary

Odd but finite non-singular attachment geometry should evaluate. Reject only non-finite points, near-zero eye separation or another true numerical singularity required to keep force direction defined.

## 8. Tripwires

C0 fails its research purpose if implementation introduces:

- wheel-rate target compensation;
- automatic retuning of `k` or `c` from motion ratio;
- a direct force toward a desired wheel/arm pose;
- a hidden second attachment-point table;
- a visual mechanism used as physical evidence;
- a broad suspension architecture;
- a generic component/constraint framework because this one relation exists.

## 9. Natural stop

Stop C0 as soon as the machine evidence demonstrates or falsifies:

> same spring/damper properties + different authored attachment leverage -> different real Box3D rigid-body response through equal-and-opposite force applied at the authored/live eyes.

If C0 passes, the next decision is a bounded integration into the already-proven Stage-A suspension-arm seam. Do not jump directly to the Owner builder or visual asset.
