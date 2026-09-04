# Rep2 C0c — solver-native physical k/c calibration receipt

Date: 2026-09-04

Status: **CLOSED BOUNDED RESEARCH RESULT**

Branch: `experiment/rep2-c0c-solver-native-kc`

Acceptance head: `2da7ff61219e20afd49d2be7ac7520645625a186`

Acceptance workflow:

- run: `33875428047`
- job: `101031145121`
- conclusion: **SUCCESS**
- existing regression suite: **61/61 PASS**
- C0c comparator: **PASS**
- C0c acceptance summarizer: **PASS**
- artifact: `9937638064` (`rep2-c0c-solver-native-study`)
- artifact SHA-256: `76b77a02fc7e5b2a0b50a959498cebe14083e40b29d8df866021782c67e6e7c3`

## Verdict

**NATIVE KC WRAPPER CREDIBLE — narrowly, for a linear `k > 0` spring and combined linear spring+damper realized by the pinned Box3D distance-spring constraint.**

At the same time:

**NATIVE SPRING PARTIAL ONLY — independent pure damping (`k = 0, c > 0`) remains an explicit representation gap.**

These verdicts do **not** select a final suspension architecture, a final component/data model, or a final Box3D integration strategy.

The bounded result is:

> Authored component truth can remain physical `k [N/m]`, `c [N*s/m]`, `restLength [m]` plus two real spatial attachment eyes. For the tested linear `k > 0` regime, the pinned solver-native distance spring can realize that law at normal `World_Step(1/60, 4)` stepping when Hertz and damping ratio are derived internally from the distance constraint's own axial effective mass. Hertz must not become authored component truth.

## What changed during C0c

The initial candidate mapping in the contract used the one-DOF mechanism generalized mass:

`m_generalized = I_hinge / (dL/dθ)^2`.

Exact solver inspection before the comparator showed that this was the wrong quantity for preserving the **axial component force law**.

The pinned distance joint computes:

`m_axial = 1 / (J M^-1 J^T)`

from the two bodies and their current attachment lever arms, then applies its discrete softness using that axial mass.

This separated two different objectives that must not be conflated:

1. matching the natural frequency of an already constrained mechanism;
2. preserving the authored component law `F = -k x - c v`.

For JV, objective 2 is the authority. Geometry and the rest of the mechanism are then allowed to change motion causally.

The contract was corrected **before** running the comparative acceptance study, so the result was not retrofitted to observed output.

## Mapping that survived

For `k > 0`, using the native distance constraint's axial effective mass `m_axial`:

`omega = sqrt(k / m_axial)`

`hertz = omega / (2*pi)`

`dampingRatio = c / (2 * sqrt(k * m_axial))`

The Owner-facing / authored quantities remain `k`, `c`, `restLength`, and attachment geometry. `hertz` and `dampingRatio` are internal derived solver parameters.

No per-case handling scalar or vehicle-category tuning was introduced.

## Exact substrate checks supporting the mapping

### Mass/inertia semantics

Exact donor/public source establishes that `b3MassData.inertia` is the inertia tensor about the body center of mass while `center` stores the local COM separately. `b3Body_SetMassData` stores those values directly and does not apply a parallel-axis shift for a later revolute pivot.

The separate hinge-inertia runtime oracle therefore tested whether the constrained runtime itself recovers the expected parallel-axis generalized inertia.

Corrected oracle run:

- workflow run: `33874271844`
- expected `I_hinge = I_COM + m*r^2 = 1.3066666667`
- inferred at `1/60`: `1.3066700375` (relative error `2.58e-6`)
- inferred at `1/240`: `1.3066666791` (relative error `9.54e-9`)
- inferred through the fine cadence series remained at the same value to numerical precision
- `World_Step(1/60, 4)`: `1.3066668318` (relative error `1.26e-7`)

