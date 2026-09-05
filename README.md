# Jozzue Vehicles Sandbox

> **Research repository for the next generation of Jozz Vehicle. Experiments are evidence, not architecture.**

The long-term product direction is a mechanically credible vehicle sandbox built around a short creative loop:

`build → run → observe → improve → get in and drive`

The repository preserves bounded research programs that reduce product uncertainty. It does **not** yet define the final builder, vehicle representation, engine, renderer, physics runtime, asset pipeline or desktop/Web split.

## Current truth

The project has now accumulated four major evidence layers:

- **E1 — construction-loop research:** CLOSED; central sufficiency hypothesis unresolved. It found bounded value in authored edit → causal PLAY → exact BUILD recovery and in preserving already placed intent, but did not establish a satisfying/general construction grammar.
- **V0 — drivable physical steering consequence:** CLOSED; technical consequence PASS plus final Owner readability PASS for research-carrier reuse only. It established a real steering-geometry → physical linkage → trajectory consequence after presentation/input confounds were removed.
- **R1 — direct spatial steering construction consequence:** CLOSED with bounded positive Owner-backed causal-construction evidence. Directly authored pickup geometry changed real driving behavior and supported repeated BUILD → DRIVE → BUILD, while also exposing a human discoverability failure. The authoring surface remains raw and is not product-accepted.
- **Rep2 donor/force/correspondence line:** JV_CORE donor forensics, a bounded direct suspension-link Stage A, C0a/C0b/C0c physical qualification and C1 causal damper correspondence are now closed at their scoped research boundaries. C1 is **CLOSED — BOUNDED TECHNICAL PASS**; Owner/product/vehicle/architecture acceptance was not claimed.

None of these programs has architecture authority.

The donor-forensics phase is no longer the active frontier. The current work is **fresh representative-problem reselection after C1**. Do not continue C1, suspension or a vehicle carrier merely because the existing code makes that path convenient.

## Durable causal rule strengthened by Rep2/C1

When JV presents something as the mechanism causing behavior, the visible mechanical story should correspond to the same real relation that owns the consequence.

Current strong formulation:

> **One presented mechanical relation has one authority truth. Physics and visible representation are downstream projections of that same relation.**

This does not require render mesh to equal solver geometry. Cosmetic detail and fixed asset-local visual offsets may be visual-only. What is rejected is a parallel live visual mechanism that falsely explains behavior caused by a different hidden physical relation.

## Start here

For a fresh takeover, read and verify live in this order:

1. this `README.md`;
2. [`docs/NEXTGEN_JV_PROJECT_SOUL.md`](docs/NEXTGEN_JV_PROJECT_SOUL.md) — durable product intent and deliberate non-decisions;
3. [`docs/NEXTGEN_JV_CURRENT_STATE.md`](docs/NEXTGEN_JV_CURRENT_STATE.md) — exact current research state and frontier;
4. [`docs/NEXTGEN_JV_FRESH_TAKEOVER.md`](docs/NEXTGEN_JV_FRESH_TAKEOVER.md) — startup mandate after C1;
5. [`evidence/rep2/REP2_RESEARCH_CLOSURE_INDEX_2026-09-05.md`](evidence/rep2/REP2_RESEARCH_CLOSURE_INDEX_2026-09-05.md) — scoped Rep2 donor/Stage-A/C0/C1 results and exact refs;
6. [`evidence/r1/R1_OWNER_CLOSURE_2026-09-04.md`](evidence/r1/R1_OWNER_CLOSURE_2026-09-04.md);
7. [`evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md`](evidence/v0/V0_OWNER_CLOSURE_2026-09-03.md);
8. [`evidence/e1/E1_CLOSURE_2026-08-31.md`](evidence/e1/E1_CLOSURE_2026-08-31.md).

Open experiment-local contracts, implementation source, detailed receipts and historical donor material only when a current question requires their provenance.

## Exact preserved research refs

### E1

- frozen historical control: `55b62da06632e9325c9f6e1cbfb4e9acb4ba6bde`
- final F1 specimen: `experiment/e1-final-f1@b9426adfcecb6f8340ffe21ff94fbd38c4c439ef`

### V0

- technical specimen: `work/front-steering-v0@673dd584d5783b59e177c4ed48c9a64f83a72e49`
- first Owner rehearsal: `work/front-steering-owner-rehearsal@184c2ed9fb71632afa30f0d60032b8e2b923aa1e`
- final deconfounded Owner specimen: `work/front-steering-v0-deconfound@69d8a8ee91117d4ce44c7dd14657418241844b2e`

### R1

- experiment branch: `experiment/nextgen-jv-direct-spatial-pickup`
- final checkpoint: `9d1ce9217ad9ed255ec30181730d57ab87165b85`

### Rep2 donor / suspension / spring-damper line

