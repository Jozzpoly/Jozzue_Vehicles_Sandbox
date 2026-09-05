# Rep4 — post-Stage-A critical review and hardened continuation plan

Date: 2026-09-05  
Branch: `experiment/rep4-multi-relation-corner`  
Canonical project truth: `main@6dc7097ed292bc654adaa0078e2a44550cea11c2`  
Original qualified Stage-A machine head: `bb8c12e7a3c69bd56d247ff90684f4961bc8a336`  
Stage-A receipt head: `b4236407869a48e215e6eb9385fc6ba51cd2bad6`  
Post-review hardened branch head before this note: `9cc035025f66c1ad8f77eeff9b20d9ce592e3666`

## 1. Purpose

This review challenges the work performed after the Rep3 Owner test before Rep4 proceeds into an Owner-facing browser apparatus.

It does not widen the Rep4 PASS. Its job is to separate what the machine evidence actually established from attractive interpretations, test for obvious post-selection/overfitting weaknesses, and prevent an unqualified Stage-B implementation from inheriting authority merely because it was already written.

## 2. What remains well supported

### Rep3 methodological result

Rep3 remains closed with:

- bounded technical causal PASS for geometry-derived hinge authority;
- demonstrated human operation;
- construction quality / feel / product verdict **NOT EARNED** because the apparatus was too sparse and placeholder-heavy.

The post-Rep3 decision to increase representative task richness rather than polish Rep3 remains justified.

### S0 topology selection

S0 established a bounded feasibility result for a `two-arm + upright` closed chain on pinned `box3d.js@0.0.2`:

- two geometry-derived revolutes + two spherical joints remained bounded;
- representative native anchor/pivot errors stayed in the tens-of-micrometres range;
- a translated upper hardpoint produced a real upright-path difference;
- a nonparallel upper hinge line produced a real out-of-plane response without a solver blow-up.

This justifies selecting the richer two-arm class over the lower-information trailing-arm fallback for **Rep4 research**. It does not establish a final suspension topology or predict Owner preference.

### Rep4 Stage A causal composition

The original qualified machine gate remains valid:

- workflow run `33967387659`;
- exact head `bb8c12e7a3c69bd56d247ff90684f4961bc8a336`;
- `97 / 97` tests PASS;
- production build PASS.

Within the bounded zero-gravity impulse apparatus, the same composed mechanism contains:

- bearing-pair geometry -> real native revolute axes;
- outboard hardpoints -> real spherical arm/upright chain;
- authored tie endpoints -> fixed native tie relation owning the otherwise-free upright twist/steering DOF;
- authored damper eyes + fixed physical `k/c/L0` -> real native spring/damper relation;
- multiple authored geometry edits producing distinguishable physical consequences.

Removing the tie materially restores the free twist DOF. Removing the damper materially restores travel. These controls are stronger evidence than output labels alone.

## 3. Claims that must remain narrow

Stage A does **not** establish:

- production suspension kinematics;
- correct vehicle bump-steer magnitude;
- tire/contact behavior;
- loaded ride/handling response;
- correct vehicle-scale masses/inertias;
- final spring/damper tuning semantics;
- a generic validity system;
- final builder/component architecture;
- Owner construction quality or feel.

The current bench uses zero gravity, apparatus-local masses/inertias and a controlled impulse. Its response magnitudes are research-fixture results.

The signed twist observer is a useful local measure around the upright ball-joint line. It should not be promoted to a full vehicle `wheel toe` claim without the missing wheel/chassis/contact context.

External suspension literature supports the **mechanical relevance** of inner tie-rod hardpoint placement to bump/roll steer, including hardpoint height sensitivity, but this support does not widen the JV evidence beyond the bounded mechanism actually tested.

## 4. Post-PASS robustness falsification

A new diagnostic was run specifically to test whether the Stage-A A5 result was an accident of one hand-picked geometry and one observation instant.

Hardened run after retiring unqualified Stage-B WIP:

