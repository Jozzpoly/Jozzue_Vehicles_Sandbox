# Rep4 — Multi-Relation Suspension Corner

Date: 2026-09-05

Status: **PRE-VERDICT EXPERIMENT CONTRACT**

Branch:

`experiment/rep4-multi-relation-corner`

Selection evidence:

`experiment/s0-suspension-composition-feasibility@e2ecfc42f137c9da62e4553cd8ae14d0373d11e4`

Canonical project truth at selection:

`main@6dc7097ed292bc654adaa0078e2a44550cea11c2`

## 1. Why Rep4 exists

Rep3 established that recognizable physical mount geometry can own a real hinge relation and that the Owner can directly manipulate that geometry. It also established a methodological boundary: a one-hinge / one-arm apparatus was too sparse to earn a meaningful construction-quality or feel verdict.

S0 then compared whether the next richer mechanism should fall back to a trailing arm + damper or carry forward a two-arm / upright closed chain. The pinned `box3d.js@0.0.2` substrate kept a two-revolute / two-spherical closed chain bounded under planar, translated-hardpoint and nonparallel spatial probes, so the richer two-arm class is selected for the next experiment.

Rep4 therefore increases **representative task richness**, not generic product scope.

## 2. Central unknown

Can a small, recognizable multi-relation suspension corner provide enough genuine construction bandwidth for the Owner to form a spatial mechanical intent, run the mechanism, understand coupled consequences and deliberately revise the construction — while every presented causal mechanism remains owned by the same real physical relations?

Target loop:

`author several meaningful hardpoints → PLAY real mechanism → observe coupled motion → revise geometry → PLAY again`

The experiment is not trying to prove a final suspension architecture or a final builder.

## 3. Selected mechanism class

Bounded corner bench:

- fixed chassis/support;
- upper rigid arm;
- lower rigid arm;
- upright / wheel-carrier body;
- upper arm inboard physical bearing pair → geometry-derived native revolute relation;
- lower arm inboard physical bearing pair → geometry-derived native revolute relation;
- upper and lower outboard physical ball-joint locations → native spherical relations to the upright;
- one real steering/tie relation if needed to own the upright steering/twist DOF exposed by S0;
- one real spring/damper relation using already-qualified physical `k/c/restLength + live eyes` semantics;
- recognizable real donor visuals projected from those live relations where useful.

No tire/contact, ground interaction, drive torque, full chassis motion or driving is required for Rep4.

## 4. Authored authority / derived mechanics

The normal BUILD authority should be spatial and mechanically recognizable.

Candidate authored geometry:

- upper inboard bearing A/B world positions;
- lower inboard bearing A/B world positions;
- upper outboard ball-joint world position in neutral BUILD;
- lower outboard ball-joint world position in neutral BUILD;
- damper chassis eye;
- damper lower eye expressed as a point attached to the lower arm in the neutral BUILD construction;
- if the steering relation is included: chassis/rack-side steering point and upright steering pickup.

Derived/internal only:

- revolute pivots / local frames / axis quaternions;
- arm rigid-body local geometry generated from the authored hardpoints;
- upright-local upper/lower ball anchors generated from neutral authored geometry;
- native solver coefficients derived from physical component semantics;
- visual transforms needed to project real donors onto live physical relations.

Normal authority must not contain an independently authored hidden hinge axis, hidden upright orientation lock, visual-only steering path or outcome-preserving geometry retune.

## 5. Adaptive-completion boundary

Rep4 may use experiment-local geometric completion where required to make physical building possible, but every such completion must be explicit in the contract and must not silently become product architecture.

Allowed provisional completion:

- rigid upper/lower arm shape/length adapts in BUILD to connect its authored inboard relation to the authored outboard ball location;
- a neutral steering/tie link may auto-fit its rigid length from its two authored neutral endpoints **if selected below**, then remain fixed during PLAY;
- visible arm meshes may stretch/adapt between live authoritative points.

Not allowed:

- silently changing damper `k`, `c` or `restLength` to preserve a desired motion;
- changing mechanical hardpoints during PLAY to make the solver behave;
- solving bad geometry by inventing hidden fallback axes/anchors;
- visual sockets becoming physics authority merely because they exist in donor files.

