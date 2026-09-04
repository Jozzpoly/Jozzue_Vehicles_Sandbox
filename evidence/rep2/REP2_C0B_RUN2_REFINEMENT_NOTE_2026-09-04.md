# Rep2 C0b — run-2 refinement note

Date: 2026-09-04

Status: **PRE-VERDICT REFINEMENT — preserves run 2 as evidence**

Run 2:

- workflow: `Rep2 C0b Numerical Qualification`
- run: `33869650202`
- head: `72746469bd3de1a7372b3f607e3e30542f91bf2c`
- technical execution: PASS (`61/61` tests + production build)

This note is written **before** assigning a C0b verdict class. It records why two additional falsifiers are justified by the raw run-2 evidence rather than by a desire to obtain a particular conclusion.

## What run 2 already demonstrates

The zero-component-force stepping control is extremely tight over 0.5 s:

- angle RMS difference: `9.54e-8 rad`;
- angular-velocity RMS difference: `3.32e-7 rad/s`;
- passive-energy RMS difference: `7.55e-7 J`.

The explicit-refresh ladder generally converges toward the 1920 Hz path. Most `960 -> 1920` versus `480 -> 1920` RMS ratios are near one third.

The JV-like path (`World_Step(1/60, 4)` with one state-dependent force evaluation) separates strongly from the fine reference for spring-bearing laws. The strongest run-2 warning is conservative spring-only energy creation:

- moderate spring-only: final energy `1.2877 x` initial; max positive overshoot `28.77%`;
- stiffer spring-only: final energy `2.9603 x` initial; max positive overshoot `196.35%`.

Fine explicit refresh reduces conservative energy drift monotonically with cadence; the 1920 Hz spring-only overshoot is about `0.20%` moderate and `0.33%` stiffer.

These values make stale state-dependent force a strong hypothesis, but two evidential gaps remain.

## Refinement R1 — non-zero frozen-wrench stepping control

The original P1 zero-force control only shows that the two stepping paths agree when no external load is accumulated.

A stronger causal control is now justified:

> Apply the same constant generalized load (`force at COM + torque`) to the same revolute substrate for the same physical time, comparing four public `1/240,1` steps against one public `1/60,4` step.

Because the load is deliberately state-independent, separation here cannot be blamed on stale spring/damper evaluation. If this control is also tight while spring-bearing stale-force runs are not, attribution to frozen `F(x,v)` becomes materially stronger.

This control does **not** alter the component law or production candidate.

## Refinement R2 — extend only the fine reference frontier

The original contract used 1920 Hz as the finest candidate and required the 960 Hz path to tighten substantially relative to 480 Hz.

Run 2 satisfies this well for nearly all observables, but the stiffer spring-only angular-velocity RMS tightening ratio is about `0.69`, materially weaker than the ~`0.33` seen in most other quantities.

Therefore 1920 Hz is not yet accepted as an unquestioned reference for the hardest conservative case.

Add `3840 Hz` and evaluate:

- `1920 -> 3840` error versus `960 -> 3840` error;
- the conservative energy-drift envelope at 3840 Hz.

No lower-cadence parameter, duration, geometry, law or acceptance threshold changes. If 3840 still does not tighten the hard case, verdict must remain `REFERENCE NOT CONVERGED` rather than extending the ladder indefinitely to manufacture convergence.

## What is deliberately not added

Run 2 does not justify adding:

- Box3D version upgrade;
- Box3D joint-spring comparator;
- full vehicle carrier;
- dynamic chassis;
- nonlinear damper curves;
- production suspension controls;
- donor visual geometry.

Those answer different questions and remain outside C0b.
