# Jozzue Vehicles Sandbox

> **Research repository for the next generation of Jozz Vehicle. Experiments are evidence, not architecture.**

The long-term product direction is a mechanically credible vehicle sandbox built around a short creative loop:

`build → run → observe → improve → get in and drive`

The repository preserves bounded research programs that reduce product uncertainty. It does **not** yet define the final builder, vehicle representation, engine, renderer, physics runtime, asset pipeline or desktop/Web split.

## Current truth

Three bounded research programs are closed:

- **E1 — construction-loop research:** CLOSED; central sufficiency hypothesis unresolved. E1 found bounded value in authored edit → causal PLAY → exact BUILD recovery and in preserving already placed intent, but did not establish a satisfying or general construction grammar.
- **V0 — drivable physical steering consequence:** CLOSED; technical consequence PASS plus final Owner readability PASS **for research-carrier reuse only**. V0 established that steering geometry can propagate through a physical rack/tie-rod/knuckle chain into a materially different, Owner-readable trajectory after confirmed presentation/input confounds were removed.
- **R1 — direct spatial steering construction consequence:** CLOSED with bounded positive causal-construction evidence. The Owner directly experimented with independent steering pickup geometry, perceived changed driving behavior, returned to BUILD and continued iterating. R1 also exposed a real discoverability failure: the baseline editable targets were effectively hidden in/behind wheel geometry, while automation could still drag them using privileged target coordinates. The current authoring surface remains raw and is **not** product-accepted.

None of these programs has architecture authority.

**Do not polish the R1 steering carrier into the builder.** The current frontier is a bounded historical donor-forensics phase before representative-problem selection #2, with special attention to JV_CORE visual-model / rig / physics correspondence.

## Start here

For a fresh takeover, read and verify live in this order:

1. this `README.md`;
2. [`docs/NEXTGEN_JV_PROJECT_SOUL.md`](docs/NEXTGEN_JV_PROJECT_SOUL.md) — durable product intent and deliberate non-decisions;
3. [`docs/NEXTGEN_JV_CURRENT_STATE.md`](docs/NEXTGEN_JV_CURRENT_STATE.md) — exact current research state, R1 disposition and current forensic frontier;
4. [`docs/NEXTGEN_JV_FRESH_TAKEOVER.md`](docs/NEXTGEN_JV_FRESH_TAKEOVER.md) — startup mandate for the fresh JV_CORE visual/rig forensic phase;
5. [`evidence/r1/R1_OWNER_CLOSURE_2026-09-04.md`](evidence/r1/R1_OWNER_CLOSURE_2026-09-04.md) — R1 machine→Owner closure and scoped result;
6. [`evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md`](evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md) — V0 technical→Owner closure;
7. [`evidence/e1/E1_CLOSURE_2026-08-31.md`](evidence/e1/E1_CLOSURE_2026-08-31.md) — E1 final disposition and limits.

Open older contracts, implementation designs, receipts and historical donor documentation only when a question actually requires their detailed provenance.

## Exact preserved research refs

### E1

- frozen historical control: `55b62da06632e9325c9f6e1cbfb4e9acb4ba6bde`
- final F1 specimen: `experiment/e1-final-f1@b9426adfcecb6f8340ffe21ff94fbd38c4c439ef`

### V0

- technical specimen: `work/front-steering-v0@673dd584d5783b59e177c4ed48c9a64f83a72e49`
- first Owner rehearsal checkpoint: `work/front-steering-owner-rehearsal@184c2ed9fb71632afa30f0d60032b8e2b923aa1e`
- final deconfounded Owner specimen: `work/front-steering-v0-deconfound@69d8a8ee91117d4ce44c7dd14657418241844b2e`

### R1

- experiment branch: `experiment/nextgen-jv-direct-spatial-pickup`
- final checkpoint: `9d1ce9217ad9ed255ec30181730d57ab87165b85`
- machine/rendered preflight receipt: `evidence/r1/R1_DIRECT_STEERING_PICKUP_PREFLIGHT_2026-09-03.md` on the R1 branch
- canonical Owner closure: `evidence/r1/R1_OWNER_CLOSURE_2026-09-04.md`

