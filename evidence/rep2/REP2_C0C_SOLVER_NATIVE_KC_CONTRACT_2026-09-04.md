# Rep2 C0c — solver-native physical k/c calibration contract

Date: 2026-09-04

Status: **ACTIVE EXPERIMENT CONTRACT — revised from exact solver source before comparator implementation**

Inputs:

- `REP2_C0_FORCE_PATH_RECEIPT_2026-09-04.md` — authored `k/c/restLength + live eyes` causal atom;
- `REP2_C0B_NUMERICAL_QUALIFICATION_RECEIPT_2026-09-04.md` — external `F(x,v)` requires fresh-state microstep evaluation;
- `REP2_SOLVER_NATIVE_SPRING_SURFACE_PROBE_2026-09-04.md` — exact `box3d.js@0.0.2` exposes a bilateral distance spring through explicit local attachment frames.

## Decision question

C0c asks one bounded question:

> Can the pinned Box3D distance spring be used as a solver-native realization of the same authored physical `k`, `c`, `restLength` and spatial attachment geometry established by C0a, without allowing Hertz/mass normalization to silently redefine the component when mechanism mass or leverage changes?

This is not a generic Box3D spring quality test.

## Why this is the next information-gain step

C0b demonstrated that external state-dependent force evaluated once before `World_Step(1/60,4)` can severely inject artificial energy, while explicit fresh-force microsteps converge.

The exact runtime offers a distance spring that is solved inside Box3D and acts through the same two spatial eyes. It is therefore the cheapest existing candidate that could obtain substep-aware state while preserving causal installation geometry.

However its native control variables are `hertz` and `dampingRatio`, not physical `N/m` and `N*s/m`. A fixed Hertz value is not allowed to become component truth merely because it is convenient.

## Physical truth retained from C0a

Authoritative component properties remain:

- spring stiffness `k [N/m]`;
- damping coefficient `c [N*s/m]`;
- rest length `L0 [m]`.

Installation owns:

- body-relative eye A;
- body-relative eye B.

Changing mass, inertia or attachment leverage must change the mechanism response through physics. It must **not** mutate the authored `k/c/L0` values.

## Exact pinned solver facts that constrain the mapping

Source inspection at the exact donor/substrate commit established:

1. `b3MassData.inertia` is the inertia tensor about the body center of mass; `center` stores that COM separately.
2. `b3Body_SetMassData` stores/inverts that COM tensor directly; it does not parallel-axis-shift it to a joint pivot.
3. the distance joint computes its own scalar axial effective mass from its live distance Jacobian:

   `K = invMassA + invMassB + crA^T invIA crA + crB^T invIB crB`

   `m_axial = 1 / K`.

4. the spring softness is created from `hertz`, `dampingRatio` and the current solver microstep `h`;
5. the spring impulse then uses `massScale * m_axial`.

Therefore two masses that are easy to conflate must stay separate:

- **distance-constraint axial mass** `m_axial` — the mass normalization actually used by the native spring law;
- **whole-mechanism constrained generalized mass** `m_generalized = I_hinge / (dL/dθ)^2` for this one-DOF revolute fixture — useful for predicting the resulting mechanism frequency after the revolute constraint participates.

They are not generally equal.

### Critical correction from the initial contract

The first version of this contract proposed using `m_generalized` directly to derive native Hertz. Exact solver inspection showed that this risks solving the wrong problem: matching whole-mechanism frequency instead of preserving the authored axial force law.

That proposal is retained only as a **competing negative/diagnostic mapping**, not as the preferred physical hypothesis.

The authority for C0c remains the C0a law:

`F_axis = -(k*x + c*v_axis)`.

If a mapping reproduces motion by silently changing force-per-extension, it fails the JV causal-semantic requirement even if its trajectory happens to look similar in one fixture.

## Mapping hypotheses to falsify

All formulas below are hypotheses until the pinned runtime trajectories and reaction forces support them.

### H1 — solver-Jacobian physical-k mapping

Use the exact live axial effective mass corresponding to the native distance constraint:

`m_axial = 1 / (J_distance M^-1 J_distance^T)`.

For `k > 0`:

`omega = sqrt(k / m_axial)`

`hertz = omega / (2*pi)`

`dampingRatio = c / (2 * sqrt(k * m_axial))`.

This is the primary candidate because it attempts to preserve the physical axial `k` and `c` that the native softness normalizes by `m_axial`.

C0c must compute `m_axial` from the same mechanism-local ingredients as the native Jacobian: current axis, eye-to-COM lever arms, inverse masses and inverse inertias. No vehicle category, hidden handling scalar or per-case tuning is allowed.

Because `m_axial` may change as the mechanism moves, compare:

1. **axial-mapped-once** — compute at the initial state and keep hertz/ratio fixed;
2. **axial-mapped-outer** — recompute before every normal `1/60` outer step, then let Box3D solve four internal substeps.

### H2 — generalized-frequency mapping

For the hinged one-DOF fixture:

`J_L = dL/dθ`

`I_hinge = I_COM + m*r_COM^2`

`m_generalized = I_hinge / J_L^2`.

Then use the same harmonic conversion with `m_generalized`.

This mapping intentionally targets the whole mechanism's generalized natural frequency. It is included because it was the plausible pre-source hypothesis and because comparing it to H1 can expose whether trajectory matching is being purchased by changing the component's axial force semantics.

