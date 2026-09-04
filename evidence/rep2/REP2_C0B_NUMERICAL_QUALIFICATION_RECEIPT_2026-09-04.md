# Rep2 C0b — numerical / passivity qualification receipt

Date: 2026-09-04

Status: **CLOSED — DIRECT-FORCE REQUIRES MICROSTEP REFRESH**

Branch: `experiment/rep2-c0b-numerical-qualification`

Qualified head: `e2976c1618363830e17cfb34fd482d0e8250c3f3`

Workflow: `Rep2 C0b Numerical Qualification`

Final run: `33870297080`

Final job: `101014394387`

Technical execution: **PASS** (`61/61` tests + production build)

Pre-verdict refinement provenance: `REP2_C0B_RUN2_REFINEMENT_NOTE_2026-09-04.md`

## Verdict

C0b closes in contract class:

> **DIRECT-FORCE REQUIRES MICROSTEP REFRESH** — fine explicit refresh is credible in the bounded bench, while the JV-like outer-step path materially departs from it because the state-dependent component force is held stale across Box3D internal substeps.

This is a qualification of the C0 calibration atom and pinned substrate behavior, not a selection of final suspension architecture, final physics frequency, Box3D joint springs, or a product-facing spring/damper schema.

## What was actually qualified

The tested mechanical law remained exactly:

`F_axis = -(k * x + c * v_axis)`

with equal-and-opposite force applied at the exact two live eyes.

Two bounded regimes were used:

- moderate: `k = 900 N/m`, combined `c = 18 N*s/m`;
- stiffer: `k = 3600 N/m`, combined `c = 36 N*s/m`.

The final fresh-force ladder was:

`60, 120, 240, 480, 960, 1920, 3840 Hz`.

All trajectories were compared on common 60 Hz observation times over `0.5 s`.

## P0 — instantaneous force law remains passive

Across the exercised states, the live identity

`P_component + dU_spring/dt + c*v_axis^2 = 0`

held to floating-point residuals of order `1e-15`, and damping dissipation remained non-negative.

This remains only a sign / causal-law oracle. It does not by itself qualify integration.

## P1 — stepping-path controls

### Zero-component-force control

Comparing four public `World_Step(1/240, 1)` calls with one `World_Step(1/60, 4)` call on the same revolute substrate produced only microscopic separation:

- angle RMS: `9.54e-8 rad`;
- angular-velocity RMS: `3.32e-7 rad/s`;
- passive-energy RMS: `7.55e-7 J`.

### Frozen-wrench control

The pre-verdict refinement then applied the same state-independent constant generalized load (`COM force + torque`) through both stepping paths.

The result remained microscopic:

- angle RMS: `2.18e-7 rad`;
- angular-velocity RMS: `1.15e-6 rad/s`;
- COM-velocity RMS: `4.73e-7 m/s`.

Therefore the large spring-bearing separation cannot reasonably be attributed to a general difference between public microsteps and internal substeps, even under a non-zero constant external load, within this bench.

## P2 — explicit-refresh convergence

The 3840 Hz refinement strengthened rather than weakened the convergence picture.

For nearly all observables and laws, the `1920 -> 3840` RMS error is roughly one third of the `960 -> 3840` RMS error. Examples:

- moderate damper-only: ~`0.333` for angle, omega, length and energy;
- moderate combined: `0.320–0.335`;
- stiffer damper-only: ~`0.332–0.333`;
- stiffer combined: `0.276–0.338`.

The hardest conservative spring-only angular-velocity quantity remains less regular (`~0.68` fine tightening), but angle, length and energy continue to tighten strongly and the conservative energy drift shrinks monotonically with cadence. Extending from 1920 to 3840 Hz therefore supplied useful additional convergence evidence rather than exposing a divergent reference.

C0b does not claim 3840 Hz is exact analytical truth. It is a sufficiently fine bounded numerical reference for the decision C0b was designed to make.

## P3/P4 — stale state-dependent force is the dominant failure

Exact pinned Box3D source establishes that `World_Step(dt, subStepCount)` divides the step internally while externally accumulated force/torque is reused across those internal velocity integrations and cleared only during body finalization. Therefore one external evaluation before `World_Step(1/60, 4)` does not become four state-dependent evaluations.

The energy falsifier makes the consequence explicit.

### Moderate spring-only

Fine 3840 Hz explicit-refresh reference:

- final energy / initial: `0.99926`;
- maximum positive energy overshoot: `0.0856%`.

JV-like stale `60 Hz / 4 internal`:

- final energy / initial: `1.28774`;
- maximum positive energy overshoot: `28.77%`.

### Stiffer spring-only

Fine 3840 Hz explicit-refresh reference:

- final energy / initial: `0.99710`;
- maximum positive energy overshoot: `0.115%`.

JV-like stale `60 Hz / 4 internal`:

- final energy / initial: `2.96032`;
- maximum positive energy overshoot: `196.35%`.

A nominally conservative spring therefore receives severe artificial energy when its state-dependent force is frozen across the four internal substeps.

### Damping can conceal the spring error

The stale damper-only paths still dissipate energy, but combined spring+damper trajectories depart materially from the fine reference even though the total energy decreases.

Moderate combined after `0.5 s`:

- fine 3840 Hz final / initial: `0.44883`;
- stale `60/4`: `0.57451`.

Stiffer combined:

- fine 3840 Hz final / initial: `0.17585`;
- stale `60/4`: `0.52714`.

Therefore "the vehicle remains stable" or "energy still decreases" would be insufficient evidence that spring/damper integration is mechanically faithful. Damping can hide substantial stale-spring error.

## Important non-claims

C0b does **not** establish:

- that the whole world must run at 3840, 1920, 480 or any other specific frequency;
- that 240 Hz explicit refresh is production-adequate;
- that direct external force is the preferred production realization;
- that Box3D Hertz / damping-ratio joint springs are the preferred realization;
- that current pinned `box3d.js` should remain the final substrate;
- that a fixed-base revolute bench predicts full vehicle feel;
- that the current linear spring/damper law is a final component model.

The result is narrower and more useful:

> If a state-dependent authored mechanical relation is realized as external body force, the relation must see sufficiently fresh state. Box3D internal substeps do not automatically provide that refresh to externally evaluated `F(x,v)`.

## Decision consequence

Do not carry the current C0 external-force implementation directly into an Owner-facing suspension corner by calling `World_Step(1/60, 4)` once per outer tick.

The next bounded substrate decision should compare where the mechanical relation is solved, not re-litigate whether geometry matters:

1. explicit external microstep refresh;
2. authored physical parameters translated into an existing solver-native constraint, if the pinned API can express the required causal relation without semantic distortion;
3. a minimal custom solver/constraint seam only if the first two cannot preserve the required physical semantics.

Those are separate experiments. C0b grants none of them architecture authority.

## Natural stop

C0b is closed here. Do not extend its frequency ladder, add more stiffness values, add vehicle contact, donor visuals, UI or nonlinear curves merely to make the receipt broader.
