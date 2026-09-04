# Rep2 C0b — numerical / passivity qualification contract

Date: 2026-09-04

Status: **ACTIVE EXPERIMENT CONTRACT — no runtime representation selected yet**

Base evidence: `REP2_C0_FORCE_PATH_RECEIPT_2026-09-04.md`

Base head: `fa372932e92ceaae3767da24e5045552749bc73a`

Branch: `experiment/rep2-c0b-numerical-qualification`

## Why C0b exists

C0a established a real causal force path:

`physical force law + live installation geometry -> force at exact eyes -> r x F -> Box3D response`

It did **not** establish that evaluating a state-dependent spring/damper law outside Box3D once per render/outer physics tick is numerically faithful enough for a vehicle.

Exact pinned donor source establishes that `b3World_Step(dt, subStepCount)` uses `h = dt / subStepCount` internally, while the externally accumulated body force/torque is reused by the internal velocity-integration substeps and reset only during body finalization. Therefore `World_Step(1/60, 4)` does not re-evaluate a nonlinear/state-dependent component law at 240 Hz merely because the constraint solver substeps at 240 Hz.

C0b asks a narrower question before any UI, vehicle carrier, donor visual work, or final suspension model:

> How much numerical/physical error is introduced by the cadence at which an externally authored mechanical relation is re-evaluated, and is direct external force application still a credible substrate candidate?

## Explicit anti-goals

C0b does not select:

- final suspension architecture;
- final spring or damper schema;
- final Box3D version;
- final physics tick rate;
- a universal axial-force component abstraction;
- product-facing tuning controls;
- a vehicle-level suspension setup;
- a replacement for Box3D joint springs.

No Box3D upgrade is allowed inside C0b. A newer-engine comparison is a separate substrate requalification if later justified.

## Critical correction to the first C0b idea

A simple comparison of:

- four public `World_Step(1/240, 1)` calls with force re-evaluated before every call, versus
- one public `World_Step(1/60, 4)` call with force evaluated once,

is **not by itself causal evidence for force staleness**. Those paths also differ in outer-step finalization, warm-start lifecycle, transform/inertia refresh and other solver bookkeeping.

C0b therefore includes a zero-component-force free-motion control. If the free control already separates strongly between those stepping paths, the state-dependent comparison is confounded and must not be attributed to stale spring/damper evaluation.

## Mechanical law under test

Only the existing C0 calibration atom is used:

`F_axis = -(k * x + c * v_axis)`

where:

- `x = currentLength - restLength`;
- `v_axis` is relative eye velocity projected onto the live eye-to-eye axis;
- equal-and-opposite force is applied at the exact two live eyes.

This is not promoted to a final damper model.

## Phase P0 — instantaneous passivity identity

For arbitrary finite geometry/state, verify directly from the live trace:

`P_component = F_arm · v_arm + F_chassis · v_chassis`

`dU_spring/dt = k * x * v_axis`

`P_dissipation = c * v_axis^2 >= 0`

and therefore, to floating-point tolerance:

`P_component + dU_spring/dt + P_dissipation = 0`

This is a sign/causal-law oracle. It does not qualify time integration.

## Phase P1 — free-motion stepping control

Use the exact same shaped/manual-mass/revolute substrate and initial angular state, but `k = 0`, `c = 0`.

Compare over identical physical time:

- explicit outer microsteps: repeated `World_Step(1/240, 1)`;
- JV-like path: `World_Step(1/60, 4)`.

Record common-time hinge angle, angular velocity and passive mechanical energy.

If this zero-force control separates materially, C0b must classify the later state-dependent A/B as solver-path-confounded rather than stale-force evidence.

## Phase P2 — explicit-refresh convergence ladder

For both a moderate and a stiffer bounded regime, run the same initial mechanical state with force re-evaluated before every public outer step at:

