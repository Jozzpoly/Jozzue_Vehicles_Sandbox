# S0 — Suspension Composition Feasibility / Selection Receipt

Date: 2026-09-05

Status: **CLOSED — MACHINE-ONLY FEASIBILITY PASS; TWO-ARM / UPRIGHT CLASS SELECTED FOR THE NEXT PRE-VERDICT CONTRACT**

## 1. Purpose

After Rep3 closed with strong bounded technical evidence but insufficient experiential bandwidth for a meaningful construction/feel judgement, S0 asked one deliberately narrow selection question:

> Is a spatial two-arm + upright closed-chain mechanism cheap and clean enough on the pinned browser Box3D substrate to justify selecting it over the lower-blast-radius trailing-arm + damper fallback for the next representative Owner-facing research program?

S0 was machine-only. It did not build product UI, import new suspension visuals, add tire/contact/driving, or ask the Owner for another checkpoint.

## 2. Exact lineage

Canonical project truth at S0 start:

`main@6dc7097ed292bc654adaa0078e2a44550cea11c2`

Disposable execution base:

`experiment/rep3-geometry-derived-hinge-line@798cf235b4550bbfb9725364f4f3d85da0cd8d67`

S0 branch:

`experiment/s0-suspension-composition-feasibility`

Exact selected evidence head before this receipt:

`38ab5fc296c86720d81d50502dafefe694663a70`

Accepted workflow:

- workflow: `S0 Suspension Composition Feasibility`
- run: `33965768220`
- job: `101305508604`
- exact head: `38ab5fc296c86720d81d50502dafefe694663a70`
- inherited + S0 tests: **81 / 81 PASS**
- production build regression: **PASS**

Evidence artifact:

- name: `s0-two-arm-upright-composition-evidence`
- artifact ID: `9969364390`
- size: `1753` bytes
- digest: `sha256:1abe503ec9a262a8f0e975a7c10cbccc9f2b88bd105a7d0f0b1d464f66ffcd62`
- schema: `jv-s0-two-arm-upright-composition-v2`

## 3. Pinned substrate reality

The active package remains:

`box3d.js@0.0.2`

Independent upstream grounding for the exact v0.0.2 release lineage confirmed that the pinned package exposes native spherical joints (`b3DefaultSphericalJointDef`, `b3CreateSphericalJoint`). S0 therefore tested actual closed-chain behavior rather than assuming API availability from current docs.

S0 apparatus used:

- fixed support;
- upper dynamic arm;
- lower dynamic arm;
- dynamic upright;
- two geometry-derived native revolute joints at the inboard arm bearings;
- two native spherical joints at the outboard arm/upright connections;
- no gravity;
- `dt = 1/60 s`;
- `4` Box3D substeps;
- `90` outer steps;
- arm mass `3 kg` each;
- upright mass `5 kg`;
- one controlled upright impulse `(0, -0.8, 0)`.

The authored S0 geometry record contains only physical hardpoints for the upper/lower inboard bearing pairs and outboard joints. Solver pivots, hinge directions and upright-local spherical anchors are derived from that geometry.

## 4. Baseline closed-chain integrity

Baseline authored geometry used parallel inboard bearing lines and a planar no-Z initial state/load.

Native body identity readback matched the intended support / upper arm / lower arm / upright for all four joints.

Measured maximum errors / response:

- upper spherical anchor separation: `0.000026190057260283698 m`;
- lower spherical anchor separation: `0.000014741790390269642 m`;
- upper revolute pivot separation: `0.0000115531577030929 m`;
- lower revolute pivot separation: `0.000011827730404863282 m`;
- upper/lower native hinge-axis alignment error: `0`;
- maximum planar drift: `0 m`;
- max upright linear speed: `0.10652443680056685 m/s`;
- max upright angular speed: `0.18460160493850708 rad/s`;
- max upright displacement: `0.15834167844983676 m`.

No immediate overconstraint instability, non-finite state, pathological speed or large anchor divergence appeared in this bounded run.

## 5. Authored hardpoint translation changes real kinematics

The first mutation changed only the upper inboard bearing pair position while keeping the same initial upright/outboard geometry and lower arm.

Results remained bounded:

- upper spherical anchor separation: `0.0000238972677514931 m`;
- lower spherical anchor separation: `0.000013489625444324303 m`;
- upper hinge pivot separation: `0.00001462071228569907 m`;
- lower hinge pivot separation: `0.000010380838091589547 m`;
- hinge-axis readback errors: `0`;
- no planar drift.

Real consequence:

- initial upright path separation: `0 m`;
- final / maximum path separation vs baseline: `0.023202479782251324 m`.

This is bounded evidence that changing physical arm installation geometry can materially change the composed closed-chain upright trajectory without breaking the joint chain.