An earlier oracle report incorrectly used the microstep `dt` rather than total outer `dt` for the internal-four inference and therefore reported exactly one quarter of the correct inertia. That was identified as an evidence-calculation bug and corrected before C0c acceptance evidence was used.

### Native spring solver semantics

Exact pinned source shows that the distance joint:

- uses its two local attachment frames as the real spatial constraint geometry;
- computes an axial effective mass from body inverse mass/inertia and attachment lever arms;
- derives discrete constraint softness from `hertz`, `dampingRatio`, and the internal substep `h`;
- solves the spring inside the constraint loop;
- exposes the resulting constraint force through `b3Joint_GetConstraintForce`.

This is materially different from C0b's failed stale external-force path, where state-dependent force was evaluated only once before four internal solver substeps.

## Acceptance study

Reference:

- same hinged mechanical bench;
- same authored `k/c/restLength` and exact spatial eyes;
- explicit external physical law refreshed at `3840 Hz`;
- observations at common `60 Hz` times;
- bounded duration `0.5 s`.

Normal native path:

`World_Step(1/60, 4)`.

Cases:

1. baseline — `8 kg`, attachment radius `0.35 m`;
2. mass mutation — `16 kg`, same geometry;
3. leverage mutation — `8 kg`, attachment radius `0.175 m`.

For every case:

- spring-only: `k=900 N/m`, `c=0`;
- combined: `k=900 N/m`, `c=18 N*s/m`.

Compared paths:

- **H1 axial-once**;
- **H1 axial-outer**;
- **H2 generalized-once**;
- **H2 generalized-outer**;
- **H3 fixed-Hertz** negative control.

The reaction-force comparison excludes the pre-step `t=0` sample, where a solver reaction has not yet been produced.

## Quantitative result

### Aggregate force-law fidelity

Normalized RMS error of native reaction force against the authored instantaneous axial law:

| path | mean NRMSE | worst NRMSE |
|---|---:|---:|
| axial-once | 2.935% | 3.834% |
| axial-outer | **2.934%** | **3.834%** |
| generalized-once | 46.970% | 89.353% |
| generalized-outer | 46.869% | 89.344% |
| fixed-Hertz | 48.599% | 98.970% |

The H1 residual is finite and not claimed to be analytical equivalence. In this bounded test it is consistent with a discretized solver-native realization that needs no hidden per-case tuning.

### Aggregate trajectory fidelity

Angle RMS against the same fine external reference:

| path | mean angle RMS | worst angle RMS |
|---|---:|---:|
| axial-once | 0.002950 rad | 0.005250 rad |
| axial-outer | **0.002942 rad** | **0.005250 rad** |
| generalized-once | 0.029319 rad | 0.059703 rad |
| generalized-outer | 0.029274 rad | 0.059700 rad |
| fixed-Hertz | 0.018911 rad | 0.032272 rad |

### Mutation falsifiers

For the mass-doubled case, axial-outer versus fixed-Hertz:

- spring-only force-error ratio: `0.02672`;
- combined force-error ratio: `0.02694`;
- spring-only angle-error ratio: `0.10490`;
- combined angle-error ratio: `0.11179`.

For the half-radius leverage case:

- spring-only force-error ratio: `0.05494`;
- combined force-error ratio: `0.05293`;
- spring-only angle-error ratio: `0.04683`;
- combined angle-error ratio: `0.04756`.

Against generalized-outer, axial-outer force-error ratios are approximately:

- `0.103` / `0.105` for mass mutation;
- `0.0266` / `0.0256` for leverage mutation.

This is not a marginal ranking. The mutations strongly separate physical axial-mass mapping from both alternative hypotheses.

## What was falsified

### Fixed Hertz as component truth — falsified

Fixed Hertz matches the baseline only because that is where it was calibrated.

When mass doubles while authored `k/c/L0` stay unchanged, fixed-Hertz force-law NRMSE rises to approximately `98.5–99.0%`.

When attachment radius is halved, it rises to approximately `43.2%`.