- exact head: `9cc035025f66c1ad8f77eeff9b20d9ce592e3666`;
- workflow run: `33968253017`;
- inherited + Rep4 tests: PASS;
- A3/A4/A5 diagnostics: PASS;
- robustness-neighborhood diagnostic: PASS as an emitter;
- production build: PASS.

The robustness artifact sweeps tie inner-point height and observation time without changing the underlying physics model or relaxing a PASS threshold.

### Tie-height neighborhood

Baseline is `tieHeight = 0`.

Representative signed-twist separation at `t = 0.5 s`:

| tie height | twist separation | displacement difference |
| ---: | ---: | ---: |
| `+0.050 m` | `0.03662 rad` | `0.000082 m` |
| `-0.025 m` | `0.01742 rad` | `0.000105 m` |
| `-0.050 m` | `0.03418 rad` | `0.000299 m` |
| `-0.075 m` | `0.05025 rad` | `0.000574 m` |
| `-0.100 m` | `0.06562 rad` | `0.000924 m` |
| `-0.125 m` | `0.08028 rad` | `0.001344 m` |
| `-0.150 m` | `0.09422 rad` | `0.001825 m` |

For the previously selected `-0.100 m` edit, twist separation persists through a broad in-motion window:

- `0.2 s`: `0.02783 rad`;
- `0.3 s`: `0.04226 rad`;
- `0.4 s`: `0.05525 rad`;
- `0.5 s`: `0.06562 rad`;
- `0.6 s`: `0.07245 rad`;
- `0.7 s`: `0.07515 rad`;
- `0.8 s`: `0.07355 rad`;
- `1.0 s`: `0.05902 rad`.

The associated suspension-displacement difference remains small relative to the motion over this window. Constraint errors remain bounded in the same general tens-of-micrometres regime.

Interpretation:

> the selected tie effect is not dependent on exactly one post-selected `0.5 s` sample; a smooth local hardpoint -> twist consequence exists in the tested neighborhood.

This still does not establish a general vehicle bump-steer law.

### Damper-eye neighborhood

The lower damper eye was interpolated from the previous inner to outer locations.

Observed max upright travel is deliberately **not monotonic** across that interpolation:

- `t=0.00`: `0.06410 m`;
- `t=0.25`: `0.07640 m`;
- `t=0.50`: `0.06596 m`;
- `t=0.75`: `0.04189 m`;
- `t=1.00`: `0.01578 m`.

The derived rotational Jacobian also changes sign across the sweep.

Interpretation:

> the earned A4 claim is only that installation geometry materially changes real response while physical `k/c/L0` remain fixed. Do **not** replace this with a simple monotonic rule such as “moving the eye outward always stiffens the suspension”.

The nonlinear result is useful for the next Owner-facing apparatus because it makes exploration preferable to a disguised scalar slider.

## 5. Stage-B implementation audit

While this review was running, the active branch had also received unqualified Stage-B work:

- `17d22fb12adb506b4d8bed9efe848280d96e40cb` added an observer-only native playback trace to the real `dampered-corner-world` result;
- `d35e846b8fbee65c3a881bcda6de1cd7b19b8b4d` added a single ~1176-line browser apparatus file.

The trace addition is retained because it is small and causal-safe: it records the same native Stage-A snapshots and does not create a second physical mechanism.

The large browser file was **not** accepted as Stage-B progress merely because it existed. Source/build review found:

- TypeScript nullability failures;
- references to nonexistent derived fields (`mountSpan`, `outboardWorld`);
- an import of a nonexistent CSS file;
- no active `?rep4` route;
- a large one-shot implementation before any source/build/browser slice was qualified.

The file was removed from the active branch at `9cc035025f66c1ad8f77eeff9b20d9ce592e3666`. Its commit remains inspectable as donor/WIP evidence.

This is a prototype-gravity correction, not a rejection of every design idea inside that file.

## 6. Multi-writer synchronization incident

During this review, Stage-B shadow work advanced the same branch between the last explicit branch read and the first robustness write.

The robustness commit did not overwrite that work — its parent already included the Stage-B commits — but the write was made without a final exact-head recheck immediately before mutation.