- 60 Hz;
- 120 Hz;
- 240 Hz;
- 480 Hz;
- 960 Hz;
- 1920 Hz.

Sample all trajectories on common 60 Hz observation times.

Primary observables:

- hinge angle;
- arm angular velocity;
- spring length / extension;
- total passive mechanical energy = translational kinetic + rotational kinetic + spring potential;
- maximum positive energy overshoot relative to initial energy;
- for damped cases, total energy decay.

No single arbitrary scalar score is allowed to hide the observables.

### Reference gate

1920 Hz is not automatically truth.

Before lower-cadence judgement, 960 Hz and 1920 Hz must demonstrate a substantially tighter trajectory agreement than the next-coarser 480 Hz path. If not, verdict is:

**REFERENCE NOT CONVERGED — stop and refine the reference before judging production cadence.**

## Phase P3 — isolate the state-dependent refresh penalty

Run three laws in both the explicit-refresh ladder and the JV-like `60 Hz / 4 internal` path:

1. spring-only;
2. damper-only, starting with non-zero angular velocity;
3. combined spring + damper.

Use P1 to bound the stepping-path difference that exists with no component force at all.

Only separation substantially beyond that control may be interpreted as evidence associated with stale state-dependent force evaluation.

## Phase P4 — dynamic passivity / energy falsifier

Use the fine explicit-refresh reference to establish the numerical energy-drift envelope of the conservative spring-only case.

For positive damping, the component must not show sustained/passive energy creation. Any damped-run positive energy overshoot must be interpreted relative to the conservative numerical drift envelope rather than against an invented universal epsilon.

A candidate cadence that exhibits repeatable net energy pumping beyond the reference numerical envelope is not acceptable merely because its final pose looks plausible.

## Parameter regimes

C0b deliberately uses two bounded regimes rather than one tuned example:

### Moderate

- `k = 900 N/m`
- combined `c = 18 N*s/m`
- rest length `0.5 m`

### Stiffer stress case

- `k = 3600 N/m`
- combined `c = 36 N*s/m`
- rest length `0.5 m`

The damping coefficient scales with `sqrt(k)` here only to keep the stress case from silently changing both stiffness and damping character by unrelated factors. This does not claim either pair is a production vehicle setting.

Default spatial fixture remains a non-singular off-axis installation derived from C0. Initial angle / velocity must be large enough to exercise the law but stay far from solver speed caps or geometric singularity.

## Verdict classes

C0b must end in one of these evidence classes, not a forced PASS/FAIL binary:

1. **DIRECT-FORCE CREDIBLE** — explicit-refresh trajectories converge, passivity is bounded by the reference envelope, and a practical refresh cadence exists; `60/4` stale-force behavior may still be rejected separately.
2. **DIRECT-FORCE REQUIRES MICROSTEP REFRESH** — fine explicit refresh is credible but JV-like outer-step refresh materially departs from it beyond the zero-force control.
3. **PUBLIC-API STEPPING CONFOUNDED** — even zero-force stepping paths separate enough that stale-force causality cannot be isolated cleanly with this apparatus.
4. **DIRECT-FORCE NUMERICALLY WEAK** — even fine explicit refresh has unacceptable/non-convergent or energy-pumping behaviour in the bounded regimes.
5. **REFERENCE NOT CONVERGED** — the fine ladder cannot yet supply a defensible reference.

No class automatically selects Box3D Hertz/joint springs. If direct force needs microstep access, the next bounded decision may compare: external explicit microsteps, authored `k/c` translated into a solver constraint, or a small engine extension.

## Natural stop boundary

Stop C0b after:

- P0–P4 metrics exist for both regimes;
- the reference gate has been evaluated;
- the zero-force control has bounded solver-path confounding;
- one verdict class is justified from the evidence;
- negative/failing trajectories are retained.

Do **not** continue from C0b into UI, donor visuals, vehicle driving, Box3D upgrade, or a custom constraint in the same milestone.