Preserve these branches as inspectable evidence. Do not merge their experimental implementation merely to make `main` contain the newest experiment.

## Current frontier — JV_CORE donor forensics

The next implementation has **not** been selected.

Before representative-problem selection #2, the project needs a bounded forensic recovery of useful historical donor capital, especially from:

`Jozzpoly/Box3d_FunProject`

A verified historical entry point at this handoff is:

`jozz-scan-terrain-f0@241fe10a9056836332c21d9614471d32d749ce3d`

This is an archaeology entry point, **not** a canonical good rig or foundation.

The Owner warns that rigging and visualization were major historical problems in both JV_CORE and JV-Web, and that JV_CORE documentation can lead an agent into a coherent but false reconstruction. Therefore the next phase must treat visual model, import/transforms, physics bodies/joints and their correspondence as separate evidence layers.

Do not use broad JV_CORE narrative documentation as the initial authority. Prefer fresh rendered/runtime observation, traced source/physics/import evidence and early compact Owner corrections. `UNKNOWN` is acceptable when the bounded evidence cannot resolve something honestly.

The purpose is **donor extraction, not donor adoption**.

## Why the next problem remains unselected

R1 is only one construction class. A second materially different representative problem is still needed before any builder architecture can begin to converge.

Candidate classes such as adaptive structural members, wheel/hub/corner mounting, suspension hardpoints or driveline adaptation remain hypotheses only. Choose among them — or reject them — only after the forensic phase clarifies what real assets/mechanisms are trustworthy donor capital.

The selection should compare information gain, actual JV representativeness, adaptation/intent semantics, causal consequence, visual/rig confounds, real-asset usefulness, cost, causal blast radius and prototype gravity.

## Hierarchy of truth

1. Current Owner judgement governs desired experience, feel, product value and intent.
2. Live source/runtime and reproducible evidence govern technical state.
3. Current scoped closure/state documents govern what has actually been learned.
4. Historical contracts/receipts govern only their bounded experiments.
5. Donor code, assets, old docs and previous recommendations are evidence/candidates, not automatic authority.

For the upcoming JV_CORE visual/rig forensic phase, `NEXTGEN_JV_CURRENT_STATE.md` and `NEXTGEN_JV_FRESH_TAKEOVER.md` define a stricter phase-specific evidence posture because the old documentation itself is known to be a potential confound.

A PASS must remain scoped to the evidence that earned it.

## Prototype-gravity boundaries

Do not silently inherit experimental apparatus into the product:

- E1's PointRef/AxisRef, relations, Connect/FIT grammar, evaluator and UI are E1-local.
- V0's spherical contacts, no-suspension carrier, A/B enum, oracle, HUD, chase camera and trail implementation are V0-local.
- R1's pickup `{x,z}` authoring, experiment-local neutral tie-rod auto-fit, direct-drag surface and primitive visuals are R1-local.
- Three.js, current Box3D integration forms and current Web packaging are experiment substrates, not final choices.
- Native JV, JV-Web, JV_CORE and existing Blockbench/glTF material are donor capital, not a reference ontology or final component model.

The project should retain knowledge while remaining willing to discard code.

## Working practice

Active implementation belongs on named working/experimental branches, not directly on `main`.

At coherent boundaries use:

`checkpoint → validate → commit → push`

A checkpoint is reproducible state, not acceptance.

Choose the execution surface that best fits the question. Browser ChatGPT should carry research, synthesis, planning, GitHub work and continuity directly when tools permit. Local Codex/Work is valuable when local repo/filesystem/runtime/browser/desktop access materially improves evidence or execution.

For the next visual-model/rig forensic phase, Sol Max with computer-use/browser is an appropriate escalation for bounded rendered/spatial observation. It should receive specific observational/falsification tasks rather than a broad mandate to "understand JV_CORE".

Do not route routine technical work through the Owner. The Owner's highest-value role is product/feel judgement and early correction of compact historical/intent reconstructions where source/runtime evidence alone is unsafe.

## Archived default-branch runtime

Canonical `main` may intentionally carry older experimental apparatus rather than the newest runnable specimen. Running the default source tree is therefore not evidence of the current product direction.

Use exact research refs when reproducing experiments, and use current closure/state documents to understand what those experiments actually established.