Therefore Hertz cannot be stored or exposed as the physical component stiffness authority if JV intends geometry and mass to retain causal meaning.

### Generalized mechanism mass as the k/c translation mass — falsified for this purpose

The generalized mapping is intuitively attractive because it describes the constrained mechanism's frequency, but it does not preserve the axial spring law.

Its force-law error reaches approximately `25–26%` in baseline/mass cases and approximately `89.3%` under the leverage mutation.

It may remain useful as a diagnostic for mechanism-level modal behavior, but it is not the correct `k/c -> native distance spring` translation authority demonstrated here.

## Outer remapping result

In the baseline and mass mutation the solver's axial mass is constant in this fixture, so axial-once and axial-outer are identical.

In the half-radius case the live axial mass changes only slightly during the bounded motion (roughly `4.571–4.584 kg`). Outer remapping produces only a small improvement.

Therefore C0c does **not** demonstrate that outer-step remapping is generally unnecessary. It demonstrates only that this bounded mechanism does not require more frequent remapping to recover the tested law.

The acceptance summarizer intentionally distinguishes exact applied parameters from post-step live candidate diagnostics. The first raw C0c run is retained only as exploratory evidence because its `mappingRange` label could otherwise be misread as an exact applied-parameter history for `*-once` paths.

## Pure damper gap

The native API parameterizes damping through `hertz + dampingRatio`.

For `k = 0, c > 0`, the physical mapping becomes singular. C0c deliberately does not insert an arbitrary epsilon spring to manufacture a Hertz value.

Therefore:

> independent pure damping remains unresolved.

This does not invalidate the demonstrated combined `k > 0, c >= 0` path.

It does prevent a broad claim that the native distance spring is already a general-purpose suspension force component.

## Relationship to C0b

C0b demonstrated:

- stale state-dependent direct force outside `World_Step(1/60,4)` can inject severe artificial energy;
- fresh-force external microsteps converge;
- frozen-wrench controls show that internal solver stepping itself is not the source of that failure.

C0c now demonstrates a bounded way to avoid that specific stale-refresh problem for a linear `k > 0` spring/combined damper:

- preserve physical authored law;
- derive native solver parameters from mechanism-local axial effective mass;
- let the solver reevaluate the spatial constraint during its internal substeps.

This removes the current evidence-based justification for immediately building a custom substep callback or custom constraint solely to solve the C0b problem.

## Claims C0c does not make

C0c does **not** demonstrate:

- a final suspension architecture;
- a final spring/damper component schema;
- nonlinear or piecewise spring curves;
- independent pure damper behavior;
- bump stops, droop limits, hysteresis, friction, thermal behavior, or actuator semantics;
- large-travel geometry where axial mass changes substantially during one outer step;
- multi-link suspension correspondence under load;
- whole-vehicle handling, stability, performance, or Owner feel;
- visual correspondence or donor-asset quality;
- that `box3d.js@0.0.2` is the final JV physics substrate.

## Research consequence

**Stop numerical spring-substrate escalation here.**

The current evidence does not justify an engine fork, custom spring constraint, or more cadence tuning for the bounded `k > 0` problem.

The highest-value next move is to carry this narrow causal substrate back into the representative product problem:

- use real spatial attachment geometry;
- retain authored `k/c/restLength` as component truth;
- derive native Hertz/ratio internally from the solver-compatible axial mass;
- bring a real donor suspension visual fragment into the same causal mechanism;
- test whether visible authored geometry and physical geometry can genuinely remain one correspondence path under BUILD→PLAY rather than creating another parallel visual rig.

Pure damper/nonlinear law remains an explicit open risk to revisit when a representative product problem actually requires it.

## Natural stop

C0c is closed at this receipt.

Do not continue automatically into:

- full suspension-corner implementation;
- custom engine constraints;
- a generalized suspension framework;
- Owner-facing handling polish.

Any next experiment must be selected from the product-facing uncertainty, not from momentum generated by this numerical bench.