That violates the project's intended multi-writer discipline.

Correction for the remainder of Rep4:

1. read exact active branch head immediately before each write series;
2. compare unexpected deltas before modifying the branch;
3. never treat an unseen new commit as harmless because filenames appear unrelated;
4. prefer bounded sequential writes and re-check head after independent/background execution.

## 7. Donor review correction

The real `Asset_Dumper.gltf` donor already has a qualified Rep2 adapter (`c1-damper-adapter.ts`) that binds `Part_Upper`, `Part_Stretch`, `Part_Lower` and projects the donor between live authoritative eyes.

Rep4 Stage B should **reuse that qualified visual adapter** rather than invent a parallel damper projection path.

The older `OneSided_Steering_Suspension_Rig.gltf` and `One_Sided_wheel_mount.gltf` are exported primarily as a skinned mesh plus historical socket/axis nodes, not clean independent product components. Forcing those old socket hierarchies to drive Rep4 would risk reviving the exact physics<->visual authority problem the project is trying to eliminate.

Therefore Stage B may use those files as visual/reference donor capital where a faithful projection is practical, but it should not delay the experiment or invent a new rig system merely to reuse them. A recognizable hardpoint-derived A-arm/upright projection plus the real qualified damper donor is preferable to a more detailed but causally misleading legacy rig.

## 8. Hardened Stage-B plan

Stage B is now divided into small qualification slices.

### B0 — causal playback boundary

Retain one physical source:

`Rep4DamperedCornerAuthority -> deriveRep4DamperRelation -> native Box3D run -> observer-only trace`

The browser may replay that trace. It must not implement an independent arm/upright/tie/damper motion model that can disagree with the native path.

### B1 — visual correspondence slice

Build only enough Three.js projection to prove:

- authored hardpoints are visible as physical construction locations;
- upper/lower A-arm visuals are generated from the same hardpoints;
- upright/wheel-carrier visual follows the same upper/lower live anchors;
- tie visual follows its same live endpoints;
- the existing qualified `Asset_Dumper.gltf` adapter follows the same live damper eyes;
- donor/reference nodes never become mechanical authority.

Source/build tests first; no Owner checkpoint.

### B2 — direct BUILD manipulation

Add ordinary 3D point acquisition and translation for several relation classes, not one scalar disguised in 3D.

Minimum meaningful edit set should include at least:

- inboard bearing geometry;
- one outboard/upright hardpoint;
- tie installation geometry;
- damper installation geometry.

Maintain authored document exactness and deterministic reset.

### B3 — BUILD -> PLAY -> BUILD

PLAY reconstructs the real complete corner from authored authority and replays only its native trace.

Returning to BUILD must recover the exact authored construction. PLAY state must never be committed as new authored geometry.

### B4 — real Chromium preflight

Before Owner time:

- acquire and manipulate multiple rendered hardpoint classes;
- orbit/zoom without input conflicts;
- run at least two materially different authored configurations;
- verify visible tie/twist and damper/travel consequence;
- verify donor damper load/projection and fallback diagnostics;
- verify exact BUILD recovery and no page/console errors.

### B5 — Owner-judgement eligibility

Do not send the checkpoint merely because B1-B4 are green.

The machine/render review must establish that the apparatus offers enough unscripted construction space to let the Owner form an intention, not merely reproduce the author's A/B cases.

If this remains doubtful, record `OWNER VERDICT NOT YET ELIGIBLE` and fix only the missing representative scope.

## 9. Current decision

**Continue Rep4. Do not reselect topology and do not widen to a drivable vehicle.**

The two-arm/upright + tie + damper direction remains justified because:

- its new solver seam survived S0;
- Stage A established multiple real causal levers in one mechanism;
- post-PASS robustness reduced the strongest obvious single-sample overfitting concern;
- the next unresolved question is now presentation/direct-construction eligibility, exactly the intended Rep4 frontier.

The correct next implementation move is **B1 visual correspondence on top of the retained B0 native trace**, not more physics tuning and not another all-at-once Owner UI.