## 6. Spatial / nonparallel hinge stress

A second falsification kept the upper bearing midpoint unchanged but tilted only its authored bearing line:

- baseline upper axis: `(0, 0, 1)`;
- tilted upper axis: approximately `(0.196116, 0, 0.980581)`.

The lower bearing axis remained world Z. This deliberately left the two arm hinge axes nonparallel.

Measured integrity remained bounded:

- upper spherical anchor separation: `0.000029357908114953278 m`;
- lower spherical anchor separation: `0.000015094010496209167 m`;
- upper hinge pivot separation: `0.000013395767449791957 m`;
- lower hinge pivot separation: `0.000011803665901191725 m`;
- upper native axis A alignment error: `-2.22e-16` numerical roundoff;
- upper native axis B alignment error: `8.24e-14`;
- lower native axis errors: approximately `0`;
- max upright linear speed: `0.10621556799368632 m/s`;
- max upright angular speed: `0.18746401653700806 rad/s`.

Real spatial consequence:

- max out-of-plane response: `0.014803621917963028 m`;
- final / maximum upright path separation vs planar baseline: `0.007438617966052944 m`.

Therefore the closed chain is not only a planar fixture disguised as 3D in this bounded probe.

## 7. Important exposed DOF — do not hide it

Two inboard revolute arm joints plus two outboard spherical joints leave an additional upright rotational degree of freedom: a steering/twist DOF around the line through the two outboard spherical connections.

S0 deliberately did **not** hide this by:

- world-axis rotation locks;
- an invisible solver-only orientation constraint;
- a cosmetic visual correction;
- treating upright orientation as authored independently of the mechanical relations.

This is not a S0 failure. It is a real semantic boundary of the chosen mechanism.

If the next representative apparatus needs a determinate upright steer/toe state, that state should be owned by a real additional relation (for example a tie-rod / steering link) or explicitly remain free because the research question requires it.

## 8. Failed run history

The first S0 workflow attempt (`33965422840`, job `101304574761`) failed before physics because four result expressions referenced a local identifier `derived` rather than `this.#derived`. It was a TypeScript compile defect only. The probe was corrected without changing the intended mechanical topology.

Subsequent physics/test/build runs passed, and the final exact evidence run above includes both the translated-hardpoint and nonparallel spatial falsifications.

## 9. Selection decision

### Trailing arm + damper

Still technically attractive and lower blast radius, and it remains a useful fallback pattern. However most of its relation classes are already individually qualified by Rep3 + Rep2 C0c/C1. It would therefore buy less new construction space for the next Owner gate.

### Two-arm + upright

S0 demonstrated that the new spherical closed-chain seam is sufficiently bounded and numerically clean under representative baseline, translated-hardpoint and nonparallel-axis probes to justify carrying it forward.

It provides materially more independent authored decisions and coupled kinematic consequences without yet requiring tire/contact/driving.

**Selection: two-arm / upright mechanism class.**

This is a research-program selection, not architecture acceptance and not authorization to implement a full vehicle suspension.

## 10. Next pre-verdict program shape

The next program should be a bounded multi-relation suspension/mechanism corner on a bench, built from real causal relations rather than hidden stabilizers.

Candidate relation set to evaluate in the pre-verdict contract:

1. upper arm inboard physical bearing pair → geometry-derived revolute relation;
2. lower arm inboard physical bearing pair → geometry-derived revolute relation;
3. upper/lower outboard spherical joints → real upright attachment;
4. a real tie/steering relation **only if needed to own the exposed upright steering DOF**;
5. a real spring/damper relation using already-qualified `k/c/restLength + live eyes` semantics;
6. real donor visual projection from the same live relations where available.

The contract must decide the minimum set needed to create genuine Owner construction bandwidth. Do not add every familiar suspension component by default.

## 11. Claim boundary / STOP

S0 establishes only:

- exact pinned spherical-joint availability;
- bounded feasibility of one two-revolute/two-spherical closed chain;
- native body/frame/anchor correspondence in the tested cases;
- material real path response to authored hardpoint geometry;
- bounded 3D response with nonparallel arm hinge axes;
- explicit recognition of the remaining steering/twist DOF;
- selection evidence favoring a two-arm/upright next representative mechanism over the trailing-arm fallback.

S0 does **not** establish:

- full double-wishbone suspension correctness;
- steering/tie-rod semantics;
- spring/damper integration into the closed chain;
- wheel/tire/contact;
- driving or handling;
- Owner construction quality / feel;
- final component/reference/data model;
- final physics or renderer architecture.

**S0 is closed. Do not keep tuning this machine bench. Proceed to a fresh pre-verdict contract for the selected richer mechanism.**
