# Rep3 Stage B — machine/rendered preflight receipt

Date: 2026-09-05

Status: **MACHINE / RENDERED PREFLIGHT PASS — OWNER VERDICT NOT YET RUN**

## Claim boundary

This receipt qualifies only the bounded Rep3 Stage-B presentation apparatus before spending Owner attention.

It does **not** establish that the mechanism is intuitive, natural, useful, fun, product-worthy, or worth continuing. Those are Stage-B Owner questions and remain deliberately unresolved.

It also does not expand Rep3 into wishbone geometry, coilover integration, tire/contact, a drivable vehicle, a generic builder, or final component/data/renderer/physics architecture.

## Qualified runtime

- working branch: `experiment/rep3-geometry-derived-hinge-line`
- exact runtime head qualified here: `3de78caf3c7c0066b352d62097591b48fce90d20`
- immutable Owner-checkpoint alias created from that exact commit: `rep3-stage-b-owner-checkpoint`
- `main` remains untouched.

The Owner-checkpoint alias exists so the hands-on run can be launched from a short branch name without moving the experimental branch or relying on its later docs-only commits.

## Inherited authority regression

On the exact qualified runtime head:

### Stage A

- workflow run: `33958027877`
- job: `101284784974`
- result: **PASS**
- inherited + Rep3 source tests: PASS
- exact A1–A5 Stage-A evidence emitter: PASS
- production build: PASS

### Stage P

- workflow run: `33958027886`
- job: `101284784991`
- result: **PASS**
- inherited + Rep3 source tests: PASS
- exact Stage-P hinge-axis evidence emitter: PASS
- production build: PASS

Therefore the Stage-B presentation changes did not regress the previously bounded Stage-P substrate or Stage-A two-mount authority evidence at this exact commit.

## Stage-B rendered interaction preflight

Dedicated workflow:

- workflow: `Rep3 Hinge Line Stage B Preflight`
- run: `33958027917`
- job: `101284784924`
- exact head: `3de78caf3c7c0066b352d62097591b48fce90d20`
- result: **PASS**

The workflow passed:

1. `npm ci`;
2. inherited source tests + production build (`npm run check`);
3. Chromium installation;
4. real headless Chromium rendered-interaction test;
5. screenshot artifact upload.

Artifact:

- name: `rep3-stage-b-rendered-preflight`
- artifact ID: `9967016101`
- size: `832013` bytes
- digest: `sha256:966919cac5b0d77b4039aaebe1a52489d6bf3710fcbfc8b60b40ad39a80f1cc6`

## What the Chromium test actually did

At a 1440×900 viewport it used rendered pointer interaction rather than privileged mechanical setters:

- opened `/?rep3` and required a live BUILD/READY render;
- verified both projected physical bearing handles are inside the viewport and materially separated on screen;
- verified there is no conventional authored axis input (`input`, `select`, `textarea`) and the axis is presented as derived;
- clicked physical bearing A at its actual projected canvas position;
- acquired the visible world-X translation gizmo and dragged it with real mouse events;
- verified only the authored A.x coordinate changed materially while A.y/A.z remained unchanged;
- dragged empty rendered space through OrbitControls and verified real camera motion;
- entered PLAY through the visible button;
- required a 121-sample path produced by the real `runRep3GeometryDerivedHinge(...)` Box3D path;
- verified the rendered endpoint materially moved during PLAY and no diagnosis/error appeared;
- returned to BUILD and verified the exact authored bearing edit was recovered instead of accepting a PLAY pose as authority;
- clicked physical bearing B after the round trip and verified it was independently acquirable;
- required zero page errors and zero browser console errors.

Screenshots were captured for:

1. initial BUILD;
2. edited BUILD with visible translation gizmo;
3. physical PLAY after camera orbit;
4. returned BUILD with the other bearing selected.

## Screenshot inspection

Human inspection of the exact workflow screenshots found no blocking presentation confound:

- both physical bearings are large and visually distinct;
- the inferred hinge relation is visible between them without becoming an editable axis control;
- arm and endpoint are visually separable from mount authority;
- the translation gizmo is large and anchored at the selected physical bearing;
- the information card does not cover the bearing handles;
- after camera movement, PLAY remains readable;
- BUILD recovery remains readable and the second bearing can still be selected.

One deliberately **non-blocking** weakness remains: the optional cyan trajectory trail is not especially prominent in the final PLAY screenshot. The core Stage-B question does not depend on the trail, and the arm/endpoint consequence is already visible and machine-verified, so polishing the trail before Owner judgement would increase prototype gravity without resolving a required uncertainty.

## Failed preflight history retained

Two failures occurred before the qualified green run and are evidence about the apparatus/test boundary rather than hidden from the record:

1. an earlier Stage-B source check failed before Chromium because strict TypeScript compilation did not accept the new CSS side-effect import and preserved a nullable app-root type inside callbacks; both were presentation-source typing issues and were fixed without changing Stage-A authority mechanics;
2. the first Chromium run reached the rendered app but the Playwright harness read telemetry from `.rep3-shell` while the app intentionally stored it on `#app`; the screenshot showed a live, readable initial render. The selector was corrected to read the actual authoritative app root. Runtime mechanics were unchanged.

The next exact-head run passed the full rendered interaction sequence.

## Current Stage-B apparatus

The bounded Owner-facing apparatus now contains only what the pre-verdict contract needs:

- readable fixed support/chassis slab;
- two large physical mount/bearing handles as the only authored hinge-line authority;
- inferred visible hinge line;
- arm + endpoint consequence;
- ordinary world-X/Y/Z translation gizmo on a selected bearing;
- orbit/zoom camera control;
- BUILD / PLAY / PAUSE / reset loop;
- authored bearing readouts and derived-axis readout;
- explicit diagnosis instead of fallback authority for invalid mount pairs.

PLAY invokes the same Stage-A geometry-derived Box3D path and replays its endpoint samples. There is no separately authored hinge-axis parameter and no hand-authored replacement trajectory.

## Natural STOP / next evidence

Machine preflight is complete. The next evidence must be **Owner hands-on judgement on the exact checkpoint**.

The first honest Owner run should answer, without requiring coaching toward a positive result:

- Are the two physical bearings immediately understandable as the thing being built?
- Is it obvious that their relative placement defines the hinge relation, rather than an invisible axis parameter?
- Is selecting and translating either bearing in 3D usable enough to explore the relation?
- Does BUILD → PLAY → BUILD make the causal consequence legible?
- Does this feel more like placing a mechanism than tuning a disguised configuration value?
- Is the result interesting enough to justify another Rep3 iteration at all?

**STOP after that verdict.** Do not expand Rep3 into larger suspension/vehicle/builder scope before interpreting Owner evidence against the original pre-verdict contract.