The provisional auto-fit choice, if used, is Rep4-local and does not settle future intent-lock/adaptation semantics.

## 6. Steering/twist DOF decision

S0 exposed that two revolute arms + two spherical outboard joints leave a second upright rotational / steering DOF.

Rep4 must **not** hide it with a world rotation lock.

Before the Owner-facing gate, Stage A must decide between only two acceptable paths:

### T — real tie relation

Add a real fixed-length steering/tie link between a chassis-side authored point and an upright authored pickup. Its neutral length may be experiment-local auto-fit at BUILD, but PLAY must use that real fixed relation.

This is currently preferred because it:

- mechanically owns upright steer/toe;
- adds another meaningful construction decision;
- can expose real suspension-travel → toe/bump-steer consequence;
- reuses relation classes already present in JV/V0/R1 research rather than inventing a hidden lock.

### F — intentionally free upright

Keep the second DOF free only if machine evidence shows that free steering is itself necessary to the targeted Rep4 question and remains readable rather than confounding the construction loop.

A hidden orientation constraint is not an option.

## 7. Damper relation

Rep4 should compose the already-qualified Rep2/C0c/C1 semantics rather than re-invent spring physics:

`authored physical k/c/restLength + live chassis/lower-arm eyes → native Box3D spring relation → body response`

Required invariants:

- `k/c/restLength` remain identical across geometry-only comparison variants unless the experiment explicitly edits the component property;
- live native joint bodies/anchors/spring state are independently read back;
- changing installation geometry may change leverage, travel, preload/current length and body response;
- visual `Asset_Dumper.gltf` projection must follow the same live eyes if used.

## 8. Real donor policy

Rep4 must use real donor capital early enough that the Owner is not again asked to judge a recognizable vehicle mechanism represented only by balls and rods when useful real assets already exist.

Primary donor source:

`Jozzpoly/Box3d_FunProject@241fe10a9056836332c21d9614471d32d749ce3d`

Relevant assets:

- `assets/source/OneSided_Steering_Suspension_Rig.gltf`;
- `assets/source/One_Sided_wheel_mount.gltf`;
- `assets/source/Asset_Dumper.gltf`.

Historical donor sockets/axes are `physicsAuthority:false` and remain visual/provenance hints only. In particular, old node names are not reliable body-role authority.

The normal Rep4 path should derive visible arm/upright/damper placement from current live mechanical relations and independently check the visual projection where practical.

Rep4 does not require preserving the old donor rig hierarchy.

## 9. Stage A — machine causal composition gate

Before building Owner UI, qualify the smallest complete Rep4 mechanical authority path.

### A1 — upper/lower inboard authority

For both arms:

- native revolute bodies are correct;
- native pivots match derived bearing midpoints;
- native hinge axes match authored bearing lines;
- no independent authored axis exists.

### A2 — outboard closed-chain authority

- upper/lower spherical bodies and anchors correspond to the intended arm/upright physical hardpoints;
- anchor separation remains bounded under motion;
- finite spatial hardpoint mutations produce a real composed upright path without pathological solver behavior.

### A3 — upright steering/twist ownership

Resolve the S0 free DOF by the explicit T or F path from section 6.

If T is selected:

- native tie relation connects intended bodies / live points;
- removing the tie must materially restore the free steering DOF;
- changing tie installation geometry must materially alter a real upright steer/toe consequence during suspension motion;
- no direct upright-angle setter may substitute for the link.

### A4 — damper authority

- native spring bodies / eyes / `restLength` / derived solver coefficients read back correctly;
- same physical `k/c/restLength` across geometry-only variants;
- changing damper installation geometry changes real force leverage / body response without hidden retuning.

### A5 — coupled consequence

At least two distinct authored geometric decisions must produce independently distinguishable real consequences in the same mechanism.

The goal is not a single scalar A/B output. Candidate observable consequences include:

- upright/wheel-center path;
- camber-like upright orientation change;
- toe/steer change if tie relation is included;
- damper length/travel;
- arm motion / installation leverage.

Machine evidence must demonstrate actual body/constraint differences, not telemetry-only labels.

### A6 — invalid / strange geometry behavior

