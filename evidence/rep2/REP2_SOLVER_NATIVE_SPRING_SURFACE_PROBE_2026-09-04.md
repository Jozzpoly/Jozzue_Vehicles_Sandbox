# Rep2 — exact solver-native spring surface probe

Date: 2026-09-04

Status: **RUNTIME SURFACE EVIDENCE — not architecture authority**

Branch: `research/rep2-solver-native-spring-seam`

Probe head: `49d9e7dc6e331adbb3d417a6e3dbbc957c8d3dcf`

Workflow: `Rep2 Solver Native Spring Probe`

Run: `33873045278`

Job: `101023365502`

Result: **PASS**

## Exact substrate

The probe instantiated the same installed package used by C0a/C0b and printed the live WASM surface:

- package: `box3d.js@0.0.2`;
- factory: `box3d.js/inline`.

This avoids inferring the available JS API from a newer upstream header.

## Distance spring surface actually exposed

The exact runtime exposes:

- `b3CreateDistanceJoint`;
- `b3DefaultDistanceJointDef`;
- `b3DistanceJoint_EnableSpring`;
- `b3DistanceJoint_SetSpringHertz` / `GetSpringHertz`;
- `b3DistanceJoint_SetSpringDampingRatio` / `GetSpringDampingRatio`;
- `b3DistanceJoint_SetSpringForceRange` / `GetSpringForceRange`;
- `b3DistanceJoint_SetLength` / `GetLength`;
- `b3DistanceJoint_GetCurrentLength`;
- limit and motor controls.

The live default distance definition contains:

- two full local joint frames (`base.localFrameA/B`), so the constraint acts through explicit body-relative attachment points;
- `length = 1`;
- `enableSpring = false`;
- `hertz = 0`;
- `dampingRatio = 0`;
- lower spring force approximately `-FLT_MAX`;
- upper spring force approximately `+FLT_MAX`.

Therefore the native distance spring is not limited to a center-of-mass pseudo-suspension. It is capable, at the API level, of attaching the same two spatial eyes used by C0a and generating a bilateral spring force along their live separation.

The exact runtime also exposes solver-native spring controls for prismatic, revolute, spherical, wheel, motor and parallel joints. Their presence is not evidence that they are appropriate for Rep2.

## Important semantic mismatch

The authored C0a physical atom is parameterized by:

- `k` in `N/m`;
- `c` in `N*s/m`;
- `restLength` in meters;
- explicit live attachment geometry.

The native distance spring instead accepts:

- rest `length`;
- `hertz`;
- `dampingRatio`.

A fixed Hertz value is mass-normalized tuning, not a fixed physical component stiffness. Therefore directly exposing or storing Hertz as the authoritative spring property would violate the C0a result whenever body mass/inertia or installation leverage changes.

The native spring remains a credible *realization substrate* only if a thin, falsifiable mapping can preserve authored physical `k/c/restLength` semantics.

## Candidate physical mapping to test, not assume

For an axial constraint with scalar effective mass `m_eff`, the standard harmonic mapping candidate is:

`omega = sqrt(k / m_eff)`

`hertz = omega / (2*pi)`

`dampingRatio = c / (2 * sqrt(k * m_eff))`

where `m_eff` must come from the exact live spatial Jacobian, including attachment-point lever arms and inverse inertia — not only body scalar masses.

This mapping is a hypothesis until the pinned solver trajectory reproduces the physical reference across changed mass and geometry.

A second semantic edge is already visible: `hertz + dampingRatio` does not naturally encode an independent pure damper with `k = 0, c > 0`. C0c should not hide this limitation by inventing a tiny non-zero spring unless that approximation is separately justified.

## Consequence

The exact API surface is sufficient to justify one bounded solver-native calibration experiment.

It is **not** sufficient to select:

- Box3D distance spring as final suspension architecture;
- Hertz as an authored/product parameter;
- wheel joint as the vehicle suspension model;
- a fixed conversion independent of geometry/mass;
- a split spring/damper realization.
