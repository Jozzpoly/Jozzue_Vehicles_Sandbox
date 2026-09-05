# Rep4 Stage A — causal composition receipt

Date: 2026-09-05  
Branch: `experiment/rep4-multi-relation-corner`  
Qualified head before this receipt: `bb8c12e7a3c69bd56d247ff90684f4961bc8a336`  
Canonical `main` remains: `6dc7097ed292bc654adaa0078e2a44550cea11c2`  
Pinned physics package: `box3d.js@0.0.2`

## Verdict

**Rep4 Stage A: PASS — bounded causal-composition feasibility only.**

A single suspension corner can now compose all of the Stage-A mechanical relations without hidden pose/handling authority:

- authored upper and lower inboard bearing pairs -> real geometry-derived revolute axes;
- authored upper/lower outboard hardpoints -> real spherical closed chain into an upright;
- authored chassis-side tie point + upright pickup -> neutral auto-fit, fixed-length native tie relation that owns the otherwise-free upright steering/twist DOF;
- authored damper chassis eye + lower-arm eye -> live native spring/damper relation with qualified physical `k/c/L0` held as component properties;
- multiple authored geometry edits remain causally distinguishable in the same composed mechanism.

This does **not** qualify a final suspension architecture, generic builder/data model, tire/contact model, full vehicle, visual rig, or Owner-facing interaction quality.

## Exact execution receipt

Final Stage-A machine gate:

- workflow: `Rep4 Stage A Causal Composition`
- run: `33967387659`
- head: `bb8c12e7a3c69bd56d247ff90684f4961bc8a336`
- tests: **97 / 97 PASS**
- production build: **PASS**
- diagnostics artifact: `rep4-stage-a-diagnostics`, artifact ID `9969861119`
- artifact SHA-256 reported by Actions: `d060b9f5712d4b6b997f2e35abfb323faf618b50361317df2ada15fe40bb8719`

The artifact contains:

- `rep4-tie-diagnostics.json`
- `rep4-damper-diagnostics.json`
- `rep4-coupled-diagnostics.json`

## A1 — upper/lower inboard authority

**PASS.**

The inboard revolute relation is derived from each authored bearing pair. Existing Rep3/S0 tests verify native body ownership/readback, arbitrary finite 3D bearing-line direction and materially different endpoint paths. The complete Rep4 A6 corner also runs with a nonparallel upper bearing line while tie and damper remain composed.

No independent hidden hinge axis is authored beside the physical bearing geometry.

## A2 — outboard closed-chain authority

**PASS.**

The upper and lower arms join the upright through real spherical joints on the pinned package. S0 established the closed-chain substrate and Rep4 retains it under tie and damper composition.

Representative errors in the Rep4 diagnostics remain in the tens-of-micrometres range rather than showing a solver blow-up; A4/A5/A6 tests retain explicit spherical-separation bounds.

## A3 — steering/twist ownership

**PASS.**

A real fixed-length native distance relation connects:

`authored chassis tie point -> authored upright pickup`

with neutral length derived once from those endpoints. There is no upright-angle setter or world rotation lock.

Controlled twist falsification:

- upright without tie: final signed twist `0.4999997095 rad`;
- same mechanism/impulse with tie: `0.0004426979 rad`;
- free-vs-tied orientation departure separation: `0.4975097547 rad`.

Geometry consequence under the same undamped suspension-travel impulse:

- baseline rack-side height: signed twist `0.0000547425 rad`;
- rack-side height changed only from `y=0` to `y=-0.1 m`: `0.2004270192 rad`;
- signed-twist separation: **`0.2003722767 rad` (~11.48 deg)**;
- max travel remains of the same order (`0.15825 m` vs `0.15390 m`).

Important failed attempt retained in provenance: an earlier Z-only rack-point mutation changed neutral tie length but produced essentially no bump-steer separation because travel was nearly planar in XY. The causal gate was corrected by changing the measurement to signed twist about the upright ball-joint line and mutating installation geometry in the actual travel plane; thresholds were not relaxed to turn the failure green.

## A4 — damper authority

**PASS.**

The composed corner uses a real native spring-enabled distance joint between fixed support and an authored lower-arm eye.

Qualified physical component semantics inherited from Rep2 are held exact across geometry:

- `k = 900 N/m`
- `c = 18 N*s/m`
- `L0 = 0.5 m`

