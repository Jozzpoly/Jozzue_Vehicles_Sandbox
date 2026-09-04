# Rep2 C0c — solver-native physical k/c calibration contract

Date: 2026-09-04

Status: **ACTIVE EXPERIMENT CONTRACT — no solver representation selected**

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

## Candidate mapping — hypothesis, not assumption

For the one-DOF hinged-arm bench, let:

- `θ` be arm angle;
- `L(θ)` be live eye separation;
- `I_hinge` be the arm generalized rotational inertia about the revolute pivot;
- `J_L = dL/dθ` be the length Jacobian.

The mechanism-level scalar effective mass seen by an axial spring is:

`m_eff = I_hinge / J_L^2`.

The candidate physical-to-solver map is then:

`omega = sqrt(k / m_eff)`

`hertz = omega / (2*pi)`

`dampingRatio = c / (2 * sqrt(k * m_eff))`.

This is valid only for `k > 0` and finite, non-singular `J_L`.

C0c must compute `J_L` from the exact live authored geometry, not from a hidden suspension category or a pre-authored handling scalar.

Because `m_eff` can change as geometry moves, C0c must compare at least:

1. **mapped-once** — calibrate from initial state and keep native hertz/ratio fixed;
2. **mapped-outer** — recompute the physical mapping before each normal `1/60` outer step, then let Box3D solve four internal substeps.

No internal Box3D callback or engine fork is added in C0c.

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

The physical reference must slow because mechanism inertia changed. The solver wrapper must recover that through its mapping rather than by changing component stiffness.

### Case C — leverage mutation

Use at least one materially different non-singular attachment radius while preserving neutral eye separation and exact authored `k/c/L0`.

This changes `dL/dθ`, restoring moment and generalized effective mass through real geometry.

### Case D — fixed-Hertz negative control

Take the baseline solver-native Hertz/damping values and reuse them unchanged in the mass/leverage mutations.

This is intentionally the semantically suspect path. It establishes what happens if Hertz is mistaken for component truth.

If fixed Hertz happens to match one case, that is calibration coincidence, not general validation.

## Observables

At common 60 Hz times record:

- hinge angle;
- angular velocity;
- eye separation;
- physical spring potential using authored `k` and `L0`;
- arm kinetic energy;
- total authored-mechanical energy;
- mapped Hertz and damping ratio over time for mapped-outer;
- `J_L` and inferred `m_eff`.

Compare all solver-native paths against the same external fine reference.

No single aggregate score may hide trajectory structure.

## Pure damper semantic edge

The exact native API parameterizes damping through `hertz + dampingRatio`. The candidate mapping becomes singular for `k = 0, c > 0`.

C0c must record this explicitly as a representation gap. It must **not** fake pure damping by inserting an arbitrary epsilon spring.

A successful combined spring+damper result therefore qualifies only the `k > 0` native distance-spring path. Independent damper realization would remain open.

## Falsifiers

The solver-native candidate is falsified as a clean physical wrapper if any of the following occurs in the bounded cases:

1. mapped paths fail to improve systematically over the fixed-Hertz negative control when mass or leverage changes;
2. preserving authored `k/c/L0` requires per-case hand tuning unrelated to the explicit effective-mass mapping;
3. live spatial leverage is erased or reversed by the solver representation;
4. mapped-outer introduces instability/energy behavior materially worse than the already-qualified fresh-force reference without a bounded explanation;
5. the mapping needs hidden vehicle-category semantics rather than mechanism-local state.

## Verdict classes

1. **NATIVE KC WRAPPER CREDIBLE** — one explicit mechanism-local mapping preserves the physical reference across baseline, mass and leverage mutations; mapped-outer is bounded at normal `60/4` stepping.
2. **NATIVE KC NEEDS MORE THAN OUTER REMAP** — mapping is physically meaningful but outer-step updates remain insufficient; a substep callback/engine seam becomes justified.
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

Stop after the baseline, mass mutation, leverage mutation and fixed-Hertz control have comparable trajectory evidence against the same fine reference, and one verdict class can be justified.

Do not continue automatically into a full vehicle or a custom engine constraint.