- non-finite and true singular authority rejects explicitly;
- finite unusual geometry should remain permitted when the native mechanism can be instantiated safely;
- if a finite configuration creates an inconsistent/unstable closed chain, diagnose the actual condition instead of silently repairing it.

No product-wide validity system is designed here.

## 10. Stage B — visual correspondence / interaction preflight

Only after Stage A is clean.

Build a browser apparatus that projects the same live authority into a readable mechanism.

Minimum presentation:

- recognizable support/chassis reference;
- visible upper/lower arms and upright/wheel-carrier using real donor capital where practical;
- real damper visual from the live eyes;
- visible steering/tie member if T is selected;
- clearly acquirable authored hardpoint handles;
- ordinary 3D translation gizmo;
- camera orbit/zoom;
- BUILD / PLAY / reset / exact BUILD recovery;
- concise distinction between authored geometry, derived relation and live physical state.

Machine browser preflight should verify actual rendered acquisition/manipulation and causal PLAY before Owner time is spent.

Delivery surface should also be preflighted separately if it introduces a new runtime/hosting layer.

## 11. Owner-judgement eligibility gate

This is the critical addition after Rep3.

Do **not** ask the Owner for a construction/feel verdict merely because Stage A/B are technically green.

Before the checkpoint, the apparatus must demonstrably offer enough independent meaningful construction choices that the Owner can form an intent not scripted by the test author.

Minimum eligibility target:

- at least several spatial hardpoints affecting different relations;
- at least two coupled mechanical consequences visible during PLAY;
- multiple materially different but valid configurations reachable through direct BUILD edits;
- a reason to return from PLAY to BUILD and revise the mechanism;
- no requirement to follow one prescribed A/B sequence to make the experiment work.

If this threshold is not met, record **OWNER VERDICT NOT YET ELIGIBLE** and improve only the missing representative scope. Do not send another sparse checkpoint just to collect feedback.

## 12. Stage C — first honest Owner construction gate

Only after Stage B + eligibility preflight.

The Owner should be allowed to explore rather than follow a rigid script.

Questions:

1. Can the Owner form and execute a spatial construction intention using several hardpoints?
2. Does the mechanism remain understandable enough that PLAY consequences can be causally attributed to the construction?
3. Does the Owner naturally want to return to BUILD to correct or explore the mechanism?
4. Do the real component visuals help read the mechanism without becoming decorative authority?
5. Which semantics feel missing or awkward: hardpoint manipulation, adaptive completion, tie relation, damper placement, camera/readability, or something more fundamental?
6. Is the apparatus finally rich enough to begin discussing construction feel, or is that claim still not earned?

A negative result is useful. Do not polish toward a PASS inside the checkpoint.

## 13. Explicit STOP / non-scope

STOP after the first honest Stage-C Owner verdict and interpret it before adding scope.

Rep4 does **not** authorize by default:

- tire or road contact;
- full wheel spin dynamics;
- drive torque / drivetrain;
- chassis ride/heave/roll vehicle dynamics;
- full steering rack input system;
- a second vehicle side;
- driving;
- full suspension tuning UI;
- general topology editing;
- generic component/data architecture;
- final adaptive-component semantics;
- final renderer / physics runtime / asset pipeline.

Do not turn the corner bench into a car before the STOP.

## 14. PASS boundaries

### Stage A PASS

The selected multi-relation corner is mechanically causal and native-authority-clean under bounded machine tests.

### Stage B PASS

The same real relations are visibly projected and directly manipulable in a real browser without blocking presentation/interaction confounds.

### Owner eligibility PASS

The apparatus materially manifests enough construction task richness to justify asking the Owner about construction quality/feel.

### Stage C bounded positive result

The Owner can independently construct, run, understand and revise several interacting relations, and the loop has enough value to justify broader testing.

None of these is architecture or product acceptance.

## 15. Immediate execution instruction

Do not jump to Stage B/UI.

Start Stage A with the smallest new unresolved seam: **resolve upright steering/twist ownership using a real tie relation on top of the S0 two-arm closed chain**, while preserving the S0 geometry-derived bearing authority. Then compose the already-qualified damper relation and test coupled geometry consequences before any Owner-facing implementation.