Geometry-dependent Box3D `hertz` and `dampingRatio` are derived once from the neutral live-eye geometry using the already-qualified `axial-once-at-initial-state` mapping; they are not authored substitutes for `k/c/L0`.

Two geometry variants with only `7.90 mm` neutral-length difference produce strongly different real response:

- outer lower eye: max upright displacement `0.0157762 m`;
- inner lower eye: max upright displacement `0.0641038 m`;
- separation: **`0.0483276 m`**.

Removing the real damper relation entirely restores max travel to `0.2092805 m`, a `0.1935043 m` difference from the outer-damper case. No substitute force path is installed in the FREE control.

## A5 — coupled consequence

**PASS.**

A disposable 2x2 machine diagnostic varied only:

1. rack-side tie height (`0` vs `-0.1 m`), and
2. lower damper eye (`inner` vs `outer`).

Both edits run through the same composed two-arm + upright + tie + damper runtime.

The first long-run observer initially under-reported tie consequence because it measured final twist after two seconds, after the damper had returned the mechanism toward neutral. That was not treated as a mechanical failure or repaired by stronger input. A bounded 0.5 s in-motion observation was derived from a deterministic 1..30-step diagnostic instead.

At `t = 0.5 s` during compression, tie-only geometry change gives:

- baseline displacement: `0.05679521 m`;
- tie-edit displacement: `0.05587072 m`;
- displacement difference: **`0.00092449 m`**;
- baseline signed twist: `0.00860038 rad`;
- tie-edit signed twist: `0.07422351 rad`;
- signed-twist separation: **`0.06562313 rad` (~3.76 deg)**.

Thus the tie edit is toe/twist-dominant while essentially preserving suspension travel at the observation.

Damper-only geometry change at the same tie geometry gives:

- max-travel difference: **`0.04832760 m`**;
- long-run final signed-twist difference: `0.00326159 rad`.

Formal A5 tests lock only the causally useful claims with margin; the 1..30-step reconstruction remains disposable evidence apparatus rather than production runtime authority.

## A6 — strange / invalid geometry boundary

**PASS for the bounded Stage-A claim.**

The complete tied + dampered corner accepts a finite, deliberately nonparallel upper bearing line and remains bounded under the Stage-A impulse. It also explicitly rejects:

- coincident/singular bearing pairs;
- non-finite mechanical hardpoints;
- zero-span tie authority;
- zero-span damper authority.

No hidden fallback axis, sanitized point or substitute length is invented.

### Important scope boundary

Stage A does **not** demonstrate a generic product-wide inconsistent-construction validator. In the current bounded authority model, several contradiction classes are intentionally not expressible because:

- hinge axis is derived from the authored bearing pair;
- spherical local anchors are derived from the same neutral hardpoints;
- neutral tie length is derived from its authored endpoints;
- damper solver mapping is derived from its authored eyes and fixed physical component properties.

Adding redundant independent axis/length authority merely to manufacture inconsistency tests would weaken the model and create prototype gravity. Future free-form builder states may create new diagnosable contradiction classes; they should be handled when they become real product problems.

## What Stage A learned

The richer `two-arm + upright` selection survived composition. The extra relations did not force a solver-R&D detour, and they bought genuinely different causal levers:

- bearing geometry controls arm motion planes / 3D path;
- tie geometry owns toe/steer consequence;
- damper installation geometry controls suspension leverage/response while physical component properties stay constant.

This is enough construction bandwidth to justify an Owner-facing Rep4 apparatus. It is still evidence for a representative problem, not architecture authority.

## Next gate

Proceed to **Rep4 Stage B — donor-backed browser visual / interaction preflight**.

Minimum purpose of Stage B is not visual polish. It must make the qualified Stage-A causal relations legible and directly authorable enough that an Owner test can answer the Rep4 product question rather than debug presentation.

Do not request Owner time until machine/browser preflight shows:

- recognizable support/chassis, two arms, upright/wheel carrier, tie and damper;
- real donor visuals where practical, without inheriting donor sockets/axes as physics authority;
- clear authored hardpoints and ordinary 3D manipulation;
- BUILD/PLAY/reset and exact BUILD recovery;
- readable distinction between authored geometry, derived relation and live PLAY state;
- visible motion/consequence large enough to judge without telemetry being the only evidence.
