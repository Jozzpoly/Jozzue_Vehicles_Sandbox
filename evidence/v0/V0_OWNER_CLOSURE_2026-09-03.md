# V0 closure — physical consequence readable enough for next research use

2026-09-03. **V0 CLOSED by Owner decision as a bounded research carrier.**

Disposition:

> **PASS for reuse as a research carrier for the next bounded construction→driving experiment.**
>
> **NO product PASS. NO architecture authority. NO authorization to keep polishing V0 as a vehicle.**

The question closed here is deliberately narrow: after removing confirmed presentation/input confounds, is this small physical carrier readable enough that a real steering-geometry change can be understood during driving and therefore serve one further direct-construction research question?

The answer is **yes**.

## Exact provenance

- Canonical docs base before V0: `main@640f6d9074a5dea42ca18e05afb782a90dbb5947`.
- Technical V0 specimen: [`work/front-steering-v0@673dd584d5783b59e177c4ed48c9a64f83a72e49`](https://github.com/Jozzpoly/Jozzue_Vehicles_Sandbox/tree/673dd584d5783b59e177c4ed48c9a64f83a72e49).
- Owner-rehearsal input checkpoint: [`work/front-steering-owner-rehearsal@184c2ed9fb71632afa30f0d60032b8e2b923aa1e`](https://github.com/Jozzpoly/Jozzue_Vehicles_Sandbox/tree/184c2ed9fb71632afa30f0d60032b8e2b923aa1e), direct child of the technical specimen.
- Final deconfounded Owner specimen: [`work/front-steering-v0-deconfound@69d8a8ee91117d4ce44c7dd14657418241844b2e`](https://github.com/Jozzpoly/Jozzue_Vehicles_Sandbox/tree/69d8a8ee91117d4ce44c7dd14657418241844b2e), direct child of the rehearsal checkpoint.
- The original [technical receipt](https://github.com/Jozzpoly/Jozzue_Vehicles_Sandbox/blob/673dd584d5783b59e177c4ed48c9a64f83a72e49/evidence/v0/V0_DRIVABLE_STEERING_RECEIPT_2026-09-01.md) remains the authority for C0–C3 quantitative technical evidence.
- This closure is prepared on a docs-only branch from canonical `main`; it does not merge the V0 implementation into `main`.

## What the technical V0 established

The technical specimen established only:

`steering geometry → physical linkage → wheel orientation/contact → changed vehicle trajectory`

The physical rack and fixed-length tie-rods are the steering authority. The analytical oracle observes rather than actuates. At the C3 trace, the short-arm A geometry produced roughly 1.8× the curvature magnitude of long-arm B in both directions while rack tracking, oracle residual, tie-rod length error and disposable wheel contacts remained within the receipt's bounded evidence.

That was a **technical PASS only**. It did not establish Owner readability, vehicle feel, a final contact model, a builder, a reusable vehicle backend or future JV architecture.

## First Owner rehearsal — confounded, not a V0 failure

The first Owner hands-on on `184c2ed9…` exposed several apparatus-level problems before it could fairly answer whether the A/B mechanical consequence was readable:

- visible steering semantics were reversed: left input produced a world-right trajectory and right input produced world-left;
- the body-relative camera sat front-right of the vehicle and made front/rear and steering interpretation uncomfortable;
- A/B differed physically but the difference was much easier to read from telemetry than from the scene;
- the motion envelope was too weak to make the short drive visually informative.

Owner feedback at that checkpoint was correspondingly negative: the vehicle/camera orientation felt wrong, A/B was not visibly meaningful, and the overall experience was too raw and uncomfortable to support a fair product-path judgement.

Later source/trace investigation confirmed the steering semantic inversion and front-right camera as real implementation confounds. It also confirmed that steering target persistence after key release was intentional in this apparatus: there was no autonomous return-to-center hidden behind the feedback.

This first run therefore remains valuable evidence about **instrument readability**, not evidence that the physical steering consequence itself lacked Owner value.

## Bounded deconfounding patch

`69d8a8ee…` changed only the bounded rehearsal/presentation surface needed for a fair retest:

- corrected user-input polarity without changing the physical world convention or linkage;
- replaced the front-right view with a simple rear/chase-ish camera;
- added an explicit FRONT/nose cue;
- added a world-space current trajectory trail plus one previous-run A/B ghost;
- modestly increased the application drive envelope while retaining the disposable low-speed carrier;
- strengthened browser coverage for world-space left/right semantics, steering persistence/explicit centering, contacts and the one-run ghost.

The patch deliberately did **not** redesign `PhysicalSteeringWorld`, steering geometry, tie-rods, oracle, tires, suspension, drivetrain, assets, builder semantics or final camera architecture.

Recorded implementation validation before the final Owner run: 35/35 operation/build checks and 9/9 browser checks, followed by an independent rendered-runtime preflight. The preflight found correct left/right rendered behavior, retained steering target plus explicit `C` centering, visible A/B trajectory-radius difference, working current/ghost trails, stable `1 / 1 / world 4` contacts and no application console errors/warnings.

## Final Owner evidence

The second Owner hands-on on exact `69d8a8ee…` materially changed the product signal.

Owner judgement after driving both variants:

> the experience is now significantly better;
>
> there is now a substantial visible difference between A and B;
>
> vehicle/camera orientation is correct;
>
> steering semantics are correct.

The recorded run also shows sustained driving rather than button-checking: the Owner drives A through long curved paths, switches to B, continues driving with the prior A path available as a ghost, and is able to perceive the different steering response in the rendered scene. No visible carrier collapse or loss of the bounded contact state dominates the run.

This does **not** convert the primitive vehicle into a good product. It establishes that the earlier confirmed confounds no longer dominate the narrow research question.

## Closure claim

V0 now supports the following bounded claim:

> A real change in steering linkage geometry can propagate through the physical mechanism into a materially different driving trajectory, and after basic orientation/input/readability confounds are removed, the Owner can perceive that difference well enough for this carrier to support one further direct-construction→driving research experiment.

This is stronger than the original technical C3 receipt because it adds Owner readability of the physical consequence. It is still much narrower than a vehicle, builder or architecture PASS.

## Portable knowledge — not prescribed architecture

- Machine-readable mechanical difference is not enough. Presentation can completely hide a valid causal effect from the Owner.
- Input semantics, camera/orientation and enough motion to expose a trajectory are part of experimental validity when the research question depends on human perception.
- A cheap world-space trajectory comparison can be sufficient research instrumentation; it is not a proposed final replay/ghost system.
- The useful causal chain is the important result, not the V0 carrier implementation.
- A/B are unusually clean for the next research step: their common geometry is the same and the tested steering-arm pickup radius differs (`0.18 m` versus `0.30 m`). This makes the steering linkage a strong candidate for a direct-construction experiment, but does not preselect it.
- The current preset construction automatically establishes a matching straight-ahead fixed tie-rod length for each geometry. Any future editable geometry must make the adaptation/intent rule explicit rather than silently inheriting this convenience as product semantics.

## Deliberately not inherited

Do not promote any of the following from V0 into JV architecture merely because they worked here:

- spherical wheel contacts, no-suspension carrier, current mass/friction/drive constants;
- `SteeringVariantId`, A/B presets, analytical steering oracle or current trace/HUD schema;
- translucent primitive projection, nose flag, current chase camera or trail implementation;
- Three.js, current Box3D integration shape or this repository's temporary Web runtime structure;
- the assumption that adaptive tie-rod length is always automatic;
- a one-parameter steering-arm edit as proof of a general builder interaction grammar.

The carrier may be reused only while it remains the cheapest honest substrate for the next bounded question. If its rawness begins to dominate that question, freeze it rather than growing it into the product by inertia.

## Stop and next decision

**Stop V0 feature development here.** Do not add a power slider, suspension, final wheel model, richer camera system, asset pipeline or general builder simply because the carrier is now usable.

Before new implementation, refresh canonical project truth and select the next representative problem against the long-term loop:

`build → run → observe → improve → get in and drive`

The leading candidate is direct spatial steering-linkage construction, because it could connect E1's construction-loop learning with V0's demonstrated physical driving consequence. It remains a candidate until compared against alternatives for information gain, representativeness, confounds and prototype gravity.
