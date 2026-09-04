# Rep2 — spring / damper semantics audit

Date: 2026-09-04

Status: **bounded research finding; not an architecture decision**

## Why this audit exists

Owner feedback from the historical JV_CORE build was that the suspension `Hz` control never felt like a convincing direct spring-stiffness control. That judgement is product evidence about what the control communicated and felt like; it is not, by itself, a diagnosis of the physics.

The post-R1 Rep2 reselection therefore checked the exact old implementation before deciding what a new spring/damper model should mean.

## 1. What the old JV control actually meant

The old UI presented `suspensionHertz` as **"Twardość sprężyny"** with a `Hz` value and a soft/hard description.

The underlying physics did not consistently treat that number as a physical spring rate belonging to a component.

For the trailing-arm path it explicitly:

1. derived a damper/wheel motion ratio from the installation geometry;
2. derived the distance-constraint effective mass from body mass, inertia, anchor radius and damper axis;
3. interpreted configured `suspensionHertz` as a target wheel response;
4. computed a target wheel rate from unsprung mass and configured frequency;
5. divided that wheel rate by motion-ratio squared to obtain a target damper rate;
6. converted that target rate plus constraint effective mass back into the Box3D `hertz` required by that particular constraint;
7. cached a `trailingCoiloverHertzScale` so later live tuning retained that compensation.

This was not random or mathematically nonsensical. It was an intentional attempt to make the same configured Hz produce comparable wheel response across different rig substrates.

The semantic problem is that the UI described this as **spring hardness**, while the implementation was closer to **target system frequency / wheel response translated through the current mechanism**.

## 2. The same inversion existed beyond Hertz

Historical JV also treated several other suspension controls as wheel-space targets and translated them through geometry:

- `suspensionPreloadFront/Rear`, shown as front/rear ride height, changed the distance-joint rest length after motion-ratio mapping;
- compression/rebound travel were specified in wheel space and mapped through the motion ratio into damper length limits.

This reveals a broader old-JV model:

`desired vehicle/wheel behaviour -> current geometry -> derived joint parameters`

That model is useful for a configurator or target-driven setup tool. It is not a neutral default for a construction system whose geometry is supposed to have direct mechanical consequences.

## 3. Candidate Nextgen default: reverse the authority direction

For direct mechanical construction the more honest default is provisionally:

`physical component behaviour + installation geometry -> derived vehicle/wheel behaviour`

Moving a pickup should therefore normally be allowed to change:

- motion ratio;
- wheel rate;
- damping at the wheel;
- static equilibrium / sag;
- available wheel travel;
- transient response.

The system may diagnose and visualize those consequences, but should not silently retune the component to erase them.

This remains a research posture, not final architecture.

## 4. Hertz is not "bad"

Box3D's Hz/damping-ratio spring parameterization is useful precisely because it describes desired harmonic response in a way that can be relatively independent of attached body masses. That is a solver/product convenience, not evidence that Hz is the physical identity of a real coil spring.

Possible legitimate roles for Hz in Nextgen JV include:

- a derived ride-frequency diagnostic;
- an advanced solver/debug readout;
- a target-driven setup mode;
- an explicit intent lock such as **keep ride frequency while I move this pickup**.

The key requirement is provenance and visibility: if geometry changes and the system changes spring properties to preserve a target, that must be an explicit authored intention rather than an invisible compensation.

## 5. `k / c / restLength` is also not final architecture

The current C0 relation uses

`F = -k*x - c*v`

because it is a clean falsifier for geometry -> force -> moment -> motion.

Only part of that model generalizes cleanly to a real component:

- linear spring rate `k` is a meaningful physical spring property for a linear coil spring;
- free/rest length is meaningful, although installed preload, perch position and vehicle ride height are different concepts and must not be silently collapsed;
- one scalar damper coefficient `c` is only a first-order research model.

Real dampers commonly have distinct compression and rebound behaviour and nonlinear force-versus-shaft-velocity curves. Low-, intermediate- and high-speed regions, valve transitions and hysteresis can matter. Therefore C0's scalar `c` must not acquire schema authority merely because the experiment works.

## 6. A more useful decomposition to test

A future coilover-like assembly may be better understood as several mechanical relations that happen to share attachment points and visual packaging:

- **spring force element** — conservative axial force, potentially linear or nonlinear;
- **damper force element** — velocity-dependent dissipative axial force, potentially asymmetric/nonlinear;
- **travel / stop element** — bump stop, rebound stop or hard travel limit;
- **visual assembly** — housing, shaft, coil and mounts adapting to the exact live attachment relationship.

This decomposition is only a hypothesis. It is valuable because it prevents a temporary Box3D distance-joint abstraction from becoming the definition of a physical coilover.

## 7. Explicit target-driven mode remains valuable

Rejecting hidden compensation does **not** mean rejecting compensation.

A high-value adaptive-builder operation could deliberately preserve a derived property while geometry changes, for example:

- keep wheel rate;
- keep ride frequency;
- keep static ride height;
- keep available wheel travel.

Such an operation should visibly alter the underlying component/installation values and leave an authored intent lock or operation provenance. This is analogous to CAD constraints: the system helps preserve an intention rather than pretending the geometric edit had no consequence.

This may be one of the strongest future uses of the project's open "intent lock" idea.

## 8. Validation should include energy, not only pose

For a passive spring/damper relation, machine validation can test deeper invariants than endpoint coincidence:

- equal-and-opposite forces at the two live eyes;
- spring energy storage/release consistent with the force law;
- damper power never injecting net energy when configured as a passive damper;
- moving attachment geometry changes moment through the actual `r x F` path;
- no hidden wheel target or force path restores a preselected response.

These invariants are useful even if the eventual force curves become nonlinear.

## 9. Substepping is an unresolved implementation question

A direct state-dependent force law must be recomputed from current eye position and eye velocity often enough.

C0 currently does this at 240 Hz with one Box3D substep per world step. A normal vehicle runtime may instead call a 60 Hz outer step with four internal Box3D substeps. A force computed only once before those four internal substeps is held constant while the state evolves, which is not equivalent to recomputing a stiff spring/damper force every micro-step.

Therefore Rep2 must not promote direct `ApplyForce` merely because the bounded C0 bench passes. A later machine falsifier should compare:

1. 240 Hz world steps with force recomputed every step;
2. 60 Hz outer steps with four internal substeps but one stale force evaluation;
3. four explicit 240 Hz world steps per rendered 60 Hz frame with force recomputed each micro-step;
4. if useful, a Box3D spring-joint translation from physical component properties.

The goal is to learn which representation preserves the authored physical law with acceptable stability and cost, not to defend a preferred implementation.

## 10. Current consequence for Rep2

Do not build a final suspension settings panel.

First establish, in order:

- C0: clean physical force-path relation on a supported Box3D body substrate;
- C0 follow-up: energy/passivity and timestep/substep behaviour;
- C1: exact visual correspondence using a real donor damper asset or bounded real asset fragment;
- C2: transfer to a symmetric vehicle carrier and controlled bump/drive evidence;
- C3: Owner BUILD -> DRIVE -> BUILD judgement.

At every stage preserve the distinction between:

**component truth**, **installation geometry**, **derived vehicle behaviour**, and **optional target/intent constraints**.

Do not promote any temporary C0 field names or solver technique to final component architecture merely because the experiment passes.
