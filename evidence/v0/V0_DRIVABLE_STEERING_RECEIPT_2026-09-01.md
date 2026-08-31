# V0 Drivable Physical Steering Truth Loop — technical receipt

Date: 2026-09-01

Branch: `work/front-steering-v0`

Canonical start: `main@640f6d9074a5dea42ca18e05afb782a90dbb5947`

Bounded donor: `Jozzpoly/JV-Box3D-Web-experiment@98849cfe3263dca09e30fca8bb5a216c9924fff4`

Donor dependency: exact `box3d.js@0.0.2`

## Checkpoints and claim

- C0 `221e17c`: a no-suspension, low-speed carrier settles on flat ground and drives straight.
- C1 `8fa07d7`: two valid steering geometries differ only in symmetric steering-arm pickup radius; their straight-ahead tie-rod lengths are established at creation and remain fixed during RUN.
- C2 `4ed2d7d`: rack motor → physical rack → fixed-length tie-rods → knuckles/wheels is the sole steering authority. The analytical oracle observes actual rack travel and never actuates runtime state. Removing the linkage removes steering.
- C3 is the commit containing this receipt: the same deterministic command trace produces a material, mirrored trajectory-curvature difference after an explicit rack-settle baseline.

This is a **technical V0 PASS only** for:

> steering geometry → physical linkage → wheel orientation/contact → changed vehicle trajectory

It is not an Owner verdict, a vehicle-feel result, a final contact model, or a future JV architecture decision.

## C3 evidence

The measurement window begins after 180 initial settle steps, 90 straight drive steps and 120 steps after applying `±0.65` steering. Its primary curvature is `Σ wrapped Δyaw / Σ horizontal ds` over the following 180 fixed steps; the global session curvature shown in the HUD is not the receipt metric.

| Variant / command | Rack baseline | Distance | Segment yaw | Segment curvature |
| --- | ---: | ---: | ---: | ---: |
| A / `-0.65` | -48.715 mm | 5.914 m | +1.216 rad | +0.205674 rad/m |
| A / `+0.65` | +48.712 mm | 5.916 m | -1.221 rad | -0.206419 rad/m |
| B / `-0.65` | -48.719 mm | 6.214 m | +0.704 rad | +0.113300 rad/m |
| B / `+0.65` | +48.714 mm | 6.210 m | -0.718 rad | -0.115627 rad/m |
| A / straight | -0.001 mm | 6.504 m | -0.007 rad | -0.001151 rad/m |
| B / straight | -0.001 mm | 6.504 m | -0.008 rad | -0.001158 rad/m |

Across the six measurement runs:

- maximum rack tracking error: 0.0531 mm;
- maximum oracle residual: 0.000873 rad (0.050°);
- maximum physical tie-rod length error: 0.0277 mm;
- minimum contact evidence: left front 1, right front 1, whole world 4;
- mirrored curvature sum: 0.000745 rad/m for A and 0.002327 rad/m for B;
- the tighter A geometry produces about 1.8× the measured curvature magnitude of B in both steering directions;
- repeated A/right evidence is bit-for-bit deterministic in the operation test.

## Reproducible validation

- `node scripts/test-all.mjs` — PASS, 35/35 operation tests.
- `npm run build` — PASS to ignored `dist-v0`; Vite reports only its known large-chunk and `node:module` externalization warnings. The rendered browser suite exercises the resulting runtime path rather than inferring browser validity from the build.
- `npm run test:browser` — PASS, 7/7 Edge/Playwright tests with an owned local Vite lifecycle and page/console error guards. The V0 test also verifies real-time fixed-step progress through Owner-visible controls and that steering position does not automatically return after key release.
- A 1440×900 rendered screenshot was inspected during C3. The projection shows actual Box3D body frames and actual rack/pickup endpoints, including explicit pivot→pickup steering-arm segments; the oracle is not a rendering input.

The in-app Browser control surface was unavailable in this task, so rendered validation used the repository Playwright fallback. This is tooling evidence, not Owner evidence.

## Falsifiers and limits

The required V0 falsifiers are not triggered: there is no hidden wheel-angle mapping; runtime tie-rod lengths are fixed; A/B oracle and physical traces differ materially; settled rack/constraint/oracle errors remain small relative to the mechanism; all four disposable spherical contacts remain present; and `REMOVED` linkage leaves no substitute steering.

The implementation deliberately does **not** establish or promote:

- final tire/contact, off-road, drift, high-speed handling or steering-return behavior;
- suspension, a generic vehicle backend, an M6 configuration/topology framework or a builder;
- a final steering/component/reference model;
- a final renderer, asset pipeline, desktop/Web split or product visual language;
- the primitive carrier and translucent inspection projection as reusable product assets.

Stop here. V1 direct construction, suspension and further vehicle iteration require a separate Owner decision.