- donor/visual-rig forensics: `research/jv-core-visual-rig-forensics@b7539e4b8f361609d3dc9fd1f2f60491dab6512c`
- Stage A accepted direct-link specimen: `954b6eb8e5f3bc3466134e77934cecc841ff5e5a`
- C0a closure: `experiment/rep2-coilover-force-path@fa372932e92ceaae3767da24e5045552749bc73a`
- C0b closure: `experiment/rep2-c0b-numerical-qualification@0213994430ac7915409a3b964045d816caf5313c`
- C0c closure: `experiment/rep2-c0c-solver-native-kc@ca69ccabd6a9d2df6ec1874c46a38d0b1f0d3230`
- C1 closure branch: `codex/nextgen-jv-live-frontier@d83308dd36559c7357c4ebfb62ccbaed444f4001`
- C1 accepted implementation: `8c7cb1515577f0c885e576266ad10997e69b26e7`

Preserve these branches as inspectable evidence. Do not merge their experimental implementation merely to make `main` contain the newest experiment.

## What Rep2/C1 added

The bounded donor pass recovered both donor capital and negative evidence:

- exact real Blockbench/glTF assets can be reused without adopting historical rig authority;
- the historical JV_CORE visual system could present suspension/steering members whose endpoints or topology differed from the real physical relation;
- the separate real `Asset_Dumper.gltf` donor was recovered as useful visual capital;
- visual plausibility alone is not evidence of mechanical correspondence.

C0 then separated physical questions:

- installation geometry can change real force leverage while component `k/c/restLength` remain fixed;
- a naive external-force/substep seam can reuse stale force and pump energy;
- native Box3D distance spring can represent bounded linear physical `k/c/restLength + eyes` when solver coefficients are derived internally from axial effective mass;
- pure damping and large-travel remapping remain unresolved.

C1 finally demonstrated, in a bounded real-donor apparatus, that one authority record can drive the native spring, live physical eyes and the visible donor while an independent scene-graph observer catches an injected stale visual path.

This remains experiment evidence, not product implementation.

## Current frontier — representative-problem reselection

The next implementation has **not** been selected.

Candidate problem classes currently worth comparing include:

- a minimal drivable carrier for C1-class installation geometry;
- geometry-derived hinge/axis/DOF authoring rather than direct abstract solver-axis configuration;
- another materially different adaptive real component;
- a bounded driveline/Cardan problem if it can test real orientation/transmission semantics rather than merely visual stretching;
- a different product problem if it separates a more important uncertainty with lower causal blast radius.

Selection should compare information gain, actual JV representativeness, construction class novelty, adaptation/orientation/intent semantics, causal consequence, Owner testability, real-asset usefulness, implementation cost, presentation confounds and prototype gravity.

Do not let the nearest existing code path decide the next research question.

## Hierarchy of truth

1. Current Owner judgement governs desired experience, feel, naturalness, product value and intent.
2. Live source/runtime and reproducible evidence govern technical state.
3. Current scoped closure/state documents govern what has actually been learned.
4. Historical contracts/receipts govern only their bounded experiments.
5. Donor code, assets, old docs and previous recommendations are evidence/candidates, not automatic authority.

A PASS must remain scoped to the evidence that earned it.

## Prototype-gravity boundaries

Do not silently inherit experimental apparatus into the product:

- E1's PointRef/AxisRef, relation grammar, evaluator and UI are E1-local;
- V0's carrier/contact/oracle/camera/trail implementation is V0-local;
- R1's pickup `{x,z}` authoring, neutral auto-fit and primitive direct-drag surface are R1-local;
- Stage A / C0 bench topology and C1 authority/adapter/evidence UI are Rep2-local;
- Three.js, current Box3D integration forms and current Web packaging are experiment substrates, not final choices;
- Native JV, JV-Web, JV_CORE and existing Blockbench/glTF material are donor capital, not a reference ontology or final component model.

The project should retain knowledge while remaining willing to discard code.

## Working practice

Active implementation belongs on named working/experimental branches, not directly on `main`.

At coherent boundaries use:

`checkpoint → validate → commit → push`

A checkpoint is reproducible state, not acceptance.

Browser ChatGPT is the primary continuous second brain / research and execution surface. As of 2026-09-05 the Owner is temporarily reserving local Codex/Work for separate experiments with the newly available AI, so JV work should **not** depend on Codex or route there by default. This is temporary collaboration routing, not product architecture.

Use source inspection, numerical tests, rendered/browser evidence and Owner hands-on according to the claim each can actually support. Remove obvious machine and presentation confounds before spending Owner attention when practical.

## Archived default-branch runtime

Canonical `main` may intentionally carry older experimental apparatus rather than the newest runnable specimen. Running the default source tree is therefore not evidence of the current product direction.

Use exact research refs when reproducing experiments, and use the current closure/state documents to understand what those experiments established.