It is **not** allowed to win merely because angle trajectories look closer. Reaction force / physical energy correspondence must also survive.

### H3 — fixed-Hertz control

Take one baseline Hertz/damping pair and reuse it unchanged under mass and leverage mutation.

This is the intentionally suspect path representing Hertz treated as component truth.

## Runtime generalized-inertia oracle

Before the comparator, C0c separately checks the revolute fixture's actual generalized inertia with a known applied torque.

Expected analytic value for the baseline rod:

- `m = 8 kg`;
- `L = 0.7 m`;
- COM offset from hinge = `0.35 m`;
- `I_COM,z = m*L^2/12 = 0.326666... kg*m^2`;
- `I_hinge = I_COM,z + m*0.35^2 = 1.306666... kg*m^2`.

The oracle is evidence for mechanism semantics only; measured inertia must not become a fitted hidden tuning parameter.

## Reference

Use the already-qualified external physical law from C0b as a numerical reference:

- same bodies, mass/inertia and revolute hinge;
- same exact eyes;
- same authored `k/c/L0`;
- explicit force refresh at `3840 Hz`;
- common observations at `60 Hz`;
- bounded duration `0.5 s`.

3840 Hz is not declared analytical truth; it is the existing C0b fine reference for this bounded mechanism.

## Required cases

### Case A — baseline

- arm mass `8 kg`;
- baseline attachment radius `0.35 m`;
- `k = 900 N/m`;
- test both spring-only (`c = 0`) and combined (`c = 18 N*s/m`).

### Case B — mass mutation

Double arm mass while preserving geometry and exact authored `k/c/L0`.

The physical reference must slow because mechanism inertia changed. H1 must preserve the same axial component law by changing its native mass normalization, not by changing component stiffness.

### Case C — leverage mutation

Use at least one materially different non-singular attachment radius while preserving neutral eye separation and exact authored `k/c/L0`.

This changes the real attachment Jacobian and restoring moment. H1 may change because the distance constraint's axial mass changes; H2 changes because whole-mechanism generalized mass changes. Their separation is useful evidence rather than a nuisance.

### Case D — fixed-Hertz negative control

Reuse baseline native Hertz/damping values unchanged in the mass/leverage mutations.

If fixed Hertz happens to match one case, that is calibration coincidence, not general validation.

## Observables

At common 60 Hz times record:

- hinge angle;
- angular velocity;
- eye separation;
- native distance-joint reaction force when available;
- reference physical axial force `-(k*x+c*v)` on the same state;
- physical spring potential using authored `k` and `L0`;
- arm kinetic energy;
- total authored-mechanical energy;
- mapped Hertz and damping ratio over time;
- exact live `m_axial` used by H1;
- `J_L` and `m_generalized` used by H2.

Compare all solver-native paths against the same external fine reference.

No single aggregate score may hide trajectory or force-law structure.

## Pure damper semantic edge

The exact native API parameterizes damping through `hertz + dampingRatio`. Both harmonic mappings become singular for `k = 0, c > 0`.

C0c must record this explicitly as a representation gap. It must **not** fake pure damping by inserting an arbitrary epsilon spring.

A successful combined spring+damper result therefore qualifies only the `k > 0` native distance-spring path. Independent damper realization would remain open.

## Falsifiers

The solver-native candidate is falsified as a clean physical wrapper if any of the following occurs in the bounded cases:

1. H1 fails to preserve force/trajectory semantics materially better than fixed-Hertz when mass or leverage changes;
2. preserving authored `k/c/L0` requires per-case hand tuning unrelated to the explicit native Jacobian mapping;
3. H2 can match trajectory only by materially violating the authored axial force law — this counts against H2, not in its favor;
4. live spatial leverage is erased or reversed by the solver representation;
5. outer-step remapping remains materially insufficient even though Box3D solves the spring inside its four internal substeps;
6. the mapping needs hidden vehicle-category semantics rather than mechanism-local state.

## Verdict classes

1. **NATIVE KC WRAPPER CREDIBLE** — one explicit mechanism-local mapping preserves the physical force/trajectory reference across baseline, mass and leverage mutations; normal `60/4` stepping is bounded.
2. **NATIVE KC NEEDS MORE THAN OUTER REMAP** — the physical mapping is meaningful but outer-step parameter updates remain insufficient; a substep callback/engine seam becomes justified.
3. **NATIVE HERTZ SEMANTIC DRIFT** — native spring is numerically usable but no clean explicit mapping preserves component `k/c` across the required mutations.
4. **NATIVE SPRING PARTIAL ONLY** — `k > 0` spring/combined semantics are credible but independent damping remains an explicit unresolved representation gap.
5. **INCONCLUSIVE** — apparatus or reference cannot distinguish these classes without changing the question.

Classes 1 and 4 may both be true in different scopes; if so the receipt must state the narrow qualified scope rather than collapsing it to a generic PASS.

## Anti-goals

C0c does not:

- select final suspension architecture;
- expose Hertz to the Owner;
- use the Box3D wheel joint;
- upgrade Box3D;
- build a full suspension corner;
- add donor visuals/UI;
- implement nonlinear spring/damper curves;
- design the final component/data model;
- benchmark whole-vehicle performance.

## Natural stop

Stop after the baseline, mass mutation, leverage mutation, competing mapping and fixed-Hertz control have comparable force + trajectory evidence against the same fine reference, and one verdict class can be justified.

Do not continue automatically into a full vehicle or a custom engine constraint.
