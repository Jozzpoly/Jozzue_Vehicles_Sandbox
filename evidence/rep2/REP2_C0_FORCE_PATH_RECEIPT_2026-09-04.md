# Rep2 C0 — direct compliant force-path receipt

Date: 2026-09-04

Status: **C0a physical seam PASS; numerical/timestep qualification remains separate**

Branch: `experiment/rep2-coilover-force-path`

Accepted C0a head: `30ee3a5ddf2c7dd3589d953ab0024fe42b965f92`

GitHub Actions run: `33866669360`

Job: `101002982000`

## Claim accepted

For the bounded C0 bench, one physical component state

- spring stiffness `k`,
- damping coefficient `c`,
- free/rest length,
- chassis-side live eye,
- arm-side live eye,

can drive a real Box3D force path with no wheel-position target or hidden wheel-rate compensation.

The force is evaluated from live eye separation and relative eye velocity and is applied equal-and-opposite at the exact two live eyes.

Changing only the spatial installation geometry changes the real restoring moment and the first-step Box3D angular response while `k`, `c` and rest length remain unchanged.

Two layouts with the same live damper length and axial force still produce different moments and different Box3D response when their mechanical leverage differs.

This is evidence for the causal relation:

`component force law + installation geometry -> live force at authored eyes -> r x F -> body response`

It is not evidence for a final coilover component model, final suspension architecture, final damper law, final timestep strategy, or final solver choice.

## Machine evidence

At accepted head `30ee3a5...`:

- 59 / 59 Node tests PASS;
- C0 engine-seam tests PASS;
- C0.1–C0.6 PASS;
- previous E1 / V0 / R1 / Rep2 Stage-A tests PASS;
- TypeScript no-emit check PASS;
- Vite production build PASS.

The build retained only the previously known general warnings about `node:module` browser externalization and large chunks; neither is evidence against the C0 physical claim.

## Important falsifier history

C0 did not pass on its first implementation.

### First failure

Run `33863305664` passed 52 / 54 tests. C0.4 and C0.5 failed because the arm had zero live angular response even though the analytical `r x F` moment was non-zero.

Source inspection established that the revolute really frees local Z and that `b3Body_ApplyForce` / `b3Body_ApplyTorque` really accumulate torque.

### Engine-seam isolation

Subsequent probes showed:

- a shapeless dynamic body followed by `b3Body_SetMassData` did not respond to accumulated torque on its first step;
- `b3Body_ApplyAngularImpulse` did respond immediately;
- a shaped body did respond to accumulated torque, but initially with an implausibly large angular velocity.

The first interpretation — “shapeless bodies are the whole problem” — was too broad.

### Exact pinned-engine defect

Pinned Box3D source at the donor revision showed that its `b3Body_SetMassData` updates:

- mass,
- local COM,
- inverse mass,
- `invInertiaLocal`,

but does **not** immediately rebuild `invInertiaWorld`.

Force/torque integration reads `invInertiaWorld`.

Therefore:

- a shapeless body retained zero world inverse inertia for its first force integration;
- a shaped body retained stale shape-derived world inverse inertia after the custom mass override;
- the solver later refreshed world inertia during body finalization, so this is principally a first-step / post-mass-change transient rather than evidence that all later dynamics are permanently wrong.

Current upstream Box3D has explicit regression coverage requiring `SetMassData` to update all solver-visible inertia state and finite extents immediately.

## Compatibility seam used by C0

C0 keeps a tiny real shape only to provide supported finite solver extents in the pinned engine. It then overwrites physical mass / COM / inertia with the experiment values.

Immediately after `SetMassData`, C0 performs a no-op `b3Body_SetTransform(currentPosition, currentRotation)`. In the pinned engine this normal transform path rebuilds `invInertiaWorld` from `invInertiaLocal` before the first force step.

The compatibility test does not merely assert that the body moves. It applies a known pure torque and checks that the first-step angular velocity agrees with `deltaOmega = torque / I * dt` for the requested custom inertia.

Additional tests pin the stale pre-refresh behavior and verify bounded revolute/off-centre-force response after the refresh.

This shim is experiment substrate compatibility, not suspension/component semantics.

## Blast-radius judgement

The discovered defect narrows earlier claims but does not currently justify discarding R1 or Rep2 Stage A.

Rep2 Stage A used a shapeless manually-massed arm, so its very first integration step did not begin with the intended world inverse inertia. However, its important dynamic falsifiers and carrier evidence ran for many subsequent steps, after the pinned solver had refreshed world inertia during finalization. Stage A's accepted claim was also about authored geometry owning a real body/joint/wheel path, not calibrated inertial response.

Historical JV_CORE code that changes mass data immediately before simulation or during a rebuild may have a one-step transient on this pinned engine. Any future claim that depends on the exact first-step force/torque response after `SetMassData` must either refresh the world tensor explicitly or be re-qualified on a fixed engine.

## What C0a still does not establish

C0a deliberately does not establish:

- that scalar `c` is a sufficient real damper model;
- that linear `k` is universal across spring types;
- that direct `ApplyForce` is the best runtime implementation;
- equivalence across 60 Hz / internal substeps / explicit microsteps;
- passive energy behaviour over long integration;
- static sag / gravity equilibrium;
- visual correspondence;
- vehicle-level driving consequence;
- direct BUILD -> DRIVE -> BUILD interaction quality;
- architecture authority for `Rep2CoiloverComponent` or any field names.

## Natural next bounded gate

C0b should qualify the numerical/physical representation rather than adding UI or vehicle complexity:

1. test the passive power/energy identity of the spring-damper force law;
2. compare state-dependent force refresh at explicit microstep cadence against one stale force evaluation across Box3D internal substeps;
3. use convergence against a finer explicit reference rather than an arbitrary single threshold;
4. only if this representation is credible, proceed toward real donor visual correspondence and then a vehicle carrier.

Do not upgrade Box3D in the middle of C0b. A newer-engine requalification should be a separate controlled substrate comparison using the same causal tests.
